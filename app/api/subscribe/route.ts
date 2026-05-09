export async function POST(req: Request) {
  const { firstName, lastName, email, city } = await req.json();

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !city?.trim()) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }

  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Form not configured." }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Kit-Api-Version": "2025-01-01",
      },
      body: JSON.stringify({
        email_address: email.trim(),
        first_name: firstName.trim(),
        state: "active",
        fields: {
          last_name: lastName.trim(),
          city: city.trim(),
        },
      }),
    });

    if (!res.ok) {
      return Response.json({ error: "Could not save. Try again." }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Could not save. Try again." }, { status: 500 });
  }
}
