/**
 * @file src/server/admin/projects.ts
 * Admin CRUD for projects. Reuses the orbit/visual derivation so a planet always
 * matches its orbit slot (`order`); `textureUrl` (the planet skin) is editable.
 */

import { prisma } from '@/lib/prisma';
import { generateOrbit } from '@/server/generateOrbit';
import { generatePlanetVisual } from '@/server/generatePlanetVisual';
import type { Project } from '@/lib/types';

export interface ProjectInput {
  title: string;
  category: string;
  date: string;          // ISO (yyyy-mm-dd)
  shortDesc: string;
  fullDesc: string;
  githubURL: string | null;
  deployedURL: string | null;
  order: number;
  active: boolean;
  textureUrl: string;    // 'procedural' | a planetTextures key
  tagIds: number[];
}

function slugify(title: string): string {
  return title
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/** What an auto-resolve adjusted, so the UI can tell the admin. */
export interface ProjectSaveResult {
  id: string;
  notes: string[];
}

/** Find a free slug, suffixing -2, -3… on collision (ignoring the project itself). */
async function uniqueSlug(base: string, excludeId?: string): Promise<{ slug: string; changed: boolean }> {
  const root = base || 'project';
  for (let n = 1; n < 1000; n++) {
    const slug = n === 1 ? root : `${root}-${n}`;
    const existing = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return { slug, changed: n > 1 };
  }
  return { slug: `${root}-${Date.now()}`, changed: true }; // pathological fallback
}

/** Keep the requested orbit slot if free; otherwise move to max+1 (ignoring self). */
async function resolveOrder(order: number, excludeId?: string): Promise<{ order: number; changed: boolean }> {
  const taken = await prisma.project.findFirst({
    where: { order, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (!taken) return { order, changed: false };
  const last = await prisma.project.findFirst({ orderBy: { order: 'desc' }, select: { order: true } });
  return { order: last ? last.order + 1 : 1, changed: true };
}

/** All projects (incl. inactive) for the admin list. */
export function listProjectsAdmin(): Promise<Project[]> {
  return prisma.project.findMany({
    include: { orbit: true, visual: true, tags: true },
    orderBy: { order: 'asc' },
  });
}

export function getProjectAdmin(id: string): Promise<Project | null> {
  return prisma.project.findUnique({
    where: { id },
    include: { orbit: true, visual: true, tags: true },
  });
}

export async function createProjectAdmin(input: ProjectInput): Promise<ProjectSaveResult> {
  const { slug, changed: slugChanged }   = await uniqueSlug(slugify(input.title));
  const { order, changed: orderChanged } = await resolveOrder(input.order);
  const orbit  = generateOrbit(order);
  const visual = { ...generatePlanetVisual(order), textureUrl: input.textureUrl };

  const project = await prisma.project.create({
    data: {
      slug,
      title: input.title,
      category: input.category,
      date: new Date(input.date),
      shortDesc: input.shortDesc,
      fullDesc: input.fullDesc,
      githubURL: input.githubURL,
      deployedURL: input.deployedURL,
      order,
      active: input.active,
      tags:   { connect: input.tagIds.map((id) => ({ id })) },
      orbit:  { create: orbit },
      visual: { create: visual },
    },
  });

  const notes: string[] = [];
  if (slugChanged)  notes.push(`slug set to "${slug}" (a project with that name already existed)`);
  if (orderChanged) notes.push(`orbit slot was taken — moved to ${order}`);
  return { id: project.id, notes };
}

export async function updateProjectAdmin(id: string, input: ProjectInput): Promise<ProjectSaveResult> {
  // Slug stays stable across edits (keeps links intact); only the orbit slot
  // is auto-resolved if it now collides with another project.
  const { order, changed: orderChanged } = await resolveOrder(input.order, id);
  const orbit  = generateOrbit(order);
  const visual = { ...generatePlanetVisual(order), textureUrl: input.textureUrl };

  await prisma.project.update({
    where: { id },
    data: {
      title: input.title,
      category: input.category,
      date: new Date(input.date),
      shortDesc: input.shortDesc,
      fullDesc: input.fullDesc,
      githubURL: input.githubURL,
      deployedURL: input.deployedURL,
      order,
      active: input.active,
      tags:   { set: input.tagIds.map((id) => ({ id })) },
      orbit:  { update: orbit },
      visual: { update: visual },
    },
  });

  const notes: string[] = [];
  if (orderChanged) notes.push(`orbit slot was taken — moved to ${order}`);
  return { id, notes };
}

export function deleteProjectAdmin(id: string) {
  // Cascade removes orbit/visual; the implicit m2m tag links are cleared too.
  return prisma.project.delete({ where: { id } });
}
