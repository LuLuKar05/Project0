/**
 * @file src/features/admin/auth.ts
 * Minimal admin session: a single password (ADMIN_SECRET) → an httpOnly, signed
 * cookie. The cookie value is `<expiry>.<HMAC(expiry, ADMIN_SECRET)>`, so it
 * can't be forged without the secret and expires on its own. Verified
 * server-side (Node crypto) in the admin layout and every admin action.
 */

import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE   = 'admin_session';
const MAX_AGE  = 60 * 60 * 8; // 8 hours

function secret(): string {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error('ADMIN_SECRET is not set');
  return s;
}

function sign(exp: number): string {
  return createHmac('sha256', secret()).update(`admin:${exp}`).digest('hex');
}

function verify(token: string | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split('.');
  const exp = Number(expStr);
  if (!exp || Number.isNaN(exp) || Date.now() > exp || !sig) return false;
  const expected = sign(exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when the current request carries a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verify(jar.get(COOKIE)?.value);
}

/** Validate a submitted password against ADMIN_SECRET (timing-safe). */
export function checkPassword(password: string): boolean {
  const s = process.env.ADMIN_SECRET;
  if (!s) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startAdminSession(): Promise<void> {
  const exp = Date.now() + MAX_AGE * 1000;
  const jar = await cookies();
  jar.set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
