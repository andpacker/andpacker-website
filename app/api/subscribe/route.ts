const KIT_TAG_ID = "19482127";
const V3_BASE = "https://api.convertkit.com/v3";

// Resolve the Kit tag id for a city name, creating the tag if it doesn't exist
// yet. Mirrors get_or_create_tag in tag_all_cities.py so real-time tags and the
// daily cron converge on the same "City, ST" tag names. Best-effort: returns
// null on any failure so a tagging hiccup never blocks the signup itself.
async function getOrCreateCityTagId(
  apiSecret: string,
  city: string
): Promise<number | null> {
  try {
    const listRes = await fetch(
      `${V3_BASE}/tags?api_secret=${encodeURIComponent(apiSecret)}`
    );
    if (listRes.ok) {
      const data = await listRes.json();
      const existing = (data.tags ?? []).find(
        (t: { id: number; name: string }) =>
          t.name.toLowerCase() === city.toLowerCase()
      );
      if (existing) return existing.id;
    }

    const createRes = await fetch(`${V3_BASE}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_secret: apiSecret, tag: { name: city } }),
    });
    if (!createRes.ok) return null;

    const created = await createRes.json();
    // V3 returns the created tag as either an object or a single-item array.
    if (Array.isArray(created)) return created[0]?.id ?? null;
    return created?.id ?? null;
  } catch {
    return null;
  }
}

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

    // Real-time city tagging: segment the subscriber into their "City, ST" tag
    // the instant they sign up. Best-effort and non-blocking — the subscriber is
    // already saved above, and the daily daily_city_tagger Modal cron re-sweeps
    // and catches anyone this step missed.
    const cityName = city.trim();
    const cityTagId = await getOrCreateCityTagId(apiSecret, cityName);
    if (cityTagId) {
      try {
        await fetch(`${V3_BASE}/tags/${cityTagId}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_secret: apiSecret, email: email.trim() }),
        });
      } catch {
        // Swallow: daily cron is the safety net.
      }
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Could not save. Try again." }, { status: 500 });
  }
}
