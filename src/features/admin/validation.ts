import type { Catalog, Location, SocialPost } from '../../types';
import { missingLangs } from '../../lib/localize';
import { parseInstagramUrl } from '../instagram/instagram';

/** Dashboard filter buckets that an issue belongs to (makes warnings actionable). */
export type IssueTag = 'translations' | 'description' | 'coords' | 'photo' | 'credit' | 'category' | 'unlinked';

export interface Issue {
  level: 'error' | 'warning';
  /** Translation key under admin.issues */
  code: string;
  params?: Record<string, string | number>;
  tag?: IssueTag;
}

const LANG_NAMES = { en: 'EN', fr: 'FR', ar: 'AR' } as const;

/** Errors block saving/publishing. Warnings are shown to editors and on the dashboard. */
export function locationIssues(l: Location, c: Catalog): Issue[] {
  const out: Issue[] = [];
  const err = (code: string, params?: Issue['params']) => out.push({ level: 'error', code, params });
  const warn = (code: string, tag: IssueTag, params?: Issue['params']) => out.push({ level: 'warning', code, tag, params });
  if (!Object.values(l.name).some((v) => v?.trim())) err('nameRequired');
  if (!/^[a-z0-9-]+$/.test(l.slug)) err('slugFormat');
  if (c.locations.some((x) => x.slug === l.slug && x.id !== l.id)) err('slugTaken');
  if (!c.delegations.some((d) => d.id === l.delegationId)) err('delegationRequired');
  if ((l.lat == null) !== (l.lng == null)) err('coordsPair');
  if (Number.isNaN(l.lat) || Number.isNaN(l.lng)) err('coordsInvalid');
  if (l.lat != null && !Number.isNaN(l.lat) && (l.lat < 36.3 || l.lat > 37)) err('latOutside');
  if (l.lng != null && !Number.isNaN(l.lng) && (l.lng < 9.9 || l.lng > 10.6)) err('lngOutside');
  if (l.coordinateStatus === 'verified' && (l.lat == null || !l.coordinateSource?.trim())) err('verifiedNeedsSource');
  if (l.kind === 'story' && l.placeId === l.id) err('storyPlaceSelf');
  const cover = c.media.find((x) => x.id === l.coverMediaId);
  if (l.status === 'published' && cover?.permission === 'unknown') err('publishUnknownImage');

  if (l.kind === 'place') {
    if (l.lat != null && l.coordinateStatus !== 'verified') warn('coordsUnverified', 'coords');
    if (l.lat == null) warn('noCoords', 'coords');
  }
  const m = missingLangs(l.name);
  if (m.length) warn('nameMissing', 'translations', { langs: m.map((x) => LANG_NAMES[x]).join(', ') });
  const s = missingLangs(l.summary);
  if (s.length === 3) warn('summaryMissing', 'description', { langs: 'EN, FR, AR' });
  else if (s.length) warn('summaryMissing', 'translations', { langs: s.map((x) => LANG_NAMES[x]).join(', ') });
  if (!l.categoryId) warn('noCategory', 'category');
  if (!cover) warn('noCover', 'photo');
  else if (!cover.credit || cover.permission === 'unknown') warn('coverCredit', 'credit');
  return out;
}

export function postIssues(p: SocialPost, c: Catalog): Issue[] {
  const out: Issue[] = [];
  if (!parseInstagramUrl(p.url)) out.push({ level: 'error', code: 'urlInvalid' });
  if (c.socialPosts.some((x) => x.url === p.url && x.id !== p.id)) out.push({ level: 'error', code: 'urlTaken' });
  if (!p.label.trim()) out.push({ level: 'error', code: 'labelRequired' });
  if (p.metricValue != null && (!p.metricType || !p.metricSource?.trim() || !p.metricVerifiedAt)) out.push({ level: 'error', code: 'metricIncomplete' });
  if (p.featured && (p.featuredRank == null || p.featuredRank < 1 || p.featuredRank > 5)) out.push({ level: 'error', code: 'featuredRank' });
  if (p.featured && c.socialPosts.some((x) => x.id !== p.id && x.featured && x.featuredRank === p.featuredRank)) out.push({ level: 'error', code: 'featuredTaken', params: { rank: p.featuredRank ?? '' } });
  if (!p.locationId) out.push({ level: 'warning', code: 'unlinked', tag: 'unlinked' });
  if (p.reviewNote) out.push({ level: 'warning', code: 'reviewNote', params: { note: p.reviewNote } });
  return out;
}

export const hasErrors = (issues: Issue[]) => issues.some((i) => i.level === 'error');

/** Image upload rules — mirrored by the storage bucket limits in the database migration. */
export const UPLOAD_MAX_BYTES = 8 * 1024 * 1024;
export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
export function uploadIssue(file: { size: number; type: string; name: string }): 'tooLarge' | 'badType' | null {
  if (!(UPLOAD_TYPES as readonly string[]).includes(file.type) || !/\.(jpe?g|png|webp|avif)$/i.test(file.name)) return 'badType';
  if (file.size > UPLOAD_MAX_BYTES) return 'tooLarge';
  return null;
}
