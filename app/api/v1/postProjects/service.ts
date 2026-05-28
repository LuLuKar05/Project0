/**
 * @file app/api/v1/postProjects/service.ts
 *
 * Business logic for creating a new Project with its OrbitConfig and
 * PlanetVisual in a single atomic Prisma transaction.
 *
 * the client never sends them.  The generation is fully deterministic so
 * the same `order` always produces the same values, and planets spread
 * themselves evenly across the galaxy without manual tuning.
 *
 * Responsibilities:
 *  1. Pre-check slug uniqueness       → clean 409 SLUG_CONFLICT
 *  2. Pre-check order slot conflict   → clean 409 ORDER_CONFLICT
 *  3. Auto-generate OrbitConfig       → based on `order`
 *  4. Auto-generate PlanetVisual      → based on `order`
 *  5. Run nested prisma.project.create → one transaction, three rows
 *  6. Always force active = false     → safety gate, publish separately
 */

import { prisma }                from '@/lib/prisma'
import {generateOrbit} from '@/services/generateOrbit'
import {generatePlanetVisual} from '@/services/generatePlanetVisual'
import type { ValidatedProjectInput }     from './schema'
import type { Project }                   from '@/lib/types'

// ─── Result types ─────────────────────────────────────────────────────────────

type ServiceSuccess = { ok: true;  status: 201 ;project: Project }
type ServiceFail    = { ok: false; status: 409 | 500; error: string; message: string }
export type ServiceResult = ServiceSuccess | ServiceFail

// ─── Slug generator ───────────────────────────────────────────────────────────

/** Converts a title to a URL-safe slug: "My Cool App!" → "my-cool-app" */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

// ─── Main service function ────────────────────────────────────────────────────

export async function createProject(input: ValidatedProjectInput): Promise<ServiceResult> {
  try {

    // ── 1. Resolve slug ──────────────────────────────────────────────────────
    const slug = input.slug || slugify(input.title)

    // ── 2. Slug uniqueness pre-check ─────────────────────────────────────────
    const existingSlug = await prisma.project.findUnique({ where: { slug } })
    if (existingSlug) {
      return {
        ok: false,
        status: 409,
        error: 'SLUG_CONFLICT',
        message: `A project with slug "${slug}" already exists. Choose a different slug.`,
      }
    }

    // ── 3. Order slot conflict check ─────────────────────────────────────────
    const existingOrder = await prisma.project.findFirst({
      where: { order: input.order },
    })
    if (existingOrder) {
      return {
        ok: false,
        status: 409,
        error: 'ORDER_CONFLICT',
        message: `Orbit slot ${input.order} is already occupied by "${existingOrder.title}". Use a different order value.`,
      }
    }

    // ── 4. Auto-generate orbit + visual from order ───────────────────────────
    const orbit  = generateOrbit(input.order)
    const visual = generatePlanetVisual(input.order)

    // ── 5. Create all three rows in one atomic transaction ───────────────────
    // active is ALWAYS false on creation — publish via a separate endpoint.
    const project = await prisma.project.create({
      data: {
        slug,
        title:       input.title,
        category:    input.category,
        date:        input.date,
        shortDesc:   input.shortDesc,
        fullDesc:    input.fullDesc,
        tags:        input.tags,
        order:       input.order,
        active:      false,
        githubURL:   input.githubURL,
        deployedURL: input.deployedURL,
        orbit:  { create: orbit  },
        visual: { create: visual },
      },
      include: {
        orbit:  true,
        visual: true,
      },
    })

    return { ok: true, status: 201, project }

  } catch (error) {
    console.error('[createProject] Unexpected error:', error)
    return {
      ok: false,
      status: 500,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while creating the project.',
    }
  }
}