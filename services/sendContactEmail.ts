import { Resend } from 'resend';
import {ValidatedContactInput} from '@/schemas/validateContactInput';
const resend = new Resend(process.env.RESEND_API_KEY);


export async function sendContactEmail(input: ValidatedContactInput): Promise<{ ok: boolean, error?: string }> {
    //checking the required env variables are there.
    const from = process.env.RESEND_FROM_EMAIL;
    const to = process.env.CONTACT_EMAIL;
    if (!from || !to) {
        console.error('RESEND_FROM_EMAIL and CONTACT_EMAIL environment variables must be set for sending contact emails.');
        return {ok: false, error: 'Email configurations are missing.'};
    }
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
                   <p><strong>Name:</strong> ${input.name}</p>
                   <p><strong>Email:</strong> ${input.email}</p>
                     <p><strong>Organization:</strong> ${input.org}</p>
                     <p><strong>Type:</strong> ${input.type}</p>
                     <p><strong>Message:</strong></p>
                        <p>${input.message.replace(/\n/g, '<br>')}</p>`
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