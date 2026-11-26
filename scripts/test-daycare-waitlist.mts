// Tests for the Day Care Comedy 2027 waitlist logic (lib/dayCareWaitlist.ts)
// against an in-memory fake Kit. Run: npm run test:daycare
// Node 24 runs the TypeScript module directly (built-in type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  FIELD_ATTRIBUTION,
  FIELD_CONSENT,
  FIELD_OTHER_CITY,
  GENERIC_ERROR,
  SERIES_TAG,
  WAITLIST_TAG,
  joinWaitlist,
  validateWaitlist,
  type WaitlistKit,
} from "../lib/dayCareWaitlist.ts"

const CITIES = new Set(["Toronto, ON", "Ottawa, ON", "New York, NY", "London"])
const NOW = new Date("2026-11-26T15:04:05Z")
const TOR = `${WAITLIST_TAG} - Toronto, ON`
const OTT = `${WAITLIST_TAG} - Ottawa, ON`

type Sub = { id: number; email: string; state: string; fields: Record<string, string | null>; tags: Set<string> }

/** In-memory Kit. `fail` names calls that should fail; `reactivate` is what tagging an unsubscribed person does. */
function fakeKit(opts: { reactivate?: boolean; hideCancelled?: boolean } = {}) {
  const subs = new Map<string, Sub>()
  const tags: { id: number; name: string }[] = [{ id: 1, name: "toronto, on" }]
  const calls: string[] = []
  const fail = new Set<string>()
  let nextSub = 100
  let nextTag = 50
  const tagName = (id: number) => tags.find((t) => t.id === id)!.name

  const kit: WaitlistKit = {
    async findSubscriber(email) {
      calls.push("find")
      if (fail.has("find")) return undefined
      const s = subs.get(email.toLowerCase())
      if (!s) return null
      if (opts.hideCancelled && s.state !== "active") return null
      return { id: s.id, state: s.state, fields: { ...s.fields } }
    },
    async listTags() {
      calls.push("listTags")
      return fail.has("listTags") ? null : tags.map((t) => ({ ...t }))
    },
    async createTag(name) {
      calls.push(`create:${name}`)
      if (fail.has("createTag")) return null
      const t = { id: nextTag++, name }
      tags.push(t)
      return t.id
    },
    async subscriberTags(id) {
      calls.push("subTags")
      if (fail.has("subTags")) return null
      const s = [...subs.values()].find((x) => x.id === id)
      return s ? [...s.tags] : []
    },
    async tagSubscribe(tagId, payload) {
      const name = tagName(tagId)
      calls.push(`tag:${name}`)
      if (fail.has(`tag:${name}`)) return false
      const key = payload.email.toLowerCase()
      let s = subs.get(key)
      if (!s) {
        s = { id: nextSub++, email: payload.email, state: "active", fields: {}, tags: new Set() }
        subs.set(key, s)
      } else if (s.state === "cancelled" && opts.reactivate) {
        s.state = "active"
      }
      s.tags.add(name)
      Object.assign(s.fields, payload.fields ?? {})
      return true
    },
  }
  return { kit, subs, tags, calls, fail }
}

function input(body: Record<string, unknown>) {
  const v = validateWaitlist(body, CITIES)
  assert.ok(v.ok, `expected valid input, got ${JSON.stringify(v)}`)
  return v.input
}

const tagCalls = (calls: string[]) => calls.filter((c) => c.startsWith("tag:"))

test("new email + listed city: created with all three tags, consent and attribution", async () => {
  const k = fakeKit()
  const r = await joinWaitlist(
    k.kit,
    input({ email: "new@x.com", city: "Toronto, ON", utm_source: "ig", referrer: "https://www.instagram.com/p/abc?u=me@x.com" }),
    NOW
  )
  assert.deepEqual(r, { ok: true, city: "Toronto" })
  const s = k.subs.get("new@x.com")!
  assert.equal(s.state, "active")
  assert.deepEqual([...s.tags].sort(), [SERIES_TAG, WAITLIST_TAG, TOR].sort())
  assert.equal(s.fields[FIELD_CONSENT], "dcc-2027-v1 | 2026-11-26T15:04:05.000Z | andpacker.com/daycarecomedy")
  assert.equal(s.fields[FIELD_ATTRIBUTION], "utm_source=ig; ref=instagram.com")
  // Never the home-city field, a name, or source.
  for (const f of ["city", "first_name", "source", "last_name"]) assert.ok(!(f in s.fields), f)
  // The general "Toronto, ON" city tag is never applied.
  assert.ok(![...s.tags].some((t) => t.toLowerCase() === "toronto, on"))
})

