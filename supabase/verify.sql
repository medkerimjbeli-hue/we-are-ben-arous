-- We Are Ben Arous — database verification. Run in the Supabase SQL editor after the migrations + seed.
-- Every check raises an exception on failure; success ends with "ALL CHECKS PASSED".
-- It runs inside a transaction that is rolled back, so it changes nothing.
begin;

do $$
declare n int; t text;
begin
  -- 1. RLS enabled on every content table
  foreach t in array array['admin_users','delegations','categories','media','locations','social_posts','content_revisions'] loop
    select count(*) into n from pg_class c join pg_namespace s on s.oid = c.relnamespace
      where s.nspname = 'public' and c.relname = t and c.relrowsecurity;
    if n <> 1 then raise exception 'RLS not enabled on %', t; end if;
  end loop;

  -- 2. Seed integrity
  select count(*) into n from public.delegations where governorate_id = 'TN-13';
  if n <> 12 then raise exception 'Expected 12 Ben Arous delegations, found %', n; end if;
  select count(*) into n from public.social_posts;
  if n < 10 then raise exception 'Expected the 10 supplied Instagram posts, found %', n; end if;
  select count(*) into n from public.locations where coordinate_status = 'verified' and (lat is null or coordinate_source is null);
  if n > 0 then raise exception '% locations marked verified without coordinates/source', n; end if;

  -- 3. No write policy is granted to anonymous users
  select count(*) into n from pg_policies where schemaname = 'public' and cmd <> 'SELECT' and 'anon' = any(roles);
  if n > 0 then raise exception 'Found % write policies for anon', n; end if;
  -- admin_users has no write policy at all
  select count(*) into n from pg_policies where schemaname = 'public' and tablename = 'admin_users' and cmd <> 'SELECT';
  if n > 0 then raise exception 'admin_users must not have write policies'; end if;

  -- 4. Storage bucket restrictions
  select count(*) into n from storage.buckets where id = 'media' and file_size_limit <= 8388608 and allowed_mime_types is not null;
  if n <> 1 then raise exception 'media bucket missing size/mime limits'; end if;
end $$;

-- 5. Behave as an anonymous visitor: only published rows are visible, writes fail.
set local role anon;
do $$
declare n int;
begin
  select count(*) into n from public.locations where status <> 'published';
  if n > 0 then raise exception 'anon can see % unpublished locations', n; end if;
  begin
    select count(*) into n from public.admin_users;
    if n > 0 then raise exception 'anon can read admin_users'; end if;
  exception when insufficient_privilege then null;  -- expected: no grant at all
  end;
  begin
    insert into public.categories (slug, name) values ('rls-probe', '{}');
    raise exception 'anon was able to insert a category';
  exception when insufficient_privilege then null;  -- expected
  end;
end $$;
reset role;

-- 6. Behave as a signed-in non-admin user: still read-only.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}';
do $$
declare n int;
begin
  if public.is_admin() then raise exception 'random user is admin'; end if;
  update public.locations set featured = true;
  get diagnostics n = row_count;
  if n > 0 then raise exception 'non-admin updated % locations', n; end if;
  begin
    insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-000000000000');
    raise exception 'non-admin could grant themselves admin';
  exception when insufficient_privilege or foreign_key_violation then null;
  end;
end $$;
reset role;

select 'ALL CHECKS PASSED' as result;
rollback;
