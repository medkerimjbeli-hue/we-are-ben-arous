import type { Catalog } from '../types';
import seed from './seed.json';
import { isSupabaseConfigured } from '../lib/config';
import { toCategory, toDelegation, toLocation, toMedia, toSocialPost } from './mappers';

export type PublicCatalog = Catalog & { source: 'supabase' | 'seed' };

/** Full bundled owner-supplied content (all statuses). */
export const rawSeed = seed as unknown as Catalog;

/** Bundled owner-supplied content, used when no backend is configured. Only published records are exposed. */
export function seedCatalog(): Catalog {
  return {
    delegations: rawSeed.delegations,
    categories: rawSeed.categories,
    locations: rawSeed.locations.filter((l) => l.status === 'published'),
    socialPosts: rawSeed.socialPosts.filter((p) => p.status === 'published'),
    media: rawSeed.media,
  };
}

/** Loads public content. With Supabase, Row Level Security guarantees only published rows are returned. */
export async function loadPublicCatalog(): Promise<PublicCatalog> {
  if (!isSupabaseConfigured) return { ...seedCatalog(), source: 'seed' };
  const { supabase } = await import('../lib/supabase');
  if (!supabase) return { ...seedCatalog(), source: 'seed' };
  const [d, c, l, p, m] = await Promise.all([
    supabase.from('delegations').select('*').order('ins_code'),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('locations').select('*').eq('status', 'published'),
    supabase.from('social_posts').select('*').eq('status', 'published').order('sort_order'),
    supabase.from('media').select('*'),
  ]);
  const err = d.error ?? c.error ?? l.error ?? p.error ?? m.error;
  if (err) throw new Error(err.message);
  return {
    source: 'supabase',
    delegations: d.data!.map(toDelegation),
    categories: c.data!.map(toCategory),
    locations: l.data!.map(toLocation),
    socialPosts: p.data!.map(toSocialPost),
    // Images without a recorded permission are never shown publicly.
    media: m.data!.map(toMedia).filter((x) => x.permission !== 'unknown'),
  };
}
