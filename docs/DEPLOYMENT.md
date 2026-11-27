# Deployment

The site is a static Vite build (`dist/`) with Supabase as the backend. It can be hosted on **Netlify** (recommended, served at `/`) or on **GitHub Pages** (served at `/we-are-ben-arous/`). The base path comes from `VITE_BASE_PATH`, so the same code works on both.

| Host | Base path | SPA refresh handled by | Config file |
| --- | --- | --- | --- |
| Netlify | `/` | `[[redirects]] /* → /index.html 200` | `netlify.toml` |
| GitHub Pages | `/we-are-ben-arous/` | `404.html` copy of `index.html` | `.github/workflows/deploy.yml` |

## Netlify (recommended)

Everything Netlify needs is in **`netlify.toml`** at the repository root:
- build command `npm run build`, publish directory `dist`, Node 22, `VITE_BASE_PATH=/`;
- **SPA fallback**: every path without a matching file is served `index.html` with status 200, so a direct visit or refresh on `/en`, `/fr`, `/ar`, `/fr/places/saraya`, `/ar/explore/ben-arous/mornag` or `/admin/locations` works. Real files (JS/CSS, `/geo/*.geojson`, images, `robots.txt`, `sitemap.xml`) are served first;
- cache headers (`/assets/*` cached for a year, `/geo/*` revalidated daily), basic security headers, and `X-Robots-Tag: noindex` on `/admin/*`.

The build automatically uses Netlify's primary URL (`URL`) for canonical links, Open Graph tags, `sitemap.xml` and `robots.txt`, unless you set `VITE_SITE_URL`.

### Steps in Netlify

1. **Add new site → Import an existing project → GitHub**, then choose `medkerimjbeli-hue/we-are-ben-arous`.
2. **Branch to deploy:** `main`. Leave *Build command* / *Publish directory* as detected from `netlify.toml` (`npm run build` / `dist`); don't override them, and leave *Base directory* empty.
3. **Site configuration → Environment variables → Add a variable** (scope: *Builds*; all deploy contexts):

   | Key | Value | Secret? |
   | --- | --- | --- |
   | `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | No, public |
   | `VITE_SUPABASE_ANON_KEY` | the **anon / publishable** key | No, public (protected by RLS) |
   | `VITE_SITE_URL` | *optional*: your custom domain, e.g. `https://www.example.tn` | No |

   Don't add `VITE_BASE_PATH` (it's already `/` in `netlify.toml`).
   **Never** add the Supabase *service_role / secret* key, the database password or any Meta token to Netlify. Every `VITE_*` value is built into public JavaScript.
   Without the two Supabase variables, the site still works with the bundled starter content, and `/admin` explains that the backend isn't configured.
