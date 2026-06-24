/**
 * @file src/features/admin/loginRateLimit.ts
 * In-memory login throttle, keyed by client IP. Blocks brute-forcing the admin
 * password after too many failures in a window.
 *
 * NOTE: state lives in process memory — it resets on restart and is per-instance.
 * That's intentional for this single-instance deployment. For multi-instance
 * (e.g. default Vercel) you'd move this to Redis/Upstash.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10-minute window
const MAX_FAILS = 5;              // allowed failures per window

const attempts = new Map<string, { count: number; resetAt: number }>();

/** True if this key has hit the failure limit and is still within the window. */
export function loginRateLimited(key: string): boolean {
  const e = attempts.get(key);
  if (!e || Date.now() > e.resetAt) return false;
  return e.count >= MAX_FAILS;
}

/** Record a failed login attempt. */
export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const e = attempts.get(key);
  if (!e || now > e.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    e.count += 1;
  }
}

/** Clear the counter on a successful login. */
export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}
