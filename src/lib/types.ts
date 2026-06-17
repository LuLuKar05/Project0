/**
 * @file src/lib/types.ts
 * @description Single source of truth for the app's TypeScript types.
 * Re-exports the generated Prisma model types under friendly names.
 *
 * ─── IMPORT STRATEGY ─────────────────────────────────────────────────────────
 *
 * We import directly from the generated model files (e.g. ProjectGetPayload)
 * rather than going through the Prisma namespace.  The generated output for
 * this project exports all payload/include types as named exports, so the
 * direct import is cleaner and avoids the Prisma namespace indirection.
 *
 * ─── PROJECT TYPE ─────────────────────────────────────────────────────────────
 *
 * `Project` is defined using ProjectGetPayload with orbit, visual and tags
 * included. This means:
 *   • Every query that returns projects MUST use:
 *       prisma.project.findMany({ include: { orbit: true, visual: true, tags: true } })
 *   • Components can rely on project.orbit / project.visual / project.tags
 *     being present (orbit and visual stay nullable — guard before 3-D use).
 */

import type { ProjectGetPayload } from './generated/prisma/models/Project';
import type { OrbitConfigModel }  from './generated/prisma/models/OrbitConfig';
import type { PlanetVisualModel } from './generated/prisma/models/PlanetVisual';
import type { ContactMessageModel } from './generated/prisma/models/ContactMessage';
import type { TagModel  } from './generated/prisma/models/Tag';
import type { SkillCategoryModel } from './generated/prisma/models/SkillCategory';
import type { SkillModel } from './generated/prisma/models/Skill';

//  Database model types

/**
 * A single portfolio project entry, always fetched with its orbit, visual
 * and tags relations included.
 *
 * Use this type everywhere a project object is passed around.
 * The query must match: prisma.project.findMany({ include: { orbit: true, visual: true, tags: true } })
 *
 * orbit and visual are typed as nullable (| null) because the schema keeps
 * them optional on the Project side — Prisma's database constraint rule.
 * Guard with a null-check before using them in 3-D rendering code.
 */
export type Project = ProjectGetPayload<{
  include: {
    orbit:  true;
    visual: true;
    tags:   true;
  };
}>;

/**
 * Orbital ring parameters for one planet.
 * All angles are in radians; speeds in radians per second.
 */
export type OrbitConfig = OrbitConfigModel;
export type PlanetVisual = PlanetVisualModel;
export type ContactMessage = ContactMessageModel;

export type Tag = TagModel;
export type SkillCategory = SkillCategoryModel;
export type Skill = SkillModel;

// The former hand-rolled Three.js runtime types (PlanetObject, CamAnim,
// AppState, GalaxyCallbacks, etc.) were removed when the galaxy moved to
// react-three-fiber — R3F components own their runtime state directly.
