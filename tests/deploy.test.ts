// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');

describe('deployment configuration', () => {
  const toml = read('netlify.toml');
  it('Netlify builds with Vite into dist at base "/"', () => {
    expect(toml).toMatch(/command\s*=\s*"npm run build"/);
    expect(toml).toMatch(/publish\s*=\s*"dist"/);
    expect(toml).toMatch(/VITE_BASE_PATH\s*=\s*"\/"/);
  });
  it('Netlify rewrites unknown paths to index.html (SPA refresh on /en, /fr/places/…, /admin)', () => {
    expect(toml).toMatch(/\[\[redirects\]\]\s*from\s*=\s*"\/\*"\s*to\s*=\s*"\/index\.html"\s*status\s*=\s*200/);
    expect(toml).not.toMatch(/force\s*=\s*true/); // real files (assets, geo, images) must win
  });
  it('contains no secrets', () => {
    for (const f of ['netlify.toml', '.github/workflows/deploy.yml', '.env.example']) expect(read(f)).not.toMatch(/service_role\s*=|SERVICE_ROLE_KEY\s*[:=]\s*\S|eyJhbGciOi/);
  });
  it('GitHub Pages still derives its sub-path from the Pages configuration', () => {
    expect(read('.github/workflows/deploy.yml')).toMatch(/VITE_BASE_PATH:.*base_path/);
  });
});
