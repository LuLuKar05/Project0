import { Prisma } from '@/lib/generated/prisma/client';
import {prisma} from '@/lib/prisma';
import type { ContactMessage } from '@/lib/types';
import type { ValidatedContactInput } from '@/features/contact/validation';

type ServiceResult = {
    ok: boolean;
    status: number;
    contactMessage?: ContactMessage;
    error?: string;
    message?: string;
    alreadyExists?: boolean;
}
// ── Rate limiting ────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10-minute window
const RATE_LIMIT_MAX       = 5;              // max messages per IP per window

/**
 * Rate-limit by hashed IP. Uses the @@index([createdAt, ipHash]) on
 * ContactMessage so the count is cheap. Fails open (returns false) when there
 * is no ipHash — we'd rather accept a message than block a real user we can't
 * identify.
 */
export async function isRateLimited(ipHash?: string | null): Promise<boolean> {
    if (!ipHash) return false;
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recent = await prisma.contactMessage.count({
        where: { ipHash, createdAt: { gte: since } },
    });
    return recent >= RATE_LIMIT_MAX;
}

export async function markEmailSent(id: string): Promise<void> {
    try{
        await prisma.contactMessage.update({
            where: { id },
            data: { emailSent: true }
        })
    } catch (error) {
        console.error('Failed to update emailSent status:', error);
    }
}

export async function createContactMessage(
    input: ValidatedContactInput,
    requestId?: string | null,
    ipHash?: string | null,
): Promise<ServiceResult> {
    try {
        const contactMessage = await prisma.contactMessage.create({
            data: {
                ...input,
                requestId: requestId ?? undefined,
                ipHash:    ipHash ?? undefined,
            },
        });
        return {
            ok: true,
            status: 201,
            contactMessage
        };
    } catch (error) {
        // Duplicate requestId (unique constraint) → the client retried the same
        // submission. Treat as success (idempotent replay); no insert, and the
        // route skips the email because no fresh contactMessage is returned.
        if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return {
                ok: true,
                status: 200,
                alreadyExists: true,
                message: 'Contact message already received.'
            };
        }
        const message = error instanceof Error ? error.message : String(error);
        console.error('[createContactMessage]', message);
        return {
            ok: false,
            status: 500,
            error: 'Failed to create contact message.',
            message,
        };
    }
}
