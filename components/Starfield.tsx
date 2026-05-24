'use client';

/**
 * @file components/Starfield.tsx
 * @description Three.js starfield background with Star Wars-style warp effect.
 *
 * ─── ARCHITECTURE ────────────────────────────────────────────────────────────
 *
 * This component creates its own isolated WebGLRenderer on a fixed canvas that
 * sits behind all page content (z-index 0 by default).  It is completely
 * independent from the galaxy scene's renderer so it works on every page
 * without coupling to any other Three.js context.
 *
 * There are four Three.js mesh objects in the scene:
 *
 *   1. THREE.Points (starPoints)
 *      One GPU point per star.  The CPU computes each star's 2-D screen
 *      position every frame via a perspective-projection formula and writes
 *      it into a Float32Array (posArr).  The vertex shader reads those
 *      positions and sets gl_PointSize from a per-star size attribute.
 *      The fragment shader clips each square point-sprite into a soft circle.
 *
 *   2. THREE.LineSegments (spikeLines)
 *      Stars randomly assigned the "spike4" or "spike6" shape get an extra
 *      cross/asterisk drawn on top of their dot.  Each arm is one line
 *      segment (two vertices).  The buffer is rebuilt each frame and only
 *      filled up to the number of spike stars that are on-screen.
 *
 *   3. THREE.LineSegments (warpLines)
 *      During warp mode each star leaves a radial streak from its previous
 *      projected position to its current one.  Two vertices per star,
 *      alpha faded from 0 (tail) to bright (head) so the streak looks like
 *      motion blur radiating from the centre.
 *
 *   4. THREE.Line (meteorLine)
 *      A single occasional shooting-star effect.  One Line object whose
 *      two vertices (head and tail) are updated each frame.
 *
 * ─── WARP MODES ──────────────────────────────────────────────────────────────
 *
 *   Idle        BASE_SPEED = 0, warpSpeed = 0 → stars are frozen.
 *               Zero animation cost because positions never change.
 *
 *   Auto warp   Scroll velocity and mouse movement inject into warpSpeed
 *               each frame.  warpSpeed decays exponentially (WARP_DECAY).
 *               Once it exceeds WARP_THRESHOLD, warpFactor reaches 1 and
 *               full hyperspace streaks are visible.
 *
 *   Override    ref.current.setWarp(0..1) sets warpOverrideRef, which takes
 *               priority over the automatic calculation.  Used by the loading
 *               screen to force instant full-warp on mount.
 *               Calling setWarp(0) freezes auto-warp until the component
 *               unmounts; there is no "release back to auto" — call setWarp
 *               only when you intend to stay in manual mode.
 *
 * ─── PUBLIC API (forwardRef) ─────────────────────────────────────────────────
 *
 *   setWarp(level: number)   0 = idle · 1 = full hyperspace
 *
 * ─── PROPS ───────────────────────────────────────────────────────────────────
 *
 *   starCount?  number   How many stars to render (default 800).
 *   zIndex?     number   CSS z-index of the canvas wrapper (default 0).
 *                        Must be raised (e.g. 99) when used inside a loading
 *                        overlay so the stacking context sits above the backdrop.
 */

import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import * as THREE from 'three';

// ─── tunables ──────────────────────────────────────────────────────────────────
// Adjust these constants to change the feel of the starfield without touching
// any rendering logic.

/** Default star count when no prop is supplied. */
const STAR_COUNT = 1300;

/**
 * Base forward speed applied every frame regardless of interaction.
 * 0 = stars are completely frozen until the user scrolls or moves the mouse.
 * Raise to e.g. 0.003 for a slow ambient drift.
 */
const BASE_SPEED = 0;

/** How strongly scroll velocity feeds into warp speed. */
const SCROLL_MULTIPLIER = 0.00055;

/** How strongly mouse movement velocity feeds into warp speed.
 *  Kept very small so casual mouse movement only causes a subtle shimmer. */
const MOUSE_WARP_MULT = 0.00008;

/**
 * The warpSpeed value at which warpFactor reaches 1 (full hyperspace streaks).
 * Lower = streaks appear at slower scroll; higher = needs aggressive scrolling.
 */
const WARP_THRESHOLD = 0.04;

