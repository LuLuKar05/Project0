/**
 * @file src/lib/dbRetry.ts
 * Retry a DB call through *transient* connectivity failures.
 *
 * Neon (and most serverless Postgres) auto-suspends the compute after idle. The
 * first query after a sleep can fail with P1001 / DatabaseNotReachable while the
 * compute cold-starts (~1s), then succeed. Retrying briefly turns that flake
 * into a successful load instead of an empty page.
 *
 * Only transient errors are retried; real errors (bad query, constraint, etc.)
 * are re-thrown immediately so callers still surface them.
 */

function isTransient(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code === 'P1001') return true; // Prisma: can't reach database server
  const msg = err instanceof Error ? err.message : String(err);
  return /DatabaseNotReachable|Can't reach database|ECONNREFUSED|ETIMEDOUT|Connection terminated|connection closed/i.test(msg);
}

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 600,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || i === attempts - 1) throw err;
      // Linear backoff: 600ms, 1200ms — enough to ride out a Neon cold start.
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (i + 1)));
    }
  }
  throw lastErr;
}
