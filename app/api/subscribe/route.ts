const KIT_TAG_ID = "19482127";

export async function POST(req: Request) {
  const { firstName, lastName, email, city, source } = await req.json();

  // email + city are required; names are optional (trimmed /pack form omits them).
  if (!email?.trim() || !city?.trim()) {
    return Response.json({ error: "Email and city are required." }, { status: 400 });
  }

  const apiSecret = process.env.KIT_API_SECRET;
  if (!apiSecret) {
    return Response.json({ error: "Form not configured." }, { status: 500 });
  }

  // last_name is an existing Kit custom field (alongside city, source); keep it there.
  const fields: Record<string, string> = {
    city: city.trim(),
    source: typeof source === "string" && source.trim() ? source.trim() : "website",
  };
  if (lastName?.trim()) {
    fields.last_name = lastName.trim();
  }

  const payload: Record<string, unknown> = {
    api_secret: apiSecret,
    email: email.trim(),
    fields,
  };
  if (firstName?.trim()) {
    payload.first_name = firstName.trim();
  }

  try {
    const res = await fetch(
      `https://api.convertkit.com/v3/tags/${KIT_TAG_ID}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
