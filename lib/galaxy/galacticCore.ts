/**
 * @file lib/galaxy/galacticCore.ts
 * The galactic core: a bright central sphere with a radial glow sprite,
 * a horizontal lens-flare line, and two slowly-rotating structural rings.
 *
 * ANIMATION — Core Pulse:
 * The glow sprite opacity oscillates sinusoidally, simulating a pulsating
 * energy source.  The two torus rings rotate at different speeds to suggest
 * complex orbital mechanics around the core.
 */

import * as THREE from 'three';
import { gfx } from './gfx';
import { radialGlow, lensFlareH } from '../utils';

/** The Group holding all core sub-objects — null until create() is called */
let _group: THREE.Group | null = null;

/** The glow sprite — stored separately for per-frame opacity animation */
let _glowSprite: THREE.Sprite | null = null;

let _glowOuter: THREE.Sprite | null = null; // the new outer glow sprite, stored for animation

/** The two structural torus rings — stored for per-frame rotation */
const _rings: THREE.Mesh[] = [];

// ─────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────

/**
 * Build the galactic core assembly and add it to the scene.
 *
 * Structure (all children of _group):
 *  1. Bright central sphere (MeshBasicMaterial — always lit)
 *  2. Radial glow Sprite (additive blending for bloom-like halo)
 *  3. Horizontal lens-flare Sprite (wide flat streak)
 *  4. Two TorusGeometry rings at slightly different radii & angles
 *
 * The entire group starts at scale 0.01 so the entry animation can
 * scale-pop it into existence.
 */
export function create(): void {
  _group = new THREE.Group();

  // 1. Bright central sphere (self-illuminated, no shading)
  _group.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xE0F4FF }),
    ),
  );

  // 2. Radial glow sprite — large additive cyan halo around the core.
  //    AdditiveBlending makes overlapping glows brighter, not opaque.
  _glowSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: radialGlow(0x8EECFF),
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0, // hidden until entry animation reveals it
    }),
  );
  _glowSprite.scale.set(6, 6, 1);
  _group.add(_glowSprite);

  _glowOuter = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: radialGlow(0x2080C0),
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0, // hidden until entry animation reveals it
    }),
  );
  _glowOuter.scale.set(14, 14, 1);
  _group.add(_glowOuter);
  // 3. Horizontal lens-flare streak — a wide, flat sprite that simulates
  //    a camera anamorphic lens flare along the horizontal axis.
  const lf = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: lensFlareH(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    }),
  );
  lf.scale.set(24, 0.3, 1);
  lf.name = 'coreLens'; // named so entryAnimation can find it by name
  _group.add(lf);

  const lfV = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: lensFlareH(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    }),
  );
  lfV.scale.set(0.3, 16, 1);
  lfV.name = 'coreLensV';
  _group.add(lfV);

  // 4. Two structural torus rings — decorative orbit lines around the core.
  //    Ring 1: radius 1.3, ring 2: radius 1.65, tilted 36° relative to ring 1.
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.2 + i * 0.4, 0.02, 8, 100),
      new THREE.MeshBasicMaterial({
        color: 0x4FC3F7,
        transparent: true,
        opacity: 0, // revealed by entry animation
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = (i * Math.PI) / 5; // second ring tilted 36°
    _rings.push(ring);
    _group.add(ring);
  }

  // Start invisible at near-zero scale for the entry "scale-pop" reveal
  _group.scale.set(0.01, 0.01, 0.01);
  gfx.scene.add(_group);
}

/**
 * Per-frame update.
 *
 * 1. Glow pulse — opacity oscillates ±0.15 around 0.55 on a ~4.2 s cycle.
 * 2. Ring rotation — each ring rotates at a different speed so they look
 *    independent and alive.
 *
 * @param elapsed - Total scene time in seconds
 * @param dt      - Delta time since last frame in seconds
 */
export function update(elapsed: number, dt: number): void {
  if (!_group) return;
  const flicker = 1 + (Math.random() - 0.5) * 0.06;
  // Glow pulse — smooth sinusoidal opacity oscillation
  if (_glowSprite) {
    (_glowSprite.material as THREE.SpriteMaterial).opacity =
      (0.55 + Math.sin(elapsed * 1.5) * 0.15) * flicker; // add subtle random flicker for extra life
  }
  if (_glowOuter) {
    (_glowOuter.material as THREE.SpriteMaterial).opacity =
      (0.35 + Math.sin(elapsed * 1.5 + Math.PI / 2) * 0.1) * flicker; // offset phase for variation
  }

  // Structural ring rotation — rings spin independently
  for (let i = 0; i < _rings.length; i++) {
    _rings[i]!.rotation.z += (0.12 + i * 0.08) * dt;
  }
}

// ─────────────────────────────────────────────
//  Internal accessors (used by entry-animation)
// ─────────────────────────────────────────────

/** Returns the core Group; null before create() */
export function getGroup(): THREE.Group | null { return _group; }

/** Returns the glow Sprite; null before create() */
export function getGlowSprite(): THREE.Sprite | null { return _glowSprite; }

/** Returns the glow outer Sprite; null before create() */
export function getGlowOuter(): THREE.Sprite | null { return _glowOuter; }

/** Returns the structural torus rings array */
export function getRings(): readonly THREE.Mesh[] { return _rings; }
