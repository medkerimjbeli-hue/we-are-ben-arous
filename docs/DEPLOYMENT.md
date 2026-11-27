# Deployment: GitHub Pages

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

No code changes are needed: the base path, canonical URLs, sitemap and Open Graph tags all come from these variables. On a host with rewrites (Netlify, Vercel, Cloudflare Pages, nginx), rewrite every unknown path to `/index.html` with status 200.

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
