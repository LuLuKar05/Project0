/**
 * @file src/server/getProjects.ts
 *
 * Server-side data access for projects — called directly from Server
 * Components (no API round-trip). The page that calls this should set
 * `export const revalidate = <seconds>` so the result is cached by ISR
 * and the DB is only hit on regeneration, not on every visit.
 *
 * Returns [] on failure so a DB outage (or a missing DATABASE_URL at
 * build time) degrades to an empty list instead of crashing the build.
 */

import { prisma } from '@/lib/prisma'
import type { Project } from '@/lib/types'

export async function getProjects(): Promise<Project[]> {
  try {
    return await prisma.project.findMany({
      where: { active: true },
      include: {
        orbit:  true,
        visual: true,
        tags:   true,
      },
      orderBy: { order: 'asc' },
    })
  } catch (error) {
    console.error('[getProjects] Failed to fetch projects:', error)
    return []
  }
}
