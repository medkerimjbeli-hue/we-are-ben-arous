import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateGeo, EXPECTED_DELEGATION_CODES } from '../scripts/geo/lib.mjs';
import seed from '../src/data/seed.json';
import type { Catalog } from '../src/types';
import { parseInstagramUrl } from '../src/features/instagram/instagram';
import { featuredPosts, hasVerifiedCoords, searchLocations, delegationOnlyPosts, postsForLocation } from '../src/data/selectors';
import { seedCatalog } from '../src/data/catalog';

const root = resolve(__dirname, '..');
const readJson = (p: string) => JSON.parse(readFileSync(resolve(root, p), 'utf8'));
const gov = readJson('public/geo/governorates.geojson');
const del = readJson('public/geo/ben-arous-delegations.geojson');
const s = seed as unknown as Catalog;

describe('geographic data', () => {
  it('passes structural validation', () => {
    expect(validateGeo(gov, del)).toEqual([]);
  });
  it('has 24 governorates including Ben Arous (TN-13)', () => {
    expect(gov.features).toHaveLength(24);
    expect(gov.features.find((f: { properties: { id: string } }) => f.properties.id === 'TN-13').properties.name_fr).toBe('Ben Arous');
  });
  it('has exactly the 12 Ben Arous delegations, joined by governorate id (not by name)', () => {
    expect(del.features).toHaveLength(12);
    for (const f of del.features) expect(f.properties.governorate).toBe('TN-13');
    expect(del.features.map((f: { properties: { ins_code: string } }) => f.properties.ins_code).sort()).toEqual(EXPECTED_DELEGATION_CODES);
  });
  it('matches the owner’s working list of delegation names', () => {
    const ar = del.features.map((f: { properties: { name_ar: string } }) => f.properties.name_ar).sort();
    expect(ar).toEqual(['بن عروس', 'المدينة الجديدة', 'المروج', 'حمام الأنف', 'حمام الشط', 'بومهل البساتين', 'الزهراء', 'رادس', 'مقرين', 'المحمدية', 'فوشانة', 'مرناق'].sort());
  });
  it('content delegations are exactly the geographic delegations', () => {
    const geoIds = del.features.map((f: { properties: { id: string } }) => f.properties.id).sort();
    expect(s.delegations.map((d) => d.id).sort()).toEqual(geoIds);
    for (const d of s.delegations) {
      const f = del.features.find((x: { properties: { id: string } }) => x.properties.id === d.id);
      expect(d.sourceName.fr).toBe(f.properties.name_fr);
      expect(d.sourceName.ar).toBe(f.properties.name_ar);
      expect(d.governorateId).toBe('TN-13');
    }
  });
  it('keeps the ODbL licence next to the derived data', () => {
    expect(readFileSync(resolve(root, 'public/geo/LICENSE-DATA.md'), 'utf8')).toMatch(/Open Database License/);
  });
});

