/**
 * @file components/hero/Planet3D.tsx
 * @description Three.js 3-D planet/model with two distinct render modes.
 *
 * ── FOREGROUND MODE (default) ─────────────────────────────────────────────────
 *   Canvas placed inside normal layout flow.
 *   • Auto-rotation, hover speed boost.
 *
 * ── BACKGROUND MODE  (backgroundMode prop) ────────────────────────────────────
 *   Designed to live inside a layout column at the same visual layer as the
 *   Starfield.  The object is completely inert — no hover, no click, no pointer
 *   events at all.
 *
 *   The "camera angle trick":
 *   window.mousemove translates the CSS wrapper div so the planet feels like
 *   part of the same 3-D world as the Starfield's tilt.
 *
 * ── GLB MODEL ─────────────────────────────────────────────────────────────────
 *   Pass modelUrl="/models/foo.glb" to replace the procedural sphere with a GLB.
 *   • File must live inside /public/ (served at root URL by Next.js).
 *   • Draco decoder files expected at /draco/.
 *   • Model is auto-scaled to fit a bounding sphere of radius R = 1.0.
 *   • Its own PBR materials are preserved.
 *   • On load failure the procedural sphere stays visible as a fallback.
 *
 * ── SIZE UPDATES ──────────────────────────────────────────────────────────────
 *   The `size` prop changing (e.g. window resize) only calls renderer.setSize()
 *   — the scene, materials, and animation loop are NOT rebuilt.  A full rebuild
 *   only happens when rotationSpeed / backgroundMode / modelUrl / axialTilt
 *   actually change.
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
   * CSS wrapper div translates with window.mousemove for parallax.
   */
  backgroundMode?: boolean;
  /** Radians to tilt the planet's rotation axis (default 0.27 ≈ 15°). */
  axialTilt?:      number;
  /** Path to a glb/glTF model inside /public. Falls back to procedural sphere. */
  modelUrl?:       string;
  /** Disable hover effects even in foreground mode. */
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
}

const PRESET: PlanetPreset = {
  color:         0xb2b2a8,
  emissive:      0x050505,
  roughness:     0.92,
  metalness:     0.05,
  rotationSpeed: 0.0018,
};

// ─── scene builder ────────────────────────────────────────────────────────────

interface SceneRefs {
  scene:    THREE.Scene;
  camera:   THREE.PerspectiveCamera;
  pivot:    THREE.Group;
  sphere:   THREE.Mesh;
  material: THREE.MeshStandardMaterial;
}

