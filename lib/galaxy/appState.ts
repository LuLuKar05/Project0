/**
 * @file lib/galaxy/appState.ts
 * Singleton mutable runtime state shared across all Three.js galaxy modules.
 *
 * Why a single shared object instead of React state?
 * The animation loop runs at 60 fps and needs O(1) reads/writes with zero
 * React re-render cost.  UI updates are pushed to React via callbacks only
 * when meaningful events occur (planet hover/click, transitions complete).
 *
 * Pattern: export a plain mutable object.  Any module can import it and
 * mutate properties directly — ES module imports are live bindings, so all
 * importers share the same object reference.
 */

import * as THREE from 'three';
import type { AppState, CamAnim, PlanetObject } from '../types';

// ─────────────────────────────────────────────
//  Core scene state
// ─────────────────────────────────────────────

/**
 * Primary application state flags.
 * Mutated by camera-ctrl, input-handler, and entry-animation.
 */
export const state: AppState = {
  hovIdx:       -1,     // index of hovered planet (-1 = none)
  selIdx:       -1,     // index of selected / zoomed planet (-1 = overview)
  transitioning: false, // true while a camera tween is playing
  elapsed:       0,     // total scene time in seconds
  entryDone:     false, // true after the intro animation finishes
};

/**
 * Runtime planet objects, one per PROJECTS entry.
 * Populated by orbitsPlanets.create() during galaxy init.
 * Other modules read this array every frame.
 */
export const planets: PlanetObject[] = [];

// ─────────────────────────────────────────────
//  Camera animation state
// ─────────────────────────────────────────────

/**
 * Active camera tween, or null when the camera is at rest.
 * Set by cameraCtrl.flyTo() / flyHome() and cleared when prog reaches 1.
 */
export let camAnim: CamAnim | null = null;

/** Update the active camera animation tween */
export function setCamAnim(value: CamAnim | null): void {
  camAnim = value;
}

/**
 * Current camera lookAt target in world space.
 * Interpolated during transitions; tracked to planet position when locked-on.
 * Initialised to the overview target — overwritten by initRenderer().
 */
export let currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

/** Replace the currentLookAt vector */
export function setCurrentLookAt(v: THREE.Vector3): void {
  currentLookAt = v;
}

// ─────────────────────────────────────────────
//  Mouse / pointer state
// ─────────────────────────────────────────────

/**
 * NDC mouse position (Normalised Device Coordinates).
 * x ∈ [-1, 1], y ∈ [-1, 1] — required by THREE.Raycaster.
 * Updated by inputHandler on every mousemove / touchstart.
 */
export const mouse = { x: -9, y: -9 };

/**
 * Mouse position in [0, 1] space centred at 0.5.
 * x = clientX/width - 0.5, y = clientY/height - 0.5.
 * Used by cameraCtrl for parallax offset.
 */
export const normMouse = { x: 0, y: 0 };

/**
 * Smoothed version of normMouse — lerped towards normMouse each frame.
 * Prevents jarring camera jumps when the cursor moves quickly.
 */
export const smoothMouse = { x: 0, y: 0 };

/**
 * Accumulated scene rotation around the Y axis (radians).
 * Modified by mouse drag to let the user orbit the sector view.
 */
export let sceneRotY = 0;

/** Update sceneRotY */
export function setSceneRotY(value: number): void {
  sceneRotY = value;
}

/** True while the primary pointer button is held down */
export let isDragging = false;

/** Set drag flag */
export function setIsDragging(value: boolean): void {
  isDragging = value;
}

/** Screen pixel coords where the current drag gesture started */
export const dragStart = { x: 0, y: 0 };

/** The sceneRotY value at the moment a drag gesture began */
export let dragRotStart = 0;

/** Update drag rotation start value */
export function setDragRotStart(value: number): void {
  dragRotStart = value;
}
