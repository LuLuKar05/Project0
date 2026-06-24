'use server';

/**
 * @file src/features/admin/actions.ts
 * All admin mutations. Every action (except login) verifies the admin session
 * first, then calls the services layer, revalidates affected pages, and redirects.
 */

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { checkPassword, startAdminSession, endAdminSession, isAdmin } from '@/features/admin/auth';
import { loginRateLimited, recordLoginFailure, clearLoginAttempts } from '@/features/admin/loginRateLimit';
import {
  createProjectAdmin, updateProjectAdmin, deleteProjectAdmin, type ProjectInput,
} from '@/server/admin/projects';
import {
  createCategory, deleteCategory, createSkill, deleteSkill,
} from '@/server/admin/skills';
import { createTag, deleteTag } from '@/server/admin/tags';
import { deleteMessage } from '@/server/admin/messages';

async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? '').trim();
}

function parseProject(fd: FormData): ProjectInput {
  return {
    title:       str(fd, 'title'),
    category:    str(fd, 'category'),
    date:        str(fd, 'date'),
    shortDesc:   str(fd, 'shortDesc'),
    fullDesc:    str(fd, 'fullDesc'),
    githubURL:   str(fd, 'githubURL') || null,
    deployedURL: str(fd, 'deployedURL') || null,
    order:       Number(fd.get('order') ?? 0),
    active:      fd.get('active') === 'on',
    textureUrl:  str(fd, 'textureUrl') || 'procedural',
    tagIds:      fd.getAll('tagIds').map(Number).filter((n) => Number.isInteger(n)),
  };
}

// ── Auth ────────────────────────────────────────────────────────────────────
async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function loginAction(fd: FormData) {
  const key = await clientKey();
  if (loginRateLimited(key)) redirect('/admin/login?error=rate');

  if (!checkPassword(String(fd.get('password') ?? ''))) {
    recordLoginFailure(key);
    redirect('/admin/login?error=1');
  }
  clearLoginAttempts(key);
  await startAdminSession();
  redirect('/admin');
}

export async function logoutAction() {
  await endAdminSession();
  redirect('/admin/login');
}

// ── Projects ──────────────────────────────────────────────────────────────────
function noticeQuery(notes: string[]): string {
  return notes.length ? `?notice=${encodeURIComponent('Saved — ' + notes.join('; ') + '.')}` : '';
}

export async function createProjectAction(fd: FormData) {
  await requireAdmin();
  const { notes } = await createProjectAdmin(parseProject(fd));
  revalidatePath('/'); revalidatePath('/admin/projects');
  redirect('/admin/projects' + noticeQuery(notes));
}

export async function updateProjectAction(fd: FormData) {
  await requireAdmin();
  const { notes } = await updateProjectAdmin(str(fd, 'id'), parseProject(fd));
  revalidatePath('/'); revalidatePath('/admin/projects');
  redirect('/admin/projects' + noticeQuery(notes));
}

export async function deleteProjectAction(fd: FormData) {
  await requireAdmin();
  await deleteProjectAdmin(str(fd, 'id'));
  revalidatePath('/'); revalidatePath('/admin/projects');
  redirect('/admin/projects');
}

// ── Skills ──────────────────────────────────────────────────────────────────
export async function createCategoryAction(fd: FormData) {
  await requireAdmin();
  await createCategory(str(fd, 'name'), Number(fd.get('displayOrder') ?? 0));
  revalidatePath('/'); revalidatePath('/admin/skills');
  redirect('/admin/skills');
}

export async function deleteCategoryAction(fd: FormData) {
  await requireAdmin();
  await deleteCategory(str(fd, 'id'));
  revalidatePath('/'); revalidatePath('/admin/skills');
  redirect('/admin/skills');
}

export async function createSkillAction(fd: FormData) {
  await requireAdmin();
  await createSkill(str(fd, 'categoryId'), str(fd, 'name'));
  revalidatePath('/'); revalidatePath('/admin/skills');
  redirect('/admin/skills');
}

export async function deleteSkillAction(fd: FormData) {
  await requireAdmin();
  await deleteSkill(str(fd, 'id'));
  revalidatePath('/'); revalidatePath('/admin/skills');
  redirect('/admin/skills');
}

// ── Tags ──────────────────────────────────────────────────────────────────────
export async function createTagAction(fd: FormData) {
  await requireAdmin();
  await createTag(str(fd, 'name'), str(fd, 'category'), str(fd, 'color') || '#4FC3F7');
  revalidatePath('/admin/tags');
  redirect('/admin/tags');
}

export async function deleteTagAction(fd: FormData) {
  await requireAdmin();
  await deleteTag(Number(fd.get('id')));
  revalidatePath('/admin/tags');
  redirect('/admin/tags');
}

// ── Messages ──────────────────────────────────────────────────────────────────
export async function deleteMessageAction(fd: FormData) {
  await requireAdmin();
  await deleteMessage(str(fd, 'id'));
  revalidatePath('/admin/messages');
  redirect('/admin/messages');
}
