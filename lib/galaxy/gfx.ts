/**
 * @file lib/galaxy/gfx.ts
 * Container for the Three.js graphics context objects.
 *
 * These are populated once by renderer.initRenderer() and then read by
 * every other galaxy module.  Using a mutable container object (instead of
 * exported `let` variables) allows other modules to import the container
 * reference once at module-load time — they always see the latest value
 * because they're reading a property on the same object reference.
 *
 * ⚠️  All fields start as `null`.  Do NOT access them before initRenderer()
 *     has been called — you will get a runtime error.
 */

import type * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * The shared Three.js graphics context.
 * Populated lazily by renderer.initRenderer().
 */
export const gfx = {
  /** WebGL renderer (draws the scene each frame) */
  renderer: null as unknown as THREE.WebGLRenderer,

  /** Three.js Scene — all 3D objects live here */
  scene:    null as unknown as THREE.Scene,

  /** Perspective camera — follows the user's viewpoint */
  camera:   null as unknown as THREE.PerspectiveCamera,

  /**
   * Post-processing composer that chains render passes.
   * Set to null if bloom post-processing is unavailable.
   */
  composer: null as EffectComposer | null,

  /**
   * The UnrealBloom pass added to the composer.
   * Stored separately so strength/threshold can be tweaked at runtime.
   */
  bloomPass: null as UnrealBloomPass | null,
} as const;
// `as const` prevents reassigning the container reference itself;
// individual properties are still mutable (they're typed as non-readonly).
