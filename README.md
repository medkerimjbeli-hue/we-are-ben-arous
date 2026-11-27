# We Are Ben Arous

**Your region has more to tell.** · *Votre région a encore tant à raconter.* · *جهتك ما زال عندها برشا ما تحكيلك عليه.*

A multilingual (English / French / Arabic) regional discovery and storytelling platform for the Governorate of Ben Arous, Tunisia. It has an interactive map of Tunisia's 24 governorates, the 12 Ben Arous delegations with their real boundaries, discovery pages, an Instagram showcase and a protected content-management dashboard.

> We Are Ben Arous is an independent digital storytelling project. It is not a government service or an official tourism authority.

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS 4 · React Router 7 · i18next · Leaflet · Supabase (Auth, Postgres + RLS, Storage) · Vitest + Testing Library. Static hosting on GitHub Pages.

## Quick start

Requirements: Node.js 20+ (22 recommended) and npm.

```powershell
npm install
npm run dev
```

Open http://localhost:5173. Without Supabase credentials the public site runs on the bundled owner-supplied content (`src/data/seed.json`), and `/admin` explains how to connect a backend.

To connect a backend, copy `.env.example` to `.env.local` and fill in the **public** values (see [docs/BACKEND_SETUP.md](docs/BACKEND_SETUP.md)).

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm test` | Unit, data-integrity and UI tests (Vitest) |
| `npm run typecheck` | TypeScript project check |
| `npm run lint` | ESLint |
| `npm run build` | Type-check + production build into `dist/` (+ 404.html, robots, sitemap) |
| `npm run preview` | Serve the production build locally |
| `npm run geo:validate` | Validate the derived GeoJSON in `public/geo` |
| `npm run db:verify` | Apply every Supabase migration + seed to an in-memory PostgreSQL (PGlite) and run `supabase/verify.sql` |
| `npm run geo:build` | Re-extract `public/geo` from a local Map Tunisia clone |
| `npm run seed:sql` | Regenerate `supabase/seed.sql` from `src/data/seed.json` |

## Project layout

```text
src/
  app/            router, language layout
  components/     header, footer, dialog, SEO, states
  data/           seed content, Supabase mappers, catalog provider, selectors
  features/
    admin/        protected CMS (auth gate, CRUD pages, validation)
    home/         hero delegation carousel
    i18n/         i18next setup + en/fr/ar messages
    instagram/    URL parsing + click-to-load official embed with fallback
    locations/    cards + detail view
    map/          Leaflet map, geo loading/helpers
  routes/         public pages
public/geo/       derived Map Tunisia data (ODbL) + licence
supabase/         migrations (schema, RLS, storage) and seed.sql
scripts/          geo extraction/validation, seed SQL, postbuild
tests/            Vitest suites (unit, UI, mocked-admin, and real-PostgreSQL RLS tests in tests/db)
docs/             deployment, backend, content guide, implementation report
```

## Routes

`/:lang` (en, fr, ar) · `/:lang/explore` (Tunisia) · `/:lang/explore/ben-arous[/:delegation]` · `/:lang/places` (search + filters) · `/:lang/places/:slug` · `/:lang/stories` · `/:lang/about` · `/admin/*`.

## Documentation

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): GitHub Pages and custom domain
- [docs/BACKEND_SETUP.md](docs/BACKEND_SETUP.md): Supabase, RLS, storage and the first administrator
- [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md): how to manage content in the dashboard
- [docs/INSTAGRAM.md](docs/INSTAGRAM.md): Instagram embeds, featured posts and the optional metrics integration
- [docs/IMPLEMENTATION_REPORT.md](docs/IMPLEMENTATION_REPORT.md): what's done, test results, limitations, data to verify

## Credits & licences

- **Map data** © OpenStreetMap contributors, via [Map Tunisia](https://github.com/Alaa-Taieb/map-tunisia) by Alaa Taieb, under the **ODbL 1.0** (see `public/geo/LICENSE-DATA.md`). The attribution is shown on every map and on the About page. Because `public/geo/*.geojson` is a derived database, it stays under the ODbL.
- **Logo** is the We Are Ben Arous brand asset supplied by the owner.
- **Fonts**: Montserrat, Inter and IBM Plex Sans Arabic (SIL Open Font License), loaded from Google Fonts.
- **Instagram content** is embedded from the original posts and remains the property of its authors.
