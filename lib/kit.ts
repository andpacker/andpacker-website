// Kit (ConvertKit) V3 helpers shared by the signup and waitlist routes.
// Server-only: every call takes the KIT_API_SECRET.

export const KIT_V3_BASE = "https://api.convertkit.com/v3"

/** "Website Signup": the tag every subscriber added through the site is subscribed to. */
export const WEBSITE_SIGNUP_TAG_ID = "19482127"

export type KitSubscriber = {
  id: number
  state: string
  first_name: string | null
  fields: Record<string, string | null>
}

// Resolve a Kit tag id by name, creating the tag if it doesn't exist yet. Matching
// is case-insensitive, mirroring get_or_create_tag in tag_all_cities.py, so the
// site and the daily cron converge on the same "City, ST" tag names. Best-effort:
// returns null on any failure.
export async function getOrCreateTagId(
  apiSecret: string,
  name: string
): Promise<number | null> {
  try {
    const listRes = await fetch(
      `${KIT_V3_BASE}/tags?api_secret=${encodeURIComponent(apiSecret)}`
    )
    if (listRes.ok) {
      const data = await listRes.json()
      const existing = (data.tags ?? []).find(
        (t: { id: number; name: string }) =>
          t.name.toLowerCase() === name.toLowerCase()
      )
      if (existing) return existing.id
    }

    const createRes = await fetch(`${KIT_V3_BASE}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_secret: apiSecret, tag: { name } }),
    })
    if (!createRes.ok) return null

    const created = await createRes.json()
    // V3 returns the created tag as either an object or a single-item array.
    if (Array.isArray(created)) return created[0]?.id ?? null
    return created?.id ?? null
  } catch {
    return null
  }
}

// Subscribe an email to a tag. Creates the subscriber if they don't exist, and
// writes `first_name` / `fields` when the payload carries them. Tagging someone
// who already has the tag is a no-op. Returns false on any failure.
export async function tagSubscriber(
  apiSecret: string,
  tagId: number | string,
  payload: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetch(`${KIT_V3_BASE}/tags/${tagId}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, api_secret: apiSecret }),
    })
    return res.ok
  } catch {
    return false
  }
}

// Look a subscriber up by email. Returns the subscriber, null when Kit has no
// active subscriber with that email, or undefined when the lookup itself failed.
export async function findSubscriber(
  apiSecret: string,
  email: string
): Promise<KitSubscriber | null | undefined> {
  try {
    const res = await fetch(
      `${KIT_V3_BASE}/subscribers?api_secret=${encodeURIComponent(
        apiSecret
      )}&email_address=${encodeURIComponent(email)}`
    )
    if (!res.ok) return undefined
    const data = await res.json()
    return data.subscribers?.[0] ?? null
  } catch {
    return undefined
  }
}
