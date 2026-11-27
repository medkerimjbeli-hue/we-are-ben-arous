-- We Are Ben Arous — hardening, content-model extensions and edit history.
-- Safe to run after 20261127000000_init.sql. Idempotent.

-- ---------------------------------------------------------------- audit columns cannot be spoofed
create or replace function public.touch_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.created_by := auth.uid();
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------- content model extensions
alter table public.locations add column if not exists seo_title jsonb not null default '{}'::jsonb;
alter table public.locations add column if not exists seo_description jsonb not null default '{}'::jsonb;
-- A community story may relate to one place (shown as "Related stories" on that place).
alter table public.locations add column if not exists place_id uuid references public.locations (id) on delete set null;
alter table public.locations drop constraint if exists place_id_only_for_stories;
alter table public.locations add constraint place_id_only_for_stories check (place_id is null or (kind = 'story' and place_id <> id));
create index if not exists locations_place_idx on public.locations (place_id);

-- Governorate on delegations is already stored; constrain it to ISO 3166-2 Tunisian codes for future expansion.
alter table public.delegations drop constraint if exists delegations_governorate_format;
alter table public.delegations add constraint delegations_governorate_format check (governorate_id ~ '^TN-[0-9]{2}$');

-- Media: the stored path must live in a dated folder with an image extension (matches the dashboard upload code).
alter table public.media drop constraint if exists media_path_format;
alter table public.media add constraint media_path_format check (path ~ '^[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|avif)$');

-- Only owned/licensed/permitted images may be used as a published cover.
create or replace function public.check_cover_permission() returns trigger language plpgsql set search_path = public as $$
declare perm media_permission;
begin
  if new.status = 'published' and new.cover_media_id is not null then
    select permission into perm from public.media where id = new.cover_media_id;
    if perm = 'unknown' then
      raise exception 'Cannot publish with a cover image whose permission is unknown.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists locations_cover_permission on public.locations;
create trigger locations_cover_permission before insert or update on public.locations for each row execute function public.check_cover_permission();

-- Public media reads: also hide images without a recorded permission.
drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media for select using (
  public.is_admin()
  or (permission <> 'unknown' and exists (
    select 1 from public.locations l where l.status = 'published' and (l.id = media.location_id or l.cover_media_id = media.id)))
);

-- ---------------------------------------------------------------- edit history
create table if not exists public.content_revisions (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid,
  changed_at timestamptz not null default now(),
  snapshot jsonb not null
);
create index if not exists content_revisions_record_idx on public.content_revisions (table_name, record_id, changed_at desc);
alter table public.content_revisions enable row level security;
drop policy if exists content_revisions_admin_read on public.content_revisions;
create policy content_revisions_admin_read on public.content_revisions for select to authenticated using (public.is_admin());
-- No insert/update/delete policies: rows are written only by the trigger below (security definer).

create or replace function public.log_revision() returns trigger
language plpgsql security definer set search_path = public as $$
declare rec jsonb;
begin
  rec := to_jsonb(coalesce(new, old));
  insert into public.content_revisions (table_name, record_id, action, changed_by, snapshot)
  values (tg_table_name, rec->>'id', tg_op, auth.uid(), rec);
  return coalesce(new, old);
end $$;
revoke all on function public.log_revision() from public;

do $$ declare t text; begin
  foreach t in array array['delegations', 'categories', 'media', 'locations', 'social_posts'] loop
    execute format('drop trigger if exists %I_history on public.%I', t, t);
    execute format('create trigger %I_history after insert or update or delete on public.%I for each row execute function public.log_revision()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- explicit grants (defence in depth)
-- Anonymous visitors can only SELECT; RLS further limits rows.
revoke insert, update, delete, truncate on all tables in schema public from anon;
grant select on public.delegations, public.categories, public.locations, public.social_posts, public.media to anon;
revoke all on public.admin_users, public.content_revisions from anon;
