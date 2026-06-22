import type { ContactMessage } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ContactFormField   = 'name' | 'org' | 'email' | 'message';
// requestId and ipHash are set by the server (header + hashed IP), never by the
// user — so they are excluded from the validated user-input shape.
export type ValidatedContactInput = Omit<ContactMessage, 'id' | 'createdAt' | 'emailSent' | 'requestId' | 'ipHash'>;
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

// ── Bot detection (server-side, two independent signals) ────────────────────────

/** Submissions faster than this are almost certainly scripted, not typed. */
export const MIN_SUBMIT_MS = 2000;

export type BotSignal =
  | { bot: false }
  | { bot: true; reason: 'honeypot' | 'too_fast' };

/**
 * Detect a likely bot from two independent signals. The route reacts by faking a
 * success response and dropping the submission (no DB write, no email).
 *
 *  1. Honeypot — the `company` field is hidden from humans via off-screen CSS and
 *     carries a non-autofill name in the DOM, so no real visitor fills it. It is
 *     NEVER stored; it exists purely as bait.
 *  2. Time-trap — `elapsedMs` is the time between form mount and submit. A human
 *     can't type a valid name/email/org + 10-char message in under MIN_SUBMIT_MS.
 *     A missing/absent value is NOT penalised (we only act on a clearly-too-fast
 *     submit) to avoid false positives.
 */
export function detectBot(body: unknown): BotSignal {
  const b = (body ?? {}) as Record<string, unknown>;

  const company = b.company;
  if (typeof company === 'string' && company.trim().length > 0) {
    return { bot: true, reason: 'honeypot' };
  }

  const elapsed = typeof b.elapsedMs === 'number' ? b.elapsedMs : Number(b.elapsedMs);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_SUBMIT_MS) {
    return { bot: true, reason: 'too_fast' };
  }

  return { bot: false };
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
