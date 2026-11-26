/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// VITE_BASE_PATH must match the GitHub Pages path, e.g. "/WE-ARE-BEN-AROUS/" for
// https://<user>.github.io/WE-ARE-BEN-AROUS/, or "/" for a custom domain.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
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
