'use client';

/**
 * @file src/features/galaxy/components/scene/PlanetSystem.tsx
 * Renders one orbit ring + planet + labels per project.
 *
 * Each planet lives inside a group tilted by its orbit inclination; the
 * planet's position on the ring is a pure function of elapsed time
 * (angle = initialAngle + speed · t), so there is no incremental drift.
 *
 * World positions are written into `positionsRef` every frame so the
 * CameraRig can follow the selected planet without React re-renders.
 *
 * Hover/click use R3F's built-in pointer events (no manual raycaster),
 * and labels are drei <Html> elements that track their planet for free.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Project } from '@/lib/types';
import { planetColors, initialAngle } from '@/features/galaxy/lib/derive';
import { radialGlow } from '@/lib/utils';

/** Visual scale multiplier on top of the DB `sz` value (0.28–0.38). */
const PLANET_SCALE = 1.7;

interface PlanetSystemProps {
  projects: Project[];
  hovIdx: number;
  selIdx: number;
  onHover: (idx: number) => void;
  onSelect: (idx: number) => void;
  /** Per-frame world positions, indexed like `projects` — read by CameraRig. */
  positionsRef: React.RefObject<THREE.Vector3[]>;
}

export default function PlanetSystem({
  projects,
  hovIdx,
  selIdx,
  onHover,
  onSelect,
  positionsRef,
}: PlanetSystemProps) {
  return (
    <>
      {projects.map((project, i) =>
        project.orbit && project.visual ? (
          <Planet
            key={project.id}
            project={project}
            index={i}
            hovered={hovIdx === i}
            selected={selIdx === i}
            anySelected={selIdx !== -1}
            onHover={onHover}
            onSelect={onSelect}
            positionsRef={positionsRef}
          />
        ) : null,
      )}
    </>
  );
}

// ─────────────────────────────────────────────
//  Single planet + its orbit ring
// ─────────────────────────────────────────────

interface PlanetProps {
  project: Project;
  index: number;
  hovered: boolean;
  selected: boolean;
  anySelected: boolean;
  onHover: (idx: number) => void;
  onSelect: (idx: number) => void;
  positionsRef: React.RefObject<THREE.Vector3[]>;
}

function Planet({
  project,
  index,
  hovered,
  selected,
  anySelected,
  onHover,
  onSelect,
  positionsRef,
}: PlanetProps) {
  // Guarded by the parent — assert non-null once here.
  const orbit  = project.orbit!;
  const visual = project.visual!;

  const planetRef = useRef<THREE.Group>(null);
  const meshRef   = useRef<THREE.Mesh>(null);

  const radius  = orbit.radius;
  const tilt    = THREE.MathUtils.degToRad(orbit.inclination);
  const phase   = initialAngle(project.order);
  const size    = visual.sz * PLANET_SCALE;
  const colors  = planetColors(project.order);
  const glowTex = useMemo(() => radialGlow(colors.glow), [colors.glow]);

  // Orbit ring vertices (closed circle in the tilted XZ plane).
  const ringPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let k = 0; k <= 128; k++) {
      const a = (k / 128) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return pts;
  }, [radius]);

  useFrame(({ clock }, dt) => {
    const g = planetRef.current;
    if (!g) return;

    const a = phase + clock.elapsedTime * orbit.speed;
    g.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    g.getWorldPosition(positionsRef.current[index]);

    // Planet self-rotation + smooth hover scale-up.
    const mesh = meshRef.current;
    if (mesh) {
      mesh.rotation.y += dt * visual.rotationSpeed;
      const target = hovered || selected ? 1.25 : 1;
      const s = THREE.MathUtils.damp(mesh.scale.x, target, 8, dt);
      mesh.scale.setScalar(s);
    }
  });

  const ringOpacity = selected ? 0.4 : hovered ? 0.3 : 0.15;

  return (
    <group rotation-x={tilt}>
      {/* Orbit ring */}
      <Line points={ringPoints} color="#4FC3F7" transparent opacity={ringOpacity} lineWidth={1} />

      {/* Planet assembly — positioned along the ring every frame */}
      <group ref={planetRef}>
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onSelect(index); }}
          onPointerOver={(e) => { e.stopPropagation(); onHover(index); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { onHover(-1); document.body.style.cursor = ''; }}
        >
          <sphereGeometry args={[size, 48, 32]} />
          <meshStandardMaterial
            color={colors.surface}
            emissive={colors.emissive}
            emissiveIntensity={hovered || selected ? 1.4 : 0.7}
            roughness={0.5}
            metalness={0.15}
          />
        </mesh>

        {/* Additive halo sprite */}
        <sprite scale={[size * 6, size * 6, 1]}>
          <spriteMaterial
            map={glowTex}
            transparent
            depthWrite={false}
            opacity={(hovered || selected ? 0.9 : 0.5) * visual.glowIntensity}
            blending={THREE.AdditiveBlending}
          />
        </sprite>

        {/* Always-visible mini name label (hidden while a planet is selected) */}
        <Html
          position={[0, size + 0.5, 0]}
          center
          distanceFactor={16}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[10, 0]}
        >
          <div className="ml-label" style={{ opacity: anySelected || hovered ? 0 : 1 }}>
            {project.title}
          </div>
        </Html>

        {/* Hover tooltip card */}
        {hovered && !anySelected && (
          <Html
            position={[0, size + 0.4, 0]}
            center
            style={{ pointerEvents: 'none' }}
            zIndexRange={[20, 11]}
          >
            <div className="hl-wrap">
              <div className="hl-box">
                <div className="hl-cat">{project.category}</div>
                <div className="hl-ttl">{project.title}</div>
                <div className="hl-dsc">{project.shortDesc}</div>
              </div>
              <div className="hl-con" />
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
