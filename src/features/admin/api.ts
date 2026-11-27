import type { Catalog, Category, Delegation, Location, Media, Revision, SocialPost } from '../../types';
import { MEDIA_BUCKET, supabase } from '../../lib/supabase';
import { fromLocation, fromSocialPost, toCategory, toDelegation, toLocation, toMedia, toSocialPost } from '../../data/mappers';
import { uploadIssue } from './validation';

/** Error whose message is a translation key under admin.* when `key` is set. */
export class AdminError extends Error {
  constructor(message: string, public key?: string) { super(message); }
}

function db() {
  if (!supabase) throw new AdminError('Supabase is not configured.', 'auth.notConfiguredTitle');
  return supabase;
}
function check<T>(r: { data: T; error: { message: string; code?: string } | null }): NonNullable<T> {
  if (r.error) {
    // 42501 = insufficient_privilege (RLS / missing grant)
    if (r.error.code === '42501' || /row-level security|permission denied/i.test(r.error.message)) throw new AdminError(r.error.message, 'errors.rls');
    throw new AdminError(r.error.message);
  }
  return r.data as NonNullable<T>;
}

/** Loads every record (RLS lets admins see drafts and archived content). */
export async function loadAdminCatalog(): Promise<Catalog> {
  const s = db();
  const [d, c, l, p, m] = await Promise.all([
    s.from('delegations').select('*').order('ins_code'),
    s.from('categories').select('*').order('sort_order'),
    s.from('locations').select('*').order('updated_at', { ascending: false }),
    s.from('social_posts').select('*').order('sort_order'),
    s.from('media').select('*').order('created_at', { ascending: false }),
  ]);
  return {
    delegations: check(d).map(toDelegation), categories: check(c).map(toCategory), locations: check(l).map(toLocation),
    socialPosts: check(p).map(toSocialPost), media: check(m).map(toMedia),
  };
}

export async function saveLocation(l: Location, isNew: boolean) {
  const row = fromLocation(l);
  const q = isNew ? db().from('locations').insert(row) : db().from('locations').update(row).eq('id', l.id);
  check(await q.select().single());
}
export async function deleteLocation(id: string) { check(await db().from('locations').delete().eq('id', id)); }

export async function savePost(p: SocialPost, isNew: boolean) {
  const row = fromSocialPost(p);
  const q = isNew ? db().from('social_posts').insert(row) : db().from('social_posts').update(row).eq('id', p.id);
  check(await q.select().single());
}
export async function deletePost(id: string) { check(await db().from('social_posts').delete().eq('id', id)); }

export async function saveCategory(c: Category, isNew: boolean) {
  const row = { id: c.id, slug: c.slug, name: c.name, sort_order: c.sortOrder };
  check(await (isNew ? db().from('categories').insert(row) : db().from('categories').update(row).eq('id', c.id)));
}
export async function deleteCategory(id: string) { check(await db().from('categories').delete().eq('id', id)); }

export async function saveDelegation(d: Delegation) {
  check(await db().from('delegations').update({ name: d.name, slug: d.slug, status: d.status }).eq('id', d.id));
}

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

export async function uploadMedia(file: File, meta: Pick<Media, 'alt' | 'credit' | 'sourceUrl' | 'permission' | 'locationId'>) {
  const bad = uploadIssue(file);
  if (bad) throw new AdminError(bad, `media.${bad}`);
  // Path format is enforced by the database (media_path_format): YYYY-MM/<uuid>.<ext>
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${EXT[file.type]}`;
  check(await db().storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' }));
  const row = { path, alt: meta.alt, credit: meta.credit, source_url: meta.sourceUrl, permission: meta.permission, location_id: meta.locationId };
  const r = await db().from('media').insert(row).select().single();
  if (r.error) { await db().storage.from(MEDIA_BUCKET).remove([path]); check(r); }
  return toMedia(r.data);
}
export async function updateMedia(m: Media) {
  check(await db().from('media').update({ alt: m.alt, credit: m.credit, source_url: m.sourceUrl, permission: m.permission, location_id: m.locationId }).eq('id', m.id));
}
export async function deleteMedia(m: Media) {
  check(await db().from('media').delete().eq('id', m.id));
  if (!/^https?:/.test(m.path)) await db().storage.from(MEDIA_BUCKET).remove([m.path]);
}

/** Latest revisions, optionally for one record. Returns null if the history table is not installed yet. */
export async function loadRevisions(recordId?: string, limit = 100): Promise<Revision[] | null> {
  let q = db().from('content_revisions').select('*').order('id', { ascending: false }).limit(limit);
  if (recordId) q = q.eq('record_id', recordId);
  const r = await q;
  if (r.error) { if (/does not exist|schema cache/i.test(r.error.message)) return null; check(r); }
  return (r.data ?? []).map((x) => ({ id: x.id, tableName: x.table_name, recordId: x.record_id, action: x.action, changedBy: x.changed_by, changedAt: x.changed_at, snapshot: x.snapshot }));
}
