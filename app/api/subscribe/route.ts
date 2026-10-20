import { getOrCreateTagId, tagSubscriber, WEBSITE_SIGNUP_TAG_ID } from "@/lib/kit";

export async function POST(req: Request) {
  const { firstName, lastName, email, city, source } = await req.json();

  // email + city are required; names are optional (trimmed /thepack form omits them).
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
    email: email.trim(),
    fields,
  };
  if (firstName?.trim()) {
    payload.first_name = firstName.trim();
  }

  try {
    if (!(await tagSubscriber(apiSecret, WEBSITE_SIGNUP_TAG_ID, payload))) {
      return Response.json({ error: "Could not save. Try again." }, { status: 500 });
    }

    // Real-time city tagging: segment the subscriber into their "City, ST" tag
    // the instant they sign up. Best-effort and non-blocking — the subscriber is
    // already saved above, and the daily daily_city_tagger Modal cron re-sweeps
    // and catches anyone this step missed.
    const cityTagId = await getOrCreateTagId(apiSecret, city.trim());
    if (cityTagId) {
      await tagSubscriber(apiSecret, cityTagId, { email: email.trim() });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Could not save. Try again." }, { status: 500 });
  }
}
