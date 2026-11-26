import { VALID_CITIES } from "@/lib/cities"
import {
  createTag,
  findSubscriberAnyState,
  getSubscriberTags,
  listTags,
  tagSubscriber,
} from "@/lib/kit"
import {
  GENERIC_ERROR,
  joinWaitlist,
  validateWaitlist,
  type WaitlistKit,
} from "@/lib/dayCareWaitlist"

// Day Care Comedy 2027 first-access waitlist (andpacker.com/daycarecomedy).
// All the rules live in lib/dayCareWaitlist.ts; this file only wires in Kit.

/** A browser posting from another site sends its own Origin: refuse it. */
function crossSite(req: Request): boolean {
  const origin = req.headers.get("origin")
  if (!origin) return false
  try {
    return new URL(origin).host !== req.headers.get("host")
  } catch {
    return true
  }
}

export async function POST(req: Request) {
  if (crossSite(req)) {
    return Response.json({ error: GENERIC_ERROR }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 })
  }

  const checked = validateWaitlist(body, VALID_CITIES)
  if (!checked.ok) {
    return Response.json({ error: checked.error }, { status: 400 })
  }

  const apiSecret = process.env.KIT_API_SECRET
  if (!apiSecret) {
    console.error("daycare-waitlist: KIT_API_SECRET missing")
    return Response.json({ error: GENERIC_ERROR }, { status: 500 })
  }

  const kit: WaitlistKit = {
    findSubscriber: (email) => findSubscriberAnyState(apiSecret, email),
    listTags: () => listTags(apiSecret),
    createTag: (name) => createTag(apiSecret, name),
    subscriberTags: (id) => getSubscriberTags(apiSecret, id),
    tagSubscribe: (tagId, payload) => tagSubscriber(apiSecret, tagId, payload),
    pause: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }

  try {
    const result = await joinWaitlist(kit, checked.input, new Date())
    if (!result.ok) {
      // The reason is for the Vercel log only. It never names the email.
      console.error(`daycare-waitlist: ${result.reason}`)
      return Response.json({ error: GENERIC_ERROR }, { status: 502 })
    }
    return Response.json({ success: true, city: result.city })
  } catch {
    console.error("daycare-waitlist: unexpected error")
    return Response.json({ error: GENERIC_ERROR }, { status: 500 })
  }
}
