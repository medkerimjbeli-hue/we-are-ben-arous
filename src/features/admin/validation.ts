import type { Catalog, Location, SocialPost } from '../../types';
import { missingLangs } from '../../lib/localize';
import { parseInstagramUrl } from '../instagram/instagram';

export interface Issue { level: 'error' | 'warning'; message: string }

/** Errors block saving/publishing. Warnings are shown to the editor and on the dashboard. */
export function locationIssues(l: Location, c: Catalog): Issue[] {
  const out: Issue[] = [];
  if (!Object.values(l.name).some((v) => v?.trim())) out.push({ level: 'error', message: 'A name is required in at least one language.' });
  if (!/^[a-z0-9-]+$/.test(l.slug)) out.push({ level: 'error', message: 'Slug may only contain lowercase letters, digits and hyphens.' });
  if (c.locations.some((x) => x.slug === l.slug && x.id !== l.id)) out.push({ level: 'error', message: 'Another location already uses this slug.' });
  if (!c.delegations.some((d) => d.id === l.delegationId)) out.push({ level: 'error', message: 'Choose a delegation.' });
  if ((l.lat == null) !== (l.lng == null)) out.push({ level: 'error', message: 'Latitude and longitude must both be set or both be empty.' });
  if (l.lat != null && (l.lat < 36.3 || l.lat > 37)) out.push({ level: 'error', message: 'Latitude is outside Ben Arous.' });
  if (l.lng != null && (l.lng < 9.9 || l.lng > 10.6)) out.push({ level: 'error', message: 'Longitude is outside Ben Arous.' });
  if (l.coordinateStatus === 'verified' && (l.lat == null || !l.coordinateSource?.trim())) out.push({ level: 'error', message: 'Verified coordinates need a latitude/longitude and a verification source.' });
  if (l.lat != null && l.coordinateStatus !== 'verified') out.push({ level: 'warning', message: 'Coordinates are unverified — no map pin will be shown.' });
  if (l.lat == null) out.push({ level: 'warning', message: 'No coordinates — shown without a map pin.' });
  const m = missingLangs(l.name); if (m.length) out.push({ level: 'warning', message: `Name missing in: ${m.join(', ')}` });
  const s = missingLangs(l.summary); if (s.length) out.push({ level: 'warning', message: `Summary missing in: ${s.join(', ')}` });
  if (!l.categoryId) out.push({ level: 'warning', message: 'No category.' });
  const cover = c.media.find((x) => x.id === l.coverMediaId);
  if (!cover) out.push({ level: 'warning', message: 'No cover image.' });
  else if (!cover.credit || cover.permission === 'unknown') out.push({ level: 'warning', message: 'Cover image is missing a credit or permission record.' });
  return out;
}

export function postIssues(p: SocialPost, c: Catalog): Issue[] {
  const out: Issue[] = [];
  if (!parseInstagramUrl(p.url)) out.push({ level: 'error', message: 'Not a valid Instagram post/Reel URL (https://www.instagram.com/reel/… or /p/…).' });
  if (c.socialPosts.some((x) => x.url === p.url && x.id !== p.id)) out.push({ level: 'error', message: 'This URL is already registered.' });
  if (!p.label.trim()) out.push({ level: 'error', message: 'A display label is required.' });
  if (p.metricValue != null && (!p.metricType || !p.metricSource?.trim() || !p.metricVerifiedAt)) out.push({ level: 'error', message: 'A metric needs its type, source and verification date.' });
  if (p.featured && (p.featuredRank == null || p.featuredRank < 1 || p.featuredRank > 5)) out.push({ level: 'error', message: 'Featured posts need a position from 1 to 5.' });
  if (p.featured && c.socialPosts.some((x) => x.id !== p.id && x.featured && x.featuredRank === p.featuredRank)) out.push({ level: 'error', message: `Another post already holds featured position ${p.featuredRank}.` });
  if (!p.locationId) out.push({ level: 'warning', message: 'Not linked to a location.' });
  if (p.reviewNote) out.push({ level: 'warning', message: `Review note: ${p.reviewNote}` });
  return out;
}

export const hasErrors = (issues: Issue[]) => issues.some((i) => i.level === 'error');
