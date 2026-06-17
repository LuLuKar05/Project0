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

export async function createContactMessage(input: ValidatedContactInput, requestID?: string | null): Promise<ServiceResult> {
    try {
        const contactMessage = await prisma.contactMessage.create({
            data: input
        });
        return {
            ok: true,
            status: 201,
            contactMessage
        };
    } catch (error) {
        //This requestId was already submitted,  treat as success. (idempotent replay)
        if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return {
                ok: true,
                status: 200,
                alreadyExists: true,
                error: 'Contact message already exists.',
                message: 'A contact message with the same details already exists.'
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
