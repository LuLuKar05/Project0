import { validateContactInput } from '@/features/contact/validation';
import { createContactMessage, markEmailSent } from '@/features/contact/services/createContactMessage';
import { NextRequest, NextResponse, after } from 'next/server';
import { sendContactEmail } from '@/features/contact/services/sendContactEmail';


export async function POST(req: NextRequest) {
  try {
    //this the idempotency key sent by the client in the request header. It is used to prevent duplicate messages from being created if the client retries the request.
    const requestID = req.headers.get('X-Request-ID');

    //Parse Body
    let body: { name?: string; org?: string; email?: string; type?: string; message?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON', message: 'Request body must be valid JSON.' }, 
        { status: 400 }
      );
    }

    //Vlidation
    const validation = validateContactInput(body);
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error, field: validation.field, message: validation.message },
        { status: validation.error === 'INVALID_INPUT' ? 400 : 500 }
      );
    }
    // ── Save to DB ───────────────────────────────────────────────────────────
    // ContactMessage model: firstName, lastName, email, message
    // We map: name → firstName, org → lastName, type+brief → message
    const result = await createContactMessage(validation.data, requestID);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: result.status }
      );
    }
    // Send the email after the response is flushed. `after()` keeps the
    // serverless function alive until the work finishes — a bare
    // fire-and-forget promise could be frozen mid-send once the response
    // returns, silently dropping the email.
    after(async () => {
      const emailRes = await sendContactEmail(validation.data);
      if (emailRes.ok) {
        await markEmailSent(result.contactMessage!.id); // contactMessage is set since result.ok is true.
      } else {
        console.error('Failed to send contact email:', emailRes.error);
      }
    });

    return NextResponse.json({ success: true, data: result.contactMessage, message: 'Contact message received.' }, { status: 201 });
  } catch(error) {
    console.error('[POST /api/v1/contact]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save message.', message: 'An unexpected error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
