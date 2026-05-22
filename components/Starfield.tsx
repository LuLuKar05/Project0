'use client';

/**
 * 3D Starfield — Star Wars-style warp background
 *
 * Each star lives at (x, y, z) in 3D space, centered at origin.
 * Every frame, z decreases — the star moves toward the viewer.
 * Screen position is derived by perspective projection:
 *   screenX = (x / z) * fov + cx
 *   screenY = (y / z) * fov + cy
 *   size    = baseSize / z
 *
 * Scroll velocity boosts z-speed → stars stretch into radial streaks (warp).
 * Mouse position tilts the projection center (cx, cy) → "looking around" feel.
 * Mouse velocity adds a minor warp boost → fast swipes cause a brief streak burst.
 */

import { useEffect, useRef } from 'react';

type Shape = 'dot' | 'spike4' | 'spike6';

type Star3D = {
  x: number;       // 3D position, range -1 to 1 (relative to center)
  y: number;
  z: number;       // depth: 1 = far, ~0 = just passed the camera
  pz: number;      // z from the previous frame — used to compute streak length
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

// Base forward speed. 0 = stars are stationary until the user scrolls or moves the mouse.
const BASE_SPEED = 0;

// How much scroll velocity contributes to warp speed
const SCROLL_MULTIPLIER = 0.00055;

// How much mouse movement velocity contributes to warp speed (intentionally tiny)
const MOUSE_WARP_MULTIPLIER = 0.00008;

// warpSpeed value at which warpFactor reaches 1 (full hyperspace streaks)
const WARP_THRESHOLD = 0.04;

// How far the projection center shifts toward the mouse (fraction of half-screen)
const TILT_STRENGTH = 0.06;

// Lerp factor for tilt smoothing — low = sluggish/organic, high = snappy
const TILT_LERP = 0.06;

function makeStar(): Star3D {
  const r = Math.random();
  const shape: Shape = r < 0.6 ? 'dot' : r < 0.85 ? 'spike4' : 'spike6';
  return {
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: Math.random() * 0.98 + 0.02,
    // pz starts at 1 so the first frame doesn't produce a giant streak
    // (streak = difference between current and previous projected position)
    pz: 1,
    baseSize: Math.random() * 1.4 + 0.5,
    brightness: Math.random() * 0.35 + 0.65,
    shape,
  };
}

function resetStar(s: Star3D) {
  s.x = (Math.random() - 0.5) * 2;
  s.y = (Math.random() - 0.5) * 2;
  // Always reset to z=1 (far background), not a random z.
  // Random z on reset would cause stars to pop in at visible sizes mid-screen.
  s.z = 1;
  s.pz = 1;
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, alpha: number,
) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.4, size), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
  ctx.fill();
}

// 4-spike: two perpendicular lines (H + V) sharing a bright center dot.
// The center dot is drawn separately so it stays round and bright regardless of line width.
function drawSpike4(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, alpha: number,
) {
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

// 6-spike: three lines at 0°, 60°, 120° — drawn through center so each line
// covers both directions without needing 6 separate segments.
function drawSpike6(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, alpha: number,
) {
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

    // Scroll tracking
    let scrollY = 0;
    let lastScrollY = 0;
    let warpSpeed = 0;

    // Mouse tracking
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    let lastMouseX = mouseX;
    let lastMouseY = mouseY;
    // Smoothed tilt offsets applied to the projection center
    let tiltX = 0;
    let tiltY = 0;

    let meteor: Meteor | null = null;
    let nextMeteorIn = Math.random() * 6000 + 4000;
    let lastTime = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-center mouse tracking after resize so tilt doesn't jump
      mouseX = canvas.width / 2;
      mouseY = canvas.height / 2;
    };
    resize();

    const onScroll = () => { scrollY = window.scrollY; };
    const onMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);

    const draw = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      // --- Tilt: lerp projection center toward mouse position ---
      // Normalized mouse offset: -1 (left/top) to +1 (right/bottom)
      const normalizedMX = (mouseX - canvas.width  / 2) / (canvas.width  / 2);
      const normalizedMY = (mouseY - canvas.height / 2) / (canvas.height / 2);
      const targetTiltX = normalizedMX * canvas.width  * TILT_STRENGTH;
      const targetTiltY = normalizedMY * canvas.height * TILT_STRENGTH;
      tiltX += (targetTiltX - tiltX) * TILT_LERP;
      tiltY += (targetTiltY - tiltY) * TILT_LERP;

      const cx = canvas.width  / 2 + tiltX;
      const cy = canvas.height / 2 + tiltY;
      const fov = canvas.width * 0.85;

      // --- Warp speed: scroll velocity + mouse velocity ---
      const scrollDelta = scrollY - lastScrollY;
      lastScrollY = scrollY;
      const mouseDelta = Math.hypot(mouseX - lastMouseX, mouseY - lastMouseY);
      lastMouseX = mouseX;
      lastMouseY = mouseY;

      // warpSpeed decays each frame; both scroll and mouse inject into it
      warpSpeed = warpSpeed * 0.88
        + Math.abs(scrollDelta) * SCROLL_MULTIPLIER
        + mouseDelta * MOUSE_WARP_MULTIPLIER;

      const speed = BASE_SPEED + warpSpeed;

      // warpFactor: 0 = normal shapes, 1 = full hyperspace streaks
      const warpFactor = Math.min(1, warpSpeed / WARP_THRESHOLD);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;

        if (s.z <= 0) {
          resetStar(s);
          continue;
        }

        // Perspective projection — current and previous frame positions
        const sx  = (s.x / s.z)  * fov + cx;
        const sy  = (s.y / s.z)  * fov + cy;
        const psx = (s.x / s.pz) * fov + cx;
        const psy = (s.y / s.pz) * fov + cy;

        if (sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) continue;

        const size = s.baseSize / s.z;

        if (warpFactor > 0.12) {
          // Warp mode: draw a gradient streak from previous position to current.
          // The streak radiates outward from center naturally because projection
          // amplifies displacement the closer z gets to 0.
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

          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.3, size * 0.3), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${streakAlpha.toFixed(2)})`;
          ctx.fill();
        } else {
          // Normal mode: draw the star's assigned shape
          const alpha = s.brightness * (1 - warpFactor * 0.5);
          if (s.shape === 'spike4')      drawSpike4(ctx, sx, sy, size, alpha);
          else if (s.shape === 'spike6') drawSpike6(ctx, sx, sy, size, alpha);
          else                           drawDot(ctx, sx, sy, size, alpha);
        }
      }

      // --- Meteor ---
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
      window.removeEventListener('mousemove', onMouseMove);
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
