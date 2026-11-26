import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { asset } from '../../hooks/useLang';

export interface GovernorateProps { id: string; ins_code: string; name_en: string; name_fr: string; name_ar: string; population_2024?: string; area_km2?: number }
export interface DelegationProps extends GovernorateProps { governorate: string; wikidata?: string; osm_relation?: string }

export type GovFC = FeatureCollection<Geometry, GovernorateProps>;
export type DelFC = FeatureCollection<Geometry, DelegationProps>;
export type GeoFeature<P> = Feature<Geometry, P>;

/** Governorates currently open on the platform. Others are shown as "coming soon". */
export const AVAILABLE_GOVERNORATES = new Set(['TN-13']);
export const BEN_AROUS = 'TN-13';

const cache = new Map<string, Promise<unknown>>();
function load<T>(file: string): Promise<T> {
  if (!cache.has(file)) {
    cache.set(file, fetch(asset(`geo/${file}`)).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).catch((e) => { cache.delete(file); throw e; }));
  }
  return cache.get(file) as Promise<T>;
}
export const loadGovernorates = () => load<GovFC>('governorates.geojson');
export const loadDelegations = () => load<DelFC>('ben-arous-delegations.geojson');

export function geoName(p: { name_en: string; name_fr: string; name_ar: string }, lang: 'en' | 'fr' | 'ar') {
  return lang === 'ar' ? p.name_ar : lang === 'fr' ? p.name_fr : p.name_en;
}

/** Bounding box [[minLat,minLng],[maxLat,maxLng]] of a geometry (GeoJSON is [lng, lat]). */
export function bbox(g: Geometry): [[number, number], [number, number]] {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  const walk = (x: unknown): void => {
    if (Array.isArray(x) && typeof x[0] === 'number') { const [lng, lat] = x as number[]; a = Math.min(a, lat); b = Math.min(b, lng); c = Math.max(c, lat); d = Math.max(d, lng); }
    else if (Array.isArray(x)) x.forEach(walk);
  };
  walk((g as { coordinates: unknown }).coordinates);
  return [[a, b], [c, d]];
}

/** Projects a polygon to an SVG path in a square viewBox (for decorative silhouettes built from real geometry). */
export function toSvgPath(g: Geometry, size = 100, pad = 4): string {
  const [[minLat, minLng], [maxLat, maxLng]] = bbox(g);
  const k = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const w = (maxLng - minLng) * k, h = maxLat - minLat;
  const s = (size - pad * 2) / Math.max(w, h);
  const ox = (size - w * s) / 2, oy = (size - h * s) / 2;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys.map((poly) => poly.map((ring) => ring.map(([lng, lat], i) =>
    `${i ? 'L' : 'M'}${(ox + (lng - minLng) * k * s).toFixed(1)},${(oy + (maxLat - lat) * s).toFixed(1)}`).join('') + 'Z').join('')).join('');
}
