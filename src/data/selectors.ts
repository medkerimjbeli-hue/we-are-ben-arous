import type { Catalog, Lang, Location, SocialPost } from '../types';
import { normalizeSearch, tr } from '../lib/localize';

export const hasVerifiedCoords = (l: Location) => l.coordinateStatus === 'verified' && l.lat != null && l.lng != null;

export const delegationById = (c: Catalog, id: string | null | undefined) => c.delegations.find((d) => d.id === id) ?? null;
export const delegationBySlug = (c: Catalog, slug: string | null | undefined) => c.delegations.find((d) => d.slug === slug) ?? null;
export const categoryById = (c: Catalog, id: string | null | undefined) => c.categories.find((d) => d.id === id) ?? null;
export const mediaById = (c: Catalog, id: string | null | undefined) => c.media.find((m) => m.id === id) ?? null;
export const postsForLocation = (c: Catalog, locationId: string) => c.socialPosts.filter((p) => p.locationId === locationId);
/** Posts attached to a delegation but not to any specific location. */
export const delegationOnlyPosts = (c: Catalog, delegationId: string) => c.socialPosts.filter((p) => p.delegationId === delegationId && !p.locationId);
/** Published community stories that are about a given place. */
export const storiesForPlace = (c: Catalog, placeId: string) => c.locations.filter((l) => l.kind === 'story' && l.placeId === placeId);
export const locationsInDelegation = (c: Catalog, delegationId: string) => c.locations.filter((l) => l.delegationId === delegationId);

/** Featured posts: admin-selected (ordered by featuredRank) when any exist; never ranked by unverified metrics. */
export function featuredPosts(c: Catalog, max = 5): { posts: SocialPost[]; curated: boolean } {
  const curated = c.socialPosts.filter((p) => p.featured).sort((a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99));
  if (curated.length) return { posts: curated.slice(0, max), curated: true };
  return { posts: [...c.socialPosts].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, max), curated: false };
}

export interface SearchFilters { q: string; categoryId: string | null; delegationId: string | null; kind: 'place' | 'story' | null }

export function searchLocations(c: Catalog, f: SearchFilters, lang: Lang): Location[] {
  const q = normalizeSearch(f.q);
  return c.locations
    .filter((l) => (!f.categoryId || l.categoryId === f.categoryId) && (!f.delegationId || l.delegationId === f.delegationId) && (!f.kind || l.kind === f.kind))
    .filter((l) => {
      if (!q) return true;
      const d = delegationById(c, l.delegationId);
      const hay = [...Object.values(l.name), ...Object.values(l.summary), ...Object.values(d?.name ?? {})]
        .filter(Boolean).map((s) => normalizeSearch(s as string)).join(' ');
      return hay.includes(q);
    })
    .sort((a, b) => tr(a.name, lang).localeCompare(tr(b.name, lang), lang));
}
