/**
 * @file components/hero/Planet3D.tsx
 * @description Three.js 3-D planet/model with two distinct render modes.
 *
 * ── FOREGROUND MODE (default) ─────────────────────────────────────────────────
 *   Canvas placed inside normal layout flow.
 *   • Auto-rotation, micro-drift camera, local star field, hover speed boost.
 *
 * ── BACKGROUND MODE  (backgroundMode prop) ────────────────────────────────────
 *   Designed to live at z-[1] in a fixed container, same visual layer as the
 *   Starfield (z-0).  The object is completely inert from the user's perspective
 *   — no hover, no click, no pointer events at all.
 *
 *   The "camera angle trick":
 *   The same window.mousemove that drives the Starfield's projection-centre tilt
 *   also translates this canvas's CSS wrapper div at the DOM level.  Both move
 *   in the same direction at similar magnitudes, so they feel like parts of one
 *   shared 3-D world.
 *
 *   Example: mouse moves RIGHT → wrapper translates +X px → the canvas slides
 *   right → if the canvas was already partially off the right viewport edge, the
 *   right portion disappears further.  Feels exactly like a camera panning right
 *   past a massive fixed object.
 *
 *   The lerp factor (0.04) is deliberately slow so the object feels far away and
 *   massive — similar to how the Starfield's tilt lags behind the mouse.
 *
 *   What is intentionally REMOVED in background mode vs. foreground:
 *   • No hover speed boost
 *   • No local star field (Starfield already provides them)
 *   • No cloud shell or orbital satellite
 *   • No Three.js camera movement of any kind (camera is locked at z = 3.2 R)
 *   • No float or sway — pivot stays at origin, only Y rotation ticks
 *
 * ── GLB MODEL ─────────────────────────────────────────────────────────────────
 *   Pass modelUrl="/models/foo.glb" to replace the procedural sphere with a GLB.
 *   • The file must live inside /public/ (served at the root URL by Next.js).
 *   • Draco decoder files are expected at /draco/ — copy them once:
 *       cp -r node_modules/three/examples/jsm/libs/draco/ public/draco/
 *   • The model is auto-scaled to fit a bounding sphere of radius R = 1.0.
 *   • Its own PBR materials are preserved (preset colour/roughness are ignored).
 *   • On load failure the procedural sphere stays visible as a fallback.
 *
 * ── USAGE ─────────────────────────────────────────────────────────────────────
 *   // Foreground (small panel)
 *   <Planet3D type="moon" size={300} />
 *
 *   // Background (fixed z-[1], no interaction, camera-angle parallax)
 *   <Planet3D type="moon" size={680} backgroundMode rotationSpeed={0.0003} />
 *
 *   // GLB in background mode
 *   <Planet3D
 *     type="moon"
 *     size={280}
 *     rotationSpeed={0.02}
 *     modelUrl="/models/death_star.glb"
 *   />
 *
 * ── TEXTURE NOTE ──────────────────────────────────────────────────────────────
 *   No textures are loaded by default.  For a texture-mapped sphere, load via
 *   THREE.TextureLoader inside buildScene() and assign to material.map.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// ─── types ────────────────────────────────────────────────────────────────────


export interface Planet3DProps {
  /** Canvas (width/height) in pixels. */
  size?:           number;
  /** Radians per frame — overrides the preset default. */
  rotationSpeed?:  number;
  /**
   * Background mode — completely non-interactive.
   * • Only Y-axis rotation (very slow).
   * • CSS wrapper div translates with window.mousemove to create the
   *   "camera angle" parallax that matches the Starfield's tilt behaviour.
   * • All hover events, Three.js camera drift, float, sway, cloud/satellite
   *   animations are disabled.
   */
  backgroundMode?: boolean;
  axialTilt?:     number; // Radians to tilt the planet's axis (default 0.27 = 15°)

  //Path to glb/glTf model inside /public.models. will fallback to procedural sphere on error.
  modelUrl?:       string;
  //to make the planet completely non-interactive even in foreground mode (no hover effects, no pointer events)
  noInteraction?:  boolean;
  className?:      string;
  style?:          React.CSSProperties;
}

// ─── preset config ────────────────────────────────────────────────────────────

interface PlanetPreset {
  color:             number;
  emissive:          number;
  roughness:         number;
  metalness:         number;
  rotationSpeed:     number;
  axialTilt:         number;
  atmosphereColor:   THREE.ColorRepresentation;
  atmosphereOpacity: number;
  hasRing:           boolean;
  ringInner:         number;
  ringOuter:         number;
  ringOpacity:       number;
  ringColor:         number;
}

