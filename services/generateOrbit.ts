import { OrbitConfig } from '@/lib/types'

/** A single segment of a planet's orbit, defined by its start and end angles (in radians). */
//Example simple implementation:
    // radius      — each orbit raidus increase by 7 units, starting from 15 for the first planet(order 1 → 15, 2 → 22, 3 → 29…)
    // speed       — outer planets orbits slower than the inner ones, mimicking real physics
    // inclination — spread across -15° → +15° in a repeating cycle of 8 to create visual variety.

    // For a more complex implementation, you could use a combination of mathematical functions and randomization (with a fixed seed for determinism) to generate orbits that are more visually interesting while still ensuring they don't overlap too much.

    /** Note: can adjust the inclination_cycle range for different visual effects(-5 to +5) and (-30 to +30) */

export function generateOrbit(order: number): Omit<OrbitConfig, 'id' | 'projectId'> {
    const INCLINATION_CYCLE = [-15, -10, -5, 0, 5, 10, 15, 8]
	return {
        radius:         (order * 7) + 8, 
        speed:          parseFloat((1.2 / (order * 0.3 + 0.6)).toFixed(3)),
        inclination:    INCLINATION_CYCLE[(order-1) % INCLINATION_CYCLE.length]
	} as Omit<OrbitConfig, 'id' | 'projectId'>
}