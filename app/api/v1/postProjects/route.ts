/**
 * @file app/api/v1/postProjects/route.ts
 *
 * POST /api/v1/postProjects
 *
 * Admin-only endpoint to create a new Project with its OrbitConfig and
 * PlanetVisual. Protected by a static Bearer token (ADMIN_SECRET env var).
 *
 * Flow:
 *   1. Auth guard   → 401 if token missing or wrong
 *   2. Parse body   → 400 if not valid JSON
 *   3. Validate     → 400 with field + message if shape is wrong
 *   4. Service      → 409 on slug/order conflict, 500 on DB error
 *   5. Respond      → 201 with the created project
 */

import { NextResponse }        from 'next/server'
import { revalidatePath }       from 'next/cache'
import { validateProjectInput } from '@/schemas/validateProjectsInput'
import { createProject }       from '@/services/createProject'

export async function POST(req: Request) {

  // ── 1. Auth guard ────────────────────────────────────────────────────────────
  // Expects: Authorization: Bearer <ADMIN_SECRET>
  const authHeader  = req.headers.get('authorization') ?? ''
  const token       = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const adminSecret = process.env.ADMIN_SECRET

  if (!adminSecret) {
    console.error('[postProjects] ADMIN_SECRET env var is not set')
    return NextResponse.json(
      { success: false, error: 'SERVER_MISCONFIGURATION' },
      { status: 500 },
    )
  }

  if (token !== adminSecret) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED', message: 'Valid Bearer token required' },
      { status: 401 },
    )
  }

  // ── 2. Parse body ────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
      { status: 400 },
    )
  }

  // ── 3. Validate ──────────────────────────────────────────────────────────────
  const validation = validateProjectInput(body)
  if (!validation.ok) {
    return NextResponse.json(
      {
        success: false,
        error:   'INVALID_INPUT',
        field:   validation.field,
        message: validation.message,
      },
      { status: 400 },
    )
  }

  // ── 4. Business logic + DB write ─────────────────────────────────────────────
  const result = await createProject(validation.data)
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error, message: result.message },
      { status: result.status },
    )
  }

  // ── 5. Created ───────────────────────────────────────────────────────────────
  // Regenerate the ISR-cached home page so the new project shows up
  // immediately instead of waiting for the next revalidate window.
  revalidatePath('/')

  return NextResponse.json(
    { success: true, data: result.project },
    { status: 201 },
  )
}