/**
 * How far the projection centre shifts toward the mouse position.
 * Expressed as a fraction of the half-screen width/height.
 * 0 = no tilt effect; 1 = projection centre tracks the mouse exactly.
 */
const TILT_STRENGTH = 0.06;

/**
 * Linear-interpolation factor for the tilt smoothing each frame.
 * Low (0.02) = sluggish, cinematic pan.  High (0.15) = snappy.
 */
const TILT_LERP = 0.06;

/**
 * Per-frame multiplicative decay applied to warpSpeed.
 * 0.88 means warp speed loses ~12 % each frame — streaks fade within ~0.5 s
 * of the user stopping scrolling.
 */
const WARP_DECAY = 0.88;

// ─── types ─────────────────────────────────────────────────────────────────────

/**
 * Star shape codes.
 *   0 = plain dot   (60 % of stars)
 *   1 = 4-spike      (25 % of stars) — horizontal + vertical cross
 *   2 = 6-spike      (15 % of stars) — asterisk at 0°, 60°, 120°
 */
type Shape = 0 | 1 | 2;

/** All per-star state kept in a plain JS object (no Three.js overhead). */
interface Star {
  x: number;          // 3-D X position, range −1 … +1
  y: number;          // 3-D Y position, range −1 … +1
  z: number;          // depth: 1 = far background, near 0 = just passed camera
  pz: number;         // z from the previous frame — used to compute streak length
  baseSize: number;   // unscaled radius; grows as the star approaches (÷ z)
  brightness: number; // base alpha, 0.65 … 1.0
  shape: Shape;
}

/** One active shooting-star meteor. Only one exists at a time. */
interface Meteor {
  x: number; y: number;     // current head position (screen pixels)
  vx: number; vy: number;   // velocity (pixels per frame at 60 fps)
  life: number;             // remaining life (counts down from maxLife)
  maxLife: number;          // total lifespan (used to compute progress 0→1)
  length: number;           // tail length in pixels at full opacity
}

/** Methods exposed to parent components via React ref. */
export interface StarfieldHandle {
  /**
   * Programmatically override the warp level.
   * @param level  0 = fully idle · 1 = full hyperspace streaks.
   *               Clamped to [0, 1].  Once called, automatic scroll/mouse
   *               warp is suppressed until the component unmounts.
   */
  setWarp(level: number): void;
}

// ─── star factory helpers ───────────────────────────────────────────────────────

/**
 * Create a brand-new star with random position, size, brightness, and shape.
 * z is randomised across the full depth range so the field looks populated
 * from the very first frame.
 */
function makeStar(): Star {
  const r = Math.random();
  // Probability split: 60 % dots, 25 % spike4, 15 % spike6
  const shape: Shape = r < 0.6 ? 0 : r < 0.85 ? 1 : 2;
  return {
    x:          (Math.random() - 0.5) * 2,
    y:          (Math.random() - 0.5) * 2,
    z:          Math.random() * 0.98 + 0.02,  // never exactly 0 (would ÷ by zero)
    pz:         1,   // start at far end so the first frame produces no streak
    baseSize:   Math.random() * 1.4 + 0.5,
    brightness: Math.random() * 0.35 + 0.65,
    shape,
  };
}

/**
 * Reset a star to the far background after it has passed the camera.
 * z is always reset to 1 (never random) to prevent stars from "popping in"
 * at a visible size mid-screen.  They always enter tiny from the back.
 */
function resetStar(s: Star) {
  s.x  = (Math.random() - 0.5) * 2;
  s.y  = (Math.random() - 0.5) * 2;
  s.z  = 1;
  s.pz = 1;  // reset previous-z too so no phantom streak on the next frame
}

/**
 * Spawn a new shooting-star meteor.
 * Meteors travel at a shallow downward-right angle (10°–30° below horizontal)
 * and originate from either the top edge or the left edge of the screen.
 */
function spawnMeteor(w: number, h: number): Meteor {
  const fromTop = Math.random() > 0.3;  // 70 % from top, 30 % from left side
  // Angle kept between 10°–30° so meteors always feel like they're falling
  const angle = (Math.random() * 20 + 10) * (Math.PI / 180);
  const speed = Math.random() * 8 + 10;
  const life  = Math.random() * 40 + 50;
  return {
    x:       fromTop ? Math.random() * w : 0,
    y:       fromTop ? 0 : Math.random() * h * 0.4,
    vx:      Math.cos(angle) * speed,
    vy:      Math.sin(angle) * speed,
    life,
    maxLife: life,
    length:  Math.random() * 120 + 80,
  };
}

