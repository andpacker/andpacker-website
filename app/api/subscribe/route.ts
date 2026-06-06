const KIT_TAG_ID = "19482127";

export async function POST(req: Request) {
  const { firstName, lastName, email, city, source } = await req.json();

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !city?.trim()) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }

  const apiSecret = process.env.KIT_API_SECRET;
  if (!apiSecret) {
    return Response.json({ error: "Form not configured." }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.convertkit.com/v3/tags/${KIT_TAG_ID}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_secret: apiSecret,
          email: email.trim(),
          first_name: firstName.trim(),
          fields: {
            last_name: lastName.trim(),
            city: city.trim(),
            source: typeof source === "string" && source.trim() ? source.trim() : "website",
          },
        }),
      }
    );

    if (!res.ok) {
      return Response.json({ error: "Could not save. Try again." }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Could not save. Try again." }, { status: 500 });
  }
}
