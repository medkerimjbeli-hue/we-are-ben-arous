# WE ARE BEN AROUS — MASTER CLAUDE CODE IMPLEMENTATION PROMPT

> **Project:** We Are Ben Arous  
> **Tagline:** Your region has more to tell.  
> **Initial launch region:** Ben Arous, Tunisia  
> **Initial hosting:** GitHub Pages  
> **Backend/CMS:** Supabase (subject to architecture validation before implementation)  
> **Languages:** English, French, Arabic  
> **Visual direction:** Immersive, cinematic, editorial, interactive  
> **Status:** Master implementation brief — inspect all supplied materials before coding.

---

## 0. Your role and mission

Act as a senior product engineer, full-stack architect, UI/UX designer, geospatial frontend engineer, accessibility specialist, and deployment engineer.

Build the first complete, deployable version of **We Are Ben Arous**, a digital regional discovery and storytelling platform dedicated to the identity, heritage, culture, destinations, and people of the Governorate of Ben Arous, Tunisia.

This is not merely a map website and not just a static tourism landing page. It is a regional discovery platform that connects people with places and the stories behind them.

The central product principle is:

> **We don't just tell people where a place is. We show them why it matters.**

The platform must serve both residents and visitors. Ben Arous is the first region and the starting point for a future nationwide platform covering Tunisia's 24 governorates.

Your task is to inspect the supplied repository, documentation, brand assets, screenshots, geographic data, and content files; understand what already exists; then implement the application in the existing project where possible. Do not blindly scaffold over an existing working project.

Do not stop after producing a homepage mockup. Deliver a coherent application with the public experience, protected content-management dashboard, data model, deployment workflow, tests, and setup documentation.

---

## 1. Mandatory first step: inspect before changing anything

Before writing or modifying code:

1. Inspect the complete current working directory and repository structure.
2. Identify the existing framework, package manager, scripts, dependencies, routing, styling system, and current application entry points.
3. Read all supplied project documentation, especially any official identity/reference-pack Markdown files.
4. Inspect every supplied image, logo, screenshot, spreadsheet, text file, and other asset. Do not assume filenames; identify files by their contents.
5. Inspect the cloned **Map Tunisia** repository and its README, documentation, data schemas, geographic files, attribution requirements, and licenses.
6. Inspect the supplied location/Reel list and preserve every supplied label and URL accurately.
7. Identify what is complete, incomplete, duplicated, contradictory, or missing.
8. Produce a concise implementation plan and list any blockers or required manual credentials.
9. Only then begin implementation.

Preserve existing useful code and assets. Avoid unnecessary rewrites, dependency churn, or destructive changes. Do not delete or overwrite user work without a clear reason.

If there are multiple repositories or nested projects, identify the intended website project and the geographic-data repository separately.

---

## 2. Product identity and positioning

### Official English description

“We Are Ben Arous is a digital regional discovery platform dedicated to celebrating the identity, heritage, culture, destinations and people of Ben Arous, Tunisia.

Through interactive geographical exploration, digital storytelling and community-driven content, we bring the region closer to its residents and visitors. From well-known landmarks to hidden destinations, from historical heritage to everyday local stories, we reveal the richness that makes Ben Arous unique.

We believe every place has a story worth telling, every community deserves to be seen, and every region has more to offer than meets the eye.”

### Official French description

“We Are Ben Arous est une plateforme numérique de découverte régionale dédiée à la valorisation de l'identité, du patrimoine, de la culture, des destinations et des habitants du gouvernorat de Ben Arous, en Tunisie.

À travers l'exploration géographique interactive, le storytelling numérique et les contributions de la communauté locale, nous rapprochons la région de ses habitants et de ses visiteurs. Des lieux emblématiques aux destinations méconnues, du patrimoine historique aux histoires du quotidien, nous révélons toute la richesse qui rend Ben Arous unique.

Nous croyons que chaque lieu mérite d'être raconté, que chaque communauté mérite d'être mise en lumière et que chaque région possède bien plus de richesses qu'on ne l'imagine.”

### Official Arabic description

“وي آر بن عروس هي منصة رقمية لاكتشاف المنطقة، تهدف إلى إبراز هوية ولاية بن عروس وتراثها وثقافتها ومعالمها وأهلها.

