# Contact Message Flow

## Overview

When a visitor submits the contact form, the request travels through validation, persistence, idempotency protection, and async email notification. The DB record is always the source of truth — email delivery is best-effort with a recoverable failure flag.

---

## Files Involved

| Layer | File |
|---|---|
| UI Component | `components/ui/ContactMessageForm.tsx` |
| Form Logic | `hooks/useContactForm.ts` |
| Validation (shared) | `schemas/validateContactInput.ts` |
| API Route | `app/api/v1/contact/route.ts` |
| DB Service | `services/createContactMessage.ts` |
| Email Service | `services/sendContactEmail.ts` |
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
      body: { name, org, email, type, message }

SERVER
──────
POST /api/v1/contact
  → idempotency check (in-memory Map, 60s TTL)
       ↓ seen → return cached response, done
  → parse body
  → validateContactInput()
       ↓ invalid → return 400, done
  → createContactMessage()   → write to DB (emailSent: false)
       ↓ db error → return 500, done
  → cache result in Map + setTimeout(delete, 60s)
  → return 201  ← client gets response here

BACKGROUND (after 201 is sent)
────────────────────────────────
  → sendContactEmail()       → Resend API
       ↓ ok   → markEmailSent()  → DB update (emailSent: true)
       ↓ fail → console.error, emailSent stays false (recoverable)
```

---

## Validation

Client and server share the same `validateField` function exported from `schemas/validateContactInput.ts`. There is no gap between what the client accepts and what the server accepts.

| Field | Rules |
|---|---|
| `name` | Required, min 2 chars |
| `org` | Required, min 2 chars |
| `email` | Required, valid email format |
| `message` | Required, min 10 chars |
| `type` | Required, non-empty string (server only — client controls via select) |

---

## Idempotency

The form generates a `requestId` (`crypto.randomUUID()`) on mount via `useRef`. It is sent as the `X-Request-ID` header on every submit.

The server holds an in-memory `Map<requestId, { status, body }>`. If the same ID arrives again within 60 seconds, the cached response is returned immediately — no DB write, no email.

The ID is regenerated in `handleReset()` so a fresh submission after success gets a new ID.

---

## Email Failure Recovery

If Resend fails, the `ContactMessage` record remains in the DB with `emailSent: false`. To find failed deliveries:

```ts
// Prisma Studio or raw query
prisma.contactMessage.findMany({ where: { emailSent: false } })
```

Resend the email manually and call `markEmailSent(id)` to update the flag.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API authentication |
| `RESEND_FROM_EMAIL` | Sender address (must be verified in Resend) |
| `CONTACT_EMAIL` | Your inbox — where notifications are delivered |

---

## DB Model

```prisma
model ContactMessage {
  id        String   @id @default(uuid())
  name      String
  org       String
  type      String
  email     String
  message   String
  emailSent Boolean  @default(false)
  createdAt DateTime @default(now())
}
```
