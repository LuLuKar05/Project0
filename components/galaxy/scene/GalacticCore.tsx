'use client';

/**
 * @file components/galaxy/scene/GalacticCore.tsx
 * The galactic core: a bright central sphere, two pulsing additive glow
 * sprites, a horizontal lens-flare streak, and two slowly counter-rotating
 * structural rings. Scale-pops in on mount for the entry animation.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { radialGlow, lensFlareH } from '@/lib/utils';

export default function GalacticCore() {
  const groupRef     = useRef<THREE.Group>(null);
  const innerGlowRef = useRef<THREE.SpriteMaterial>(null);
  const outerGlowRef = useRef<THREE.SpriteMaterial>(null);
  const ringARef     = useRef<THREE.Mesh>(null);
  const ringBRef     = useRef<THREE.Mesh>(null);

  // Canvas textures are cheap to build but must only be built once.
  const innerTex = useMemo(() => radialGlow(0x8eecff), []);
  const outerTex = useMemo(() => radialGlow(0x2080c0), []);
  const flareTex = useMemo(() => lensFlareH(), []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;

    // Entry scale-pop: exponential damp from 0.01 → 1.
    const g = groupRef.current;
    if (g && g.scale.x < 0.999) {
      const s = THREE.MathUtils.damp(g.scale.x, 1, 2.2, dt);
      g.scale.setScalar(s);
    }

    // Core pulse — the two halos breathe out of phase.
    if (innerGlowRef.current) innerGlowRef.current.opacity = 0.65 + 0.2 * Math.sin(t * 1.8);
    if (outerGlowRef.current) outerGlowRef.current.opacity = 0.3 + 0.12 * Math.sin(t * 1.1 + 1.5);

    if (ringARef.current) ringARef.current.rotation.z += dt * 0.12;
    if (ringBRef.current) ringBRef.current.rotation.z -= dt * 0.07;
  });

  return (
    <group ref={groupRef} scale={0.01}>
      {/* Bright self-illuminated core sphere */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#E0F4FF" />
      </mesh>

      {/* Inner halo */}
      <sprite scale={[6, 6, 1]}>
        <spriteMaterial
          ref={innerGlowRef}
          map={innerTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* Outer halo */}
      <sprite scale={[14, 14, 1]}>
        <spriteMaterial
          ref={outerGlowRef}
          map={outerTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* Horizontal anamorphic lens-flare streak */}
      <sprite scale={[10, 0.6, 1]}>
        <spriteMaterial
          map={flareTex}
          transparent
          depthWrite={false}
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* Structural rings — counter-rotating tori around the core */}
      <mesh ref={ringARef} rotation-x={Math.PI / 2.3}>
        <torusGeometry args={[1.15, 0.012, 8, 96]} />
        <meshBasicMaterial color="#4FC3F7" transparent opacity={0.4} />
      </mesh>
      <mesh ref={ringBRef} rotation-x={Math.PI / 1.8} rotation-y={0.4}>
        <torusGeometry args={[1.6, 0.008, 8, 96]} />
        <meshBasicMaterial color="#8EECFF" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
