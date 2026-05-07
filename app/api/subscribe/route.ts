export async function POST(req: Request) {
  const { firstName, lastName, email, city } = await req.json();

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !city?.trim()) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return Response.json({ error: "Form not configured." }, { status: 500 });
  }

  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(), city }),
      redirect: "follow",
    });

    if (!res.ok) {
      return Response.json({ error: "Could not save. Try again." }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Could not save. Try again." }, { status: 500 });
  }
}
