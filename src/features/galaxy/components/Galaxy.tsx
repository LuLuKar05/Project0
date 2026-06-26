'use client';

/**
 * @file src/features/galaxy/components/Galaxy.tsx
 * The Project Galaxy section — react-three-fiber Canvas + HTML overlay UI.
 *
 * ─── DATA FLOW ───────────────────────────────────────────────────────────────
 * Receives `projects` (with orbit/visual/tags) as a prop from the server
 * page — no client fetching. Selection and hover state live here as plain
 * React state (events are rare); per-frame data (planet world positions)
 * flows through a shared ref so nothing re-renders at 60 fps.
 *
 * ─── PERFORMANCE ─────────────────────────────────────────────────────────────
 * • frameloop flips to 'never' via IntersectionObserver when the section is
 *   scrolled out of view — the galaxy costs nothing while reading the hero,
 *   skills, or contact sections.
 * • The canvas is transparent; the global Starfield (layout.tsx) shows
 *   through, so no second star system is rendered here.
 * • dpr capped at 2 to avoid 4K-retina overdraw.
 */

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { Project } from '@/lib/types';
import { ENTRY_POS } from '@/features/galaxy/lib/sceneConfig';

import GalacticCore from './scene/GalacticCore';
import AsteroidBelt from './scene/AsteroidBelt';
import PlanetSystem from './scene/PlanetSystem';
import DeadOrbits   from './scene/DeadOrbits';
import CameraRig    from './scene/CameraRig';
import SidebarNav   from './SidebarNav';
import DetailPanel  from './DetailPanel';
import GalaxyLoader from './GalaxyLoader';

interface GalaxyProps {
  /** Active projects in orbit order, fetched server-side (services/getProjects). */
  projects: Project[];
}

export default function Galaxy({ projects }: GalaxyProps) {
  const [hovIdx, setHovIdx]     = useState(-1);
  const [selIdx, setSelIdx]     = useState(-1);
  const [revealed, setRevealed] = useState(false);
  const [inView, setInView]     = useState(false);
  // Lazy textures: latches true the first time the galaxy scrolls into view and
  // stays true (we don't want to re-fetch when it scrolls back off-screen).
  // Once active, every planet shows its diffuse; the *full* PBR set (roughness,
  // bump, clouds, lights…) only loads for the currently selected planet.
  const [texturesActive, setTexturesActive] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);

  /** Planet world positions, written by PlanetSystem and read by CameraRig. */
  const positionsRef = useRef<THREE.Vector3[]>(projects.map(() => new THREE.Vector3()));

  // Reveal the sidebar after the camera fly-in has mostly settled.
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1600);
    return () => clearTimeout(t);
  }, []);

  // Pause the render loop entirely while the section is off-screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        // Lazy textures: latch on first intersection and never unset, so they
        // stay loaded once seen rather than re-fetching on scroll.
        if (entry.isIntersecting) setTexturesActive(true);
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cycle = (dir: 1 | -1) => {
    const n = projects.length;
    if (n === 0) return;
    setSelIdx((((selIdx < 0 ? 0 : selIdx + dir) % n) + n) % n);
  };

  const selectedProject = selIdx >= 0 ? (projects[selIdx] ?? null) : null;

  return (
    <section
      ref={sectionRef}
      id="galaxy-section"
      className="relative h-dvh w-full overflow-hidden"
      aria-label="Project galaxy"
    >
      {/* ── 3D scene ── */}
      <div className="absolute inset-0">
        <Canvas
          frameloop={inView ? 'always' : 'never'}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ fov: 58, near: 0.1, far: 300, position: [...ENTRY_POS] }}
          onPointerMissed={() => setSelIdx(-1)}
        >
          <ambientLight intensity={0.4} />
          {/* The core itself is the light source for planet shading */}
          <pointLight position={[0, 0, 0]} color="#bfeaff" intensity={160} decay={2} distance={80} />
          <directionalLight position={[20, 30, 10]} color="#8090ff" intensity={0.3} />

          <GalacticCore />
          <AsteroidBelt />
          <DeadOrbits />
          <PlanetSystem
            projects={projects}
            hovIdx={hovIdx}
            selIdx={selIdx}
            onHover={setHovIdx}
            onSelect={setSelIdx}
            positionsRef={positionsRef}
            texturesActive={texturesActive}
          />
          <CameraRig selIdx={selIdx} positionsRef={positionsRef} />
        </Canvas>
      </div>

      {/* ── Loading screen — covers the canvas until the scene is ready ── */}
      <GalaxyLoader inView={inView} revealed={revealed} />

      {/* ── HUD header ── */}
      <div className={`gx-hud${revealed ? ' in' : ''}`}>
        <div className="gx-hud-tag">Sector 7 · Project Galaxy</div>
        <div className="gx-hud-sub">
          {projects.length > 0
            ? 'Select a planet to open mission details'
            : 'Galaxy offline — no missions on record'}
        </div>
      </div>

      {/* ── Overlay UI ── */}
      <SidebarNav
        projects={projects}
        activeIdx={selIdx}
        revealed={revealed}
        onSelectProject={setSelIdx}
      />
      <DetailPanel
        project={selectedProject}
        index={selIdx}
        total={projects.length}
        onClose={() => setSelIdx(-1)}
        onPrev={() => cycle(-1)}
        onNext={() => cycle(1)}
      />
    </section>
  );
}
