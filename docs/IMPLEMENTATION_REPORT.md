# Implementation report: first release

Date: 2026-11-27. Nothing has been committed or pushed. There is no git remote yet.

## Checklist (acceptance criteria from the master brief)

- [x] Existing repository inspected and preserved (it was an empty scaffold plus reference assets)
- [x] Supplied logo used unaltered (resized copies for the header, favicon and social preview); brand colours and typography applied
- [x] Responsive, immersive homepage (drag/swipe arc carousel of the 12 delegations drawn from their real boundaries)
- [x] All 24 governorates render from real data; Ben Arous selectable; the other 23 marked "coming soon" with an explanation dialog
- [x] The 12 Ben Arous delegations verified against the source data (INS 1351–1362, `governorate = TN-13`) and selectable
- [x] Selecting a delegation zooms to its real boundary
- [x] Pins only at verified coordinates (none yet, so no pins are shown, by design)
- [x] Discovery pins open an accessible preview card (works as soon as an admin verifies a position)
- [x] Location detail pages, share/copy link, related places
- [x] 10 Instagram URLs preserved exactly; linked to a location only when the label names a specific place
- [x] Instagram embeds load on click, with a fallback card and link
- [x] Five featured posts chosen manually in the CMS (no fabricated ranking)
- [x] Search, delegation, category and type filters (accent- and Arabic-insensitive)
- [x] English, French and Arabic, with Arabic RTL across the public site
- [x] Browsing without an account
- [x] Admin protected by Supabase Auth and database RLS (not just hidden in the UI)
- [x] Admins can manage locations, stories, posts, translations, categories, images, delegation labels and publication status
- [x] No secrets in the repository or frontend
- [x] Map attribution on every map, plus a credits section and the ODbL licence shipped with the data
- [x] GitHub Pages workflow
- [x] Production build and tests pass
- [x] README and setup/deployment/content docs

## Completed and tested

