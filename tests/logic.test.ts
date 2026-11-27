import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import en from '../src/features/i18n/locales/en';
import fr from '../src/features/i18n/locales/fr';
import ar from '../src/features/i18n/locales/ar';
import { normalizeSearch, pick, missingLangs } from '../src/lib/localize';
import { parseInstagramUrl } from '../src/features/instagram/instagram';
import { locationIssues, postIssues, hasErrors, uploadIssue } from '../src/features/admin/validation';
import adminEn from '../src/features/i18n/locales/admin.en';
import adminFr from '../src/features/i18n/locales/admin.fr';
import adminAr from '../src/features/i18n/locales/admin.ar';
import { clusterPoints, spreadOffsets } from '../src/features/map/cluster';
import { seedCatalog } from '../src/data/catalog';

const keys = (o: object, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
const base = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '');

describe('translations', () => {
  it('French and Arabic cover every English interface string', () => {
    const e = new Set(keys(en).map(base));
    for (const loc of [fr, ar]) {
      const l = new Set(keys(loc).map(base));
      expect([...e].filter((k) => !l.has(k))).toEqual([]);
      expect([...l].filter((k) => !e.has(k))).toEqual([]);
    }
  });
  it('admin interface is fully translated in French and Arabic', () => {
    const e = keys(adminEn);
    for (const loc of [adminFr, adminAr]) expect(keys(loc)).toEqual(e);
  });
  it('every validation issue code has an admin message', () => {
    const codes = ['nameRequired', 'slugFormat', 'slugTaken', 'delegationRequired', 'coordsPair', 'coordsInvalid', 'latOutside', 'lngOutside', 'verifiedNeedsSource', 'coordsUnverified', 'noCoords', 'nameMissing', 'summaryMissing', 'noCategory', 'noCover', 'coverCredit', 'storyPlaceSelf', 'publishUnknownImage', 'urlInvalid', 'urlTaken', 'labelRequired', 'metricIncomplete', 'featuredRank', 'featuredTaken', 'unlinked', 'reviewNote'];
    for (const loc of [adminEn, adminFr, adminAr]) for (const c of codes) expect((loc.issues as Record<string, string>)[c], c).toBeTruthy();
  });
  it('does not translate proper names of delegations in the UI copy', () => {
    expect(ar.map.benArous).toBe('بن عروس'); expect(fr.map.benArous).toBe('Ben Arous');
  });
  it('uses the official localized slogans', () => {
    expect(en.brand.slogan).toBe('Your region has more to tell.');
    expect(fr.brand.slogan).toBe('Votre région a encore tant à raconter.');
    expect(ar.brand.slogan).toBe('جهتك ما زال عندها برشا ما تحكيلك عليه.');
  });
});

describe('localization helpers', () => {
  it('falls back and reports the language used', () => {
    expect(pick({ fr: 'Bonjour' }, 'ar')).toEqual({ text: 'Bonjour', lang: 'fr' });
    expect(pick({ en: 'Hi', ar: 'مرحبا' }, 'ar')).toEqual({ text: 'مرحبا', lang: 'ar' });
    expect(pick({}, 'en')).toEqual({ text: '', lang: null });
    expect(missingLangs({ en: 'x', fr: ' ' })).toEqual(['fr', 'ar']);
  });
  it('normalizes accents and Arabic variants', () => {
    expect(normalizeSearch('Radès')).toBe('rades');
    expect(normalizeSearch('الأنف')).toBe(normalizeSearch('الانف'));
    expect(normalizeSearch('مَرْنَاق')).toBe('مرناق');
  });
});

describe('Instagram URLs', () => {
  it('parses reels and posts without altering the original', () => {
    const url = 'https://www.instagram.com/p/Daai0sOjYF1/?utm_source=ig_web_copy_link&dmpr=MzRlODBiNWFlZA==';
    expect(parseInstagramUrl(url)).toEqual({ type: 'post', shortcode: 'Daai0sOjYF1', permalink: 'https://www.instagram.com/p/Daai0sOjYF1/' });
    expect(parseInstagramUrl('https://www.instagram.com/reels/abc_D-1/')?.type).toBe('reel');
  });
  it('rejects non-Instagram and profile URLs', () => {
    expect(parseInstagramUrl('https://instagram.com.evil.example/reel/x/')).toBeNull();
    expect(parseInstagramUrl('https://www.instagram.com/we_are_ben_arous/')).toBeNull();
    expect(parseInstagramUrl('http://www.instagram.com/reel/abc/')).toBeNull();
    expect(parseInstagramUrl('not a url')).toBeNull();
  });
});

