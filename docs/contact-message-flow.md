# Contact Message Flow

## Overview

When a visitor submits the contact form, the request travels through a honeypot bot-trap,
field validation, IP-based rate-limiting, idempotent persistence, and async email
notification. The DB record is always the source of truth — email delivery is best-effort
with a recoverable failure flag.

> **Note:** an earlier version of this doc described an in-memory `Map` (60s TTL) for
> idempotency. That was never implemented. Idempotency is now backed by a **unique
> `requestId` column in the database**, described below.

---

## Files Involved

| Layer | File |
|---|---|
| UI Component | `src/features/contact/components/ContactMessageForm.tsx` |
| Form Logic | `src/features/contact/hooks/useContactForm.ts` |
| Validation + honeypot (shared) | `src/features/contact/validation.ts` |
| API Route | `src/app/api/v1/contact/route.ts` |
| DB Service + rate-limit | `src/features/contact/services/createContactMessage.ts` |
| Email Service | `src/features/contact/services/sendContactEmail.ts` |
| Schema | `prisma/schema.prisma` → `ContactMessage` |

---

## Full Request Flow

```
CLIENT
──────
User fills form
  → onBlur / onChange: validateField() per field   (live feedback)
  → handleSubmit:      validateAll()               (full check before submit)
       ↓ any error → show inline, abort
  → fetch POST /api/v1/contact
      headers: X-Request-ID (UUID, stable per form mount)
      body: { name, org, email, type, message, company, elapsedMs }
                                              │         └── time-trap (ms since mount)
                                              └── honeypot (empty for humans)

SERVER
──────
POST /api/v1/contact
  → parse body
       ↓ invalid JSON → return 400, done
  → hashIp(req)  → ipHash (HMAC-SHA256 of trusted IP; null if no IP)   (logged on every drop)
  → bot check: detectBot(body)
       • honeypot: company non-empty?
       • time-trap: elapsedMs < MIN_SUBMIT_MS (2000)?
       ↓ tripped → log(reason) + return FAKE 201 success, drop silently (no DB, no email)
  → validateContactInput()
       ↓ invalid → log + return 400, done
  → isRateLimited(ipHash)   (≥ 5 messages from this ipHash in last 10 min?)
       ↓ limited → log + return 429, done
  → createContactMessage(data, requestId, ipHash)
       → write to DB (emailSent: false), storing requestId + ipHash
       ↓ duplicate requestId (P2002) → 200 idempotent replay (no insert, no email)
       ↓ other db error → return 500, done
  → return 201 (fresh) / 200 (replay)  ← client gets response here

BACKGROUND (after a FRESH insert only — replays are skipped)
────────────────────────────────────────────────────────────
  → sendContactEmail()       → Resend API
       ↓ ok   → markEmailSent()  → DB update (emailSent: true)
       ↓ fail → log(email_failed), emailSent stays false (recoverable)
```

---

## Bot detection (two independent signals)

`detectBot(body)` returns `{ bot, reason }` from two signals; either one trips the trap. When
tripped, the server logs the reason and responds with a **normal-looking 201 success** so the
bot can't tell it was caught, then discards the submission: no DB write, no email.

**1. Honeypot (`company`)** — a field rendered in the DOM but hidden from humans via off-screen
CSS (`position:absolute; left:-9999px`, `aria-hidden`, `tabIndex={-1}`, `autoComplete="off"`).
Crucially the DOM input is named with a **neutral token** (`contact_reference`, *not*
`company`/`organization`) so browser autofill / password managers won't fill it for real users.
The React state key is still `company`; only the rendered `name`/`id` are neutral. It is **never
stored** (no `company` column) and is excluded from `ValidatedContactInput`.

**2. Time-trap (`elapsedMs`)** — the client sends ms elapsed between form mount and submit. A
human can't fill name/email/org + a 10-char message in under `MIN_SUBMIT_MS` (2000 ms), so a
clearly-too-fast submit is flagged. A missing/absent value is **not** penalised (fail-safe).

