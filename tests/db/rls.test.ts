// @vitest-environment node
// Real PostgreSQL (PGlite) running the actual migrations, seed and RLS policies.
import { beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ADMIN_ID, as, createDb } from './harness';
import seed from '../../src/data/seed.json';

let db: PGlite;
beforeAll(async () => { db = await createDb(); }, 60_000);

const denied = /permission denied|row-level security|violates row-level/i;
const firstLoc = seed.locations[0].id;

describe('fresh project setup', () => {
  it('applies migrations + seed and passes supabase/verify.sql', async () => {
    const out = await db.exec(readFileSync(resolve(__dirname, '../../supabase/verify.sql'), 'utf8'));
    expect(out.flatMap((r) => r.rows)).toContainEqual({ result: 'ALL CHECKS PASSED' });
  });
  it('seed SQL matches the bundled seed exactly', async () => {
    const urls = await db.query<{ url: string }>('select url from public.social_posts order by sort_order');
    expect(urls.rows.map((r) => r.url)).toEqual(seed.socialPosts.map((p) => p.url));
    const d = await db.query<{ n: number }>("select count(*)::int n from public.delegations where governorate_id = 'TN-13'");
    expect(d.rows[0].n).toBe(12);
  });
});

describe('anonymous visitor', () => {
  it('reads only published content', async () => {
    await db.exec(`update public.locations set status = 'draft' where id = '${firstLoc}'`);
    const n = await as(db, 'anon', (q) => q('select id from public.locations'));
    expect(n.rows.map((r) => r.id)).not.toContain(firstLoc);
    await db.exec(`update public.locations set status = 'published' where id = '${firstLoc}'`);
  });
  it('cannot write anything', async () => {
    await expect(as(db, 'anon', (q) => q(`insert into public.categories (slug, name) values ('x', '{}')`))).rejects.toThrow(denied);
    await expect(as(db, 'anon', (q) => q(`update public.locations set featured = true`))).rejects.toThrow(denied);
    await expect(as(db, 'anon', (q) => q(`delete from public.social_posts`))).rejects.toThrow(denied);
  });
  it('cannot read admins or edit history', async () => {
    await expect(as(db, 'anon', (q) => q('select * from public.admin_users'))).rejects.toThrow(denied);
    await expect(as(db, 'anon', (q) => q('select * from public.content_revisions'))).rejects.toThrow(denied);
  });
});

describe('signed-in non-admin', () => {
  it('is not an admin and cannot change content', async () => {
    const r = await as(db, 'user', async (q) => {
      const admin = (await q('select public.is_admin() as a')).rows[0].a;
      const upd = await q(`update public.locations set featured = true`);
      return { admin, affected: upd.affectedRows };
    });
    expect(r).toEqual({ admin: false, affected: 0 });
  });
  it('cannot grant itself admin rights (privilege escalation)', async () => {
    await expect(as(db, 'user', (q) => q(`insert into public.admin_users (user_id) values ('22222222-2222-4222-8222-222222222222')`))).rejects.toThrow(denied);
  });
  it('cannot upload to the media bucket', async () => {
    await expect(as(db, 'user', (q) => q(`insert into storage.objects (bucket_id, name) values ('media', '2026-11/x.jpg')`))).rejects.toThrow(denied);
  });
});

describe('administrator', () => {
  it('can create, publish and delete content, and uploads are allowed', async () => {
    const r = await as(db, 'admin', async (q) => {
      await q(`insert into public.categories (slug, name) values ('test-cat', '{"en":"Test"}')`);
      const u = await q(`update public.locations set featured = true where id = $1`, [firstLoc]);
      await q(`insert into storage.objects (bucket_id, name) values ('media', '2026-11/x.jpg')`);
      const del = await q(`delete from public.categories where slug = 'test-cat'`);
      return [u.affectedRows, del.affectedRows];
    });
    expect(r).toEqual([1, 1]);
  });
  it('cannot spoof audit columns', async () => {
    const r = await as(db, 'admin', async (q) => {
      await q(`insert into public.categories (slug, name, created_by, created_at) values ('spoof', '{"en":"x"}', '22222222-2222-4222-8222-222222222222', '2000-01-01')`);
      return (await q(`select created_by, created_at from public.categories where slug = 'spoof'`)).rows[0];
    });
    expect(r.created_by).toBe(ADMIN_ID);
    expect(new Date(r.created_at as string).getFullYear()).toBeGreaterThan(2000);
  });
  it('records edit history with the editor', async () => {
    const r = await as(db, 'admin', async (q) => {
      await q(`update public.locations set featured = true where id = $1`, [firstLoc]);
      return (await q(`select action, changed_by from public.content_revisions where record_id = $1 order by id desc limit 1`, [firstLoc])).rows[0];
    });
    expect(r).toEqual({ action: 'UPDATE', changed_by: ADMIN_ID });
  });
  it('cannot edit delegation identifiers or source names', async () => {
    await expect(as(db, 'admin', (q) => q(`update public.delegations set ins_code = '9999' where id = 'delegation-1351'`))).rejects.toThrow(/cannot be edited/);
    const ok = await as(db, 'admin', (q) => q(`update public.delegations set name = '{"en":"Ben Arous","fr":"Ben Arous","ar":"بن عروس"}' where id = 'delegation-1351'`));
    expect(ok.affectedRows).toBe(1);
  });
});

describe('integrity constraints', () => {
  const tryAdmin = (sql: string) => as(db, 'admin', (q) => q(sql));
  it('rejects verified coordinates without a source, and coordinates outside Ben Arous', async () => {
    await expect(tryAdmin(`update public.locations set lat = 36.7, lng = 10.3, coordinate_status = 'verified' where id = '${firstLoc}'`)).rejects.toThrow(/verified_needs_coords/);
    await expect(tryAdmin(`update public.locations set lat = 35.0, lng = 10.3 where id = '${firstLoc}'`)).rejects.toThrow(/lat_check|check constraint/);
    await expect(tryAdmin(`update public.locations set lat = 36.7 where id = '${firstLoc}'`)).rejects.toThrow(/coords_pair/);
  });
  it('rejects incomplete metrics and duplicate featured positions', async () => {
    await expect(tryAdmin(`update public.social_posts set metric_value = 10 where sort_order = 1`)).rejects.toThrow(/metric_complete/);
    await expect(tryAdmin(`update public.social_posts set featured = true, featured_rank = 1 where sort_order in (1, 2)`)).rejects.toThrow(/featured_rank_uq|duplicate/);
  });
  it('rejects non-Instagram URLs and invalid media paths', async () => {
    await expect(tryAdmin(`insert into public.social_posts (url, label) values ('https://example.com/reel/abc', 'x')`)).rejects.toThrow(/check constraint/);
    await expect(tryAdmin(`insert into public.media (path) values ('../../etc/passwd')`)).rejects.toThrow(/media_path_format/);
  });
  it('blocks publishing with an image of unknown permission', async () => {
    await expect(as(db, 'admin', async (q) => {
      const m = await q(`insert into public.media (path, permission) values ('2026-11/0b4f4b4e-1111-4111-8111-111111111111.jpg', 'unknown') returning id`);
      await q(`update public.locations set cover_media_id = $1 where id = $2`, [m.rows[0].id, firstLoc]);
    })).rejects.toThrow(/permission is unknown/);
  });
  it('only stories can point to a place', async () => {
    await expect(tryAdmin(`update public.locations set place_id = '${seed.locations[1].id}' where id = '${firstLoc}'`)).rejects.toThrow(/place_id_only_for_stories/);
  });
});
