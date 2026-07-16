# bush.finance — Cryptobush landing

Dark-violet / crypto-gold quant-fund landing page. Astro + GSAP + Lenis, WebGL
blob/ray hero. Static build, deployed to GitHub Pages on `bush.finance`.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview  # serve the build
```

## Structure

- `src/components/` — one file per section (Hero, Manifesto, Edge, Strategies, Numbers, Venues, Firm, Contact, Footer, Nav)
- `src/scripts/hero-canvas.ts` — WebGL fragment-shader hero background
- `src/scripts/scroll.ts` — Lenis smooth scroll + GSAP reveal/parallax + nav state
- `src/styles/global.css` — design tokens + base styles
- `public/CNAME` — custom domain for GitHub Pages

## Before going live

1. **Contact form** — `src/components/Contact.astro`: replace `FORM_ID` in
   `FORM_ENDPOINT` with your [Formspree](https://formspree.io) form id.
2. **Email** — update `partners@bush.finance` if different.
3. **Domain** — in the GitHub repo: Settings → Pages → Source = GitHub Actions;
   Custom domain = `bush.finance`. Add DNS: `A`/`ALIAS` records per GitHub Pages docs.
4. All copy is qualitative — no performance figures. Keep it that way unless legally reviewed.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` builds and publishes to Pages.
