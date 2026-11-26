// Day Care Comedy 2027 first-access waitlist (andpacker.com/daycarecomedy).
//
// Pure logic, no imports: the route (app/api/daycare-waitlist/route.ts) passes in
// a Kit client and the city list, and scripts/test-daycare-waitlist.mts runs the
// same code against a fake Kit with Node's built-in TypeScript support.
//
// Rules (Andrew, 2026-11-26):
// - The city here is the city someone would ATTEND, not where they live. So this
//   never writes Kit's `city` field (the daily city tagger reads it), never applies
//   the general "City, ST" tags, and never touches first_name or source.
// - Tags come from a fixed pattern, never from what someone types. An "Other" city
//   gets the Other tag; the typed text is only stored in a custom field.
// - Success is reported ONLY when Kit reads the person back as active with all
//   three tags. Kit does not document what re-tagging an unsubscribed person does,
//   so the read-back decides. Bounced or complained addresses are never retried.
// - Every step is safe to repeat: a retry after a partial failure finishes the job,
//   and a tag the person already has is never added again.

/** Bump the version whenever CONSENT_TEXT changes; it is stored on the subscriber. */
export const CONSENT_VERSION = "dcc-2027-v1"

/** Shown under the button. The stored consent version refers to exactly this text. */
export const CONSENT_TEXT =
  "By joining, you agree to receive Day Care Comedy 2027 announcements and ticket presale emails from Andrew Packer. You can unsubscribe at any time."

export const OTHER_CITY = "Other"
export const SERIES_TAG = "Day Care Comedy"
export const WAITLIST_TAG = "Day Care Comedy - 2027 Waitlist"
export const PAGE = "andpacker.com/daycarecomedy"

/** Kit custom field keys. They must exist in Kit before the route can write them. */
export const FIELD_CONSENT = "dcc_consent"
export const FIELD_ATTRIBUTION = "dcc_attribution"
export const FIELD_OTHER_CITY = "dcc_other_city"

/** The one message for every failure, so the page never reveals anyone's list status. */
export const GENERIC_ERROR =
  "We couldn't add this email. Try another address, or email info@andpacker.com."

const MAX_EMAIL = 254
const MAX_UTM = 100
const MAX_FIELD = 255
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
const OTHER_CITY_RE = /^[\p{L}\p{M}][\p{L}\p{M} .,'’()-]{1,79}$/u
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const

export type CityTagged = { kind: "listed"; city: string } | { kind: "other"; text: string }

export type WaitlistInput = {
  email: string
  choice: CityTagged
  /** "utm_source=ig; ...; ref=instagram.com", or "" when nothing came in. */
  attribution: string
}

export type Validation =
  | { ok: true; input: WaitlistInput }
  | { ok: false; error: string }

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  // Newlines and tabs become a space (so words don't fuse), other control
  // characters are dropped, then whitespace collapses.
  return value
    .replace(/[\t\n\v\f\r]/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

/** Host only, so a referrer's path or query string (which can carry personal data) is never stored. */
function referrerHost(value: unknown): string {
  const raw = clean(value, 500)
  if (!raw) return ""
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "")
    return host.slice(0, MAX_UTM)
  } catch {
    return ""
  }
}

export function buildAttribution(body: Record<string, unknown>): string {
  const parts: string[] = []
  for (const key of UTM_KEYS) {
    const v = clean(body[key], MAX_UTM).replace(/;/g, ",")
    if (v) parts.push(`${key}=${v}`)
  }
  const ref = referrerHost(body.referrer)
  if (ref) parts.push(`ref=${ref}`)
  return parts.join("; ").slice(0, MAX_FIELD)
}

/** Server-side check of everything the form sends. Never trusts the client. */
export function validateWaitlist(
  body: unknown,
  validCities: ReadonlySet<string>
): Validation {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Bad request." }
  }
  const b = body as Record<string, unknown>

  // Honeypot: a hidden field people never see. Filled means a bot. Same generic
  // error as everything else (never a fake success).
  // Named dcc_hp, not "website", so browser autofill and password managers leave it alone.
  const hp = b.dcc_hp
  if (hp !== undefined && hp !== null && !(typeof hp === "string" && hp.trim() === "")) {
    return { ok: false, error: GENERIC_ERROR }
  }

  const email = typeof b.email === "string" ? b.email.trim() : ""
  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." }
  }

  const city = typeof b.city === "string" ? b.city.trim() : ""
  let choice: CityTagged
  if (city === OTHER_CITY) {
    // Cleaned but not cut short, so an over-long entry is rejected, not truncated.
    const text = clean(b.otherCity, 500)
    if (!OTHER_CITY_RE.test(text)) {
      return { ok: false, error: "Type the city you'd attend." }
    }
    choice = { kind: "other", text }
  } else if (validCities.has(city)) {
    choice = { kind: "listed", city }
  } else {
    return { ok: false, error: "Choose a city from the list, or pick Other." }
  }

  return { ok: true, input: { email, choice, attribution: buildAttribution(b) } }
}

/** The three tag names for a choice, in the order they are applied. */
export function tagNamesFor(choice: CityTagged): string[] {
  const cityTag =
    choice.kind === "listed"
      ? `${WAITLIST_TAG} - ${choice.city}`
      : `${WAITLIST_TAG} - ${OTHER_CITY}`
  // The waitlist tag goes first: its subscribe call creates a new person and
  // carries the custom fields.
  return [WAITLIST_TAG, cityTag, SERIES_TAG]
}

