/**
 * @file src/server/getSkills.ts
 *
 * Server-side data access for skill categories — called directly from
 * Server Components (no API round-trip). Same caching/fallback contract
 * as getProjects: the calling page's `revalidate` controls freshness,
 * and a DB failure returns [] instead of throwing.
 */

import { prisma } from '@/lib/prisma'
import { withDbRetry } from '@/lib/dbRetry'

/** Plain serialisable shape passed from the server page to client components. */
export interface SkillCategoryData {
  name:   string
  skills: string[]
}

export async function getSkills(): Promise<SkillCategoryData[]> {
  try {
    // Retry rides out a Neon cold start (P1001) instead of returning empty skills.
    const categories = await withDbRetry(() =>
      prisma.skillCategory.findMany({
        orderBy: { displayOrder: 'asc' },
        include: {
          skills: {
            select:  { name: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    )
    return categories.map((category) => ({
      name:   category.name,
      skills: category.skills.map((skill) => skill.name),
    }))
  } catch (error) {
    console.error('[getSkills] Failed to fetch skills:', error)
    return []
  }
}