> Both signals can be defeated by a determined bot (it can leave the honeypot empty and wait),
> and `elapsedMs` is client-supplied so it's spoofable — this is defense-in-depth, not a wall.
> The neutral field name is what removes the autofill false-positive risk of the old design.

---

## Validation

Client and server share the same `validateField` function exported from
`src/features/contact/validation.ts`. There is no gap between what the client accepts and what
the server accepts.

| Field | Rules |
|---|---|
| `name` | Required, min 2 chars |
| `org` | Required, min 2 chars |
| `email` | Required, valid email format |
| `message` | Required, min 10 chars |
| `type` | Required, non-empty string (server only — client controls via select) |
| `company` | **Not validated** — honeypot; must be empty for humans (DOM name: `contact_reference`) |
| `elapsedMs` | **Not validated** — time-trap; checked by `detectBot`, not stored |

---

## Idempotency (DB-backed)

The form generates a `requestId` (`crypto.randomUUID()`) on mount via `useRef`, sent as the
`X-Request-ID` header on every submit.

The server persists `requestId` into the **unique** `ContactMessage.requestId` column. If the
same ID arrives again, the insert hits the unique constraint (`P2002`), which
`createContactMessage` treats as a successful **idempotent replay** — it does **not** insert a
duplicate, and the route does **not** resend the email (only a fresh insert returns a
`contactMessage`).

The ID is regenerated in `handleReset()` so a fresh submission after success gets a new ID.

---

## Rate Limiting (by hashed IP)

`hashIp(req)` resolves the caller's IP from the **trusted** `x-real-ip` header (set by the
platform proxy), falling back to the **rightmost** `x-forwarded-for` entry — never the leftmost,
which is attacker-controlled. It then derives `ipHash = HMAC-SHA256(IP_HASH_SALT, ip)`, so raw
IPs are never stored. `isRateLimited(ipHash)` counts `ContactMessage` rows with the same `ipHash`
created within the window, using the `@@index([createdAt, ipHash])`:

| Knob | Location | Default |
|---|---|---|
| Window | `RATE_LIMIT_WINDOW_MS` in `createContactMessage.ts` | 10 minutes |
| Max per window | `RATE_LIMIT_MAX` in `createContactMessage.ts` | 5 |

Over the limit → `429`. It **fails open** (allows the message) when no IP can be determined.

> ⚠️ **Caveat:** the limiter is a soft deterrent, not a hard wall —
> (a) `count`-then-`insert` is not atomic, so a burst can slip over the limit;
> (b) only successful inserts are counted, so honeypot/invalid spam is not throttled.
> For an atomic, attempt-counting limiter use Upstash Redis (see `PROJECT_REVIEW.md` §8.5).
> The previous XFF-spoofing weakness is fixed (trusted-header resolution above).

---

## Email Failure Recovery

If Resend fails, the `ContactMessage` record remains in the DB with `emailSent: false`.
To find failed deliveries:

```ts
// Prisma Studio or raw query
prisma.contactMessage.findMany({ where: { emailSent: false } })
```

Resend the email manually and call `markEmailSent(id)` to update the flag.

---

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `RESEND_API_KEY` | Resend API authentication | yes |
| `RESEND_FROM_EMAIL` | Sender address (must be verified in Resend) | yes |
| `CONTACT_EMAIL` | Your inbox — where notifications are delivered | yes |
| `IP_HASH_SALT` | HMAC key for hashing IPs before storage (>= 16 chars) | **required in production** |

> `IP_HASH_SALT` is the HMAC key for `ipHash`. The route **fails fast** (throws) if it's missing
> or shorter than 16 chars in production; in development it warns and uses an insecure
> placeholder. Treat it as a stable secret — rotating it resets every hash and breaks the
> rate-limit window. Even salted this is *pseudonymization* (same IP → same hash), not
> anonymization.

---

## DB Model

```prisma
model ContactMessage {
  id        String   @id @default(uuid())
  requestId String?  @unique          // idempotency key (X-Request-ID); null-safe
  ipHash    String?                   // salted sha256 of sender IP — for rate limiting
  name      String
  org       String
  type      String
  email     String
  message   String
  emailSent Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([createdAt, ipHash])        // backs the rate-limit count query
}
```