/** "Toronto, ON" -> "Toronto". The success message names the city the way people say it. */
export function cityLabel(choice: CityTagged): string {
  return choice.kind === "listed" ? choice.city.split(",")[0].trim() : choice.text
}

export function consentValue(now: Date): string {
  return `${CONSENT_VERSION} | ${now.toISOString()} | ${PAGE}`
}

// ---- Kit ------------------------------------------------------------------

export type KitSub = {
  id: number
  state: string
  fields?: Record<string, string | null> | null
}

/** Each method returns null (or undefined for the lookup) when the Kit call failed. */
export type WaitlistKit = {
  /** The subscriber, null when Kit has none, undefined when the lookup failed. */
  findSubscriber(email: string): Promise<KitSub | null | undefined>
  listTags(): Promise<{ id: number; name: string }[] | null>
  createTag(name: string): Promise<number | null>
  /** Tag names the subscriber has, or null on failure. */
  subscriberTags(id: number): Promise<string[] | null>
  /** Subscribe an email to a tag (creates the person if new). False on failure. */
  tagSubscribe(
    tagId: number,
    payload: { email: string; fields?: Record<string, string> }
  ): Promise<boolean>
  /** Wait before the one read-back retry. Omitted in tests (retries at once). */
  pause?(ms: number): Promise<void>
}

export type SignupResult =
  | { ok: true; city: string }
  | { ok: false; reason: string }

/** States Kit will never send to again without the person's own action. */
const NEVER_RETRY = new Set(["bounced", "complained", "blocked"])

const lower = (s: string) => s.toLowerCase()

export async function joinWaitlist(
  kit: WaitlistKit,
  input: WaitlistInput,
  now: Date
): Promise<SignupResult> {
  const wanted = tagNamesFor(input.choice)

  const existing = await kit.findSubscriber(input.email)
  if (existing === undefined) return { ok: false, reason: "lookup failed" }
  if (existing && NEVER_RETRY.has(lower(existing.state))) {
    return { ok: false, reason: `state ${existing.state}` }
  }

  // One tag-list call resolves all three ids; missing tags are created.
  const all = await kit.listTags()
  if (!all) return { ok: false, reason: "tag list failed" }
  const ids: number[] = []
  for (const name of wanted) {
    const found = all.find((t) => lower(t.name) === lower(name))
    const id = found ? found.id : await kit.createTag(name)
    if (id == null) return { ok: false, reason: `tag create failed: ${name}` }
    ids.push(id)
  }

  // Tags the person already has are skipped, so nothing is added twice.
  let have = new Set<string>()
  if (existing) {
    const tags = await kit.subscriberTags(existing.id)
    if (!tags) return { ok: false, reason: "subscriber tags failed" }
    have = new Set(tags.map(lower))
  }

  // Custom fields: consent on every call that changes something; first-touch
  // attribution only if the person has none yet; the Other text when given.
  const fields: Record<string, string> = { [FIELD_CONSENT]: consentValue(now) }
  const hadAttribution = Boolean(existing?.fields?.[FIELD_ATTRIBUTION])
  if (input.attribution && !hadAttribution) fields[FIELD_ATTRIBUTION] = input.attribution
  // Other cities accumulate ("Paris; Berlin"), so a second Other choice isn't lost.
  let otherChanged = false
  if (input.choice.kind === "other") {
    const before = existing?.fields?.[FIELD_OTHER_CITY] ?? ""
    const known = before.split(";").map((x) => lower(x.trim()))
    if (!known.includes(lower(input.choice.text))) {
      fields[FIELD_OTHER_CITY] = (before ? `${before}; ${input.choice.text}` : input.choice.text).slice(0, MAX_FIELD)
      otherChanged = true
    }
  }

  // A person who isn't active gets every tag call again, because that call is the
  // fresh opt-in; the read-back below decides whether it took.
  const active = existing ? lower(existing.state) === "active" : false
  let fieldsSent = false
  for (let i = 0; i < wanted.length; i++) {
    if (active && have.has(lower(wanted[i]))) continue
    const payload: { email: string; fields?: Record<string, string> } = {
      email: input.email,
    }
    if (!fieldsSent) payload.fields = fields
    if (!(await kit.tagSubscribe(ids[i], payload))) {
      return { ok: false, reason: `tag failed: ${wanted[i]}` }
    }
    fieldsSent = true
  }
  // Fully tagged already but naming a new Other city: write it through the Other
  // tag (new for this page, so no automation hangs off it).
  if (!fieldsSent && otherChanged) {
    if (!(await kit.tagSubscribe(ids[1], { email: input.email, fields }))) {
      return { ok: false, reason: "other-city update failed" }
    }
  }

  // Read back: success only if Kit now has them active with all three tags. Kit
  // may apply tags a moment late, so one short retry before giving up.
  let problem = await readBack(kit, input.email, wanted)
  if (problem) {
    await kit.pause?.(800)
    problem = await readBack(kit, input.email, wanted)
  }
  if (problem) return { ok: false, reason: problem }

  return { ok: true, city: cityLabel(input.choice) }
}

/** null when Kit has the person active with every wanted tag, else what is wrong. */
async function readBack(kit: WaitlistKit, email: string, wanted: string[]): Promise<string | null> {
  const after = await kit.findSubscriber(email)
  if (!after) return "not found after signup"
  if (lower(after.state) !== "active") return `state ${after.state} after signup`
  const tags = await kit.subscriberTags(after.id)
  if (!tags) return "read-back tags failed"
  const have = new Set(tags.map(lower))
  const missing = wanted.filter((t) => !have.has(lower(t)))
  return missing.length ? `missing after signup: ${missing.join(", ")}` : null
}