من خلال الاستكشاف الجغرافي التفاعلي، والسرد الرقمي، والمحتوى الذي تساهم فيه المجموعة المحلية، نقرّب المنطقة من سكانها وزوارها. فمن المعالم المعروفة إلى الأماكن المخفية، ومن التراث التاريخي إلى الحكايات اليومية، نكشف عن الثراء الذي يجعل بن عروس جهة مميزة.

نؤمن بأن لكل مكان حكاية تستحق أن تُروى، ولكل مجتمع حق في أن يُسلّط الضوء عليه، ولكل جهة من الكنوز ما يفوق توقعاتنا.”

### Mission

**“Making every corner worth discovering.”**

“Our mission is to reveal the full richness of Ben Arous by connecting its people, places, heritage and stories through accessible digital experiences.”

### Vision

“To become a leading digital platform for discovering, documenting and celebrating the richness of Tunisia's regions.

Starting with Ben Arous, we envision a future in which every governorate can tell its own story, showcase its identity and connect its communities with the rest of the country and the world.

Our ambition is not simply to build a website about a region. It is to create a digital gateway through which people can rediscover Tunisia, one region at a time.”

### Core aims

- Preserve identity: highlight history, traditions, and cultural heritage.
- Inspire discovery: encourage residents and visitors to explore beyond familiar destinations.
- Promote tourism: give visibility to local attractions, hidden places, and experiences.
- Empower communities: showcase local people, initiatives, businesses, and stories.
- Connect generations: make regional knowledge accessible and engaging through digital storytelling.

### Brand philosophy

1. We don't just show locations. We tell their stories.
2. We don't just promote destinations. We celebrate the people and heritage that make them meaningful.
3. We don't want people merely to visit our platform. We want them to rediscover their region.

The central idea is that We Are Ben Arous is about the relationship between people and the places they belong to. Ben Arous is where the journey begins, not where the ambition ends.

### Important positioning boundary

Do not describe the project as a government service, tourism authority, official public institution, registered association, or legally incorporated organization unless the owner supplies verified evidence. Present it as a digital regional discovery and storytelling platform.

---

## 3. Brand assets and visual system

The supplied logo image is the project's current brand logo. Use the supplied asset rather than inventing a replacement. Preserve its proportions and transparent background where available. Do not redraw, distort, crop important elements, or apply effects that make it illegible.

### Supplied typography

- **Montserrat** for headings, navigation, buttons, and important labels.
  - Recommended weights: 600, 700, 800.
- **Inter** for paragraphs, descriptions, cards, forms, and interface text.
  - Recommended weights: 400, 500, 600.

Verify Arabic glyph coverage and Arabic typography quality. If the supplied typefaces do not render Arabic well, select a compatible Arabic font for Arabic UI only, document the choice, and preserve the visual relationship with the Latin fonts.

### Supplied color palette

```css
:root {
  --color-primary: #F0002E;
  --color-secondary: #FFFFFF;
  --color-accent: #8B001B;

  --color-bg-main: #080808;
  --color-bg-secondary: #151515;

  --color-text-main: #FFFFFF;
  --color-text-muted: #A6A6A6;

  --color-border: #303030;
}
```

Use the palette consistently. The intended visual identity is black/dark cinematic surfaces, strong red accents, white typography, and muted grey supporting text.

Do not introduce a competing palette without a strong usability reason. Red should be used deliberately for important actions, selected states, map highlights, and brand emphasis—not as a flood of decoration.

### Visual inspiration screenshot

The supplied GoFundMe / The Kind 50 screenshot is an interaction and composition reference, not a template to copy. Use it as inspiration for:
- An immersive interactive hero.
- Layered, floating or draggable story imagery.
- A prominent featured story.
- Editorial image composition.
- Smooth transitions between featured stories.
- A sense of exploration and discovery.

Do not copy GoFundMe branding, text, layout pixel-for-pixel, or proprietary assets. Create an original We Are Ben Arous experience.

### General visual direction

- Immersive and cinematic, but still usable and fast.
- Strong editorial photography and clear hierarchy.
- Confident typography and generous spacing.
- Purposeful movement, not gratuitous animation.
- Distinct visual treatment for geographic exploration and story content.
- Responsive desktop, tablet, and mobile experiences.
- High-quality loading, empty, error, and unavailable-content states.

The website should feel like a contemporary regional discovery platform, not a generic admin template or a generic travel booking site.

---

## 4. Languages and internationalization

The launch must support all three languages:

1. English (`en`)
2. French (`fr`)
3. Arabic (`ar`)

