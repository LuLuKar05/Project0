/**
 * @file src/features/galaxy/lib/sceneConfig.ts
 * Scene configuration constants for the galaxy view.
 * Single source of truth for camera positions and scene dimensions —
 * shared by the R3F scene components and the orbit generator service.
 */

/** Camera resting position in overview mode (above and behind the core). */
export const OVERVIEW_POS = [0, 16, 22] as const;

/** Camera lookAt target in overview mode (the galactic core). */
export const OVERVIEW_TGT = [0, 0, 0] as const;

/** Camera start position for the entry fly-in animation. */
export const ENTRY_POS = [0, 38, 56] as const;

/** Asteroid belt radial bounds. */
export const BELT_INNER = 11.5;
export const BELT_OUTER = 12.8;

/** Maximum orbit radius — nothing should orbit beyond this. */
export const GRID_RADIUS = 18;

/** Innermost orbit radius and per-slot spacing (matches the seeded data). */
export const ORBIT_BASE_RADIUS = 3.8;
export const ORBIT_STEP = 2.25;

/**
 * Decorative "dead orbit" slots shown as faint rings with dark planets.
 * Mirrors the two hardcoded "Upcoming Missions" entries in SidebarNav.
 */
export const DEAD_ORBITS = [
  { radius: 13.5, speed: 0.022, inclination: 3.8 },
  { radius: 16.0, speed: 0.016, inclination: 5.9 },
] as const;
