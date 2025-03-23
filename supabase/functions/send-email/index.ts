function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

Deno.serve(async (req) => {
  try {
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      return new Response(JSON.stringify({ error: "API key not found" }), { status: 500 });
    }

    let requestData;
    try {
      requestData = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON format" }), { status: 400 });
    }

    const { to, subject, message } = requestData;

    if (!to || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    if (!isValidEmail(to)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), { status: 400 });
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: "Your App", email: Deno.env.get("SENDER_EMAIL") || "your-email@example.com" },
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
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