function buildScene(
  preset:        PlanetPreset,
  R:             number,
  axialTilt:     number,
): SceneRefs {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, R * 3.2);

  // Ambient fill — raised from 0.18 so the Death Star's surface detail is
  // visible in the shadowed hemisphere instead of going pitch-black.
  const ambient = new THREE.AmbientLight(0xffffff, 0.42);
  scene.add(ambient);

  // Main key light — slightly reduced to balance the increased ambient.
  const sun = new THREE.DirectionalLight(0xfff8f0, 1.35);
  sun.position.set(-R * 2, R * 1.5, R * 2.5);
  scene.add(sun);

  // Cool rim light for a deep-space feel.
  const rim = new THREE.DirectionalLight(0x8090ff, 0.35);
  rim.position.set(R * 2, -R * 0.5, -R * 1.5);
  scene.add(rim);

  const sphereGeo = new THREE.SphereGeometry(R, 96, 64);
  const material  = new THREE.MeshStandardMaterial({
    color:     preset.color,
    emissive:  preset.emissive,
    roughness: preset.roughness,
    metalness: preset.metalness,
  });
  const sphere = new THREE.Mesh(sphereGeo, material);
  sphere.rotation.z = axialTilt;

  const pivot = new THREE.Group();
  pivot.add(sphere);
  scene.add(pivot);

  return { scene, camera, pivot, sphere, material };
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Planet3D({
  size           = 100,
  rotationSpeed,
  backgroundMode = true,
  modelUrl,
  axialTilt      = 0.27,
  noInteraction  = false,
  className      = '',
  style          = {},
}: Planet3DProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hovered    = useRef(false);

  const parallaxTarget  = useRef({ x: 0, y: 0 });
  const parallaxCurrent = useRef({ x: 0, y: 0 });

  // Renderer is kept in a ref so the size-update effect can reach it without
  // triggering a full scene rebuild.
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── Size-only update ────────────────────────────────────────────────────────
  // Runs whenever `size` changes after initial mount.
  // Does NOT rebuild the scene — just resizes the WebGL viewport.
  useEffect(() => {
    rendererRef.current?.setSize(size, size);
  }, [size]);

  // ── Full scene rebuild ──────────────────────────────────────────────────────
  // Only re-runs when scene-affecting props change (NOT `size`).
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const speed = rotationSpeed ?? (backgroundMode ? 0.0003 : PRESET.rotationSpeed);
    const R = 1.0;

    // ── Renderer ──────────────────────────────────────────────────────────────
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
    rendererRef.current = renderer;

    // ── Scene ──────────────────────────────────────────────────────────────────
    const { scene, camera, pivot, sphere, material } = buildScene(PRESET, R, axialTilt);

    // ── GLB loader (optional) ──────────────────────────────────────────────────
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
          // Translate so the geometric center sits at the scene origin.
          glbModel.position.set(
            -center.x * scale,
            -center.y * scale,
            -center.z * scale,
          );
          glbModel.rotation.z = axialTilt;
          pivot.remove(sphere);
          sphere.geometry.dispose();
          (sphere.material as THREE.Material).dispose();
          pivot.add(glbModel);
        },
        undefined,
        (err) => console.warn('[Planet3D] GLB load failed — using procedural sphere:', err),
      );
    }

    // ── Parallax (background mode only) ───────────────────────────────────────
    const PAR_X = size * 0.17;
    const PAR_Y = size * 0.15;

    function applyParallax(clientX: number, clientY: number) {
      if (!backgroundMode) return;
      const mx = (clientX / window.innerWidth  - 0.5) * 2;
      const my = (clientY / window.innerHeight - 0.5) * 2;
      parallaxTarget.current.x = mx * PAR_X;
      parallaxTarget.current.y = my * PAR_Y;
    }

    function onMouseMove(e: MouseEvent) { applyParallax(e.clientX, e.clientY); }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (t) applyParallax(t.clientX, t.clientY);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // ── Animation loop ─────────────────────────────────────────────────────────
    let rafId: number;

    function animate() {
      rafId = requestAnimationFrame(animate);

      const activeSpeed =
        !backgroundMode && !noInteraction && hovered.current ? speed * 2.8 : speed;

      if (glbModel) {
        glbModel.rotation.y += activeSpeed;
      } else {
        sphere.rotation.y += activeSpeed;
      }

      renderer.render(scene, camera);

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

    // ── Hover (foreground + interaction enabled only) ──────────────────────────
    const onEnter = () => { hovered.current = true;  };
    const onLeave = () => { hovered.current = false; };
    const interactionActive = !backgroundMode && !noInteraction;
    if (interactionActive) {
      canvas.addEventListener('mouseenter', onEnter);
      canvas.addEventListener('mouseleave', onLeave);
    }

    // ── Cleanup ────────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      rendererRef.current = null;
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
      void material; // suppress unused-variable warning — disposed via scene.traverse
    };
    // `size` intentionally omitted — renderer.setSize is handled by the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, rotationSpeed, backgroundMode, modelUrl, axialTilt]);

  // ── SSR placeholder ────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, flexShrink: 0, ...style }}
      />
    );
  }

  const canvasEl = (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{
        display:       'block',
        flexShrink:    0,
        pointerEvents: (backgroundMode || noInteraction) ? 'none' : 'auto',
        ...style,
      }}
    />
  );

  if (backgroundMode) {
    return (
      <div
        ref={wrapperRef}
        style={{
          display:       'inline-block',
          flexShrink:    0,
          pointerEvents: 'none',
          willChange:    'transform',
        }}
      >
        {canvasEl}
      </div>
    );
  }

  return canvasEl;
}
