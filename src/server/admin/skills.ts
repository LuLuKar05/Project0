/**
 * @file src/server/admin/skills.ts
 * Admin CRUD for skill categories and their skills.
 */

import { prisma } from '@/lib/prisma';

export function listSkillData() {
  return prisma.skillCategory.findMany({
    include: { skills: { orderBy: { createdAt: 'asc' } } },
    orderBy: { displayOrder: 'asc' },
  });
}

export function createCategory(name: string, displayOrder: number) {
  return prisma.skillCategory.create({ data: { name, displayOrder } });
}

export function deleteCategory(id: string) {
  return prisma.skillCategory.delete({ where: { id } }); // cascades to skills
}

export function createSkill(categoryId: string, name: string) {
  return prisma.skill.create({ data: { categoryId, name } });
}

export function deleteSkill(id: string) {
  return prisma.skill.delete({ where: { id } });
}
