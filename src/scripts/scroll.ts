import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initSmoothScroll() {
  if (reduced) return;
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // let in-page anchors drive Lenis
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.2 });
    });
  });
}

function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initHeroIntro() {
  const items = gsap.utils.toArray<HTMLElement>('[data-hero]');
  if (!items.length) return;
  document.documentElement.classList.add('gsap-ready');
  if (reduced) {
    gsap.set(items, { opacity: 1, y: 0 });
    return;
  }
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.25,
  });
}

function initReveals() {
  const els = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  if (!els.length) return;
  document.documentElement.classList.add('gsap-ready');
  if (reduced) {
    gsap.set(els, { opacity: 1, y: 0 });
    return;
  }
  els.forEach((el) => {
    const delay = parseFloat(el.dataset.revealDelay || '0');
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      delay,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

function initParallax() {
  if (reduced) return;
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const amt = parseFloat(el.dataset.parallax || '40');
    gsap.to(el, {
      yPercent: amt,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

function run() {
  initSmoothScroll();
  initNav();
  initHeroIntro();
  initReveals();
  initParallax();
  ScrollTrigger.refresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
