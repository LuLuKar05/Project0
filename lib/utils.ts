/**
 * @file lib/utils.ts
 * Pure utility functions shared by the galaxy Three.js modules.
 * No React dependencies — safe to import in any environment.
 */

import * as THREE from 'three';

// ─────────────────────────────────────────────
//  Math helpers
// ─────────────────────────────────────────────

/**
 * Cubic ease-in-out interpolation.
 *
 * Maps a linear t ∈ [0, 1] to a smooth S-curve:
 *   - Accelerates for the first half (t < 0.5)
 *   - Decelerates for the second half (t ≥ 0.5)
 *
 * Used for camera transitions and entry animation tweens.
 *
 * @param t - Normalised progress (0 = start, 1 = end)
 * @returns Eased value in the same [0, 1] range
 */
export function easeIO(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Convert HSL colour to an RGB triple.
 * All parameters and return values are in the [0, 1] range.
 *
 * @param h - Hue (0–1)
 * @param s - Saturation (0–1)
 * @param l - Lightness (0–1)
 * @returns [r, g, b] each in [0, 1]
 */
export function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
  // Achromatic shortcut
  if (s === 0) return [l, l, l];

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  /** Internal hue-to-channel helper */
  function h2r(p2: number, q2: number, t: number): number {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p2 + (q2 - p2) * 6 * tt;
    if (tt < 1 / 2) return q2;
    if (tt < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - tt) * 6;
    return p2;
  }

  return [h2r(p, q, h + 1 / 3), h2r(p, q, h), h2r(p, q, h - 1 / 3)];
}

// ─────────────────────────────────────────────
//  Texture generators
// ─────────────────────────────────────────────

/**
 * Generate a soft radial glow sprite texture on an off-screen canvas.
 *
 * The texture is a radial gradient that fades from the given colour at the
 * centre to fully transparent at the edges.  Used for planet halos and the
 * galactic core sprite.
 *
 * @param hexColor - Three.js hex integer colour (e.g. 0x4FC3F7)
 * @param size     - Canvas size in pixels (default 128, must be power-of-2)
 * @returns A Three.js CanvasTexture ready for SpriteMaterial
 */
export function radialGlow(hexColor: number, size = 128): THREE.CanvasTexture {
  // Decompose hex into 0-255 RGB channels
  const c = new THREE.Color(hexColor);
  const r = Math.floor(c.r * 255);
  const g = Math.floor(c.g * 255);
  const b = Math.floor(c.b * 255);

  // Draw gradient on an off-screen canvas
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;

  const half = size / 2;
  const gr = ctx.createRadialGradient(half, half, 0, half, half, half);
  gr.addColorStop(0,    `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.15, `rgba(${r},${g},${b},0.5)`);
  gr.addColorStop(0.5,  `rgba(${r},${g},${b},0.1)`);
  gr.addColorStop(1,    'rgba(0,0,0,0)');

  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(cv);
}

/**
 * Generate a horizontal lens-flare streak texture.
 *
 * Creates a 256×16 canvas with a cyan gradient brighter in the centre and
 * fading to transparent on both sides.  Attached to the galactic core as a
 * wide, flat Sprite to simulate a camera lens flare.
 *
 * @returns A Three.js CanvasTexture ready for SpriteMaterial
 */
export function lensFlareH(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 16;
  const ctx = cv.getContext('2d')!;

  const gr = ctx.createLinearGradient(0, 0, 256, 0);
  gr.addColorStop(0,    'rgba(79,195,247,0)');
  gr.addColorStop(0.35, 'rgba(79,195,247,0.04)');
  gr.addColorStop(0.5,  'rgba(200,240,255,0.6)');
  gr.addColorStop(0.65, 'rgba(79,195,247,0.04)');
  gr.addColorStop(1,    'rgba(79,195,247,0)');

  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 256, 16);

  return new THREE.CanvasTexture(cv);
}

// ─────────────────────────────────────────────
//  3D → 2D projection
// ─────────────────────────────────────────────

/**
 * Project a 3D world position into 2D CSS pixel coordinates.
 *
 * Used every frame to position HTML overlay elements (mini labels, hover
 * label) so they track their corresponding 3D objects.
 *
 * @param pos    - World-space position to project
 * @param camera - The active perspective camera
 * @returns Object with `x` and `y` in CSS pixel coordinates
 */
export function toScreen(
  pos: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
): { x: number; y: number } {
  // NDC: x ∈ [-1, 1], y ∈ [-1, 1] (Y is flipped vs CSS)
  const v = pos.clone().project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * window.innerWidth,
    y: (-v.y * 0.5 + 0.5) * window.innerHeight,
  };
}
