/**
 * @file src/features/galaxy/lib/derive.ts
 * Pure presentation derivation for planets.
 *
 * The DB stores facts (title, order, orbit params); colours are derived
 * deterministically from the orbit slot here at render time. This replaces
 * the texture files referenced by PlanetVisual.textureUrl (which never
 * existed in /public) with a procedural palette, so there is exactly one
 * source of truth for how a planet looks.
 */

export interface PlanetColors {
  /** Surface colour of the sphere material. */
  surface: string;
  /** Emissive tint so the dark side never goes pitch black. */
  emissive: string;
  /** Halo sprite colour as a Three.js hex int (radialGlow takes a number). */
  glow: number;
}

const PALETTE: PlanetColors[] = [
  { surface: '#4FC3F7', emissive: '#0a2a3f', glow: 0x4fc3f7 }, // cyan
  { surface: '#FFB454', emissive: '#3f240a', glow: 0xffb454 }, // amber
  { surface: '#8EECFF', emissive: '#10333f', glow: 0x8eecff }, // bright cyan
  { surface: '#B39DFF', emissive: '#221a3f', glow: 0xb39dff }, // violet
  { surface: '#7CFFB0', emissive: '#0e3f22', glow: 0x7cffb0 }, // green
  { surface: '#FF8A80', emissive: '#3f1410', glow: 0xff8a80 }, // coral
  { surface: '#FFE082', emissive: '#3f330a', glow: 0xffe082 }, // gold
  { surface: '#80DEEA', emissive: '#0d3338', glow: 0x80deea }, // teal
];

/** Deterministic colour set for the planet in orbit slot `order`. */
export function planetColors(order: number): PlanetColors {
  return PALETTE[((order % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

/** Starting angle (radians) for orbit slot `order` — spreads planets out. */
export function initialAngle(order: number): number {
  return order * 2.4; // golden-angle-ish spread so planets never start clustered
}
