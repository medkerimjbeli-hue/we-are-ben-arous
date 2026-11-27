# Backend setup (Supabase)

GitHub Pages only serves static files. The database, sign-in and image storage come from **Supabase**. The browser talks to Supabase directly using the public *anon/publishable* key, and the database's **Row Level Security (RLS)** decides what each request may read or write. Hiding buttons in the UI is never what keeps data safe.

> Everything below has been tested against a real PostgreSQL engine locally: `npm run db:verify` and `tests/db/rls.test.ts` run every migration, the seed and the security checks. **It has not yet been run on a live Supabase project**, because that needs your account.

## Keys: what's safe where

| Value | Where it goes | Safe in the browser? |
| --- | --- | --- |
| Project URL (`VITE_SUPABASE_URL`) | `.env.local`, GitHub repository **variable** | Yes |
| anon / publishable key (`VITE_SUPABASE_ANON_KEY`) | `.env.local`, GitHub repository **variable** | Yes. RLS protects the data |
| **service_role / secret key** | Supabase dashboard only. **Never** in this repo, in GitHub or in any `VITE_*` variable | **No** |
| Database password | Supabase dashboard / your password manager | **No** |

`.env*` files are git-ignored, except `.env.example`.

## 1. Create the project

1. Create a project at https://supabase.com. Pick an EU region (Frankfurt or Paris) to be closest to Tunisia.
2. In **Project Settings → API**, copy the Project URL and the anon/publishable key.

## 2. Apply the schema, seed and checks (in this order)

In the **SQL Editor**, run each file in full:

1. `supabase/migrations/20261127000000_init.sql`: tables, RLS, the storage bucket and integrity rules.
2. `supabase/migrations/20261128000000_hardening.sql`: tamper-proof audit columns, edit history, SEO and story fields, upload path rules, the cover-permission check and explicit grants.
3. `supabase/seed.sql`: the 12 delegations, 9 suggested categories, 6 owner-supplied places and the 10 Instagram URLs. It's safe to run again; existing rows are left alone.
4. `supabase/verify.sql`: should print **`ALL CHECKS PASSED`**. It runs inside a rolled-back transaction, so it changes nothing.

Using the CLI instead:
```powershell
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push
```
Then run `seed.sql` and `verify.sql` in the SQL editor.

### What the database enforces

- **RLS on every table.** Visitors who aren't signed in can only *read* published places, stories and Instagram posts, plus all delegations and categories. They see images only when the image belongs to a published place **and** has a recorded permission. They have no write access at all: the grants are revoked as well as blocked by RLS.
- **Admins:** a signed-in user can write only if their id is in `admin_users` (`public.is_admin()`). The API has **no** way to add rows to `admin_users`, which blocks privilege escalation.
- **Integrity:**
  - verified coordinates need a source and must fall inside Ben Arous;
  - latitude and longitude must be set together;
  - Instagram URLs must be real post or Reel URLs, and each can only be added once;
  - a metric needs its type, source and date;
  - each featured position (1–5) is used at most once;
  - nothing can be published without a name, or with a cover image whose permission is "unknown";
  - delegation ids and source names can't be changed;
  - only stories can link to a place.
- **Audit:** `created_by/updated_by/created_at/updated_at` are set by the database and can't be faked by the client. Every insert, update and delete is copied into `content_revisions`, which admins can read and nobody can edit.
- **Storage:** the `media` bucket is public-read (served through Supabase's CDN). Only admins can upload, replace or delete files. Files are limited to 8 MB and to JPEG, PNG, WebP or AVIF; SVG is rejected because it can carry scripts. The dashboard checks the same rules before uploading.

## 3. Auth settings

**Authentication → Sign In / Providers**
- Keep **Email** enabled and turn **off** "Allow new users to sign up". Admins are invited, never self-registered.
- Recommended: require a minimum password length of 10 or more.

**Authentication → URL Configuration**
- **Site URL**: your public URL, e.g. `https://<user>.github.io/<repo>/`.
- **Redirect URLs**: `https://<user>.github.io/<repo>/admin` and `http://localhost:5173/admin`. Password-reset and invitation links land here, and the dashboard then asks for a new password.

## 4. Create the first administrator

There's no shared or hard-coded admin password.

1. **Authentication → Users → Invite user**, then enter the administrator's email. They choose their own password from the email link.
2. In the **SQL Editor**:
   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'admin@example.com';
   ```
3. Sign in at `/admin`.

To revoke access: `delete from public.admin_users where email = '…';`. To list admins: `select * from public.admin_users;`.

## 5. Connect the frontend

Local `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```
For GitHub Pages, add the same two values as repository **variables** (see [DEPLOYMENT.md](DEPLOYMENT.md)).

Once configured, the public site reads live data. If Supabase can't be reached, visitors see an error with a retry button; the site doesn't quietly show stale data. Without configuration, the site shows the bundled seed content and doesn't even download the Supabase library.

## 6. Check that it works

1. Run `supabase/verify.sql`, which should print `ALL CHECKS PASSED`.
2. In a private browser window, open the site. The six published places appear; drafts don't.
3. Sign in at `/admin` as the administrator: the dashboard should list the warnings (no positions, no photos, unlinked posts).
4. Sign in as a non-admin user, if you created one: you should see "Access denied".
5. **Table Editor → content_revisions**: after editing something in the dashboard, a row appears.

## 7. Backups and recovery

- **Automatic:** paid Supabase plans include daily backups, and point-in-time recovery is available as an add-on. The free plan has **no** downloadable automatic backups, so take manual ones.
- **Manual backup** (any plan). Use the connection string from *Project Settings → Database*, and keep the file private because it contains admin emails:
  ```powershell
  npx supabase db dump --linked -f backup-schema.sql
  npx supabase db dump --linked --data-only -f backup-data.sql
  ```
  Download the `media` bucket from *Storage* (or with the Supabase CLI), and back up `seed.json` and `public/geo` through git as usual.
- **Undoing a content mistake:** `content_revisions.snapshot` holds the full row before and after each change. Copy the values you need back through the dashboard, or with SQL as the owner.
- **Disaster recovery:** create a new project, then run the two migrations and the data dump (or `seed.sql`), re-upload the media, re-create admins (step 4) and update the two GitHub variables.

## Instagram metrics (optional, not enabled)

See [INSTAGRAM.md](INSTAGRAM.md). Any automated metric sync must run server-side, in a Supabase Edge Function with the Meta token stored as a Supabase secret, and never in the frontend.
