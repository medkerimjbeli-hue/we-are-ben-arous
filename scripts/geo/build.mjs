// Extracts the subset of Map Tunisia data the site needs into public/geo.
// Source: map-data/map-tunisia (Map Tunisia by Alaa Taieb, data © OpenStreetMap contributors, ODbL 1.0).
// Geometry is copied verbatim from the source level-of-detail files — never edited.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGeo } from './lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = process.env.MAP_TUNISIA_DIR ?? resolve(root, 'map-data/map-tunisia');
const out = resolve(root, 'public/geo');
if (!existsSync(src)) {
  console.error(`Map Tunisia not found at ${src}. Clone https://github.com/Alaa-Taieb/map-tunisia there or set MAP_TUNISIA_DIR.`);
  process.exit(1);
}
mkdirSync(out, { recursive: true });
const read = (p) => JSON.parse(readFileSync(resolve(src, p), 'utf8'));
const pkg = read('package.json');

const GOV_KEYS = ['id', 'ins_code', 'name_en', 'name_fr', 'name_ar', 'population_2024', 'area_km2'];
const DEL_KEYS = ['id', 'ins_code', 'governorate', 'name_en', 'name_fr', 'name_ar', 'wikidata', 'osm_relation', 'population_2024', 'area_km2'];
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));
const slim = (fc, keys, filter = () => true) => ({
  type: 'FeatureCollection',
  features: fc.features.filter(filter).map((f) => ({ type: 'Feature', properties: pick(f.properties, keys), geometry: f.geometry })),
});

const governorates = slim(read('dist/geojson/tunisia-governorates-low.geojson'), GOV_KEYS);
const delegations = slim(read('dist/geojson/tunisia-delegations-high.geojson'), DEL_KEYS, (f) => f.properties.governorate === 'TN-13');

const meta = {
  source: 'Map Tunisia', sourceVersion: pkg.version, sourceUrl: 'https://github.com/Alaa-Taieb/map-tunisia',
  license: 'ODbL-1.0', attribution: 'Map data © OpenStreetMap contributors · Map Tunisia by Alaa Taieb',
  files: { 'governorates.geojson': 'tunisia-governorates-low', 'ben-arous-delegations.geojson': 'tunisia-delegations-high (governorate = TN-13)' },
};
const errors = validateGeo(governorates, delegations);
if (errors.length) { console.error('Validation failed:\n' + errors.join('\n')); process.exit(1); }
writeFileSync(resolve(out, 'governorates.geojson'), JSON.stringify(governorates));
writeFileSync(resolve(out, 'ben-arous-delegations.geojson'), JSON.stringify(delegations));
writeFileSync(resolve(out, 'meta.json'), JSON.stringify(meta, null, 2));
copyFileSync(resolve(src, 'LICENSE-DATA.md'), resolve(out, 'LICENSE-DATA.md'));
console.log(`OK: ${governorates.features.length} governorates, ${delegations.features.length} Ben Arous delegations (Map Tunisia v${pkg.version}).`);