const PRESETS: PlanetPreset = {
    color:             0xb2b2a8,
    emissive:          0x050505,
    roughness:         0.92,
    metalness:         0.05,
    rotationSpeed:     0.0018,
    axialTilt:         0.27,
    atmosphereColor:   0xd0d0c8,
    atmosphereOpacity: 0.0,
    hasRing:           false,
    ringInner: 1.4, ringOuter: 1.9, ringOpacity: 0.18, ringColor: 0x888880,
};

// ─── scene builder ────────────────────────────────────────────────────────────

interface SceneRefs {
  scene:      THREE.Scene;
  camera:     THREE.PerspectiveCamera;
  pivot:      THREE.Group;
  sphere:     THREE.Mesh;
  material:   THREE.MeshStandardMaterial;
}

function buildScene(preset:PlanetPreset, R:number, backgroundMode: boolean): SceneRefs {
  const scene = new THREE.Scene();

  //Camera
  // In background mode the camera NEVER moves — all parallax is CSS-level.
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, R * 3.2);

  //Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.18);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff8f0, 1.6);
  sun.position.set(-R * 2, R * 1.5, R * 2.5);
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x8090ff, 0.35);
  rim.position.set(R * 2, -R * 0.5, -R * 1.5);
  scene.add(rim);

  // ── Planet body ──────────────────────────────────────────────────────────
  //Sphere Shape
  const sphereGeo = new THREE.SphereGeometry(R, 96, 64);
  //Sphere Material
  const material  = new THREE.MeshStandardMaterial({
    color:     preset.color,
    emissive:  preset.emissive,
    roughness: preset.roughness,
    metalness: preset.metalness,
  });
  //Sphere Mesh, will replace with GLB model if modelUrl is provided and loads successfully
  const sphere = new THREE.Mesh(sphereGeo, material);
  sphere.rotation.z = preset.axialTilt;

  const pivot = new THREE.Group();
  pivot.add(sphere);
  scene.add(pivot);

  return { scene, camera, pivot, sphere, material};
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Planet3D({
  //Default Properties
  size           = 100,
  rotationSpeed,
  backgroundMode = true,
  modelUrl,
  axialTilt = 0.27,
  noInteraction  = false,
  className      = '',
  style          = {},
}: Planet3DProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  /** Wrapper div — only used in background mode for CSS parallax. */
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hovered    = useRef(false);

  // For background mode CSS parallax — target and current lerp values
  const parallaxTarget  = useRef({ x: 0, y: 0 });
  const parallaxCurrent = useRef({ x: 0, y: 0 });

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── WebGL scene + CSS parallax ───────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preset = PRESETS;
    // Background mode: extremely slow Y-only spin
    const speed = rotationSpeed ??
      (backgroundMode ? 0.0003 : preset.rotationSpeed);
    const R = 1.0;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias:       true,
      alpha:           true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // ── Scene ──────────────────────────────────────────────────────────────
    const {
      scene, camera, pivot, sphere, material,
    } = buildScene(preset, R, backgroundMode);

    // ── GLB loader (optional) ──────────────────────────────────────────────
    let glbModel: THREE.Group | null = null;
    if (modelUrl) {
      const draco = new DRACOLoader();
      draco.setDecoderPath('/draco/');
      const loader = new GLTFLoader();
      loader.setDRACOLoader(draco);
      loader.load(
        modelUrl,
        (gltf) => {
          glbModel = gltf.scene;
          const box    = new THREE.Box3().setFromObject(glbModel);
          const center = new THREE.Vector3();
          const sz     = new THREE.Vector3();
          box.getCenter(center);
          box.getSize(sz);
          const scale = (R * 2) / Math.max(sz.x, sz.y, sz.z);
          glbModel.scale.setScalar(scale);
          glbModel.position.copy(center).multiplyScalar(-scale);
          glbModel.rotation.z = preset.axialTilt;
          pivot.remove(sphere);
          sphere.geometry.dispose();
          (sphere.material as THREE.Material).dispose();
          pivot.add(glbModel);
        },
        undefined,
        (err) => console.warn('[Planet3D] GLB load failed — using procedural sphere:', err),
      );
    }

    // ── Mouse → parallax target (background mode) ─────────────────────────
    // We DO NOT move the Three.js camera. Instead we record the mouse position
    // so the animation loop can translate the CSS wrapper div.
    // The parallax amount scales with canvas size so it looks proportional
    // at any size.
    const PAR_X = size * 0.10;   // 10 % of canvas width  → ~70 px @ 700 px
    const PAR_Y = size * 0.05;   // 5  % of canvas height → ~35 px @ 700 px

    // Shared helper — updates the parallax target from any pointer position.
    // Used by both mouse and touch handlers so they behave identically.
    function applyParallax(clientX: number, clientY: number) {
      if (!backgroundMode) return;
      // Normalise to −1…+1, then scale to pixel offset
      const mx = (clientX / window.innerWidth  - 0.5) * 2;
      const my = (clientY / window.innerHeight - 0.5) * 2;
      parallaxTarget.current.x = mx * PAR_X;
      parallaxTarget.current.y = my * PAR_Y;
    }

    // Mouse (desktop)
    function onMouseMove(e: MouseEvent) { applyParallax(e.clientX, e.clientY); }

    // Touch (mobile / iPad) — use first contact point
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (t) applyParallax(t.clientX, t.clientY);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    // ── Animation loop ─────────────────────────────────────────────────────
    const clock = new THREE.Timer();
    let rafId: number;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsed();

      // ① Y-axis rotation — boost on hover only when interaction is enabled
      const activeSpeed =
        !backgroundMode && !noInteraction && hovered.current ? speed * 2.8 : speed;
      if (glbModel) {
        glbModel.rotation.y += activeSpeed;
      } else {
        sphere.rotation.y += activeSpeed;
      }

      renderer.render(scene, camera);

      // ⑧ CSS wrapper parallax (background mode only)
      //    Runs every frame for buttery smoothness.
      //    Lerp factor 0.04 = deliberately laggy → feels massive and far away.
      if (backgroundMode && wrapperRef.current) {
        const lerpF = 0.04;
        parallaxCurrent.current.x +=
          (parallaxTarget.current.x - parallaxCurrent.current.x) * lerpF;
        parallaxCurrent.current.y +=
          (parallaxTarget.current.y - parallaxCurrent.current.y) * lerpF;
        wrapperRef.current.style.transform =
          `translateX(${parallaxCurrent.current.x.toFixed(2)}px)` +
          ` translateY(${parallaxCurrent.current.y.toFixed(2)}px)`;
      }
    }

    animate();

    // ── Hover (foreground mode + interaction enabled only) ────────────────
    const onEnter = () => { hovered.current = true;  };
    const onLeave = () => { hovered.current = false; };
    const interactionActive = !backgroundMode && !noInteraction;
    if (interactionActive) {
      canvas.addEventListener('mouseenter', onEnter);
      canvas.addEventListener('mouseleave', onLeave);
    }

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      if (interactionActive) {
        canvas.removeEventListener('mouseenter', onEnter);
        canvas.removeEventListener('mouseleave', onLeave);
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else (obj.material as THREE.Material).dispose();
        }
        if (obj instanceof THREE.Points) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, size, rotationSpeed, backgroundMode, modelUrl]);

  // ── SSR placeholder ────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, flexShrink: 0, ...style }}
      />
    );
  }

  // // ── Glow filter ────────────────────────────────────────────────────────
  // const glowColor = hexToCSS(PRESETS[type]?.atmosphereColor ?? 0xffffff);
  // const g1 = backgroundMode ? size * 0.16 : size * 0.09;
  // const g2 = backgroundMode ? size * 0.34 : size * 0.18;

  const canvasEl = (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{
        display:       'block',
        flexShrink:    0,
        // No pointer events when background or explicitly disabled
        pointerEvents: (backgroundMode || noInteraction) ? 'none' : 'auto',
        ...style,
      }}
    />
  );

  // Background mode: wrap in a div so we can translate it via DOM ref
  // without touching the canvas element itself.
  if (backgroundMode) {
    return (
      <div
        ref={wrapperRef}
        style={{
          display:       'inline-block',
          flexShrink:    0,
          pointerEvents: 'none',
          // will-change tells the compositor to keep this layer GPU-rasterised
          willChange:    'transform',
        }}
      >
        {canvasEl}
      </div>
    );
  }

  return canvasEl;
}

// ─── util ─────────────────────────────────────────────────────────────────────

function hexToCSS(hex: THREE.ColorRepresentation): string {
  const n = typeof hex === 'number' ? hex : new THREE.Color(hex).getHex();
  return '#' + n.toString(16).padStart(6, '0');
}
