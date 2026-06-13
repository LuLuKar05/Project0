import { OrbitConfig } from '@/lib/types'
import {
    ORBIT_BASE_RADIUS,
    ORBIT_STEP,
    GRID_RADIUS,
} from '@/lib/galaxy/sceneConfig'

/**
 * Generate orbit parameters for the project in orbit slot `order`.
 *
 * Values are derived from the same constants the R3F scene uses
 * (lib/galaxy/sceneConfig), so API-created projects always land inside
 * the rendered galaxy — matching the progression of the seeded data:
 *   order 0 → r 3.8, order 1 → r 6.05, order 2 → r 8.3 …
 *
 * radius      — ORBIT_BASE_RADIUS + order * ORBIT_STEP, capped just inside GRID_RADIUS
 * speed       — outer planets orbit slower than inner ones (radians/second)
 * inclination — small tilt (degrees) cycled per slot for visual variety
 */

const INCLINATION_CYCLE = [0.5, 2.3, 4.5, 1.2, 3.8, 5.9]

export function generateOrbit(order: number): Omit<OrbitConfig, 'id' | 'projectId'> {
    return {
        radius:      Math.min(ORBIT_BASE_RADIUS + order * ORBIT_STEP, GRID_RADIUS - 1),
        speed:       parseFloat((0.12 / (1 + 0.6 * order)).toFixed(3)),
        inclination: INCLINATION_CYCLE[order % INCLINATION_CYCLE.length],
    }
}
