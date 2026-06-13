'use client';

/**
 * @file components/galaxy/scene/DeadOrbits.tsx
 * Faint outer orbits with small dark planets — the "Upcoming Missions"
 * placeholders. Purely decorative and non-interactive; mirrors the two
 * Classified entries in SidebarNav (DEAD_ORBITS in sceneConfig).
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { DEAD_ORBITS } from '@/lib/galaxy/sceneConfig';

export default function DeadOrbits() {
  return (
    <>
      {DEAD_ORBITS.map((orbit, i) => (
        <DeadOrbit key={i} index={i} {...orbit} />
      ))}
    </>
  );
}

function DeadOrbit({
  index,
  radius,
  speed,
  inclination,
}: {
  index: number;
  radius: number;
  speed: number;
  inclination: number;
}) {
  const planetRef = useRef<THREE.Group>(null);
  const phase = Math.PI * 0.8 + index * 2.6;

  const ringPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let k = 0; k <= 128; k++) {
      const a = (k / 128) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return pts;
  }, [radius]);

  useFrame(({ clock }) => {
    const g = planetRef.current;
    if (!g) return;
    const a = phase + clock.elapsedTime * speed;
    g.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  });

  return (
    <group rotation-x={THREE.MathUtils.degToRad(inclination)}>
      <Line points={ringPoints} color="#1a3a5c" transparent opacity={0.35} lineWidth={1} dashed dashSize={0.6} gapSize={0.4} />
      <group ref={planetRef}>
        <mesh>
          <sphereGeometry args={[0.34, 24, 16]} />
          <meshStandardMaterial color="#2a3540" emissive="#0a0f14" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
