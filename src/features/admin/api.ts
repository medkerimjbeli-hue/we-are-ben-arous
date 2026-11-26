import type { Catalog, Category, Delegation, Location, Media, SocialPost } from '../../types';
import { MEDIA_BUCKET, supabase } from '../../lib/supabase';
import { fromLocation, fromSocialPost, toCategory, toDelegation, toLocation, toMedia, toSocialPost } from '../../data/mappers';

function db() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}
function check<T>(r: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (r.error) throw new Error(r.error.message);
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

export async function uploadMedia(file: File, meta: Pick<Media, 'alt' | 'credit' | 'sourceUrl' | 'permission' | 'locationId'>) {
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  check(await db().storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, upsert: false }));
  const row = { path, alt: meta.alt, credit: meta.credit, source_url: meta.sourceUrl, permission: meta.permission, location_id: meta.locationId };
  const r = await db().from('media').insert(row).select().single();
  if (r.error) { await db().storage.from(MEDIA_BUCKET).remove([path]); throw new Error(r.error.message); }
  return toMedia(r.data);
}
export async function updateMedia(m: Media) {
  check(await db().from('media').update({ alt: m.alt, credit: m.credit, source_url: m.sourceUrl, permission: m.permission, location_id: m.locationId }).eq('id', m.id));
}
export async function deleteMedia(m: Media) {
  check(await db().from('media').delete().eq('id', m.id));
  if (!/^https?:/.test(m.path)) await db().storage.from(MEDIA_BUCKET).remove([m.path]);
}