Requirements:

- A language selector accessible throughout the public website.
- All interface strings must be translated; do not translate only the homepage.
- Arabic must use correct right-to-left (`dir="rtl"`) layout, including navigation, forms, cards, dialogs, map detail panels, and dashboard UI where relevant.
- Ensure punctuation, mixed Latin/Arabic text, numbers, and URLs render correctly.
- Keep content translations associated with the same underlying location or story record.
- Provide a sensible fallback language when a translation is missing, and indicate missing translations in the admin dashboard.
- Do not machine-invent historical or factual translations and present them as verified. Draft translations can be marked for review.
- Persist the visitor's language preference appropriately (e.g. URL or local preference) without requiring an account.

Use a proper internationalization approach suitable for the existing stack. Avoid hardcoding interface text inside components.

---

## 5. Geographic data and map infrastructure

### Primary geographic source

The owner has cloned the complete repository:

https://github.com/Alaa-Taieb/map-tunisia

Repository documentation/reference:
https://github.com/Alaa-Taieb/map-tunisia/blob/main/docs/reference.md

Repository quick start:
https://github.com/Alaa-Taieb/map-tunisia#-quick-start

Inspect the cloned repository directly. Do not rely only on this prompt or on assumptions about the data.

The repository documentation indicates data for governorates, delegations, and sectors, with GeoJSON/TopoJSON/SVG outputs and multiple levels of detail. Verify the current actual schema and contents before implementation.

### Geographic data requirements

- Use actual geographic features and boundaries from the supplied source.
- Inspect feature properties, identifiers, names in French/Arabic/English, parent relationships, coordinate order, geometry validity, and coordinate reference system.
- Use stable official/source identifiers and explicit parent relationships wherever available.
- Do not use fuzzy string matching as the primary method of joining delegations to governorates.
- Do not fabricate, approximate, or manually draw administrative boundaries.
- Do not invent coordinates for discovery places.
- Validate geometries and confirm the Ben Arous features belong to the correct governorate.
- Use an appropriate level of detail for each zoom level to balance visual quality and performance.
- Include map attribution visibly wherever required.
- Preserve source/license notices in the repository and documentation.

### Licensing and attribution

Inspect and comply with the licenses for both the repository code and the geographic data. The Map Tunisia project indicates MIT for code and ODbL 1.0 for map data; verify the exact current notices in the cloned repository before relying on that statement.

Preserve the required attribution to OpenStreetMap contributors and Map Tunisia wherever applicable. Include a clear map credits/about section and retain license notices in the project. Do not assume the code license also covers the geographic dataset.

### Geographic journey

The intended journey:

1. The homepage presents an interactive map of Tunisia with all 24 governorates.
2. Ben Arous is the first available/unlocked region.
3. The other governorates are visibly presented as coming soon / not yet available.
4. Selecting Ben Arous transitions into a detailed Ben Arous view.
5. The Ben Arous view presents its 12 delegations.
6. Selecting a delegation focuses/zooms to its actual boundary.
7. Discovery markers for published locations in that delegation appear.
8. Selecting a marker opens a preview popup/card.
9. The visitor can open the full location/story detail page or panel.

The map must remain understandable and usable on mobile. Provide a list-based alternative to map interaction for accessibility and small screens.

### Ben Arous delegations

Use the actual geographic dataset to verify names, identifiers, and membership. The working list supplied by the project owner is:

1. Ben Arous — بن عروس
2. La Nouvelle Médina — المدينة الجديدة
3. El Mourouj — المروج
4. Hammam Lif — حمام الأنف
5. Hammam Chott — حمام الشط
6. Bou Mhel El Bassatine — بومهل البساتين
7. Ezzahra — الزهراء
8. Radès — رادس
9. Megrine — مقرين
10. Mohamedia — المحمدية
11. Fouchana — فوشانة
12. Mornag — مرناق

Treat this as the owner's working list, not as a substitute for verifying the actual geographic source. Preserve official source spelling/identifiers in data, and use display labels that can be edited in the CMS. Do not silently change spellings or assume codes without checking.

---

## 6. Discovery locations and Instagram content supplied by the owner

The owner has supplied a labelled list of places and Instagram URLs. Preserve the supplied names, delegation groupings, and URLs exactly. Treat labels as owner-provided content, not independently verified geographic facts.

### Initial supplied content

