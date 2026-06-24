/**
 * @file src/server/admin/tags.ts
 * Admin CRUD for tags (used by projects).
 */

import { prisma } from '@/lib/prisma';

export function listTags() {
  return prisma.tag.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
}

export function createTag(name: string, category: string, color: string) {
  return prisma.tag.create({ data: { name, category, color } });
}

export function deleteTag(id: number) {
  return prisma.tag.delete({ where: { id } });
}
