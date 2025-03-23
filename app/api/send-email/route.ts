export const runtime = "edge"; // Enables Vercel Edge Runtime (No Node.js, No Deno)

export async function POST(req: Request) {
  try {
    const { to, subject, message } = await req.json();

    if (!to || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Get API Key from Vercel Environment Variables
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      return new Response(JSON.stringify({ error: "API key not found" }), { status: 500 });
    }

    // Validate email format
    const isValidEmail = (email: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail(to)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), { status: 400 });
    }

    // Send email via Brevo API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: "Your App", email:  "foradsenceali@gmail.com" },
        to: [{ email: to }],
        subject,
        htmlContent: `<p>${message}</p>`,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: result }), { status: response.status });
    }

    return new Response(JSON.stringify({ success: "Email sent successfully!" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), { status: 500 });
  }
}