describe('CMS validation', () => {
  const c = seedCatalog();
  const loc = c.locations[0];
  it('requires a source before coordinates can be marked verified', () => {
    expect(hasErrors(locationIssues({ ...loc, lat: 36.7, lng: 10.2, coordinateStatus: 'verified', coordinateSource: null }, c))).toBe(true);
    expect(hasErrors(locationIssues({ ...loc, lat: 36.7, lng: 10.2, coordinateStatus: 'verified', coordinateSource: 'Site visit' }, c))).toBe(false);
  });
  it('rejects coordinates outside Ben Arous and half-filled pairs', () => {
    expect(hasErrors(locationIssues({ ...loc, lat: 35, lng: 10.2 }, c))).toBe(true);
    expect(hasErrors(locationIssues({ ...loc, lat: 36.7, lng: null }, c))).toBe(true);
  });
  it('flags missing translations, categories and images as warnings', () => {
    const issues = locationIssues(loc, c);
    expect(issues.map((i) => i.code)).toEqual(expect.arrayContaining(['summaryMissing', 'noCategory', 'noCover', 'noCoords', 'nameMissing']));
    expect(issues.every((i) => i.level === 'warning' && i.tag)).toBe(true);
    expect(issues.find((i) => i.code === 'summaryMissing')?.tag).toBe('description');
  });
  it('prevents duplicate URLs, incomplete metrics and duplicate featured positions', () => {
    const p = c.socialPosts[0];
    expect(hasErrors(postIssues({ ...p, id: 'other' }, c))).toBe(true);
    expect(hasErrors(postIssues({ ...p, metricValue: 100 }, c))).toBe(true);
    const c2 = { ...c, socialPosts: c.socialPosts.map((x, i) => (i === 1 ? { ...x, featured: true, featuredRank: 1 } : x)) };
    expect(hasErrors(postIssues({ ...p, featured: true, featuredRank: 1 }, c2))).toBe(true);
  });
});

const sql = readFileSync(resolve(__dirname, '../supabase/migrations/20261127000000_init.sql'), 'utf8');
describe('database authorization (static checks on the migration)', () => {
  it('enables RLS on every table', () => {
    for (const t of ['admin_users', 'delegations', 'categories', 'media', 'locations', 'social_posts'])
      expect(sql).toMatch(new RegExp(`alter table public\\.${t} enable row level security`));
  });
  it('limits public reads of content to published rows', () => {
    expect(sql).toMatch(/locations_public_read[\s\S]*?using \(status = 'published' or public\.is_admin\(\)\)/);
    expect(sql).toMatch(/social_posts_public_read[\s\S]*?using \(status = 'published' or public\.is_admin\(\)\)/);
  });
  it('only lets admins write, and never grants inserts on admin_users', () => {
    expect(sql).toMatch(/using \(public\.is_admin\(\)\) with check \(public\.is_admin\(\)\)/);
    expect(sql).not.toMatch(/on public\.admin_users for (insert|update|delete|all)/);
    expect(sql).toMatch(/bucket_id = 'media' and public\.is_admin\(\)/);
  });
  it('contains no secrets', () => {
    expect(sql).not.toMatch(/service_role|eyJ[a-zA-Z0-9]{20,}/);
  });
});

describe('CMS workflow rules', () => {
  const c = seedCatalog();
  const loc = c.locations[0];
  it('stories cannot point to themselves and places do not warn about pins for stories', () => {
    expect(hasErrors(locationIssues({ ...loc, kind: 'story', placeId: loc.id }, c))).toBe(true);
    expect(locationIssues({ ...loc, kind: 'story' }, c).some((i) => i.code === 'noCoords')).toBe(false);
  });
  it('blocks publishing with an image of unknown permission and flags missing credits', () => {
    const media = [{ id: 'm1', path: 'x', url: 'x', alt: {}, credit: null, sourceUrl: null, permission: 'unknown' as const, locationId: null, createdAt: '' }];
    const c2 = { ...c, media };
    expect(locationIssues({ ...loc, coverMediaId: 'm1', status: 'published' }, c2).map((i) => i.code)).toContain('publishUnknownImage');
    expect(locationIssues({ ...loc, coverMediaId: 'm1', status: 'draft' }, c2).map((i) => i.code)).toContain('coverCredit');
  });
});

describe('image upload restrictions', () => {
  it('accepts web images up to 8 MB only', () => {
    expect(uploadIssue({ name: 'a.jpg', type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(uploadIssue({ name: 'a.webp', type: 'image/webp', size: 8 * 1024 * 1024 })).toBeNull();
    expect(uploadIssue({ name: 'a.jpg', type: 'image/jpeg', size: 8 * 1024 * 1024 + 1 })).toBe('tooLarge');
    expect(uploadIssue({ name: 'a.svg', type: 'image/svg+xml', size: 10 })).toBe('badType');
    expect(uploadIssue({ name: 'a.html', type: 'image/png', size: 10 })).toBe('badType');
    expect(uploadIssue({ name: 'a.gif', type: 'image/gif', size: 10 })).toBe('badType');
  });
  it('matches the storage bucket limits in the migration', () => {
    expect(sql).toMatch(/8388608, array\['image\/jpeg', 'image\/png', 'image\/webp', 'image\/avif'\]/);
  });
});

describe('pin clustering', () => {
  it('groups nearby points and keeps distant ones apart', () => {
    const r = clusterPoints([{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 10, y: 10 }, { id: 'c', x: 300, y: 300 }], 44);
    expect(r.map((k) => k.ids)).toEqual([['a', 'b'], ['c']]);
    expect(r[0].x).toBe(5);
  });
  it('fans out identical positions on a circle', () => {
    expect(spreadOffsets(1)).toEqual([[0, 0]]);
    const o = spreadOffsets(4, 20);
    expect(new Set(o.map(String)).size).toBe(4);
    for (const [x, y] of o) expect(Math.round(Math.hypot(x, y))).toBe(20);
  });
});
