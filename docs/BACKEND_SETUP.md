# Backend setup (Supabase)

GitHub Pages only serves static files. The database, authentication and image storage are provided by **Supabase**. The browser talks to Supabase directly using the public *anon/publishable* key, and **Row Level Security (RLS)** decides what each request may read or write.

## Keys: what is safe where

| Value | Where it goes | Safe in the browser? |
| --- | --- | --- |
| Project URL (`VITE_SUPABASE_URL`) | `.env.local`, GitHub repository **variable** | Yes |
| anon / publishable key (`VITE_SUPABASE_ANON_KEY`) | `.env.local`, GitHub repository **variable** | Yes. Protection comes from RLS |
| **service_role key** | Nowhere in this repo. Supabase dashboard only | **No, never** |
| Database password | Supabase dashboard / your password manager | **No** |

Never commit a `.env` file. `.gitignore` already excludes `.env*` except `.env.example`.

## 1. Create the project

1. Create a project at https://supabase.com (an EU region is closest to Tunisia).
2. In **Project Settings → API**, copy the Project URL and the anon/publishable key.

## 2. Apply the schema and seed

**Option A: SQL editor (no tools needed)**
1. Open **SQL Editor**, paste `supabase/migrations/20261127000000_init.sql` and run it.
2. Paste `supabase/seed.sql` and run it. This adds the 12 delegations, the suggested categories, the 6 owner-supplied places and the 10 Instagram URLs.

**Option B: Supabase CLI**
```powershell
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push
```
Then run `supabase/seed.sql` in the SQL editor. A local `npx supabase db reset` applies both files automatically.

The migration creates:
- the tables `delegations`, `categories`, `locations` (places and community stories), `social_posts`, `media` and `admin_users`;
- **RLS on every table**: the public can read published locations and posts, all delegations and categories, and media attached to published locations. Only administrators (`public.is_admin()`) can write;
- integrity rules: verified coordinates need a source and must fall inside Ben Arous; metrics need a type, source and date; there are at most 5 featured positions; delegation identifiers and source names can't be edited;
- audit columns (`created_at`, `updated_at`, `created_by`, `updated_by`) filled in by triggers;
- a public **`media` storage bucket** (images only, 8 MB max) that only administrators can write to.

## 3. Auth settings

In **Authentication → Providers**, keep **Email** enabled and turn **off** "Allow new users to sign up". Administrators are invited, never self-registered.

In **Authentication → URL Configuration**:
- **Site URL**: your public URL, e.g. `https://<user>.github.io/<repo>/`
- **Redirect URLs**: add `https://<user>.github.io/<repo>/admin` and `http://localhost:5173/admin` (needed for password-reset links).

## 4. Create the first administrator (secure)

There is no shared or hard-coded admin password.

1. **Authentication → Users → Invite user**, then enter the administrator's email. They set their own password from the invitation email. Alternatively, use *Add user* and let them reset the password.
2. In the **SQL Editor**, grant admin rights. Only the SQL editor and service role can do this; no API policy allows it:
   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'admin@example.com';
   ```
3. Sign in at `/admin`.

To revoke access, run `delete from public.admin_users where email = '…';`.

## 5. Connect the frontend

Local `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
For GitHub Pages, add the same two values as **repository variables** (see [DEPLOYMENT.md](DEPLOYMENT.md)).

Once configured, the public site reads from Supabase. If Supabase is unreachable, visitors see an error with a retry button, and the site doesn't quietly fall back to old data.

## Edge Functions

None are required. Every privileged operation (writes, uploads, granting admin rights) is either protected by RLS for signed-in admins or done in the Supabase dashboard. If you later add an automated Instagram metrics sync, it must run in an Edge Function with the Meta token stored as a Supabase secret, never in the frontend.
