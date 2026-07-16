import { defineConfig } from 'astro/config';

// GitHub Pages project site for now: https://cryptobushneo.github.io/bush-landing/
// When bush.finance is wired: site='https://bush.finance', base='/', restore public/CNAME.
export default defineConfig({
  site: 'https://cryptobushneo.github.io',
  base: '/bush-landing',
  build: { inlineStylesheets: 'auto' },
});
