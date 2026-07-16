// Classic "flying through stars" field (à la the old Windows starfield screensaver).
// White stars stream outward from the centre, streaked for a warp-forward feel.
// 2D canvas, transparent background so the faint violet clouds show through behind it.

interface Star {
  x: number; // direction, roughly [-spread, spread]
  y: number;
  z: number; // depth (0, 1], smaller = closer
  pz: number; // previous depth, for the motion streak
}

function boot() {
  const canvas = document.getElementById('hero-stars') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const spread = 1.6;
  const speed = 0.00032; // depth per ms
  let w = 0, h = 0, cx = 0, cy = 0, k = 0;
  let stars: Star[] = [];

  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const mk = (z: number): Star => ({ x: rnd(-1, 1) * spread, y: rnd(-1, 1) * spread, z, pz: z });

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;
    k = Math.min(w, h) * 0.5;
    const count = Math.min(760, Math.max(220, Math.floor((w * h) / 2400)));
    if (stars.length !== count) {
      stars = Array.from({ length: count }, () => mk(rnd(0.05, 1)));
    }
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const sx = cx + (s.x / s.z) * k;
      const sy = cy + (s.y / s.z) * k;
      if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
      const a = Math.min(1, (1 - s.z) * 1.1 + 0.12);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      const r = Math.max(0.4, (1 - s.z) * 1.6);
      ctx.fillRect(sx, sy, r, r);
    }
  }

  if (reduced) {
    drawStatic();
    return;
  }

  let last = performance.now();
  let running = true;
  let raf = 0;

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(now - last, 50);
    last = now;

    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';

    for (const s of stars) {
      s.pz = s.z;
      s.z -= speed * dt;
      if (s.z <= 0.02) {
        s.x = rnd(-1, 1) * spread;
        s.y = rnd(-1, 1) * spread;
        s.z = 1;
        s.pz = 1;
      }
      const sx = cx + (s.x / s.z) * k;
      const sy = cy + (s.y / s.z) * k;
      if (sx < -60 || sx > w + 60 || sy < -60 || sy > h + 60) continue;
      const px = cx + (s.x / s.pz) * k;
      const py = cy + (s.y / s.pz) * k;

      const a = Math.min(1, (1 - s.z) * 1.15 + 0.1);
      const lw = Math.max(0.5, (1 - s.z) * 2.1);
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });
}

boot();
