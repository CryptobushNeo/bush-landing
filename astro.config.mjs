import { defineConfig } from 'astro/config';

// Custom domain (bush.finance) served from GitHub Pages → root base.
export default defineConfig({
  site: 'https://bush.finance',
  base: '/',
  build: { inlineStylesheets: 'auto' },
});
