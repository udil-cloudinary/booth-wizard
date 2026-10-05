// A short confetti burst for screen 06: two cannons in the bottom corners, Italian
// tricolore plus the accent, drawn on a canvas over the page and removed when done.
// The canvas lives in `host` (the screen), so leaving the screen stops it.

const DURATION_MS = 3200;
const FADE_MS = 700;
const PER_CANNON = 70;

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  spin: number; // flip speed: the piece turns around its long side as it falls
  color: string;
}

export function confetti(host: HTMLElement): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = innerWidth;
  const h = innerHeight;
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ffd23f';
  const colors = ['#2e9e4f', '#ffffff', '#d8412f', accent];
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const pieces: Piece[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < PER_CANNON; i++) {
      pieces.push({
        x: side < 0 ? rand(-10, 20) : rand(w - 20, w + 10),
        y: h + rand(0, 20),
        vx: -side * rand(2, 7.5),
        vy: -rand(h / 70, h / 42),
        w: rand(6, 11),
        h: rand(3, 6),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.2, 0.2),
        spin: rand(0.05, 0.2),
        color: colors[i % colors.length],
      });
    }
  }

  host.append(canvas);
  const t0 = performance.now();
  let last = t0;
  const frame = (now: number) => {
    const elapsed = now - t0;
    const dt = Math.min(32, now - last) / 16.67; // in 60 fps frames
    last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = Math.min(1, Math.max(0, (DURATION_MS - elapsed) / FADE_MS));
    for (const p of pieces) {
      p.vy += 0.32 * dt;
      p.vx *= 0.985;
      p.vy = Math.min(p.vy, 4.5); // flutter down instead of dropping
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(elapsed * p.spin * 0.06));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (elapsed < DURATION_MS && canvas.isConnected) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
