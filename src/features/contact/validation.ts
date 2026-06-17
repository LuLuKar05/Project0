import type { ContactMessage } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ContactFormField   = 'name' | 'org' | 'email' | 'message';
export type ValidatedContactInput = Omit<ContactMessage, 'id' | 'createdAt' | 'emailSent'>;
export type ValidationResult =
  | { ok: true;  data: ValidatedContactInput }
  | { ok: false; field: string; error: string; message: string };

// ── Field-level validation (shared by client hook + server route) ──────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateField(field: ContactFormField, value: string): string {
  const trimmed = value.trim();
  switch (field) {
    case 'name':
      if (!trimmed)           return 'Designation required.';
      if (trimmed.length < 2) return 'Must be at least 2 characters.';
      return '';
    case 'org':
      if (!trimmed)           return 'Organization required.';
      if (trimmed.length < 2) return 'Must be at least 2 characters.';
      return '';
    case 'email':
      if (!trimmed)              return 'Comm channel required.';
      if (!EMAIL_RE.test(value)) return 'Must be a valid email address.';
      return '';
    case 'message':
      if (!trimmed)            return 'A mission brief is required.';
      if (trimmed.length < 10) return 'Must be at least 10 characters.';
      return '';
  }
}

// ── Full body validation (server-side) ────────────────────────────────────────

export function validateContactInput(body: unknown): ValidationResult {
  const { name, org, email, type, message } = body as Record<string, unknown>;

  const textFields: Record<ContactFormField, unknown> = { name, org, email, message };
  for (const field of ['name', 'org', 'email', 'message'] as const) {
    const value = textFields[field];
    if (typeof value !== 'string') {
      return { ok: false, field, error: 'INVALID_INPUT', message: `${field} is required.` };
    }
    const err = validateField(field, value);
    if (err) return { ok: false, field, error: 'INVALID_INPUT', message: err };
  }

  if (typeof type !== 'string' || !type.trim()) {
    return { ok: false, field: 'type', error: 'INVALID_INPUT', message: 'Contact type is required.' };
  }

  return {
    ok: true,
    data: {
      name:    name    as string,
      org:     org     as string,
      email:   email   as string,
      type,
      message: message as string,
    },
  };
}
