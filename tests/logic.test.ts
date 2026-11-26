import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import en from '../src/features/i18n/locales/en';
import fr from '../src/features/i18n/locales/fr';
import ar from '../src/features/i18n/locales/ar';
import { normalizeSearch, pick, missingLangs } from '../src/lib/localize';
import { parseInstagramUrl } from '../src/features/instagram/instagram';
import { locationIssues, postIssues, hasErrors } from '../src/features/admin/validation';
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
    const msgs = locationIssues(loc, c).map((i) => i.message).join('\n');
    expect(msgs).toMatch(/Summary missing/); expect(msgs).toMatch(/No category/); expect(msgs).toMatch(/No cover image/);
  });
  it('prevents duplicate URLs, incomplete metrics and duplicate featured positions', () => {
    const p = c.socialPosts[0];
    expect(hasErrors(postIssues({ ...p, id: 'other' }, c))).toBe(true);
    expect(hasErrors(postIssues({ ...p, metricValue: 100 }, c))).toBe(true);
    const c2 = { ...c, socialPosts: c.socialPosts.map((x, i) => (i === 1 ? { ...x, featured: true, featuredRank: 1 } : x)) };
    expect(hasErrors(postIssues({ ...p, featured: true, featuredRank: 1 }, c2))).toBe(true);
  });
});

describe('database authorization (static checks on the migration)', () => {
  const sql = readFileSync(resolve(__dirname, '../supabase/migrations/20261127000000_init.sql'), 'utf8');
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
