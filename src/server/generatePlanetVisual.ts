import {PlanetVisual} from '@/lib/types';
//Generate a Planet's Visual based on the Orbit slot(order) of the project.
//Has to divide by the array.length to make sure the cycle works for any number of projects.

//Note: colours are NOT stored — the galaxy scene derives them at render
//time from `order` via lib/galaxy/derive.ts (planetColors). textureUrl is
//kept only because the column is required in the schema; the scene ignores it.
export function generatePlanetVisual(order: number, sz?: number, rotationSpeed?: number, glowIntensity?: number): Omit<PlanetVisual, 'id' | 'projectId'> {
    // Size range matches the seeded data (0.22–0.38, drawn ×1.7 in the scene).
    const SIZE_CYCLE           = [0.32, 0.36, 0.28, 0.38, 0.30, 0.34]
    const ROTATION_SPEED_CYCLE = [0.30, 0.25, 0.20, 0.35, 0.28]
    const GLOW_CYCLE           = [0.6, 0.7, 0.5]

    return{
        textureUrl:         'procedural', // colours derived from order at render time
        sz:                 sz ?? SIZE_CYCLE[order % SIZE_CYCLE.length],
        rotationSpeed:      rotationSpeed ?? ROTATION_SPEED_CYCLE[order % ROTATION_SPEED_CYCLE.length],
        glowIntensity:      glowIntensity ?? GLOW_CYCLE[order % GLOW_CYCLE.length],
    }
}