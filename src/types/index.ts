export const LANGS = ['en', 'fr', 'ar'] as const;
export type Lang = (typeof LANGS)[number];
export type Localized = Partial<Record<Lang, string>>;

export const STATUSES = ['draft', 'needs_review', 'published', 'archived'] as const;
export type ContentStatus = (typeof STATUSES)[number];

export interface Delegation {
  id: string; // Map Tunisia id, e.g. "delegation-1351"
  insCode: string;
  governorateId: string; // ISO 3166-2, e.g. "TN-13"
  slug: string;
  name: Localized; // editable display labels
  sourceName: Localized; // names as published in the source dataset (read-only)
  status: 'available' | 'coming_soon';
}

export interface Category { id: string; slug: string; name: Localized; sortOrder: number }

export type CoordinateStatus = 'unverified' | 'verified';

export interface Location {
  id: string;
  kind: 'place' | 'story';
  slug: string;
  delegationId: string;
  categoryId: string | null;
  name: Localized;
  summary: Localized;
  story: Localized;
  address: Localized;
  lat: number | null;
  lng: number | null;
  coordinateStatus: CoordinateStatus;
  coordinateSource: string | null;
  coverMediaId: string | null;
  status: ContentStatus;
  featured: boolean;
  sourceNotes: string | null;
  /** Optional SEO overrides; fall back to name/summary. */
  seoTitle: Localized;
  seoDescription: Localized;
  /** For stories: the place this story is about (shown as a related story on that place). */
  placeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  id: string;
  url: string; // exactly as supplied
  label: string;
  delegationId: string | null;
  locationId: string | null;
  caption: Localized;
  metricType: string | null;
  metricValue: number | null;
  metricSource: string | null;
  metricVerifiedAt: string | null;
  status: ContentStatus;
  featured: boolean;
  featuredRank: number | null;
  sortOrder: number;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MediaPermission = 'owned' | 'licensed' | 'permission_granted' | 'unknown';

export interface Media {
  id: string;
  path: string; // storage path in the "media" bucket, or absolute URL
  url: string;
  alt: Localized;
  credit: string | null;
  sourceUrl: string | null;
  permission: MediaPermission;
  locationId: string | null;
  createdAt: string;
}

export interface Catalog {
  delegations: Delegation[];
  categories: Category[];
  locations: Location[];
  socialPosts: SocialPost[];
  media: Media[];
}

export interface Revision {
  id: number;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changedBy: string | null;
  changedAt: string;
  snapshot: Record<string, unknown>;
}