**Mohammedia**
- Saraya — https://www.instagram.com/reel/DaDryxTt9Om/?utm_source=ig_web_copy_link&fqnt=MzRlODBiNWFlZA==&avpt=MzRlODBiNWFlZA==

**Hammam Lif**
- Hammam Lif — https://www.instagram.com/p/Daai0sOjYF1/?utm_source=ig_web_copy_link&dmpr=MzRlODBiNWFlZA==&avpt=MzRlODBiNWFlZA==
- Louzina — https://www.instagram.com/reel/DgNllkUNZyO/?utm_source=ig_web_copy_link&hvrq=MzRlODBiNWFlZA==&avpt=MzRlODBiNWFlZA==
- Demous Chenoi — https://www.instagram.com/reel/DaVuY98Mrnp/?utm_source=ig_web_copy_link&cnvx=MzRlODBiNWFlZA==&avpt=MzRlODBiNWFlZA==

**Mornag**
- Old Factory — https://www.instagram.com/reel/Df2uk0RNOHp/?utm_source=ig_web_copy_link&gwpx=MzRlODBiNWFlZA==&avpt=MzRlODBiNWFlZA==

**Fouchana** (owner's source spelling; verify preferred display spelling before normalizing)
- Rebelle Club — https://www.instagram.com/reel/DaqgA-GtXV1/?utm_source=ig_web_copy_link&dmpr=MzRlODBiNWFlZA==&avpt=MzRlODBiNWFlZA==

**Radès**
- Rades — https://www.instagram.com/reel/DaSNKJqNarH/?utm_source=ig_web_copy_link&bqrl=MzRlODBiNWFlZA==&avpt=MzRlODBiNWFlZA==

**Hammam Chott** (owner's source also says “Hammam Chat”)
- Les Coupoles — https://www.instagram.com/reel/DbWVoWZNd90/?utm_source=ig_web_copy_link&hvrq=MzRlODBiNWFlZA==&avpt=MzRlODBiNWFlZA==
- Hammam Chat — https://www.instagram.com/reel/DZabbx0N8VA/?utm_source=ig_web_copy_link&evlk=MzRlODBiNWFlZA==&avpt=MzRlODBiNWFlZA==

**Ezzahra**
- Ezzahra — https://www.instagram.com/reel/DbOfbPMNB3T/?utm_source=ig_web_copy_link&avpt=MzRlODBiNWFlZA==

Official Instagram profile supplied by owner:
https://www.instagram.com/we_are_ben_arous/

There are 10 supplied Instagram URLs across 7 delegation groups. One supplied URL is a regular Instagram post (`/p/`) rather than a Reel (`/reel/`). Support both post and Reel content types.

### Content modelling and relationships

Use a structured data model. Do not try to infer associations by matching arbitrary text at runtime.

Recommended conceptual entities:

**Delegation**
- stable ID from geographic data
- governorate ID
- localized names
- geometry/source reference
- publication/availability status

**Location**
- stable internal ID (e.g. UUID or generated slug; do not use display name as a database primary key)
- delegation ID
- localized name
- category
- short description and long story in each language
- latitude and longitude only when verified
- address or descriptive location if available
- cover image/media references
- publication status
- source/verification notes
- created/updated timestamps

**SocialPost**
- stable internal ID
- Instagram URL
- post type (`reel`, `post`, or other supported type)
- linked location ID (nullable if not yet confidently associated)
- display label
- caption/summary if approved
- verified metrics and metric type/date only if available
- publication/featured status
- embed status and fallback URL

One location may have multiple social posts. A social post may have one explicitly linked primary location. If a post's association is uncertain, leave it unlinked and flag it for admin review. Never silently attach a post to the nearest or similarly named location.

Generate stable IDs for the supplied records, but make them independent of mutable names. Retain the original URL. Normalize URLs only if safe and preserve the canonical post identifier; do not strip parameters in a way that changes the target.

### Instagram integration constraints

The owner expects the platform to use content from the official profile and supplied links. Implement a reliable, compliant approach:

- Treat the supplied individual URLs as the initial content source of truth.
- Use Instagram's supported public embed mechanism where available and permitted.
- Preserve a clickable link to the original Instagram post.
- Do not scrape private content, bypass login, evade rate limits, or download/rehost Instagram media without explicit permission and a lawful basis.
- Do not assume a public profile means every post can be programmatically retrieved.
- Do not invent captions, thumbnails, views, reach, likes, or engagement statistics.
- Handle deleted, private, unavailable, region-restricted, or embed-blocked posts gracefully.
- Provide a fallback card with the supplied label and “View on Instagram” link if embedding fails.
- Build the CMS so an administrator can add/edit/remove Instagram URLs and associate them with locations manually.
- Do not expose Instagram access tokens or other secrets in frontend code.

### Five featured Reels

The public homepage should have a section for five featured Instagram videos/posts. Ranking must be based only on comparable, verified metrics.

- Do not fabricate view counts or reach.
- Do not compare incompatible metrics (e.g. views versus accounts reached) as if they were equivalent.
- Store metric type, value, source, and last-verified date.
- If reliable metrics are not available, allow administrators to select five featured posts manually and label them “Featured” rather than presenting a false ranking.
- Each featured item should link to its associated location if that relationship is verified.

---

## 7. Public website information architecture and features

Build a complete public-facing experience. Use good product judgement while preserving the following core requirements.

### A. Homepage / landing experience

- Strong brand introduction using the official logo and slogan: **“Your region has more to tell.”**
- Localized slogan:
  - French: “Votre région a encore tant à raconter.”
  - Tunisian Arabic: “جهتك ما زال عندها برشا ما تحكيلك عليه.”
- Immersive hero experience inspired by the supplied interaction screenshot, but original in execution.
- Interactive Tunisia map as a central discovery entry point.
- Ben Arous highlighted as the first available governorate.
- Other 23 governorates clearly shown as coming soon/locked, without pretending they are already populated.
- Clear explanation of the platform and why visitors should explore.
- Featured locations/stories.
- Five featured Instagram posts/Reels (manual featured selection if verified comparable metrics are unavailable).
- Mission/identity content.
- Footer with social profile, map/data credits, language control, and contact links only when real details are supplied.

### B. Tunisia governorate map

- Render all 24 governorates using the supplied geographic dataset.
- Ben Arous is selectable/available.
- Other governorates are visibly unavailable/coming soon, but their geographic boundaries remain accurate.
- Provide clear hover, focus, selected, and disabled/coming-soon states.
- Keyboard accessibility and a non-map alternative.
- Clicking an unavailable governorate should explain that expansion is coming, not lead to a broken route.

### C. Ben Arous exploration

- Display all 12 verified delegations.
- Accurate boundaries and localized labels.
- Selecting a delegation focuses the map and displays its published discoveries.
- Show an empty state when a delegation has no published discoveries.
- Include a delegation list for people who cannot or do not want to interact with the map.

### D. Discovery pins and popup cards

Create original branded discovery markers. The exact design should harmonize with the red/black/white identity.

Marker behaviour:
- Distinguishable default, hover, focus, and selected states.
- Avoid overlapping pins where possible; use clustering or spiderfying when appropriate.
- Provide accessible labels.
- Clicking a marker opens a compact preview card.

Preview card should show, when available:
- Place photograph.
- Place name.
- Delegation.
- Category.
- Short description.
- Associated Instagram content preview/link.
- Action to open full location details.

Do not invent unavailable information. Hide absent optional fields or display a neutral “Information coming soon” state.

### E. Full location/story detail

Provide a dedicated route or accessible detail panel for each published location:
- Name and delegation.
- Category.
- Verified location/map position.
- Cover image and gallery if available.
- Short summary and longer story.
- Localized content.
- Associated Instagram post(s).
- Credits/source attribution where applicable.
- Related discoveries when valid relationships exist.
- Share/copy-link affordance.
- Clear route back to map/delegation exploration.

### F. Search and filtering

- Search published locations by name.
- Filter by category.
- Filter by delegation.
- Provide a clear no-results state and reset controls.
- Search and filters must work with the selected language and Arabic text.

Suggested categories should be configurable in the CMS rather than hardcoded as a closed list. Initial suggested categories may include heritage, history, nature, culture, architecture, food, local business, leisure, and hidden gem. Do not assign a category to a location unless supported by owner-provided or verified information.

### G. Community storytelling

The platform's positioning includes community-driven stories, but do not launch a public submission form unless it is deliberately designed with moderation, consent, privacy, and abuse prevention. For the first release, the admin may create and publish community stories through the CMS.

---

## 8. Full protected administration dashboard / CMS

The owner explicitly requested a **full administration dashboard**, not just a visual mockup.

Visitors must be able to browse without registering. Only authorized administrators should be able to access content-management functions.

### CMS capabilities

Provide a protected admin area with:

- Secure sign-in/sign-out.
- Admin-only route protection.
- Dashboard overview and useful counts.
- Create, edit, preview, publish, unpublish, archive, and delete locations.
- Create/edit delegations only where appropriate; geographic boundary source data should not be casually editable through the CMS.
- Manage categories.
- Create/edit/archive Instagram posts and Reels.
- Associate/disassociate social posts with locations.
- Mark posts as featured.
- Manage translations for English, French, and Arabic.
- Manage location descriptions and story content.
- Upload/manage approved images and media assets.
- Add photographer/source/permission/credit information.
- Record coordinate verification status and source.
- Record metric value, metric type, verification source, and last-verified date.
- Preview content before publication.
- Validation for missing required fields.
- Clear warnings for unverified coordinates, missing translations, missing image credits, unlinked Instagram posts, or incomplete content.
- Search, filters, pagination, and useful sorting.
- Confirmation for destructive actions.
- Audit metadata (created/updated timestamps and user where feasible).

### Content workflow

Use explicit statuses such as:
- Draft
- Needs review
- Published
- Archived

Only published content appears publicly. Unverified content must not be silently published as factual.

### Security requirements

- Never expose Supabase service-role keys or private secrets in browser code, committed files, logs, or public GitHub Actions artifacts.
- Use Supabase Auth or an equivalent secure authentication mechanism.
- Enforce authorization in database policies (e.g. Row Level Security), not merely by hiding admin buttons in the UI.
- Public users should have read access only to published public content.
- Only authorized admin users should create/update/delete content.
- Provide SQL migrations/schema and setup instructions.
- Do not create a hardcoded shared admin password.
- Do not implement a fake login screen that grants access without real authentication.
- Use environment variables for public configuration and secrets. Explain which values are safe to expose and which are secret.
- Ensure storage policies prevent unauthorized writes.
- Include a clear process for creating the first administrator securely.

### GitHub Pages and backend compatibility

GitHub Pages is static hosting. A protected CMS is possible only when connected to a real external backend/service.

Use Supabase for authentication, database, and storage if the existing project does not already provide a suitable backend. Validate this architecture against the existing repository before implementing.

Do not put private credentials in the Vite client bundle. A Supabase anon/publishable key may be used in the browser only with correctly configured RLS and is not a substitute for database policies. Service-role credentials must remain server-side and must never be included in GitHub Pages frontend environment variables.

If a required operation needs a server-side secret or privileged action, use a secure server-side function/service (e.g. Supabase Edge Function) and document deployment. Do not fake privileged operations in the client.

---

## 9. Technical architecture and engineering standards

Inspect the existing codebase first and preserve its stack where reasonable. If it is empty or unsuitable, the preferred frontend stack is:

- React
- TypeScript
- Vite
- Tailwind CSS or the existing consistent styling system
- React Router or an equivalent routing solution
- Leaflet (or a justified compatible map library) for interactive maps
- GeoJSON for geographic features
- Lucide icons or the existing icon library
- Supabase for database/auth/storage

Do not add a large dependency merely for a small effect. Use animation libraries only if they add clear value and remain performant.

### Code quality

- Strict TypeScript where practical.
- Reusable components and clear feature boundaries.
- Separate content/data, geographic utilities, map components, UI, and CMS features.
- Avoid giant single-file components.
- Avoid duplicated business logic.
- Use semantic HTML and accessible controls.
- Add meaningful loading/error/empty states.
- Handle network failures and missing backend configuration gracefully.
- No fake buttons or dead links.
- No placeholder buttons presented as working features.
- No hardcoded production secrets.
- No console errors or avoidable warnings.
- Do not claim a feature works if it is only a visual mockup.

### Suggested project separation

Adapt to the existing repository, but aim for a clear separation similar to:

```text
src/
  app/
  components/
  features/
    map/
    locations/
    instagram/
    search/
    admin/
    i18n/
  data/
  hooks/
  lib/
  routes/
  styles/
  types/
supabase/
  migrations/
  functions/
public/
  assets/
  geo/
```

Keep geographic source data and derived production assets clearly distinguished. Do not duplicate huge source files unnecessarily.

### Performance

- Lazy-load heavy map and detail components where practical.
- Use appropriate GeoJSON simplification/levels of detail without altering geographic truth.
- Optimize images and provide responsive sizes.
- Avoid loading every Instagram embed at once; lazy-load embeds near the viewport or on interaction.
- Avoid excessive animation and layout shifts.
- Test mobile performance.
- Respect reduced-motion preferences.

---

## 10. GitHub Pages deployment

The first public deployment will be hosted temporarily on **GitHub Pages**. The owner will purchase a domain and hosting later.

Requirements:

1. Configure the correct base path for the actual GitHub repository URL.
2. Add a GitHub Actions workflow to build and deploy the frontend.
3. Ensure the workflow uses supported GitHub Pages deployment actions and least-privilege permissions.
4. Configure SPA routing fallback or an appropriate routing strategy so deep links do not break on refresh.
5. Document repository settings needed to enable GitHub Pages.
6. Document required GitHub repository secrets/variables only when necessary.
7. Test the production build locally.
8. Explain how future custom-domain migration can be done without redesigning the application.

Do not assume the repository name or GitHub username. Inspect the actual repository metadata or ask for the exact deployment URL if it cannot be determined.

### Backend deployment

Document Supabase project creation/configuration, migrations, RLS policies, storage buckets, Auth settings, allowed redirect URLs, and Edge Functions if used.

The static frontend can be deployed to GitHub Pages while Supabase provides the backend. Do not describe GitHub Pages as hosting the database or server.

### Environment setup

Provide:
- `.env.example` with variable names and safe placeholders only.
- Clear distinction between public client configuration and secrets.
- Setup instructions for local development.
- Instructions for production GitHub Pages deployment.
- Instructions for Supabase configuration.
- A warning never to commit `.env` files containing secrets.

---

## 11. Content integrity, sources, and permissions

This project depends on accurate regional information.

Strict rules:
- Never invent a location, coordinate, delegation assignment, historical fact, quotation, source, image credit, Instagram URL, view count, or reach figure.
- Keep owner-supplied data distinct from independently verified data.
- Keep source URLs and verification notes in the CMS/data model where appropriate.
- If information is missing, leave it blank, mark it as needing review, or show a neutral unavailable state.
- Do not infer exact coordinates from a place name alone.
- Do not assume that Instagram content can be downloaded or reused just because it is public.
- Use supported embeds and links. Obtain permission before downloading/rehosting third-party media.
- Keep attribution and license records for photographs, maps, and other assets.
- Do not publish private contact details or personal data without authorization.

---

## 12. Accessibility and responsive design

Target WCAG 2.2 AA where practical.

Include:
- Keyboard navigation.
- Visible focus states.
- Proper labels and accessible names.
- Sufficient contrast.
- Semantic headings and landmarks.
- Screen-reader-friendly map alternatives.
- Text alternatives for meaningful images.
- Dialog focus management.
- Reduced-motion support.
- Touch-friendly mobile controls.
- No information conveyed by color alone.

The map must not be the only way to discover locations. Every location should also be accessible through lists/search and direct detail links.

---

## 13. SEO and sharing

Implement:
- Localized page titles and meta descriptions.
- Open Graph metadata.
- Twitter/X card metadata where useful.
- Favicon using the supplied brand asset.
- Sitemap and robots.txt appropriate to the actual deployment.
- Canonical URLs only when the public base URL is known.
- Structured data only where accurate and appropriate.
- Shareable location/delegation URLs.
- Correct social preview image handling.

Do not invent a custom domain. Use the real GitHub Pages deployment URL once known, and make it easy to change later.

---

## 14. Testing and quality assurance

Add and run appropriate tests.

At minimum:
- Type checking.
- Linting (if configured).
- Production build.
- Geographic data validation.
- Tests for mapping delegation IDs to the correct governorate.
- Tests for location-to-delegation relationships.
- Tests for Instagram post-to-location associations.
- Tests for language switching and Arabic RTL direction.
- Tests for public/admin authorization boundaries where practical.
- Tests for empty states and missing optional content.
- Basic responsive checks.

Manually inspect:
- Homepage at desktop and mobile widths.
- Tunisia map and Ben Arous selection.
- Delegation selection and map zoom.
- Discovery pin popup.
- Location detail view.
- Instagram embed fallback.
- Language switching, especially Arabic.
- Admin sign-in and protected routes.
- CMS create/edit/publish workflows.
- Production build and GitHub Pages base path.

Do not claim tests passed unless you actually ran them. Report anything that could not be tested and why.

---

## 15. Implementation phases

Work in phases, but continue through the full implementation unless blocked by a required external credential or a genuine missing input.

### Phase 1 — Audit and plan
- Inspect repository and all supplied materials.
- Inspect geographic source and licenses.
- Identify existing implementation and gaps.
- Present concise plan and architecture decisions.

### Phase 2 — Foundation
- Establish or refine project architecture.
- Set up design tokens, typography, routing, i18n, and shared components.
- Configure environment handling.

### Phase 3 — Public experience
- Implement homepage and immersive hero.
- Implement Tunisia map and Ben Arous exploration.
- Implement delegation map, pins, popup cards, detail pages, search, and filters.
- Implement Instagram showcase and fallback behaviour.
- Implement English/French/Arabic UI and RTL.

### Phase 4 — Backend and CMS
- Create database schema and migrations.
- Configure RLS, Auth, storage, and any necessary Edge Functions.
- Implement protected admin dashboard and complete content workflows.
- Seed only the supplied owner-provided initial content, clearly marked with appropriate review status if not verified.

### Phase 5 — Deployment and QA
- Configure GitHub Pages workflow.
- Test build and routes.
- Run checks and tests.
- Fix issues found.
- Produce documentation and a handoff report.

If credentials are missing, complete all work that can be done safely without them. Provide exact setup steps and identify the remaining manual actions. Do not invent credentials or pretend external services have been configured.

---

## 16. Required final deliverables

At completion, provide:

1. A working public website implementation.
2. A working protected admin CMS implementation, not a fake UI.
3. Database schema and migrations.
4. RLS policies and secure authentication setup instructions.
5. Supabase storage configuration instructions if used.
6. GitHub Actions deployment workflow for GitHub Pages.
7. `.env.example` with placeholders only.
8. Geographic data validation/processing scripts if needed.
9. Structured initial data for the supplied locations and Instagram URLs.
10. English/French/Arabic localization structure.
11. README with exact local setup instructions.
12. Deployment guide for GitHub Pages.
13. Backend setup guide.
14. Content management guide for the owner.
15. Testing summary, known limitations, and manual actions still required.

The final report must clearly separate:
- Completed and tested.
- Implemented but awaiting credentials/configuration.
- Not implemented, with reason.
- Data that still needs owner verification.

---

## 17. Acceptance criteria

The work is not complete until all feasible criteria below are satisfied:

- [ ] Existing repository inspected and preserved.
- [ ] Supplied logo and visual references incorporated appropriately.
- [ ] Brand colors and typography implemented consistently.
- [ ] Public homepage is responsive and immersive.
- [ ] All 24 governorates render from real geographic data.
- [ ] Ben Arous is selectable; other governorates are clearly marked coming soon.
- [ ] The 12 Ben Arous delegations are verified against source data and selectable.
- [ ] Selecting a delegation shows its correct geographic boundary.
- [ ] Published locations appear at verified coordinates only.
- [ ] Discovery pins open accessible preview cards.
- [ ] Location detail pages work.
- [ ] Supplied Instagram URLs are preserved and associated only as explicitly supplied.
- [ ] Instagram embeds have graceful fallback links.
- [ ] Five featured posts can be manually selected if comparable verified metrics are unavailable.
- [ ] Search and category/delegation filters work.
- [ ] English, French, and Arabic are supported.
- [ ] Arabic RTL works across the whole interface.
- [ ] Visitors can browse without registering.
- [ ] Admin access is protected by real authentication and database authorization.
- [ ] Admins can manage locations, social posts, translations, categories, images, and publication status.
- [ ] No private secrets are exposed in frontend code or repository.
- [ ] Map and media attribution/licensing requirements are respected.
- [ ] GitHub Pages deployment workflow is configured.
- [ ] Production build and available tests pass.
- [ ] README and setup/deployment documentation are complete.

---

## 18. Final instruction

Be proactive, careful, and honest.

Make sensible implementation decisions without asking the owner to approve every minor detail. Ask questions only when a decision is genuinely blocking or could cause irreversible changes.

Do not sacrifice data accuracy or security for visual polish. Do not replace real geographic data with a decorative illustration. Do not create fake content to make empty areas look populated.

The platform should feel ambitious, memorable, and distinctly rooted in Ben Arous while being architected for future expansion to the rest of Tunisia.

**Build a platform that makes people want to rediscover their own region.**

> **WE ARE BEN AROUS — YOUR REGION HAS MORE TO TELL.**