test("existing active subscriber: tags added, profile fields untouched, first-touch attribution kept", async () => {
  const k = fakeKit()
  k.subs.set("fan@x.com", {
    id: 7, email: "fan@x.com", state: "active",
    fields: { city: "Ottawa, ON", source: "website", [FIELD_ATTRIBUTION]: "utm_source=tiktok" },
    tags: new Set(["Website Signup", "Ottawa, ON"]),
  })
  const r = await joinWaitlist(k.kit, input({ email: "fan@x.com", city: "Toronto, ON", utm_source: "ig" }), NOW)
  assert.equal(r.ok, true)
  const s = k.subs.get("fan@x.com")!
  assert.equal(s.fields.city, "Ottawa, ON")
  assert.equal(s.fields.source, "website")
  assert.equal(s.fields[FIELD_ATTRIBUTION], "utm_source=tiktok")
  assert.ok(s.tags.has("Ottawa, ON") && s.tags.has(TOR) && s.tags.has(WAITLIST_TAG) && s.tags.has(SERIES_TAG))
})

test("same email twice: second submit adds nothing and still succeeds", async () => {
  const k = fakeKit()
  await joinWaitlist(k.kit, input({ email: "twice@x.com", city: "Toronto, ON" }), NOW)
  k.calls.length = 0
  const r = await joinWaitlist(k.kit, input({ email: "twice@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, true)
  assert.deepEqual(tagCalls(k.calls), [])
  assert.equal(k.subs.size, 1)
})

test("second city: only the new city tag is added", async () => {
  const k = fakeKit()
  await joinWaitlist(k.kit, input({ email: "two@x.com", city: "Toronto, ON" }), NOW)
  k.calls.length = 0
  const r = await joinWaitlist(k.kit, input({ email: "two@x.com", city: "Ottawa, ON" }), NOW)
  assert.deepEqual(r, { ok: true, city: "Ottawa" })
  assert.deepEqual(tagCalls(k.calls), [`tag:${OTT}`])
  const s = k.subs.get("two@x.com")!
  assert.ok(s.tags.has(TOR) && s.tags.has(OTT))
})

test("existing tag in a different case is reused, not created again", async () => {
  const k = fakeKit()
  k.tags.push({ id: 9, name: WAITLIST_TAG.toUpperCase() })
  await joinWaitlist(k.kit, input({ email: "c@x.com", city: "Toronto, ON" }), NOW)
  assert.ok(!k.calls.includes(`create:${WAITLIST_TAG}`))
})

test("unknown city is rejected; Other needs real text", () => {
  assert.deepEqual(validateWaitlist({ email: "a@x.com", city: "Atlantis" }, CITIES), {
    ok: false, error: "Choose a city from the list, or pick Other.",
  })
  for (const bad of ["", "x", "<script>", "a".repeat(81), "123 Main"]) {
    const v = validateWaitlist({ email: "a@x.com", city: "Other", otherCity: bad }, CITIES)
    assert.equal(v.ok, false, bad)
  }
  for (const good of ["Peterborough", "St. John's", "Trois-Rivières", "Kitchener (Waterloo)"]) {
    assert.equal(validateWaitlist({ email: "a@x.com", city: "Other", otherCity: good }, CITIES).ok, true, good)
  }
})

test("Other city: fixed Other tag, typed text only in the custom field", async () => {
  const k = fakeKit()
  const r = await joinWaitlist(k.kit, input({ email: "o@x.com", city: "Other", otherCity: "  Peterborough " }), NOW)
  assert.deepEqual(r, { ok: true, city: "Peterborough" })
  const s = k.subs.get("o@x.com")!
  assert.ok(s.tags.has(`${WAITLIST_TAG} - Other`))
  assert.ok(![...s.tags].some((t) => t.includes("Peterborough")))
  assert.equal(s.fields[FIELD_OTHER_CITY], "Peterborough")
})

test("unsubscribed person: success only if Kit really reactivates them", async () => {
  const yes = fakeKit({ reactivate: true })
  yes.subs.set("u@x.com", { id: 3, email: "u@x.com", state: "cancelled", fields: {}, tags: new Set([WAITLIST_TAG, TOR, SERIES_TAG]) })
  const r1 = await joinWaitlist(yes.kit, input({ email: "u@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r1.ok, true)
  // Every tag call is made again: that call is the fresh opt-in.
  assert.equal(tagCalls(yes.calls).length, 3)

  const no = fakeKit({ reactivate: false })
  no.subs.set("u@x.com", { id: 3, email: "u@x.com", state: "cancelled", fields: {}, tags: new Set() })
  const r2 = await joinWaitlist(no.kit, input({ email: "u@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r2.ok, false)

  // Kit's lookup may not return unsubscribed people at all: still never a false success.
  const hidden = fakeKit({ reactivate: false, hideCancelled: true })
  hidden.subs.set("u@x.com", { id: 3, email: "u@x.com", state: "cancelled", fields: {}, tags: new Set() })
  const r3 = await joinWaitlist(hidden.kit, input({ email: "u@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r3.ok, false)
})

test("bounced, complained or blocked: refused with no Kit writes", async () => {
  for (const state of ["bounced", "complained", "blocked"]) {
    const k = fakeKit({ reactivate: true })
    k.subs.set("b@x.com", { id: 4, email: "b@x.com", state, fields: {}, tags: new Set() })
    const r = await joinWaitlist(k.kit, input({ email: "b@x.com", city: "Toronto, ON" }), NOW)
    assert.equal(r.ok, false, state)
    assert.deepEqual(tagCalls(k.calls), [], state)
    assert.ok(!k.calls.some((c) => c.startsWith("create:")), state)
  }
})

test("one tag fails: error, then a retry finishes without re-adding tags", async () => {
  const k = fakeKit()
  k.fail.add(`tag:${TOR}`)
  const r1 = await joinWaitlist(k.kit, input({ email: "r@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r1.ok, false)
  k.fail.clear()
  k.calls.length = 0
  const r2 = await joinWaitlist(k.kit, input({ email: "r@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r2.ok, true)
  // The waitlist tag landed on the first try, so the retry skips it.
  assert.deepEqual(tagCalls(k.calls), [`tag:${TOR}`, `tag:${SERIES_TAG}`])
})

test("Kit down at any step: never a success", async () => {
  for (const step of ["find", "listTags", "createTag", "subTags"]) {
    const k = fakeKit()
    if (step === "subTags") {
      k.subs.set("d@x.com", { id: 5, email: "d@x.com", state: "active", fields: {}, tags: new Set() })
    }
    k.fail.add(step)
    const r = await joinWaitlist(k.kit, input({ email: "d@x.com", city: "Toronto, ON" }), NOW)
    assert.equal(r.ok, false, step)
  }
})

test("honeypot, bad email and junk bodies are rejected", () => {
  assert.deepEqual(
    validateWaitlist({ email: "a@x.com", city: "Toronto, ON", dcc_hp: "spam.com" }, CITIES),
    { ok: false, error: GENERIC_ERROR }
  )
  for (const email of ["", "nope", "a@b", "a b@x.com", `${"a".repeat(250)}@x.com`]) {
    assert.equal(validateWaitlist({ email, city: "Toronto, ON" }, CITIES).ok, false, email)
  }
  for (const body of [null, "x", [], 42]) {
    assert.equal(validateWaitlist(body, CITIES).ok, false)
  }
})

test("attribution: UTMs trimmed and capped, referrer reduced to its host", () => {
  const v = validateWaitlist(
    {
      email: "a@x.com",
      city: "Toronto, ON",
      utm_source: " meta ",
      utm_medium: "paid;social",
      utm_campaign: "x".repeat(300),
      utm_content: 5,
      referrer: "not a url",
      utm_term: "ignored",
    },
    CITIES
  )
  assert.ok(v.ok)
  assert.equal(v.input.attribution, `utm_source=meta; utm_medium=paid,social; utm_campaign=${"x".repeat(100)}`)
})

test("honeypot rejects any non-empty value, not just strings", () => {
  for (const hp of [1, ["x"], { a: 1 }, true, "x"]) {
    assert.equal(validateWaitlist({ email: "a@x.com", city: "Toronto, ON", dcc_hp: hp }, CITIES).ok, false, JSON.stringify(hp))
  }
  for (const hp of [undefined, null, "", "   "]) {
    assert.equal(validateWaitlist({ email: "a@x.com", city: "Toronto, ON", dcc_hp: hp }, CITIES).ok, true, String(hp))
  }
})

test("read-back retries once: a tag Kit applies a moment late still succeeds", async () => {
  const k = fakeKit()
  const realSubTags = k.kit.subscriberTags
  let reads = 0
  let paused = 0
  // The first read-back sees the series tag missing; it lands during the pause.
  k.kit.subscriberTags = async (id) => {
    const tags = await realSubTags(id)
    reads++
    return reads === 1 && tags ? tags.filter((t) => t !== SERIES_TAG) : tags
  }
  k.kit.pause = async () => { paused++ }
  const r = await joinWaitlist(k.kit, input({ email: "late@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, true)
  assert.equal(paused, 1)

  // Still missing after the retry: an error, never a success.
  const k2 = fakeKit()
  const real2 = k2.kit.subscriberTags
  k2.kit.subscriberTags = async (id) => ((await real2(id)) ?? []).filter((t) => t !== SERIES_TAG)
  const r2 = await joinWaitlist(k2.kit, input({ email: "never@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r2.ok, false)
})