| Area | How it was verified |
| --- | --- |
| Geo data (24 governorates, 12 delegations, closed rings, bounds, ids/INS prefix, TN-13 membership, Arabic names match the owner's list) | `npm run geo:validate` and `tests/data.test.ts` |
| Seed content: URLs/labels identical to `Instagram ref.txt`, delegation per owner grouping, no invented coordinates/categories/metrics | `tests/data.test.ts` |
| Search, filters, featured selection, delegation-only posts | `tests/data.test.ts` |
| Translation key parity (en/fr/ar), official slogans, fallback logic, Arabic normalisation | `tests/logic.test.ts` |
| Instagram URL parsing (rejects lookalike domains, http, profile URLs) | `tests/logic.test.ts` |
| CMS validation rules (verified coordinates need a source, Ben Arous bounds, duplicate URL/featured position, incomplete metrics) | `tests/logic.test.ts` |
| RLS present on every table, published-only public reads, admin-only writes, no write path to `admin_users` (static check of the migration) | `tests/logic.test.ts` |
| Arabic sets `dir=rtl`, the language switcher keeps the page, unprefixed URLs redirect, empty search state and reset, 404 for unknown places, detail page hides missing fields | `tests/ui.test.tsx` |
| `/admin` without a backend grants no access | `tests/ui.test.tsx` |
| In-browser (Vite dev server): home carousel on mobile, Tunisia map (24 shapes, keyboard-focusable), "Ben Arous · Available" label, coming-soon dialog via keyboard (focus moves into it), delegation zoom, Arabic RTL layout, a **real Instagram embed** loaded, no console errors, no horizontal overflow at 375 px and 1024 px | Manual QA in the built-in browser |
| Production build, including the `/WE-ARE-BEN-AROUS/` sub-path, `404.html`, robots and sitemap | `npm run build` |

**Results:** `geo:validate` passes; ESLint reports 0 problems; TypeScript strict reports 0 errors; **Vitest: 3 files, 37 tests, all passing**; `vite build` succeeds.

## Implemented but waiting on credentials or configuration

- **Supabase backend**: the schema, RLS, storage bucket, triggers and seed are written (`supabase/`), and the admin dashboard is fully wired to them. They **haven't been run against a live Supabase project** because no credentials were provided. Sign-in, CRUD, uploads and the RLS policies need a first test on a real project (see [BACKEND_SETUP.md](BACKEND_SETUP.md)).
- **GitHub Pages**: the workflow is ready. It needs a GitHub repository, *Pages → Source: GitHub Actions*, and the repository variables.
- **Canonical URLs and sitemap**: generated automatically once the public URL is known (in CI, from the Pages URL).

## Not implemented, and why

- **Map pins for the supplied places**: no verified coordinates were supplied, and the brief forbids guessing them. The places appear in lists and on detail pages with a "position not verified" notice. An admin can add verified positions in the CMS and pins appear straight away.
- **Pin clustering**: no clustering library. There are no pins yet and few are expected at first. Add `leaflet.markercluster` if Ben Arous gets dense groups of pins.
- **Photography**: `reference-assets/photography/` is empty. Cards use a branded placeholder, and real images can be uploaded with credits via the CMS.
- **Public story-submission form**: deliberately not built (the brief requires moderation, consent and abuse protection first). Admins publish community stories through the CMS.
- **Instagram thumbnails, captions and metrics**: not fetched automatically. That would need a Meta app token in a server function, and the brief rules out scraping. The official embed shows the real post when a visitor clicks to load it.
- **Admin dashboard language**: the CMS interface is in English. All *content* is edited in EN/FR/AR (with RTL Arabic fields). The public site is fully translated.
- **Raster base map**: none. OpenStreetMap's tile servers don't allow production use, so the map shows only the real vector boundaries on the dark theme, which also keeps it fast. A tile provider can be added later.

## Data the owner still needs to verify

1. **Display spellings.** The source data uses *Mohamedia*, *Fouchana*, *Hammam Chott* and *Radès*. The Instagram file has *Mohammedia*, *Fouchena*, *Hammam Chat* and *Rades*. Post labels are kept exactly as supplied, and delegation labels use the source spelling. You can edit the labels under **Admin → Delegations**.
2. **Four town-level posts** ("Hammam Lif", "Rades", "Hammam Chat", "Ezzahra") are linked to their delegation only and carry review notes. Link them to a specific place if one applies.
3. **The six places** (Saraya, Louzina, Demous Chenoi, Old Factory, Rebelle Club, Les Coupoles) are published with the owner's name and delegation only. Their descriptions, categories, photos and **verified coordinates** still need adding. Unpublish any you don't want live yet.
4. **French and Arabic mission/vision and UI copy** were written for this release. Only the platform description and the slogans came officially in all three languages. The Arabic copy in particular should get a native review.
5. **The visual-inspiration file** is named "20 most viewed posts…" but contains a GoFundMe screenshot and no metrics. No view counts are used anywhere.

## Architecture notes

- The public site reads one small "catalog" (all published content) on start, from Supabase or the bundled seed. Map, admin and detail views are lazy-loaded chunks.
- Geometry is never stored in or edited through the database. It's served read-only from `public/geo`, extracted and validated from Map Tunisia by `npm run geo:build`.
- Delegations are joined by Map Tunisia id / INS code, never by name. Social posts link to locations only through explicit IDs.
- The nested `map-data/map-tunisia` clone was being tracked as a broken gitlink (a submodule entry without `.gitmodules`). The index entry was removed with `git rm --cached` (the files on disk are untouched) and the folder is now in `.gitignore`. That removal is **staged, not committed**.

## Licensing obligations

- **ODbL 1.0 (map data)**: keep "Map data © OpenStreetMap contributors · Map Tunisia by Alaa Taieb" visible wherever the map appears (already in the Leaflet attribution and on the About page). Keep `public/geo/LICENSE-DATA.md`. Anyone who publishes a modified version of the GeoJSON must release it under the ODbL.
- **Map Tunisia code (MIT)**: no Map Tunisia code is bundled. Only its data is used.
- **Fonts (OFL)**: loaded from Google Fonts.
- **Instagram**: embeds through Meta's official script, links to the originals, no downloading or re-hosting.
- **Images uploaded later**: record the credit and permission for each. Images with permission "unknown" are hidden from the public.
