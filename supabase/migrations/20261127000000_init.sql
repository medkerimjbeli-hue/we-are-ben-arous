-- We Are Ben Arous — initial schema, Row Level Security and storage.
-- Apply with `supabase db push` or paste into the Supabase SQL editor.

-- gen_random_uuid() is built into PostgreSQL 13+ (no extension needed).

-- ---------------------------------------------------------------- enums
do $$ begin
  create type content_status as enum ('draft', 'needs_review', 'published', 'archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type coordinate_status as enum ('unverified', 'verified');
exception when duplicate_object then null; end $$;
do $$ begin
  create type media_permission as enum ('owned', 'licensed', 'permission_granted', 'unknown');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- admins
-- A user is an administrator only if their auth user id is listed here.
-- Rows can only be added with the service role / SQL editor (no policy grants insert).
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------- audit helper
create or replace function public.touch_audit() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------- delegations
-- Identifiers and source names come from Map Tunisia (INS codes). Geometry is NOT stored here:
-- it is served from the read-only GeoJSON in /public/geo.
create table if not exists public.delegations (
  id text primary key check (id ~ '^delegation-[0-9]{4}$'),
  ins_code text not null unique,
  governorate_id text not null,
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,          -- editable display labels {en,fr,ar}
  source_name jsonb not null default '{}'::jsonb,   -- names as published in the source dataset
  status text not null default 'available' check (status in ('available', 'coming_soon')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

-- ---------------------------------------------------------------- categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

-- ---------------------------------------------------------------- media
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null,                      -- path inside the "media" storage bucket
  alt jsonb not null default '{}'::jsonb,
  credit text,
  source_url text,
  permission media_permission not null default 'unknown',
  location_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

-- ---------------------------------------------------------------- locations (places + community stories)
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'place' check (kind in ('place', 'story')),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  delegation_id text not null references public.delegations (id),
  category_id uuid references public.categories (id) on delete set null,
  name jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  story jsonb not null default '{}'::jsonb,
  address jsonb not null default '{}'::jsonb,
  lat double precision check (lat between 36.3 and 37.0),
  lng double precision check (lng between 9.9 and 10.6),
  coordinate_status coordinate_status not null default 'unverified',
  coordinate_source text,
  cover_media_id uuid references public.media (id) on delete set null,
  status content_status not null default 'draft',
  featured boolean not null default false,
  source_notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid,
  -- coordinates must come as a pair, and "verified" requires both values and a source
  constraint coords_pair check ((lat is null) = (lng is null)),
  constraint verified_needs_coords check (coordinate_status = 'unverified' or (lat is not null and coordinate_source is not null and length(coordinate_source) > 0)),
  -- nothing can be published without a name
  constraint published_has_name check (status <> 'published' or coalesce(name->>'en', name->>'fr', name->>'ar', '') <> '')
);
alter table public.media drop constraint if exists media_location_fk;
alter table public.media add constraint media_location_fk foreign key (location_id) references public.locations (id) on delete set null;

-- ---------------------------------------------------------------- social posts
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  url text not null unique check (url ~ '^https://(www\.)?instagram\.com/(reel|reels|p|tv)/[A-Za-z0-9_-]+/?'),
  label text not null,
  delegation_id text references public.delegations (id),
  location_id uuid references public.locations (id) on delete set null,
  caption jsonb not null default '{}'::jsonb,
  metric_type text check (metric_type in ('views', 'plays', 'reach', 'likes', 'comments', 'shares', 'saves')),
  metric_value bigint check (metric_value >= 0),
  metric_source text,
  metric_verified_at date,
  status content_status not null default 'draft',
  featured boolean not null default false,
  featured_rank int check (featured_rank between 1 and 5),
  sort_order int not null default 0,
  review_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid,
  constraint metric_complete check (metric_value is null or (metric_type is not null and metric_source is not null and metric_verified_at is not null))
);
create unique index if not exists social_posts_featured_rank_uq on public.social_posts (featured_rank) where featured and featured_rank is not null;

create index if not exists locations_delegation_idx on public.locations (delegation_id);
create index if not exists locations_status_idx on public.locations (status);
create index if not exists social_posts_location_idx on public.social_posts (location_id);

-- ---------------------------------------------------------------- triggers
do $$ declare t text; begin
  foreach t in array array['delegations', 'categories', 'media', 'locations', 'social_posts'] loop
    execute format('drop trigger if exists %I_audit on public.%I', t, t);
    execute format('create trigger %I_audit before insert or update on public.%I for each row execute function public.touch_audit()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- Row Level Security
alter table public.admin_users enable row level security;
alter table public.delegations enable row level security;
alter table public.categories enable row level security;
alter table public.media enable row level security;
alter table public.locations enable row level security;
alter table public.social_posts enable row level security;

-- admin_users: an admin may read the list; nobody can write through the API.
drop policy if exists admin_users_read on public.admin_users;
create policy admin_users_read on public.admin_users for select to authenticated using (public.is_admin() or user_id = auth.uid());

-- Public reads
drop policy if exists delegations_public_read on public.delegations;
create policy delegations_public_read on public.delegations for select using (true);
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select using (true);
drop policy if exists locations_public_read on public.locations;
create policy locations_public_read on public.locations for select using (status = 'published' or public.is_admin());
drop policy if exists social_posts_public_read on public.social_posts;
create policy social_posts_public_read on public.social_posts for select using (status = 'published' or public.is_admin());
drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media for select using (
  public.is_admin()
  or exists (select 1 from public.locations l where l.status = 'published' and (l.id = media.location_id or l.cover_media_id = media.id))
);

-- Admin writes
do $$ declare t text; begin
  foreach t in array array['categories', 'media', 'locations', 'social_posts'] loop
    execute format('drop policy if exists %I_admin_write on public.%I', t, t);
    execute format('create policy %I_admin_write on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;
-- Delegations: admins may edit display labels/status only (ids and source names are protected by a trigger).
drop policy if exists delegations_admin_update on public.delegations;
create policy delegations_admin_update on public.delegations for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.protect_delegation_source() returns trigger language plpgsql as $$
begin
  if new.id <> old.id or new.ins_code <> old.ins_code or new.governorate_id <> old.governorate_id or new.source_name <> old.source_name then
    raise exception 'Delegation identifiers and source names come from the geographic dataset and cannot be edited.';
  end if;
  return new;
end $$;
drop trigger if exists delegations_protect on public.delegations;
create trigger delegations_protect before update on public.delegations for each row execute function public.protect_delegation_source();

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_bucket_admin_insert on storage.objects;
create policy media_bucket_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists media_bucket_admin_update on storage.objects;
create policy media_bucket_admin_update on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists media_bucket_admin_delete on storage.objects;
create policy media_bucket_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());
-- Reads of the public bucket go through the public CDN URL; no select policy is needed for anonymous users.
