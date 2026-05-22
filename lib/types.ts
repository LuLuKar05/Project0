/**
 * @file lib/types.ts
 * Central TypeScript interfaces and type aliases for the Galaxy Sector app.
 * Imported by both the Three.js galaxy modules and React UI components.
 */

import type * as THREE from 'three';
import type { ProjectModel, OrbitConfigModel, PlanetVisualModel } from './generated/prisma/models'

// ─────────────────────────────────────────────
//  Data / Config types  ( , no Three.js)
// ─────────────────────────────────────────────

export type Project = ProjectModel;
export type OrbitConfigs = OrbitConfigModel;
export type PlanetVisual = PlanetVisualModel;
/**
 * A single portfolio project entry.
 * Displayed as a planet in the 3D scene and in the detail panel.
 */

/**
 * Orbital ring parameters for one planet.
 * All angles are in radians; speeds in radians per second.
 */


/**
 * Visual styling preset for one planet.
 * Colors are Three.js hex integers (0xRRGGBB).
 */


// ─────────────────────────────────────────────
//  Runtime Three.js types  (not serialisable)
// ─────────────────────────────────────────────

/**
 * A fully-constructed planet at runtime.
 * Created by orbitsPlanets.create() and stored in appState.planets[].
 */
export interface PlanetObject {
  /** The 3D sphere mesh rendered in the scene */
  mesh: THREE.Mesh;
  /** Source project data */
  proj: Project;
  /** Orbital parameters used for position updates */
  orbit: OrbitConfig;
  /** Visual parameters used for animations */
  vis: PlanetVisual;
  /** Additive glow sprite attached as child of mesh (active planets only) */
  glow: THREE.Sprite | null;
  /** Current orbital angle (radians) — mutated every frame */
  angle: number;
  /** The orbit ring line rendered beneath the planet */
  ring: THREE.Line;
  /** DOM element for the always-on mini text label (set by miniLabels.ts) */
  labelEl: HTMLElement | null;
}

/**
 * Camera animation tween — interpolates position & lookAt over `dur` seconds.
 * Set to null when no transition is in progress.
 */
export interface CamAnim {
  /** Camera start world position */
  fromP: THREE.Vector3;
  /** Camera start lookAt target */
  fromT: THREE.Vector3;
  /** Camera end world position */
  toP: THREE.Vector3;
  /** Camera end lookAt target */
  toT: THREE.Vector3;
  /** Current normalised progress 0 → 1 */
  prog: number;
  /** Total transition duration in seconds */
  dur: number;
}

/**
 * Mutable per-frame application state, shared across all galaxy modules.
 * Only primitive values here — Three.js objects live in gfx.ts.
 */
export interface AppState {
  /** Index of the currently hovered planet (-1 = none) */
  hovIdx: number;
  /** Index of the currently selected / zoomed-in planet (-1 = overview) */
  selIdx: number;
  /** True while a camera transition is playing */
  transitioning: boolean;
  /** Total seconds elapsed since the scene started */
  elapsed: number;
  /** Set to true once the entry animation sequence finishes */
  entryDone: boolean;
}

/**
 * Callbacks provided by the React layer to the Three.js galaxy layer.
 * Called on significant state changes so React can update UI accordingly.
 */
export interface GalaxyCallbacks {
  /** A planet gained or lost hover focus (idx = -1 when unhovered) */
  onHoverChange: (idx: number) => void;
  /** A planet was clicked/selected by the user */
  onPlanetSelect: (idx: number, proj: Project) => void;
  /** Camera returned to the sector overview */
  onReturnHome: () => void;
}

/**
 * Public API returned by initGalaxy() to React consumers.
 * Lets the React layer trigger camera moves without direct Three.js access.
 */
export interface GalaxyAPI {
  /** Fly camera to planet at the given index */
  flyTo: (idx: number) => void;
  /** Return camera to the overview position */
  flyHome: () => void;
  /** Navigate to the previous active project (wrap-around) */
  navPrev: () => void;
  /** Navigate to the next active project (wrap-around) */
  navNext: () => void;
  /** Stop the animation loop and clean up all Three.js resources */
  destroy: () => void;
}

// ─────────────────────────────────────────────
//  Web Audio types
// ─────────────────────────────────────────────

/**
 * Nodes that make up the continuous ambient drone.
 * Kept so the oscillator can be stopped on cleanup.
 */
export interface AmbientNodes {
  osc: OscillatorNode;
  gain: GainNode;
}

// ─────────────────────────────────────────────
//  Trail type
// ─────────────────────────────────────────────

/**
 * A single historical position snapshot stored in a trail buffer.
 */
export interface TrailPoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Runtime trail data for one active planet.
 */
export interface TrailEntry {
  /** Index into appState.planets[] */
  planetIdx: number;
  /** Ring-buffer of recent positions */
  history: TrailPoint[];
  /** The Three.js Line that renders the trail */
  line: THREE.Line;
}
