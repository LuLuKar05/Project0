import {prisma} from '@/lib/prisma';
import type { ContactMessage } from '@/lib/types';
import type { ValidatedContactInput } from '@/schemas/validateContactInput';

type ServiceResult = {
    ok: boolean;
    status: number;
    contactMessage?: ContactMessage;
    error?: string;
    message?: string;
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

export async function createContactMessage(input: ValidatedContactInput): Promise<ServiceResult> {
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
