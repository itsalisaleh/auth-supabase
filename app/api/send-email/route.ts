import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { to, subject, message } = await req.json();

  try {
    // Use Brevo API to send the email
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        sender: { email: 'foradsenceali@gmail.com' }, // Replace with your email
        to: [{ email: to }],
        subject: subject,
        htmlContent: `<html><body><p>${message}</p></body></html>`,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 400 });
    }
  } catch (error: unknown) {
    // Handle error properly
    if (error instanceof Error) {
      // Now 'error' is of type 'Error', and we can access its properties safely
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      // Fallback in case the error is not an instance of Error
      return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
  }
}
