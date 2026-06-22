import { validateContactInput, detectBot } from '@/features/contact/validation';
import { createContactMessage, markEmailSent, isRateLimited } from '@/features/contact/services/createContactMessage';
import { NextRequest, NextResponse, after } from 'next/server';
import { sendContactEmail } from '@/features/contact/services/sendContactEmail';
import { createHmac } from 'crypto';

/** Structured, non-PII log for every branch where we reject/drop a submission. */
function logDrop(reason: string, ctx: Record<string, unknown>) {
  console.warn('[contact] dropped', { reason, ...ctx });
}

/**
 * Salt for hashing IPs. Required (>= 16 chars) in production — we fail fast
 * rather than silently fall back to a weak, brute-forceable hash. In dev we
 * allow a placeholder so local work doesn't need the secret.
 */
function ipHashSalt(): string {
  const salt = process.env.IP_HASH_SALT;
  if (salt && salt.length >= 16) return salt;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('IP_HASH_SALT must be set (>= 16 chars) in production');
  }
  console.warn('[contact] IP_HASH_SALT not set — using an insecure dev placeholder');
  return 'dev-insecure-placeholder-salt';
}

/**
 * Resolve the caller's real IP, then return an HMAC-SHA256 hash of it so raw IPs
 * are never stored.
 *
 * Trust only the value our infrastructure sets: `x-real-ip` (set by the Vercel /
 * edge proxy from the actual connection, not forgeable). Fall back to the
 * RIGHTMOST `x-forwarded-for` entry — the hop closest to us — never the leftmost,
 * which is attacker-controlled. Returns null when no IP is available.
 */
function hashIp(req: NextRequest): string | null {
  const real = req.headers.get('x-real-ip')?.trim();
  let ip = real || '';
  if (!ip) {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) {
      const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
      ip = parts.at(-1) ?? '';
    }
  }
  if (!ip) return null;
  return createHmac('sha256', ipHashSalt()).update(ip).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    // Idempotency key sent by the client so retries don't create duplicates.
    const requestId = req.headers.get('X-Request-ID');

    // ── Parse body ───────────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_JSON', message: 'Request body must be valid JSON.' },
        { status: 400 },
      );
    }

    // Hash the IP up front so every branch below can log it (non-PII).
    const ipHash = hashIp(req);

    // ── Bot detection (honeypot + time-trap) ────────────────────────────────────
    // If tripped, respond with a normal-looking success so the bot can't tell it
    // was caught — but write nothing and send no email.
    const bot = detectBot(body);
    if (bot.bot) {
      logDrop(bot.reason, { ipHash, requestId });
      return NextResponse.json(
        { success: true, message: 'Contact message received.' },
        { status: 201 },
      );
    }

    // ── Validation ───────────────────────────────────────────────────────────
    const validation = validateContactInput(body);
    if (!validation.ok) {
      logDrop('invalid', { field: validation.field, ipHash });
      return NextResponse.json(
        { success: false, error: validation.error, field: validation.field, message: validation.message },
        { status: 400 },
      );
    }

    // ── Rate limit (by hashed IP) ──────────────────────────────────────────────
    if (await isRateLimited(ipHash)) {
      logDrop('rate_limited', { ipHash });
      return NextResponse.json(
        { success: false, error: 'RATE_LIMITED', message: 'Too many messages. Please try again later.' },
        { status: 429 },
      );
    }

    // ── Save to DB (idempotent on requestId) ───────────────────────────────────
    const result = await createContactMessage(validation.data, requestId, ipHash);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: result.status },
      );
    }

    // Send the email after the response is flushed. `after()` keeps the
    // serverless function alive until the work finishes — a bare
    // fire-and-forget promise could be frozen mid-send once the response
    // returns, silently dropping the email.
    //
    // Only a *fresh* insert returns a contactMessage; an idempotent replay
    // (duplicate requestId) returns none, so we skip re-sending the email.
    if (result.contactMessage) {
      const message = result.contactMessage;
      after(async () => {
        const emailRes = await sendContactEmail(validation.data);
        if (emailRes.ok) {
          await markEmailSent(message.id);
        } else {
          console.warn('[contact] dropped', { reason: 'email_failed', id: message.id, error: emailRes.error });
        }
      });
    }

    return NextResponse.json(
      { success: true, data: result.contactMessage ?? null, message: 'Contact message received.' },
      { status: result.status },
    );
  } catch (error) {
    console.error('[POST /api/v1/contact]', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred while processing your request.' },
      { status: 500 },
    );
  }
}
