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
