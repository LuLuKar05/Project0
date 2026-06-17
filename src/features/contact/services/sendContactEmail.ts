import { Resend } from 'resend';
import {ValidatedContactInput} from '@/features/contact/validation';

/**
 * Escape user-supplied text before interpolating into the HTML email body —
 * otherwise a sender could inject arbitrary markup/links into the email.
 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export async function sendContactEmail(input: ValidatedContactInput): Promise<{ ok: boolean, error?: string }> {
    const from = process.env.RESEND_FROM_EMAIL;
    const to = process.env.CONTACT_EMAIL;
    if (!from || !to || !process.env.RESEND_API_KEY) {
        console.error('RESEND_FROM_EMAIL, CONTACT_EMAIL and RESEND_API_KEY environment variables must be set for sending contact emails.');
        return {ok: false, error: 'Email configurations are missing.'};
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    try{
        const {error} = await resend.emails.send({
            from,
            to,
            subject: `New contact message from ${input.name} (${input.email})`,
            text: ` You have received a new contact message.
                    \n\nName: ${input.name}
                    \nEmail: ${input.email}
                    \nOrganization: ${input.org}
                    \nType: ${input.type}
                    \n\nMessage:${input.message}`,
            html: `<h1>New Contact Message</h1>
                   <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
                   <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
                     <p><strong>Organization:</strong> ${escapeHtml(input.org)}</p>
                     <p><strong>Type:</strong> ${escapeHtml(input.type)}</p>
                     <p><strong>Message:</strong></p>
                        <p>${escapeHtml(input.message).replace(/\n/g, '<br>')}</p>`
        })
        if(error){
            console.error('Failed to send contact email:', error);
            return { ok: false, error: error.message };
        }
        return { ok: true };
    }catch(error) {
        console.error('Error sending contact email:', error);
        return { ok: false, error: 'UNEXPECTED_NETWORK_ERROR_AT_SENDING_EMAIL' };
    }
}