describe('owner-supplied Instagram content', () => {
  // Parse reference-assets/content/Instagram ref.txt: "Group :" lines followed by "\tLabel : URL" lines.
  const raw = readFileSync(resolve(root, 'reference-assets/content/Instagram ref.txt'), 'utf8');
  const supplied: { group: string; label: string; url: string }[] = [];
  let group = '';
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const url = line.match(/https:\/\/\S+/)?.[0];
    if (!url) { group = line.replace(/:\s*$/, '').trim(); continue; }
    supplied.push({ group, label: line.slice(0, line.indexOf(url)).replace(/:\s*$/, '').trim(), url });
  }

  it('preserves all 10 URLs exactly and in order', () => {
    expect(supplied).toHaveLength(10);
    expect(s.socialPosts.map((p) => p.url)).toEqual(supplied.map((x) => x.url));
    expect(s.socialPosts.map((p) => p.label)).toEqual(supplied.map((x) => x.label));
  });
  it('recognises reels and the single regular post', () => {
    const types = s.socialPosts.map((p) => parseInstagramUrl(p.url)?.type);
    expect(types.filter((t) => t === 'reel')).toHaveLength(9);
    expect(types.filter((t) => t === 'post')).toHaveLength(1);
  });
  it('assigns each post to the delegation the owner grouped it under', () => {
    const groupToIns: Record<string, string> = { Mohammedia: '1360', 'Hammam Lif': '1354', Mornag: '1362', Fouchena: '1361', Rades: '1358', 'Hammam Chat': '1355', Ezzahra: '1357' };
    for (const sp of supplied) {
      const post = s.socialPosts.find((p) => p.url === sp.url)!;
      expect(post.delegationId).toBe(`delegation-${groupToIns[sp.group]}`);
    }
  });
  it('links posts to a location only when the label names a specific place', () => {
    const townLevel = ['Hammam Lif', 'Rades', 'Hammam Chat', 'Ezzahra'];
    for (const p of s.socialPosts) {
      if (townLevel.includes(p.label)) { expect(p.locationId).toBeNull(); expect(p.reviewNote).toBeTruthy(); }
      else {
        const loc = s.locations.find((l) => l.id === p.locationId)!;
        expect(loc.name.en).toBe(p.label);
        expect(loc.delegationId).toBe(p.delegationId);
      }
    }
  });
  it('does not fabricate coordinates, categories, metrics or descriptions', () => {
    for (const l of s.locations) {
      expect(l.lat).toBeNull(); expect(l.lng).toBeNull(); expect(l.coordinateStatus).toBe('unverified'); expect(hasVerifiedCoords(l)).toBe(false);
      expect(l.categoryId).toBeNull(); expect(l.summary).toEqual({}); expect(l.story).toEqual({});
    }
    for (const p of s.socialPosts) { expect(p.metricValue).toBeNull(); expect(p.featured).toBe(false); }
  });
  it('location ids and slugs are unique and independent of display names', () => {
    expect(new Set(s.locations.map((l) => l.id)).size).toBe(s.locations.length);
    expect(new Set(s.locations.map((l) => l.slug)).size).toBe(s.locations.length);
    for (const l of s.locations) expect(l.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('selectors', () => {
  const c = seedCatalog();
  it('never presents unverified metrics as a ranking', () => {
    const r = featuredPosts(c);
    expect(r.curated).toBe(false);
    expect(r.posts).toHaveLength(5);
  });
  it('uses admin-curated featured order when present', () => {
    const posts = c.socialPosts.map((p, i) => (i === 3 ? { ...p, featured: true, featuredRank: 2 } : i === 7 ? { ...p, featured: true, featuredRank: 1 } : p));
    const r = featuredPosts({ ...c, socialPosts: posts });
    expect(r.curated).toBe(true);
    expect(r.posts.map((p) => p.id)).toEqual([posts[7].id, posts[3].id]);
  });
  it('searches across languages, accents and Arabic delegation names', () => {
    expect(searchLocations(c, { q: 'louzina', categoryId: null, delegationId: null, kind: null }, 'en').map((l) => l.name.en)).toEqual(['Louzina']);
    expect(searchLocations(c, { q: 'حمام الأنف', categoryId: null, delegationId: null, kind: null }, 'ar').map((l) => l.name.en).sort()).toEqual(['Demous Chenoi', 'Louzina']);
    expect(searchLocations(c, { q: 'rades', categoryId: null, delegationId: null, kind: null }, 'fr')).toEqual([]);
    expect(searchLocations(c, { q: '', categoryId: null, delegationId: 'delegation-1362', kind: null }, 'en').map((l) => l.name.en)).toEqual(['Old Factory']);
  });
  it('separates delegation-level posts from location posts', () => {
    expect(delegationOnlyPosts(c, 'delegation-1354').map((p) => p.label)).toEqual(['Hammam Lif']);
    const louzina = c.locations.find((l) => l.name.en === 'Louzina')!;
    expect(postsForLocation(c, louzina.id).map((p) => p.label)).toEqual(['Louzina']);
  });
});