// ─── props ─────────────────────────────────────────────────────────────────────

export interface StarfieldProps {
  /** Number of stars to render. Default: 800. */
  starCount?: number;

  /**
   * CSS z-index of the mount div (and therefore its stacking context).
   * Default 0 — sits behind all page content.
   *
   * ⚠️  IMPORTANT: the mount div is `position: fixed`, which creates a new
   * stacking context.  The z-index of children (e.g. the WebGL canvas) is
   * evaluated WITHIN that context.  To elevate this Starfield above a fixed
   * overlay (like the loading backdrop at z-index 98) you must pass a zIndex
   * value higher than the overlay here — not just on the canvas itself.
   */
  zIndex?: number;
}

// ─── component ─────────────────────────────────────────────────────────────────

const Starfield = forwardRef<StarfieldHandle, StarfieldProps>(
  function Starfield({ starCount = STAR_COUNT, zIndex = 0 }, ref) {

    /** The div that Three.js appends its <canvas> into. */
    const mountRef = useRef<HTMLDivElement>(null);

    /**
     * Warp override set by setWarp().
     * -1  = "use automatic calculation from scroll / mouse" (initial state).
     *  0…1 = manual override; automatic warp is suppressed.
     *
     * We use a ref (not state) so updates from the parent take effect on the
     * very next animation frame without triggering a React re-render.
     */
    const warpOverrideRef = useRef<number>(-1);

    // ── expose setWarp to parent via ref ────────────────────────────────────
    useImperativeHandle(ref, () => ({
      setWarp(level: number) {
        // Clamp to [0, 1] — negative values would re-enable automatic mode
        // unintentionally; values > 1 have no extra effect.
        warpOverrideRef.current = Math.max(0, Math.min(1, level));
      },
    }));

    // ── Three.js setup & animation loop ─────────────────────────────────────
    useEffect(() => {
      const mount = mountRef.current;
      if (!mount) return;

      // ── renderer ──────────────────────────────────────────────────────────
      // antialias: false — stars are sub-pixel dots; MSAA adds cost with no gain.
      // alpha: true — renderer clears to transparent so the page bg shows through.
      const renderer = new THREE.WebGLRenderer({
        antialias:       false,
        alpha:           true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap at 2× to avoid 4K overhead
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0); // clear to fully transparent black

      // Style the canvas — position: fixed keeps it covering the full viewport
      // even when the page is scrolled.  pointer-events: none lets all clicks
      // pass through to the page content underneath.
      Object.assign(renderer.domElement.style, {
        position:      'fixed',
        top:           '0',
        left:          '0',
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        String(zIndex),
      });
      mount.appendChild(renderer.domElement);

      // ── orthographic camera ────────────────────────────────────────────────
      // An orthographic camera whose frustum matches screen pixels exactly lets
      // us do all perspective projection on the CPU in pixel-space (same maths
      // as the original Canvas 2-D version) and simply hand the results to the
      // GPU as vertex positions.  No perspective distortion from the camera.
      const makeCamera = () => new THREE.OrthographicCamera(
        0, window.innerWidth,   // left, right
        0, window.innerHeight,  // top, bottom  (Y=0 at top, matches screen coords)
        -1, 1,                  // near, far
      );
      const scene  = new THREE.Scene();
      let   camera = makeCamera();

      // ── star geometry (THREE.Points) ───────────────────────────────────────
      //
      // Buffer layout — one entry per star:
      //   posArr[i*3 .. i*3+2]  screen X, Y, 0
      //   sizeArr[i]            gl_PointSize in pixels
      //   alphaArr[i]           fragment opacity
      //
      // All arrays are pre-allocated once and mutated in-place every frame.
      // This avoids GC pressure and keeps frame time predictable.
      const posArr   = new Float32Array(starCount * 3);
      const sizeArr  = new Float32Array(starCount);
      const alphaArr = new Float32Array(starCount);

      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position',  new THREE.BufferAttribute(posArr,   3));
      starGeo.setAttribute('starSize',  new THREE.BufferAttribute(sizeArr,  1));
      starGeo.setAttribute('starAlpha', new THREE.BufferAttribute(alphaArr, 1));

      // Vertex shader — moves each point to its screen position and sets its size.
      const starVert = /* glsl */`
        attribute float starSize;
        attribute float starAlpha;
        varying   float vAlpha;
        void main() {
          vAlpha       = starAlpha;
          gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = starSize;
        }
      `;

      // Fragment shader — clips the square point-sprite into a soft circular disc.
      // Pixels outside radius 1 are discarded (transparent corners).
      // smoothstep fades the edge from the centre outward for a natural glow.
      const starFrag = /* glsl */`
        varying float vAlpha;
        void main() {
          // gl_PointCoord: 0..1 across the point-sprite quad
          vec2  uv   = gl_PointCoord - 0.5;  // re-centre to −0.5..+0.5
          float dist = length(uv) * 2.0;     // 0 = centre · 1 = edge
          if (dist > 1.0) discard;           // clip corners → circle shape
          float alpha = vAlpha * (1.0 - smoothstep(0.4, 1.0, dist));
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `;

      const starMat = new THREE.ShaderMaterial({
        vertexShader:   starVert,
        fragmentShader: starFrag,
        transparent:    true,
        depthTest:      false,         // 2-D overlay — no depth needed
        blending:       THREE.AdditiveBlending, // overlapping stars add brightness
      });

      const starPoints = new THREE.Points(starGeo, starMat);
      scene.add(starPoints);

      // ── spike overlay geometry (THREE.LineSegments) ────────────────────────
      //
      // spike4 = 2 arms × 2 vertices = 4 vertices per star
      // spike6 = 3 arms × 2 vertices = 6 vertices per star
      //
      // Pre-allocate for worst-case (all spike6).  Each frame only the vertices
      // for stars that are actually on-screen and spike-shaped are filled in;
      // the rest are parked off-screen at (−9999, −9999).
      // setDrawRange() tells Three.js how many vertices to actually draw,
      // avoiding unnecessary GPU work for the parked vertices.
      const MAX_SPIKE_VERTICES = starCount * 6;
      const spkPosArr   = new Float32Array(MAX_SPIKE_VERTICES * 3);
      const spkAlphaArr = new Float32Array(MAX_SPIKE_VERTICES);

      const spkGeo = new THREE.BufferGeometry();
      spkGeo.setAttribute('position',  new THREE.BufferAttribute(spkPosArr,   3));
      spkGeo.setAttribute('lineAlpha', new THREE.BufferAttribute(spkAlphaArr, 1));

      // Shared line shaders — used by spike lines, warp streaks, and the meteor.
      // lineAlpha varies per-vertex so arms can fade from centre outward.
      const spkVert = /* glsl */`
        attribute float lineAlpha;
        varying   float vAlpha;
        void main() {
          vAlpha      = lineAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
      const spkFrag = /* glsl */`
        varying float vAlpha;
        void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha); }
      `;

      const spkMat = new THREE.ShaderMaterial({
        vertexShader:   spkVert,
        fragmentShader: spkFrag,
        transparent:    true,
        depthTest:      false,
        blending:       THREE.AdditiveBlending,
      });

      const spikeLines = new THREE.LineSegments(spkGeo, spkMat);
      scene.add(spikeLines);

      // ── warp streak geometry (THREE.LineSegments) ──────────────────────────
      //
      // In warp mode every star draws a line from its previous projected
      // position (pz frame) to its current one (z frame).  Because the
      // perspective projection amplifies displacement near z=0, stars close to
      // the camera produce long, radially-outward streaks automatically —
      // no special streak-length logic is needed.
      //
      // Two vertices per star: [prev pos, alpha=0] → [curr pos, alpha=bright].
      // The gradient (transparent tail → opaque head) is achieved by varying
      // lineAlpha across the two vertices; GLSL interpolates it along the line.
      const warpPosArr   = new Float32Array(starCount * 6); // 2 verts × 3 floats
      const warpAlphaArr = new Float32Array(starCount * 2); // 2 verts × 1 float

      const warpGeo = new THREE.BufferGeometry();
      warpGeo.setAttribute('position',  new THREE.BufferAttribute(warpPosArr,   3));
      warpGeo.setAttribute('lineAlpha', new THREE.BufferAttribute(warpAlphaArr, 1));

      // Reuse the same vertex/fragment shaders as spike lines.
      const warpMat = new THREE.ShaderMaterial({
        vertexShader:   spkVert,
        fragmentShader: spkFrag,
        transparent:    true,
        depthTest:      false,
        blending:       THREE.AdditiveBlending,
      });

      const warpLines = new THREE.LineSegments(warpGeo, warpMat);
      warpLines.visible = false; // hidden until warpFactor > 0.12
      scene.add(warpLines);

      // ── meteor geometry (THREE.Line) ───────────────────────────────────────
      // Two vertices: [tail (alpha=0), head (alpha≈0.9)].
      // The tail position is derived from the head position minus the direction
      // vector, scaled by the current progress so the tail "grows" in on entry.
      const meteorPosArr   = new Float32Array(2 * 3);
      const meteorAlphaArr = new Float32Array(2);
      const meteorGeo      = new THREE.BufferGeometry();
      meteorGeo.setAttribute('position',  new THREE.BufferAttribute(meteorPosArr,   3));
      meteorGeo.setAttribute('lineAlpha', new THREE.BufferAttribute(meteorAlphaArr, 1));

      const meteorLine = new THREE.Line(meteorGeo, new THREE.ShaderMaterial({
        vertexShader:   spkVert,
        fragmentShader: spkFrag,
        transparent:    true,
        depthTest:      false,
        blending:       THREE.AdditiveBlending,
      }));
      meteorLine.visible = false;
      scene.add(meteorLine);

      // ── star data ──────────────────────────────────────────────────────────
      const stars: Star[] = Array.from({ length: starCount }, makeStar);

      // ── interaction state ──────────────────────────────────────────────────
      let scrollY     = 0;
      let lastScrollY = 0;
      let warpSpeed   = 0; // accumulated warp from scroll + mouse; decays each frame

      // Mouse position — initialised to screen centre so tilt starts neutral
      let mouseX     = window.innerWidth  / 2;
      let mouseY     = window.innerHeight / 2;
      let lastMouseX = mouseX;
      let lastMouseY = mouseY;

      // Smoothed tilt offsets added to the projection centre (cx, cy)
      let tiltX = 0;
      let tiltY = 0;

      let meteor: Meteor | null = null;
      let nextMeteorIn          = Math.random() * 6000 + 4000; // ms until first meteor
      let lastTime              = performance.now();
      let raf: number;

      // ── event listeners ────────────────────────────────────────────────────
      // passive: true tells the browser these handlers never call preventDefault,
      // allowing it to process scroll/touch without waiting for the JS handler.
      const onScroll    = () => { scrollY = window.scrollY; };
      const onMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };

      const resize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera = makeCamera(); // recreate camera to match new viewport dimensions
        // Re-centre mouse so tilt doesn't jump after a resize
        mouseX = window.innerWidth  / 2;
        mouseY = window.innerHeight / 2;
      };

      window.addEventListener('scroll',    onScroll,    { passive: true });
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('resize',    resize);

      // ── main animation loop ────────────────────────────────────────────────
      function tick(now: number) {
        raf = requestAnimationFrame(tick);

        const dt = now - lastTime; // ms since last frame (used for meteor)
        lastTime = now;

        const W   = window.innerWidth;
        const H   = window.innerHeight;
        const fov = W * 0.85; // field-of-view scalar: wider screens feel more immersive

        // ── tilt ─────────────────────────────────────────────────────────────
        // Normalise mouse position to −1…+1 relative to screen centre.
        // Lerp the tilt offsets toward the target each frame for smooth motion.
        const nMX = (mouseX - W / 2) / (W / 2);
        const nMY = (mouseY - H / 2) / (H / 2);
        tiltX += (nMX * W * TILT_STRENGTH - tiltX) * TILT_LERP;
        tiltY += (nMY * H * TILT_STRENGTH - tiltY) * TILT_LERP;

        // Projection centre — stars radiate outward from here.
        // Shifting it with tilt gives a "looking around" parallax feel.
        const cx = W / 2 + tiltX;
        const cy = H / 2 + tiltY;

        // ── warp speed calculation ────────────────────────────────────────────
        // Both scroll delta and mouse-movement delta feed warpSpeed.
        // warpSpeed decays WARP_DECAY × each frame so it trails off naturally.
        const scrollDelta = scrollY - lastScrollY;
        lastScrollY = scrollY;
        const mouseDelta = Math.hypot(mouseX - lastMouseX, mouseY - lastMouseY);
        lastMouseX = mouseX;
        lastMouseY = mouseY;

        warpSpeed = warpSpeed * WARP_DECAY
          + Math.abs(scrollDelta) * SCROLL_MULTIPLIER
          + mouseDelta            * MOUSE_WARP_MULT;

        // ── warp factor & speed ───────────────────────────────────────────────
        // If a manual override has been set via setWarp(), use it directly.
        // Otherwise derive warpFactor from the automatic warpSpeed calculation.
        const override = warpOverrideRef.current;
        const warpFactor = override >= 0
          ? override                                    // manual mode
          : Math.min(1, warpSpeed / WARP_THRESHOLD);   // automatic mode

        // Convert warpFactor back into a z-decrement speed for the star loop.
        const speed = BASE_SPEED + (override >= 0
          ? override * WARP_THRESHOLD
          : warpSpeed);

        // Only render warp streaks once warpFactor crosses a small threshold
        // to avoid a barely-visible jitter at very low warp.
        const inWarp = warpFactor > 0.12;
        warpLines.visible = inWarp;

        // ── per-star update ───────────────────────────────────────────────────
        let spkVtx = 0; // write cursor into the spike-line buffer

        for (let i = 0; i < starCount; i++) {
          const s = stars[i];
          s.pz    = s.z;       // save z before advancing
          s.z    -= speed;     // move star toward camera

          const base = i * 3; // byte offset into position buffer

          // ── star passed the camera — recycle it ──────────────────────────
          if (s.z <= 0) {
            resetStar(s);
            // Park geometry off-screen so no stale pixels are drawn this frame
            posArr[base]     = -9999;
            posArr[base + 1] = -9999;
            posArr[base + 2] = 0;
            sizeArr[i]  = 0;
            alphaArr[i] = 0;

            const wb = i * 6;
            warpPosArr[wb]     = -9999; warpPosArr[wb + 1] = -9999; warpPosArr[wb + 2] = 0;
            warpPosArr[wb + 3] = -9999; warpPosArr[wb + 4] = -9999; warpPosArr[wb + 5] = 0;
            warpAlphaArr[i * 2]     = 0;
            warpAlphaArr[i * 2 + 1] = 0;
            continue;
          }

          // ── perspective projection ─────────────────────────────────────────
          // Dividing 3-D (x, y) by depth z and scaling by fov maps world coords
          // to screen pixels.  Smaller z → larger divisor → star is closer/bigger.
          const sx  = (s.x / s.z)  * fov + cx;  // current screen X
          const sy  = (s.y / s.z)  * fov + cy;  // current screen Y (Y-down)
          const psx = (s.x / s.pz) * fov + cx;  // previous screen X (for streak)
          const psy = (s.y / s.pz) * fov + cy;  // previous screen Y

          // 50 px margin prevents stars from abruptly disappearing at the edge
          const offScreen = sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50;
          const size      = s.baseSize / s.z;   // apparent size grows as z → 0

          if (inWarp) {
            // ── warp mode: write streak vertices ──────────────────────────────
            const alpha = Math.min(1, s.brightness * (0.4 + warpFactor * 0.6));

            // Small bright dot at the head of the streak (THREE.Points)
            posArr[base]     = sx;
            posArr[base + 1] = sy;
            posArr[base + 2] = 0;
            sizeArr[i]  = offScreen ? 0 : Math.max(0.6, size * 0.3);
            alphaArr[i] = offScreen ? 0 : alpha;

            // Streak line: tail (previous pos, alpha=0) → head (current pos, alpha=bright)
            const wb = i * 6;
            warpPosArr[wb]     = psx; warpPosArr[wb + 1] = psy; warpPosArr[wb + 2] = 0;
            warpPosArr[wb + 3] = sx;  warpPosArr[wb + 4] = sy;  warpPosArr[wb + 5] = 0;
            const wa = Math.min(1, alpha * (1 + warpFactor));
            warpAlphaArr[i * 2]     = offScreen ? 0 : 0;   // tail: always transparent
            warpAlphaArr[i * 2 + 1] = offScreen ? 0 : wa;  // head: bright

          } else {
            // ── normal mode: dot + optional spike overlay ─────────────────────
            const alpha = s.brightness * (1 - warpFactor * 0.5); // dims slightly as warp builds

            // Dot position (THREE.Points)
            posArr[base]     = offScreen ? -9999 : sx;
            posArr[base + 1] = offScreen ? -9999 : sy;
            posArr[base + 2] = 0;
            // Dot-only stars get full size; spike stars get a smaller centre dot
            // (the arms make them look plenty large already)
            sizeArr[i]  = offScreen ? 0 : Math.max(1.5, size * 1.6);
            alphaArr[i] = offScreen ? 0 : (s.shape === 0 ? alpha : alpha * 0.5);

            // Build spike line segments for spike4 / spike6 shapes
            if (!offScreen && s.shape > 0) {
              const arm = size * 2.2; // arm length in pixels
              const a   = alpha;

              if (s.shape === 1) {
                // spike4: horizontal arm (left → right)
                spkPosArr[spkVtx * 3]     = sx - arm;
                spkPosArr[spkVtx * 3 + 1] = sy;
                spkPosArr[spkVtx * 3 + 2] = 0;
                spkAlphaArr[spkVtx]        = 0; // tip: transparent
                spkVtx++;
                spkPosArr[spkVtx * 3]     = sx + arm;
                spkPosArr[spkVtx * 3 + 1] = sy;
                spkPosArr[spkVtx * 3 + 2] = 0;
                spkAlphaArr[spkVtx]        = a; // opposite tip: bright
                spkVtx++;
                // spike4: vertical arm (top → bottom)
                spkPosArr[spkVtx * 3]     = sx;
                spkPosArr[spkVtx * 3 + 1] = sy - arm;
                spkPosArr[spkVtx * 3 + 2] = 0;
                spkAlphaArr[spkVtx]        = 0;
                spkVtx++;
                spkPosArr[spkVtx * 3]     = sx;
                spkPosArr[spkVtx * 3 + 1] = sy + arm;
                spkPosArr[spkVtx * 3 + 2] = 0;
                spkAlphaArr[spkVtx]        = a;
                spkVtx++;
              } else {
                // spike6: three arms at 0°, 60°, 120° drawn through the centre
                // (each line covers both directions so we get 6 tips from 3 segments)
                for (let li = 0; li < 3; li++) {
                  const angle = (li * Math.PI) / 3;
                  const ax    = Math.cos(angle) * arm;
                  const ay    = Math.sin(angle) * arm;
                  spkPosArr[spkVtx * 3]     = sx - ax;
                  spkPosArr[spkVtx * 3 + 1] = sy - ay;
                  spkPosArr[spkVtx * 3 + 2] = 0;
                  spkAlphaArr[spkVtx]        = 0;
                  spkVtx++;
                  spkPosArr[spkVtx * 3]     = sx + ax;
                  spkPosArr[spkVtx * 3 + 1] = sy + ay;
                  spkPosArr[spkVtx * 3 + 2] = 0;
                  spkAlphaArr[spkVtx]        = a;
                  spkVtx++;
                }
              }
            }

            // Park warp-streak vertices for this star (not in warp mode)
            const wb = i * 6;
            warpPosArr[wb]     = -9999; warpPosArr[wb + 1] = -9999; warpPosArr[wb + 2] = 0;
            warpPosArr[wb + 3] = -9999; warpPosArr[wb + 4] = -9999; warpPosArr[wb + 5] = 0;
            warpAlphaArr[i * 2]     = 0;
            warpAlphaArr[i * 2 + 1] = 0;
          }
        }

        // Park any unused spike-vertex slots so stale geometry from a previous
        // frame (when more spikes were visible) doesn't bleed through.
        for (let v = spkVtx; v < MAX_SPIKE_VERTICES; v++) {
          spkPosArr[v * 3]     = -9999;
          spkPosArr[v * 3 + 1] = -9999;
          spkPosArr[v * 3 + 2] = 0;
          spkAlphaArr[v]       = 0;
        }
        // Tell Three.js to only submit the filled portion to the GPU
        spkGeo.setDrawRange(0, Math.max(spkVtx, 1));

        // ── upload CPU buffers to GPU ──────────────────────────────────────────
        // needsUpdate = true causes Three.js to re-upload the typed array on
        // the next render call.  Must be set every frame because we mutate
        // the buffers in-place rather than replacing them.
        (starGeo.getAttribute('position')  as THREE.BufferAttribute).needsUpdate = true;
        (starGeo.getAttribute('starSize')  as THREE.BufferAttribute).needsUpdate = true;
        (starGeo.getAttribute('starAlpha') as THREE.BufferAttribute).needsUpdate = true;
        (spkGeo.getAttribute('position')   as THREE.BufferAttribute).needsUpdate = true;
        (spkGeo.getAttribute('lineAlpha')  as THREE.BufferAttribute).needsUpdate = true;
        (warpGeo.getAttribute('position')  as THREE.BufferAttribute).needsUpdate = true;
        (warpGeo.getAttribute('lineAlpha') as THREE.BufferAttribute).needsUpdate = true;

        // ── meteor update ──────────────────────────────────────────────────────
        nextMeteorIn -= dt;
        if (nextMeteorIn <= 0 && !meteor) {
          meteor       = spawnMeteor(W, H);
          nextMeteorIn = Math.random() * 6000 + 4000; // 4–10 s until next meteor
        }

        if (meteor) {
          // progress: 0 = just spawned · 1 = about to expire
          const progress = 1 - meteor.life / meteor.maxLife;

          // Fade alpha: ramp in over first 10 %, hold, ramp out over last 30 %
          const alpha = progress < 0.1
            ? progress / 0.1
            : progress > 0.7
            ? 1 - (progress - 0.7) / 0.3
            : 1;

          const angle = Math.atan2(meteor.vy, meteor.vx);
          // Tail position trails behind the head; length scales with alpha so
          // the tail "grows" in on entry and "shrinks" on exit
          const tailX = meteor.x - Math.cos(angle) * meteor.length * alpha;
          const tailY = meteor.y - Math.sin(angle) * meteor.length * alpha;

          meteorPosArr[0] = tailX;    meteorPosArr[1] = tailY;    meteorPosArr[2] = 0;
          meteorPosArr[3] = meteor.x; meteorPosArr[4] = meteor.y; meteorPosArr[5] = 0;
          meteorAlphaArr[0] = 0;             // tail vertex: transparent
          meteorAlphaArr[1] = alpha * 0.9;   // head vertex: bright

          (meteorGeo.getAttribute('position')  as THREE.BufferAttribute).needsUpdate = true;
          (meteorGeo.getAttribute('lineAlpha') as THREE.BufferAttribute).needsUpdate = true;
          meteorLine.visible = true;

          // Advance meteor position
          meteor.x    += meteor.vx;
          meteor.y    += meteor.vy;
          meteor.life -= dt / 16; // dt/16 normalises to ~60 fps life units

          // Retire the meteor when it expires or leaves the screen
          if (meteor.life <= 0 || meteor.x > W + 200 || meteor.y > H + 200) {
            meteor             = null;
            meteorLine.visible = false;
          }
        }

        renderer.render(scene, camera);
      }

      raf = requestAnimationFrame(tick);

      // ── cleanup ────────────────────────────────────────────────────────────
      // Called when the component unmounts or starCount changes.
      // Cancels the animation loop, removes all event listeners, and disposes
      // of every Three.js resource so the GPU memory is freed immediately.
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll',    onScroll);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize',    resize);

        renderer.dispose();
        starGeo.dispose();  starMat.dispose();
        spkGeo.dispose();   spkMat.dispose();
        warpGeo.dispose();  warpMat.dispose();
        meteorGeo.dispose();

        // Remove the <canvas> from the mount div (React unmounts the div itself)
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
      };
    }, [starCount]); // re-run only if starCount prop changes

    // ── render ─────────────────────────────────────────────────────────────────
    // A single zero-size fixed div that Three.js appends its <canvas> into.
    // The div must carry the same zIndex as the canvas so its stacking context
    // (created by position:fixed + z-index) sits at the correct global level.
    return (
      <div
        ref={mountRef}
        style={{
          position:      'fixed',
          inset:         0,
          pointerEvents: 'none',
          zIndex,
        }}
        aria-hidden="true"
      />
    );
  },
);

Starfield.displayName = 'Starfield';
export default Starfield;
