// Converts between Supabase rows (snake_case) and app types (camelCase).
import type { Category, Delegation, Location, Media, SocialPost } from '../types';
import { MEDIA_BUCKET, supabase } from '../lib/supabase';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

export const toDelegation = (r: Row): Delegation => ({
  id: r.id, insCode: r.ins_code, governorateId: r.governorate_id, slug: r.slug,
  name: r.name ?? {}, sourceName: r.source_name ?? {}, status: r.status,
});
export const toCategory = (r: Row): Category => ({ id: r.id, slug: r.slug, name: r.name ?? {}, sortOrder: r.sort_order ?? 0 });
export const toLocation = (r: Row): Location => ({
  id: r.id, kind: r.kind, slug: r.slug, delegationId: r.delegation_id, categoryId: r.category_id,
  name: r.name ?? {}, summary: r.summary ?? {}, story: r.story ?? {}, address: r.address ?? {},
  lat: r.lat, lng: r.lng, coordinateStatus: r.coordinate_status, coordinateSource: r.coordinate_source,
  coverMediaId: r.cover_media_id, status: r.status, featured: r.featured, sourceNotes: r.source_notes,
  createdAt: r.created_at, updatedAt: r.updated_at,
});
export const fromLocation = (l: Location): Row => ({
  id: l.id, kind: l.kind, slug: l.slug, delegation_id: l.delegationId, category_id: l.categoryId,
  name: l.name, summary: l.summary, story: l.story, address: l.address, lat: l.lat, lng: l.lng,
  coordinate_status: l.coordinateStatus, coordinate_source: l.coordinateSource, cover_media_id: l.coverMediaId,
  status: l.status, featured: l.featured, source_notes: l.sourceNotes,
});
export const toSocialPost = (r: Row): SocialPost => ({
  id: r.id, url: r.url, label: r.label, delegationId: r.delegation_id, locationId: r.location_id,
  caption: r.caption ?? {}, metricType: r.metric_type, metricValue: r.metric_value, metricSource: r.metric_source,
  metricVerifiedAt: r.metric_verified_at, status: r.status, featured: r.featured, featuredRank: r.featured_rank,
  sortOrder: r.sort_order ?? 0, reviewNote: r.review_note, createdAt: r.created_at, updatedAt: r.updated_at,
});
export const fromSocialPost = (p: SocialPost): Row => ({
  id: p.id, url: p.url, label: p.label, delegation_id: p.delegationId, location_id: p.locationId, caption: p.caption,
  metric_type: p.metricType, metric_value: p.metricValue, metric_source: p.metricSource,
  metric_verified_at: p.metricVerifiedAt, status: p.status, featured: p.featured, featured_rank: p.featuredRank,
  sort_order: p.sortOrder, review_note: p.reviewNote,
});
export function mediaUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (!supabase) return '';
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
export const toMedia = (r: Row): Media => ({
  id: r.id, path: r.path, url: mediaUrl(r.path), alt: r.alt ?? {}, credit: r.credit, sourceUrl: r.source_url,
  permission: r.permission, locationId: r.location_id, createdAt: r.created_at,
});
