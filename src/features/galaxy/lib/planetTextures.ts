/**
 * @file src/features/galaxy/lib/planetTextures.ts
 * Registry of equirectangular (2:1) texture sets for planets that should be
 * skinned instead of rendered with a flat procedural colour.
 *
 * A planet opts in by setting `PlanetVisual.textureUrl` to a KEY in this map
 * (e.g. "korriban"). The default value "procedural" (and any unknown key) keeps
 * the colour-only look from lib/galaxy/derive.ts.
 *
 * Files live under /public and are referenced by URL. Paths are case-sensitive
 * on the deployed (Linux) host — match the on-disk casing exactly.
 *
 * ⚠️ Performance: these maps are streamed to the GPU at full resolution. Keep
 * them small (1–2K, WebP). 4K maps are far larger than a planet ever needs on
 * screen and will hurt load time / memory.
 */

export interface PlanetTextureSet {
  /** Diffuse / albedo — the base colour map (sRGB). Required. */
  map: string;
  /** Roughness map (linear). Optional. */
  roughnessMap?: string;
  /** Metalness / specular mask (linear). Optional. */
  metalnessMap?: string;
  /** RGB tangent-space normal map for fine surface detail (linear). Optional. */
  normalMap?: string;
  /** Normal map strength (default 1). Optional. */
  normalScale?: number;
  /** Grayscale bump/height map — only used if `normalMap` is absent (linear). Optional. */
  bumpMap?: string;
  /** Height map driving real geometry displacement on the SELECTED planet (linear). Optional. */
  displacementMap?: string;
  /** Displacement strength as a fraction of planet radius (default 0.04). Optional. */
  displacementScale?: number;
  /** Emissive map — e.g. city night-lights; glows on the dark side (sRGB). Optional. */
  emissiveMap?: string;
  /** Tint applied to the emissive map (default warm white). Optional. */
  emissiveColor?: string;
  /** Transparent cloud overlay used as an alphaMap on a slightly larger sphere. Optional. */
  cloudsMap?: string;
  /** Fresnel atmosphere rim colour — set to enable the glow on the selected planet. Optional. */
  atmosphereColor?: string;
}

export const PLANET_TEXTURES: Record<string, PlanetTextureSet> = {
  // Korriban — KTX2, 4K. Rocky Sith world (no city lights). Bump = normal map,
  // Elevation = displacement (applied only when selected/zoomed).
  korriban: {
    map:             '/planets/Korriban/KorribanDiffuse.ktx2',
    roughnessMap:    '/planets/Korriban/KorribanRoughness.ktx2',
    normalMap:       '/planets/Korriban/KorribanBump.ktx2',
    normalScale:     1.1,
    displacementMap: '/planets/Korriban/KorribanElevation.ktx2',
    displacementScale: 0.04,
    cloudsMap:       '/planets/Korriban/KorribanClouds.ktx2',
    atmosphereColor: '#ff5028',
  },

  // Coruscant — KTX2. NOTE: source maps are 8K — heavy when selected; re-encode
  // at ~2K when you can. No elevation map in this set, so no displacement.
  coruscant: {
    map:          '/planets/Coruscant/Coruscant_Diffuse_4k.ktx2',
    emissiveMap:  '/planets/Coruscant/CoruscantLightsMetropolis.ktx2', // city night-lights
    emissiveColor:'#ffd9a0',
    normalMap:    '/planets/Coruscant/CoruscantBump.ktx2',
    metalnessMap: '/planets/Coruscant/CoruscantSpecular.ktx2',
    cloudsMap:    '/planets/Coruscant/CoruscantClouds.ktx2',
    atmosphereColor: '#88b8ff',
  },

  // Csilla — KTX2, 4K. Icy Chiss capital. Bump = normal map, Elevation =
  // displacement. City lights available but left off (uncomment to enable).
  csilla: {
    map:             '/planets/Csilla/CsillaDiffuse.ktx2',
    roughnessMap:    '/planets/Csilla/CsillaRoughness.ktx2',
    normalMap:       '/planets/Csilla/CsillaBump.ktx2',
    normalScale:     1.0,
    displacementMap: '/planets/Csilla/CsillaElevation.ktx2',
    displacementScale: 0.035,
    // emissiveMap:  '/planets/Csilla/CsillaLightMetropolis.ktx2',
    // emissiveColor:'#bcd0ff',
    cloudsMap:       '/planets/Csilla/CsillaCloud.ktx2',
    atmosphereColor: '#bcd0ff',
  },
};

/** Resolve a `PlanetVisual.textureUrl` to a texture set, or null for procedural. */
export function planetTextureSet(textureUrl: string | null | undefined): PlanetTextureSet | null {
  if (!textureUrl || textureUrl === 'procedural') return null;
  return PLANET_TEXTURES[textureUrl] ?? null;
}
