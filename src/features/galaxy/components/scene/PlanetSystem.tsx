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

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Line, useTexture, useKTX2 } from '@react-three/drei';
import * as THREE from 'three';
import type { Project } from '@/lib/types';
import { planetColors, initialAngle } from '@/features/galaxy/lib/derive';
import { planetTextureSet, type PlanetTextureSet } from '@/features/galaxy/lib/planetTextures';
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
  /** Lazy textures: true once the galaxy has scrolled into view. */
  texturesActive: boolean;
}

export default function PlanetSystem({
  projects,
  hovIdx,
  selIdx,
  onHover,
  onSelect,
  positionsRef,
  texturesActive,
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
            // Diffuse loads for every planet once the galaxy is in view; the full
            // PBR set + clouds load only for the selected planet (see Planet).
            loadTextures={texturesActive}
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
  loadTextures: boolean;
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
  loadTextures,
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
  const texSet  = planetTextureSet(visual.textureUrl);

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
          {/* High-poly only when selected, so displacement has vertices to move. */}
          <sphereGeometry args={selected ? [size, 160, 96] : [size, 48, 32]} />
          {texSet && loadTextures ? (
            selected ? (
              // Selected: full PBR set (normal, displacement, metalness, lights…).
              // Fall back to the already-loaded diffuse so the swap is seamless.
              <Suspense fallback={<DiffuseMaterial texSet={texSet} active size={size} /> }>
                <FullMaterial texSet={texSet} active size={size} />
              </Suspense>
            ) : (
              // Overview: diffuse only (cheap), with the procedural look as the
              // fallback until the diffuse finishes loading.
              <Suspense fallback={<ProceduralMaterial colors={colors} active={hovered} />}>
                <DiffuseMaterial texSet={texSet} active={hovered} size={size} />
              </Suspense>
            )
          ) : (
            <ProceduralMaterial colors={colors} active={hovered || selected} />
          )}
        </mesh>

        {/* Drifting cloud layer — full detail, only on the selected planet. */}
        {texSet?.cloudsMap && loadTextures && selected && (
          <Suspense fallback={null}>
            {isKTX2(texSet.cloudsMap)
              ? <PlanetCloudsKTX2 url={texSet.cloudsMap} size={size} />
              : <PlanetCloudsWebP url={texSet.cloudsMap} size={size} />}
          </Suspense>
        )}

        {/* Fresnel atmosphere rim — only on the selected planet. */}
        {texSet?.atmosphereColor && loadTextures && selected && (
          <Atmosphere size={size} color={texSet.atmosphereColor} />
        )}

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

// ─────────────────────────────────────────────
//  Planet materials
// ─────────────────────────────────────────────

/** Flat procedural look — colour + emissive from the orbit-slot palette. */
function ProceduralMaterial({
  colors,
  active,
}: {
  colors: ReturnType<typeof planetColors>;
  active: boolean;
}) {
  return (
    <meshStandardMaterial
      color={colors.surface}
      emissive={colors.emissive}
      emissiveIntensity={active ? 1.4 : 0.7}
      roughness={0.5}
      metalness={0.15}
    />
  );
}

/** True for KTX2 assets, which load through useKTX2 instead of useTexture. */
const BASIS_PATH = '/basis/'; // self-hosted Basis transcoder (public/basis)
function isKTX2(url: string): boolean {
  return url.toLowerCase().endsWith('.ktx2');
}

// Planet material map slots, in a stable load order. `map` and `emissiveMap`
// are colour (sRGB); the rest are linear data maps. (Diffuse-only overview loads
// just `map`; the full set loads only on the selected planet.)
const MAT_SLOTS = ['map', 'roughnessMap', 'metalnessMap', 'normalMap', 'bumpMap', 'displacementMap', 'emissiveMap'] as const;
type MatSlot = (typeof MAT_SLOTS)[number];
type LoadedMaps = Partial<Record<MatSlot, THREE.Texture>>;
const COLOUR_SLOTS: ReadonlySet<MatSlot> = new Set(['map', 'emissiveMap']);

/** The slots actually present on a texture set, in MAT_SLOTS order. */
function presentSlots(t: PlanetTextureSet): MatSlot[] {
  return MAT_SLOTS.filter((s) => Boolean(t[s]));
}

/** Build a {slot: texture} map from a flat Texture[] in presentSlots() order. */
function zipMaps(slots: MatSlot[], textures: THREE.Texture[]): LoadedMaps {
  const out: LoadedMaps = {};
  slots.forEach((s, i) => { out[s] = textures[i]; });
  return out;
}

/**
 * Configure loaded textures (mutates the array elements — safe here because they
 * are passed in as a parameter, not read straight off a hook result). Anisotropy
 * keeps the surface crisp at grazing angles; RepeatWrapping joins the longitude
 * seam cleanly.
 */
function configureMaps(textures: THREE.Texture[], maxAniso: number) {
  for (const t of textures) {
    if (t.anisotropy === maxAniso) continue;
    t.anisotropy = maxAniso;
    t.wrapS = THREE.RepeatWrapping;
    t.needsUpdate = true;
  }
}

/**
 * Presentational planet material — receives already-loaded textures.
 *
 * `selfLit` (overview / diffuse-only): the diffuse doubles as a faint emissive so
 * the planet reads at a glance even on its dark side. When false (selected), the
 * planet is lit for real — only a dedicated `emissiveMap` (city night-lights)
 * glows, giving a proper day/night terminator.
 */
function PlanetMaterial({
  maps,
  emissiveColor,
  normalScale = 1,
  displacementFrac,
  size,
  active,
  selfLit,
}: {
  maps: LoadedMaps;
  emissiveColor?: string;
  normalScale?: number;
  displacementFrac?: number;
  size: number;
  active: boolean;
  selfLit: boolean;
}) {
  const hasLights  = Boolean(maps.emissiveMap);
  const emissiveOn = selfLit || hasLights;
  const dispScale  = maps.displacementMap ? size * (displacementFrac ?? 0.04) : 0;
  const normScale  = useMemo(() => new THREE.Vector2(normalScale, normalScale), [normalScale]);
  return (
    <meshStandardMaterial
      map={maps.map}
      roughnessMap={maps.roughnessMap}
      metalnessMap={maps.metalnessMap}
      normalMap={maps.normalMap ?? null}
      normalScale={normScale}
      bumpMap={maps.normalMap ? null : (maps.bumpMap ?? null)}
      bumpScale={!maps.normalMap && maps.bumpMap ? 0.04 : 0}
      displacementMap={maps.displacementMap ?? null}
      displacementScale={dispScale}
      displacementBias={-dispScale * 0.5}
      emissiveMap={emissiveOn ? (maps.emissiveMap ?? maps.map) : null}
      emissive={emissiveOn ? (hasLights ? (emissiveColor ?? '#ffd9a0') : '#ffffff') : '#000000'}
      emissiveIntensity={emissiveOn ? (hasLights ? (active ? 1.6 : 1.1) : active ? 0.9 : 0.65) : 0}
      roughness={maps.roughnessMap ? 1 : 0.9}
      metalness={maps.metalnessMap ? 1 : 0}
    />
  );
}

// ── Diffuse-only (overview): one map, cheap. Self-lit so it reads at a glance. ──

function DiffuseMaterialWebP({ texSet, active, size }: { texSet: PlanetTextureSet; active: boolean; size: number }) {
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const tex = useTexture(texSet.map, (loaded) => {
    const t = Array.isArray(loaded) ? loaded[0] : loaded;
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
  }) as THREE.Texture;
  useEffect(() => { configureMaps([tex], maxAniso); }, [tex, maxAniso]);
  return <PlanetMaterial maps={{ map: tex }} size={size} active={active} selfLit />;
}

function DiffuseMaterialKTX2({ texSet, active, size }: { texSet: PlanetTextureSet; active: boolean; size: number }) {
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const tex = useKTX2(texSet.map, BASIS_PATH) as THREE.Texture;
  useEffect(() => { configureMaps([tex], maxAniso); }, [tex, maxAniso]);
  return <PlanetMaterial maps={{ map: tex }} size={size} active={active} selfLit />;
}

/** Diffuse-only material, picking the loader by file type. */
function DiffuseMaterial({ texSet, active, size }: { texSet: PlanetTextureSet; active: boolean; size: number }) {
  return isKTX2(texSet.map)
    ? <DiffuseMaterialKTX2 texSet={texSet} active={active} size={size} />
    : <DiffuseMaterialWebP texSet={texSet} active={active} size={size} />;
}

// ── Full PBR (selected): every provided map — normal, displacement, lights… ──

function FullMaterialWebP({ texSet, active, size }: { texSet: PlanetTextureSet; active: boolean; size: number }) {
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const slots = presentSlots(texSet);
  const urls = slots.map((s) => texSet[s]!);
  // onLoad is the supported place to set colour space (only colour maps are sRGB).
  const textures = useTexture(urls, (loaded) => {
    const arr = Array.isArray(loaded) ? loaded : [loaded];
    slots.forEach((s, i) => {
      if (COLOUR_SLOTS.has(s)) { arr[i].colorSpace = THREE.SRGBColorSpace; arr[i].needsUpdate = true; }
    });
  }) as THREE.Texture[];
  useEffect(() => { configureMaps(textures, maxAniso); }, [textures, maxAniso]);

  return (
    <PlanetMaterial
      maps={zipMaps(slots, textures)}
      emissiveColor={texSet.emissiveColor}
      normalScale={texSet.normalScale}
      displacementFrac={texSet.displacementScale}
      size={size}
      active={active}
      selfLit={false}
    />
  );
}

/**
 * Full skin from .ktx2 maps (GPU-compressed via useKTX2). Colour space is read
 * from each file's header, so encode colour maps (diffuse, emissive) with the
 * sRGB transfer function and data maps as linear.
 */
function FullMaterialKTX2({ texSet, active, size }: { texSet: PlanetTextureSet; active: boolean; size: number }) {
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const slots = presentSlots(texSet);
  const urls = slots.map((s) => texSet[s]!);
  const textures = useKTX2(urls, BASIS_PATH) as THREE.Texture[];
  useEffect(() => { configureMaps(textures, maxAniso); }, [textures, maxAniso]);

  return (
    <PlanetMaterial
      maps={zipMaps(slots, textures)}
      emissiveColor={texSet.emissiveColor}
      normalScale={texSet.normalScale}
      displacementFrac={texSet.displacementScale}
      size={size}
      active={active}
      selfLit={false}
    />
  );
}

/** Full PBR material, picking the loader by file type. */
function FullMaterial({ texSet, active, size }: { texSet: PlanetTextureSet; active: boolean; size: number }) {
  return isKTX2(texSet.map)
    ? <FullMaterialKTX2 texSet={texSet} active={active} size={size} />
    : <FullMaterialWebP texSet={texSet} active={active} size={size} />;
}

// ── Atmosphere: Fresnel rim glow on a back-side shell (selected planet only). ──

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vView = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATMO_FRAG = /* glsl */ `
  uniform vec3 glowColor;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vView), 2.6);
    gl_FragColor = vec4(glowColor, 1.0) * clamp(intensity, 0.0, 1.0);
  }
`;

function Atmosphere({ size, color }: { size: number; color: string }) {
  const uniforms = useMemo(() => ({ glowColor: { value: new THREE.Color(color) } }), [color]);
  return (
    <mesh scale={size * 1.18}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={ATMO_VERT}
        fragmentShader={ATMO_FRAG}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Transparent cloud shell, slightly larger than the planet, drifting slowly.
 * The cloud map is an `alphaMap` (grayscale → opacity: white = cloud, black =
 * clear) on a light, self-lit material — NOT a colour `map`, which would paint
 * the gaps solid black and shadow the whole planet.
 */
function CloudShell({ tex, size }: { tex: THREE.Texture; size: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.03;
  });
  return (
    <mesh ref={ref} scale={1.02}>
      <sphereGeometry args={[size, 48, 32]} />
      <meshStandardMaterial
        color="#eaf2ff"
        alphaMap={tex}
        transparent
        depthWrite={false}
        emissive="#cfe0ff"
        emissiveIntensity={0.5}
        opacity={0.85}
      />
    </mesh>
  );
}

function PlanetCloudsWebP({ url, size }: { url: string; size: number }) {
  const tex = useTexture(url) as THREE.Texture;
  return <CloudShell tex={tex} size={size} />;
}

function PlanetCloudsKTX2({ url, size }: { url: string; size: number }) {
  const tex = useKTX2(url, BASIS_PATH) as THREE.Texture;
  return <CloudShell tex={tex} size={size} />;
}
