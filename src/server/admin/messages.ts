/**
 * @file src/server/admin/messages.ts
 * Admin read access to contact submissions.
 */

import { prisma } from '@/lib/prisma';

export function listMessages() {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export function deleteMessage(id: string) {
  return prisma.contactMessage.delete({ where: { id } });
}