4. **Deploy site.** When it finishes, open `https://<your-site>.netlify.app/fr/places/saraya` directly and refresh it; it should load the page, not a 404.
5. In **Supabase → Authentication → URL Configuration**, set *Site URL* to the Netlify URL and add `https://<your-site>.netlify.app/admin` to *Redirect URLs* (needed for invitations and password resets).
6. Optional: **Domain management → Add a domain** for a custom domain, then update the Supabase Site URL and redirect URL, and set `VITE_SITE_URL` (or let Netlify's primary domain be used) and redeploy.

Each push to `main` redeploys automatically. *Deploy previews* for pull requests also work, because they use the same base path `/`. If you use previews with Supabase, add `https://deploy-preview-*--<your-site>.netlify.app/admin` to the Supabase redirect URLs.

**If you host on Netlify only:** go to GitHub → Settings → Pages and set *Source* to **None**, or delete `.github/workflows/deploy.yml`, so both hosts aren't publishing. The workflow's tests are still worth running; you can rename it and remove the deploy job.

---

## GitHub Pages (alternative)

The repository has no git remote yet, so the final URL isn't known. The workflow works out the base path automatically from GitHub, so you don't need to change any code.

## 1. Push the repository

Create a GitHub repository (for example `WE-ARE-BEN-AROUS`), then:
```powershell
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

## 2. Enable Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions.**

## 3. Repository variables (Settings → Secrets and variables → Actions → *Variables*)

| Variable | Required | Example |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | for the CMS/backend | `https://abcd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | for the CMS/backend | anon/publishable key |
| `SITE_URL` | optional | `https://www.example.tn` (defaults to the Pages URL) |
| `PAGES_BASE_PATH` | optional | `/` for a custom domain (defaults to `/<repo>/`) |

These are public values, so *variables* are fine. **Never add the Supabase service-role key** to GitHub.

## 4. Deploy

Every push to `main` runs `.github/workflows/deploy.yml`. It validates the geo data, lints, runs the tests, builds and deploys. It uses the official `configure-pages`, `upload-pages-artifact` and `deploy-pages` actions with least-privilege permissions. You can also start it by hand from the **Actions** tab.

Then add the Pages URL to Supabase **Auth → URL Configuration** (see [BACKEND_SETUP.md](BACKEND_SETUP.md)).

## How deep links work

GitHub Pages has no server-side rewrites. The build copies `index.html` to `404.html`, so a refresh on `/<repo>/fr/places/saraya` loads the app, and the router renders the right page. The page itself works, but GitHub returns HTTP 404 for those deep URLs, which can hurt SEO. A real host with rewrites (see below) fixes this.

## Test the production build locally

```powershell
npm run build
npm run preview
```
To test a sub-path like Pages: `$env:VITE_BASE_PATH='/WE-ARE-BEN-AROUS/'; npm run build; npm run preview`.

## Moving to a custom domain later

1. Point the domain's DNS at GitHub Pages (or another static host) and set it in **Settings → Pages → Custom domain**.
2. Set the repository variables `PAGES_BASE_PATH=/` and `SITE_URL=https://your-domain`.
3. Add the new URL to Supabase Auth redirect URLs.

No code changes are needed: the base path, canonical URLs, sitemap and Open Graph tags all come from these variables. On Netlify this is already configured in `netlify.toml`. On other hosts with rewrites (Vercel, Cloudflare Pages, nginx), rewrite every unknown path to `/index.html` with status 200.

## SEO files

`robots.txt` is always generated and blocks `/admin`. `sitemap.xml`, canonical and `hreflang` tags are added only when `SITE_URL` (or the Pages URL in CI) is known. Search engines only read `robots.txt` at the domain root, so on a project site (`user.github.io/repo/`) it's ignored until you move to a custom domain.

## Base maps and tile providers

The site draws only **vector boundaries** from Map Tunisia (ODbL). It loads no raster map tiles, so it doesn't break any tile server's usage policy and has no tile costs. `tile.openstreetmap.org` must **not** be used for a production site, under the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

If streets or a satellite background are wanted later:
- **Hosted:** use a commercial provider with a free tier and a proper licence, such as MapTiler, Stadia Maps or Thunderforest. Put its **public, domain-restricted** key in a `VITE_*` variable, add the tile layer in `src/features/map/MapView.tsx`, and keep the provider's attribution next to the OSM one.
- **Self-hosted:** generate a Tunisia extract as [Protomaps PMTiles](https://protomaps.com) and serve that single file from the same static host.

## Caching

- Vite fingerprints every JS and CSS file (`assets/*-<hash>.js`), so browsers can cache them indefinitely. GitHub Pages sends `Cache-Control: max-age=600` on everything and can't be configured.
- After a deploy, a visitor whose open tab still references old chunks gets the error boundary, which offers to reload the page.
- Uploaded images are stored with `Cache-Control: max-age=31536000` (each upload gets a new UUID path, so it's never overwritten).
- On a custom host, serve `/assets/*` with `Cache-Control: public, max-age=31536000, immutable` and `index.html` with `no-cache`.

## Pre-launch checklist

1. `npm run geo:validate`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run db:verify` and `npm run build` all pass (CI runs them on every push).
2. The Supabase migrations, seed and `verify.sql` print `ALL CHECKS PASSED` on the live project.
3. The repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set; the service-role key is **not** in GitHub.
4. The Supabase Auth Site URL and redirect URLs point at the Pages URL, and sign-ups are disabled.
5. The first admin can sign in, and a non-admin sees "Access denied".
6. Content verification is done (see `docs/IMPLEMENTATION_REPORT.md` → "Owner verification").
