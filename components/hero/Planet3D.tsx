'use client';

/**
 * @file components/hero/Planet3D.tsx
 * @description Hero 3-D model (the Death Star) on a transparent
 * react-three-fiber canvas. Intentionally minimal: the model slowly
 * rotates — no parallax, no hover effects, no pointer interaction.
 *
 * useGLTF loads the Draco-compressed GLB (decoder files in /draco/) and
 * R3F disposes of all GPU resources automatically on unmount.
 */

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface Planet3DProps {
  /** Canvas width/height in pixels. */
  size?: number;
  /** Radians per frame at 60 fps. */
  rotationSpeed?: number;
  /** Path to a glb/glTF model inside /public. */
  modelUrl: string;
  /** Radians to tilt the model's rotation axis. */
  axialTilt?: number;
  className?: string;
}

// ─── model ────────────────────────────────────────────────────────────────────

function Model({
  url,
  axialTilt,
  rotationSpeed,
}: {
  url: string;
  axialTilt: number;
  rotationSpeed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url, '/draco/');

  // Normalise: fit a 2-unit bounding box, centred at the origin.
  //
  // IMPORTANT: never mutate `scene` — drei caches it per URL and shares it
  // across mounts. Mutating it breaks the bounding-box maths the second
  // time this runs (Strict Mode / remount): the model gets re-measured
  // already-scaled and snaps back to its raw size. Instead, measure
  // read-only and apply scale + offset on a wrapper group (idempotent).
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const s = 2 / Math.max(sz.x, sz.y, sz.z);
    return { scale: s, offset: center.multiplyScalar(-s) };
  }, [scene]);

  useFrame((_, dt) => {
    // rotationSpeed is radians/frame at 60 fps — scale by dt for any refresh rate.
    if (groupRef.current) groupRef.current.rotation.y += rotationSpeed * dt * 60;
  });

  return (
    <group ref={groupRef} rotation-z={axialTilt}>
      <group scale={scale} position={offset}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload('/models/death_star.glb', '/draco/');

// ─── component ────────────────────────────────────────────────────────────────

export default function Planet3D({
  size = 100,
  rotationSpeed = 0.0003,
  modelUrl,
  axialTilt = 0.27,
  className = '',
}: Planet3DProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cursor-follow parallax: pointermove sets a target offset, and a rAF loop
  // lerps the wrapper transform toward it each frame (factor 0.04) — smooth
  // trailing drift, same approach as the original vanilla version. The CSS
  // transform never touches the Three.js scene, so it costs nothing on the GPU.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const PAR_X = size * 0.17;
    const PAR_Y = size * 0.15;
    const target  = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth  - 0.5) * 2 * PAR_X;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2 * PAR_Y;
    };

    let raf: number;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      current.x += (target.x - current.x) * 0.04;
      current.y += (target.y - current.y) * 0.04;
      el.style.transform = `translate(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px)`;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [size]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      aria-hidden="true"
      style={{ width: size, height: size, flexShrink: 0, pointerEvents: 'none', willChange: 'transform' }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 3.2] }}
        onCreated={({ gl, scene }) => {
          // The ONLY light source: a neutral procedural environment map
          // (three's built-in RoomEnvironment — no network fetch). This is
          // how GLB viewers (including VS Code's preview) light models:
          // even, directionless image-based lighting. No key light, no rim
          // glow, no hard shadow across the sphere.
          const pmrem = new THREE.PMREMGenerator(gl);
          scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
          pmrem.dispose();
        }}
      >
        <Suspense fallback={null}>
          <Model url={modelUrl} axialTilt={axialTilt} rotationSpeed={rotationSpeed} />
        </Suspense>
      </Canvas>
    </div>
  );
}
