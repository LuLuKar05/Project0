'use client';

import { useEffect, useRef } from 'react';

type Shape = 'dot' | 'spike4' | 'spike6';

type Star3D = {
  x: number;
  y: number;
  z: number;
  pz: number;
  baseSize: number;
  brightness: number;
  shape: Shape;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
};

const STAR_COUNT = 800;
const BASE_SPEED = 0.018;
const SCROLL_MULTIPLIER = 0.00055;
const WARP_THRESHOLD = 0.04;

function makeStar(): Star3D {
  const r = Math.random();
  const shape: Shape = r < 0.6 ? 'dot' : r < 0.85 ? 'spike4' : 'spike6';
  return {
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: Math.random() * 0.98 + 0.02,
    pz: 1,
    baseSize: Math.random() * 1.4 + 0.5,
    brightness: Math.random() * 0.35 + 0.65,
    shape,
  };
}

function resetStar(s: Star3D) {
  s.x = (Math.random() - 0.5) * 2;
  s.y = (Math.random() - 0.5) * 2;
  s.z = 1;
  s.pz = 1;
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.4, size), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
  ctx.fill();
}

function drawSpike4(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  const arm = size * 2.2;
  const w = Math.max(0.5, size * 0.35);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y);
  ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.3, size * 0.45), 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.restore();
}

function drawSpike6(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  const arm = size * 2.0;
  const w = Math.max(0.5, size * 0.3);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * arm, y + Math.sin(angle) * arm);
    ctx.lineTo(x - Math.cos(angle) * arm, y - Math.sin(angle) * arm);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.3, size * 0.4), 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.restore();
}

function spawnMeteor(w: number, h: number): Meteor {
  const fromTop = Math.random() > 0.3;
  const angle = (Math.random() * 20 + 10) * (Math.PI / 180);
  const speed = Math.random() * 8 + 10;
  const life = Math.random() * 40 + 50;
  return {
    x: fromTop ? Math.random() * w : 0,
    y: fromTop ? 0 : Math.random() * h * 0.4,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life,
    maxLife: life,
    length: Math.random() * 120 + 80,
  };
}

export default function Starfield({ starCount = STAR_COUNT }: { starCount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;

    const stars: Star3D[] = Array.from({ length: starCount }, makeStar);

    let scrollY = 0;
    let lastScrollY = 0;
    let warpSpeed = 0;

    let meteor: Meteor | null = null;
    let nextMeteorIn = Math.random() * 6000 + 4000;
    let lastTime = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);

    const draw = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const fov = canvas.width * 0.85;

      // Update warp from scroll velocity
      const scrollDelta = scrollY - lastScrollY;
      lastScrollY = scrollY;
      warpSpeed = warpSpeed * 0.88 + Math.abs(scrollDelta) * SCROLL_MULTIPLIER;
      const speed = BASE_SPEED + warpSpeed;
      const warpFactor = Math.min(1, warpSpeed / WARP_THRESHOLD);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;

        if (s.z <= 0) {
          resetStar(s);
          continue;
        }

        const sx  = (s.x / s.z)  * fov + cx;
        const sy  = (s.y / s.z)  * fov + cy;
        const psx = (s.x / s.pz) * fov + cx;
        const psy = (s.y / s.pz) * fov + cy;

        if (sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) continue;

        const size = s.baseSize / s.z;

        if (warpFactor > 0.12) {
          // Warp streak — gradient line from tail to head
          const streakAlpha = Math.min(1, s.brightness * (0.4 + warpFactor * 0.6));
          const grad = ctx.createLinearGradient(psx, psy, sx, sy);
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(1, `rgba(255,255,255,${streakAlpha.toFixed(2)})`);
          ctx.beginPath();
          ctx.moveTo(psx, psy);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(0.5, size * 0.45);
          ctx.stroke();

          // Bright tip
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.3, size * 0.3), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${streakAlpha.toFixed(2)})`;
          ctx.fill();
        } else {
          // Normal shape rendering
          const alpha = s.brightness * (1 - warpFactor * 0.5);
          if (s.shape === 'spike4') drawSpike4(ctx, sx, sy, size, alpha);
          else if (s.shape === 'spike6') drawSpike6(ctx, sx, sy, size, alpha);
          else drawDot(ctx, sx, sy, size, alpha);
        }
      }

      // Meteor
      nextMeteorIn -= dt;
      if (nextMeteorIn <= 0 && !meteor) {
        meteor = spawnMeteor(canvas.width, canvas.height);
        nextMeteorIn = Math.random() * 6000 + 4000;
      }
      if (meteor) {
        const progress = 1 - meteor.life / meteor.maxLife;
        const alpha = progress < 0.1
          ? progress / 0.1
          : progress > 0.7
          ? 1 - (progress - 0.7) / 0.3
          : 1;
        const angle = Math.atan2(meteor.vy, meteor.vx);
        const tailX = meteor.x - Math.cos(angle) * meteor.length * alpha;
        const tailY = meteor.y - Math.sin(angle) * meteor.length * alpha;

        const grad = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, `rgba(255,255,255,${(alpha * 0.9).toFixed(2)})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(meteor.x, meteor.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.9).toFixed(2)})`;
        ctx.fill();

        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.life -= dt / 16;
        if (meteor.life <= 0 || meteor.x > canvas.width + 200 || meteor.y > canvas.height + 200) {
          meteor = null;
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [starCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
