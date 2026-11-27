/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Base path of the deployed site:
//   Netlify / custom domain: "/"                  (default; also set in netlify.toml)
//   GitHub Pages:            "/we-are-ben-arous/" (set by .github/workflows/deploy.yml)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // On Netlify, fall back to the site's primary URL for canonical/OG/sitemap URLs when VITE_SITE_URL is not set.
  if (!env.VITE_SITE_URL && process.env.NETLIFY === 'true' && process.env.URL) process.env.VITE_SITE_URL = process.env.URL;
  const base = env.VITE_BASE_PATH || '/';
  return {
    base: base.endsWith('/') ? base : `${base}/`,
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/leaflet')) return 'leaflet';
            if (id.includes('node_modules/@supabase')) return 'supabase';
            if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
      css: false,
    },
  };
});
