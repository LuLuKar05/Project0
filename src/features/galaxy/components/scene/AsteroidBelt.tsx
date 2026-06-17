'use client';

/**
 * @file src/features/galaxy/components/scene/AsteroidBelt.tsx
 * Decorative asteroid belt between BELT_INNER and BELT_OUTER.
 *
 * One InstancedMesh (single draw call) with per-instance transforms set
 * once on mount; the whole belt then rotates slowly as a group.
 */

import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BELT_INNER, BELT_OUTER } from '@/features/galaxy/lib/sceneConfig';

const COUNT = 260;

export default function AsteroidBelt() {
  const meshRef  = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const rot = new THREE.Quaternion();
    const eul = new THREE.Euler();
    const scl = new THREE.Vector3();

    for (let i = 0; i < COUNT; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = BELT_INNER + Math.random() * (BELT_OUTER - BELT_INNER);
      pos.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.4, Math.sin(angle) * radius);
      rot.setFromEuler(eul.set(Math.random() * Math.PI, Math.random() * Math.PI, 0));
      scl.setScalar(0.4 + Math.random() * 1.2);
      mesh.setMatrixAt(i, m.compose(pos, rot, scl));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.018;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.06, 0]} />
        <meshStandardMaterial color="#5e6e7d" roughness={1} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}
