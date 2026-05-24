/**
 * @file lib/types.ts
 * @description Single source of truth for all TypeScript types in the Galaxy
 * Sector app.  Imported by both the Three.js galaxy modules and React UI
 * components.
 *
 * ─── IMPORT STRATEGY ─────────────────────────────────────────────────────────
 *
 * We import directly from the generated model files (e.g. ProjectGetPayload)
 * rather than going through the Prisma namespace.  The generated output for
 * this project exports all payload/include types as named exports, so the
 * direct import is cleaner and avoids the Prisma namespace indirection.
 *
 * ─── PROJECT TYPE ─────────────────────────────────────────────────────────────
 *
 * `Project` is defined using ProjectGetPayload with orbit and visual included.
 * This means:
 *   • Every API route that returns projects MUST use:
 *       prisma.project.findMany({ include: { orbit: true, visual: true } })
 *   • Components can safely access project.orbit and project.visual without
 *     undefined checks (TypeScript will enforce the include at the query level).
 */

import type * as THREE from 'three';
import type { ProjectGetPayload } from './generated/prisma/models/Project';
import type { OrbitConfigModel }  from './generated/prisma/models/OrbitConfig';
import type { PlanetVisualModel } from './generated/prisma/models/PlanetVisual';

// ─────────────────────────────────────────────
//  Database model types  (no Three.js)
// ─────────────────────────────────────────────

/**
 * A single portfolio project entry, always fetched with its orbit and visual
 * relations included.
 *
 * Use this type everywhere a project object is passed around.
 * The API route must match: prisma.project.findMany({ include: { orbit: true, visual: true } })
 *
 * orbit and visual are typed as nullable (| null) because the schema keeps
 * them optional on the Project side — Prisma's database constraint rule.
 * Guard with a null-check before using them in 3-D rendering code.
 */
export type Project = ProjectGetPayload<{
  include: {
    orbit:  true;
    visual: true;
  };
}>;

/**
 * Orbital ring parameters for one planet.
 * All angles are in radians; speeds in radians per second.
 */
export type OrbitConfig = OrbitConfigModel;

/**
 * Visual styling preset for one planet mesh.
 */
export type PlanetVisual = PlanetVisualModel;

// ─────────────────────────────────────────────
//  Runtime Three.js types  (not serialisable)
// ─────────────────────────────────────────────

/**
 * A fully-constructed planet at runtime.
 * Created by orbitsPlanets.create() and stored in appState.planets[].
 *
 * By the time a PlanetObject is created, orbit and visual have been verified
 * to be non-null (active projects always have both), so they are typed as
 * non-nullable here.
 */
export interface PlanetObject {
  /** The 3-D sphere mesh rendered in the scene */
  mesh:    THREE.Mesh;
  /** Source project data (includes orbit and visual relation) */
  proj:    Project;
  /** Orbital parameters used for position updates each frame */
  orbit:   OrbitConfig;
  /** Visual parameters used for material / animation updates */
  vis:     PlanetVisual;
  /** Additive glow sprite attached as child of mesh (active planets only) */
  glow:    THREE.Sprite | null;
  /** Current orbital angle in radians — mutated every frame */
  angle:   number;
  /** The orbit ring line rendered beneath the planet */
  ring:    THREE.Line;
  /** DOM element for the always-on mini text label (set by miniLabels.ts) */
  labelEl: HTMLElement | null;
}

/**
 * Camera animation tween — interpolates position & lookAt over `dur` seconds.
 * Set to null when no camera transition is in progress.
 */
export interface CamAnim {
  /** Camera start world position */
  fromP: THREE.Vector3;
  /** Camera start lookAt target */
  fromT: THREE.Vector3;
  /** Camera destination world position */
  toP:   THREE.Vector3;
  /** Camera destination lookAt target */
  toT:   THREE.Vector3;
  /** Current normalised progress, 0 → 1 */
  prog:  number;
  /** Total transition duration in seconds */
  dur:   number;
}

/**
 * Mutable per-frame application state, shared across all galaxy modules.
 * Only primitive values here — Three.js objects live in gfx.ts.
 */
export interface AppState {
  /** Index of the currently hovered planet (-1 = none) */
  hovIdx:        number;
  /** Index of the currently selected / zoomed-in planet (-1 = overview) */
  selIdx:        number;
  /** True while a camera transition is playing */
  transitioning: boolean;
  /** Total seconds elapsed since the scene started */
  elapsed:       number;
  /** Set to true once the entry animation sequence finishes */
  entryDone:     boolean;
}

/**
 * Callbacks provided by the React layer to the Three.js galaxy layer.
 * Called on significant state changes so React can update UI accordingly.
 */
export interface GalaxyCallbacks {
  /** A planet gained or lost hover focus (idx = -1 when unhovered) */
  onHoverChange:  (idx: number) => void;
  /** A planet was clicked / selected by the user */
  onPlanetSelect: (idx: number, proj: Project) => void;
  /** Camera returned to the sector overview */
  onReturnHome:   () => void;
}

/**
 * Public API returned by initGalaxy() to React consumers.
 * Lets the React layer trigger camera moves without direct Three.js access.
 */
export interface GalaxyAPI {
  /** Fly the camera to the planet at the given index */
  flyTo:    (idx: number) => void;
  /** Return the camera to the overview position */
  flyHome:  () => void;
  /** Navigate to the previous active project (wrap-around) */
  navPrev:  () => void;
  /** Navigate to the next active project (wrap-around) */
  navNext:  () => void;
  /** Stop the animation loop and clean up all Three.js resources */
  destroy:  () => void;
}

// ─────────────────────────────────────────────
//  Web Audio types
// ─────────────────────────────────────────────

/**
 * Nodes that make up the continuous ambient drone.
 * Stored so the oscillator can be stopped on cleanup.
 */
export interface AmbientNodes {
  osc:  OscillatorNode;
  gain: GainNode;
}

// ─────────────────────────────────────────────
//  Trail types
// ─────────────────────────────────────────────

/** A single historical position snapshot stored in a trail buffer. */
export interface TrailPoint {
  x: number;
  y: number;
  z: number;
}

/** Runtime trail data for one active planet. */
export interface TrailEntry {
  /** Index into appState.planets[] */
  planetIdx: number;
  /** Ring-buffer of recent world-space positions */
  history:   TrailPoint[];
  /** The Three.js Line that renders the trail */
  line:      THREE.Line;
}
