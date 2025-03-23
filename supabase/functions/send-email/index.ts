import { copy } from "https://deno.land/std@0.224.0/fs/copy.ts";// Correct Deno CDN path

serve(async (req) => {
  try {
    const { to, subject, message } = await req.json();
    
    if (!to || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      return new Response(JSON.stringify({ error: "API key not found" }), { status: 500 });
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: "Your App", email: "your-email@example.com" },
        to: [{ email: to }],
        subject,
        htmlContent: `<p>${message}</p>`,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: result }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: "Email sent successfully!" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
