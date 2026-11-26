// GitHub Pages helpers: SPA fallback (404.html), robots.txt and sitemap.xml.
import { copyFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
// Read VITE_SITE_URL from the environment or .env files (same precedence as Vite, simplified).
let site = process.env.VITE_SITE_URL || '';
for (const f of ['.env.production.local', '.env.local', '.env.production', '.env']) {
  if (site || !existsSync(resolve(root, f))) continue;
  const m = readFileSync(resolve(root, f), 'utf8').match(/^VITE_SITE_URL=(.*)$/m);
  if (m) site = m[1].trim();
}
site = site.replace(/\/$/, '');
const base = (process.env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'));
writeFileSync(resolve(dist, '.nojekyll'), '');
const seed = JSON.parse(readFileSync(resolve(root, 'src/data/seed.json'), 'utf8'));
if (site) {
  const paths = ['', '/explore', '/explore/ben-arous', '/places', '/stories', '/about',
    ...seed.delegations.map((d) => `/explore/ben-arous/${d.slug}`),
    ...seed.locations.filter((l) => l.status === 'published').map((l) => `/places/${l.slug}`)];
  const urls = paths.flatMap((p) => ['en', 'fr', 'ar'].map((l) => `  <url><loc>${site}/${l}${p}</loc></url>`));
  writeFileSync(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nDisallow: ${base}admin\nSitemap: ${site}/sitemap.xml\n`);
} else {
  writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nDisallow: ${base}admin\n`);
}
console.log(`postbuild: 404.html, robots.txt${site ? ', sitemap.xml' : ' (no VITE_SITE_URL: sitemap skipped)'}`);
