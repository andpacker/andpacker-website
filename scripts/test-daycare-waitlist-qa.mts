// Extra edge-case tests for lib/dayCareWaitlist.ts. Run: node --test scripts/test-daycare-waitlist-qa.mts
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  FIELD_ATTRIBUTION,
  FIELD_CONSENT,
  FIELD_OTHER_CITY,
  SERIES_TAG,
  WAITLIST_TAG,
  buildAttribution,
  cityLabel,
  joinWaitlist,
  tagNamesFor,
  validateWaitlist,
  type WaitlistKit,
} from "../lib/dayCareWaitlist.ts"

const CITIES = new Set(["Toronto, ON", "Ottawa, ON", "New York, NY", "London", "Washington, D.C., US"])
const NOW = new Date("2026-11-26T15:04:05Z")
const TOR = `${WAITLIST_TAG} - Toronto, ON`
const OTHER = `${WAITLIST_TAG} - Other`

type Sub = { id: number; email: string; state: string; fields: Record<string, string | null> | null; tags: Set<string> }
type Payload = { email: string; fields?: Record<string, string> }

function fakeKit() {
  const subs = new Map<string, Sub>()
  const tags: { id: number; name: string }[] = []
  const calls: string[] = []
  const payloads: { tag: string; payload: Payload }[] = []
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
      return { id: s.id, state: s.state, fields: s.fields ? { ...s.fields } : s.fields }
    },
    async listTags() {
      calls.push("listTags")
      return fail.has("listTags") ? null : tags.map((t) => ({ ...t }))
    },
    async createTag(name) {
      calls.push(`create:${name}`)
      if (fail.has(`create:${name}`)) return null
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
      payloads.push({ tag: name, payload })
      if (fail.has(`tag:${name}`)) return false
      const key = payload.email.toLowerCase()
      let s = subs.get(key)
      if (!s) {
        s = { id: nextSub++, email: payload.email, state: "active", fields: {}, tags: new Set() }
        subs.set(key, s)
      }
      s.tags.add(name)
      s.fields = Object.assign(s.fields ?? {}, payload.fields ?? {})
      return true
    },
  }
  return { kit, subs, tags, calls, payloads, fail }
}

function input(body: Record<string, unknown>) {
  const v = validateWaitlist(body, CITIES)
  assert.ok(v.ok, `expected valid input, got ${JSON.stringify(v)}`)
  return v.input
}
const tagCalls = (calls: string[]) => calls.filter((c) => c.startsWith("tag:"))
const isValid = (body: unknown) => validateWaitlist(body, CITIES).ok

// ---------------- validation ----------------

test("email is trimmed; two submits differing by case and spaces are one person", async () => {
  assert.equal(input({ email: " A@X.com ", city: "Toronto, ON" }).email, "A@X.com")
  const k = fakeKit()
  await joinWaitlist(k.kit, input({ email: " A@X.com ", city: "Toronto, ON" }), NOW)
  k.calls.length = 0
  const r = await joinWaitlist(k.kit, input({ email: "a@x.com  ", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, true)
  assert.equal(k.subs.size, 1)
  assert.deepEqual(tagCalls(k.calls), [])
})

test("email: unicode, boundary length, odd shapes", () => {
  assert.equal(isValid({ email: "josé@exämple.com", city: "London" }), true)
  assert.equal(isValid({ email: "a+tag@sub.x.co.uk", city: "London" }), true)
  const dom = "@x.com"
  assert.equal(isValid({ email: "a".repeat(254 - dom.length) + dom, city: "London" }), true)
  assert.equal(isValid({ email: "a".repeat(255 - dom.length) + dom, city: "London" }), false)
  for (const email of ["a@@x.com", "@x.com", "a@.com", "a@x.", "a@x.com b", "a\t@x.com", "a@x .com", "   "]) {
    assert.equal(isValid({ email, city: "London" }), false, JSON.stringify(email))
  }
  // Trailing newline / nbsp is whitespace and gets trimmed.
  assert.equal(isValid({ email: "a@x.com\n", city: "London" }), true)
  assert.equal(isValid({ email: "a@x.com ", city: "London" }), true)
})

test("non-string values for email are rejected", () => {
  for (const email of [123, ["a@x.com"], { a: 1 }, null, undefined, true]) {
    assert.equal(isValid({ email, city: "London" }), false, JSON.stringify(email))
  }
})

test("non-string values for city are rejected", () => {
  for (const city of [123, ["Toronto, ON"], { a: 1 }, null, undefined, true]) {
    assert.equal(isValid({ email: "a@x.com", city }), false, JSON.stringify(city))
  }
})

test("non-string otherCity is rejected when city is Other", () => {
  for (const otherCity of [123, ["Paris"], { a: "Paris" }, null, undefined, true]) {
    assert.equal(isValid({ email: "a@x.com", city: "Other", otherCity }), false, JSON.stringify(otherCity))
  }
})

test("non-string utm_* and referrer are ignored, not stored", () => {
  const body = {
    email: "a@x.com", city: "London",
    utm_source: ["ig"], utm_medium: { a: 1 }, utm_campaign: 7, utm_content: null, referrer: ["https://x.com"],
  }
  assert.equal(input(body).attribution, "")
})

test("body with unknown keys: ignored, output shape is exactly email/choice/attribution", () => {
  const v = input({ email: "a@x.com", city: "Toronto, ON", admin: true, tags: ["Evil"], city_id: 3, __proto__x: 1 })
  assert.deepEqual(Object.keys(v).sort(), ["attribution", "choice", "email"])
  assert.deepEqual(v.choice, { kind: "listed", city: "Toronto, ON" })
  assert.equal(v.attribution, "")
})

test("city: trimmed, but case and unknown values rejected", () => {
  assert.deepEqual(input({ email: "a@x.com", city: "  Toronto, ON \n" }).choice, { kind: "listed", city: "Toronto, ON" })
  for (const city of ["toronto, on", "TORONTO, ON", "Toronto,ON", "Toronto", "other", "OTHER", "Other city", "Toronto, ON; Ottawa, ON"]) {
    assert.equal(isValid({ email: "a@x.com", city, otherCity: "Paris" }), false, city)
  }
  assert.deepEqual(input({ email: "a@x.com", city: " Other ", otherCity: "Paris" }).choice, { kind: "other", text: "Paris" })
})

test("Other: missing, empty, whitespace-only, too short/long, digits, emoji, semicolon, angle brackets", () => {
  const bad: unknown[] = [undefined, "", "   ", "A", "1Paris", "Par1s", "Paris 🎉", "🎉", "Paris; DROP", "Paris;", "<b>Paris</b>", "Paris/Lyon", "-Paris", " ,Paris", "a".repeat(81), "a".repeat(600)]
  for (const otherCity of bad) {
    assert.equal(isValid({ email: "a@x.com", city: "Other", otherCity }), false, JSON.stringify(otherCity))
  }
  assert.equal(isValid({ email: "a@x.com", city: "Other" }), false)
  for (const otherCity of ["Ab", "a".repeat(80), "Zürich", "São Paulo", "Saint-Jean-sur-Richelieu", "St. John’s", "Washington, D.C.", "Москва", "東京"]) {
    assert.equal(isValid({ email: "a@x.com", city: "Other", otherCity }), true, otherCity)
  }
})

test("Other: whitespace around and inside is trimmed and collapsed", () => {
  assert.deepEqual(input({ email: "a@x.com", city: "Other", otherCity: "  New    York  " }).choice, { kind: "other", text: "New York" })
})

test("Other: a newline or tab BETWEEN words becomes a space, not a glued word", () => {
  // clean() strips control chars (incl. \n, \t) before collapsing whitespace, so words fuse.
  for (const sep of ["\n", "\t", "\r\n"]) {
    const v = validateWaitlist({ email: "a@x.com", city: "Other", otherCity: `Saint${sep}John` }, CITIES)
    assert.ok(v.ok)
    assert.deepEqual(v.input.choice, { kind: "other", text: "Saint John" }, JSON.stringify(sep))
  }
})

test("Other: other control characters (NUL, DEL, ESC) are stripped", () => {
  const v = validateWaitlist({ email: "a@x.com", city: "Other", otherCity: "Par\u0000i\u007fs\u001b" }, CITIES)
  assert.ok(v.ok)
  assert.deepEqual(v.input.choice, { kind: "other", text: "Paris" })
})

test("honeypot: whitespace-only is not a bot; any text is", () => {
  assert.equal(isValid({ email: "a@x.com", city: "London", dcc_hp: "   " }), true)
  assert.equal(isValid({ email: "a@x.com", city: "London", dcc_hp: "x" }), false)
  assert.equal(isValid({ email: "a@x.com", city: "London", dcc_hp: "" }), true)
})

test("attribution: control chars inside a UTM value become a space", () => {
  const a = buildAttribution({ utm_source: "face\nbook" })
  assert.equal(a, "utm_source=face book")
})

test("attribution: referrer edge cases", () => {
  assert.equal(buildAttribution({ referrer: "https://WWW.Example.COM:8080/a?b=me@x.com#c" }), "ref=example.com")
  assert.equal(buildAttribution({ referrer: "https://user:pw@evil.com/" }), "ref=evil.com")
  assert.equal(buildAttribution({ referrer: "javascript:alert(1)" }), "")
  assert.equal(buildAttribution({ referrer: "mailto:me@x.com" }), "")
  assert.equal(buildAttribution({ referrer: "" }), "")
  assert.equal(buildAttribution({ referrer: "   " }), "")
  assert.equal(buildAttribution({}), "")
})

test("attribution: total capped at 255, no throw with all four UTMs + referrer", () => {
  const big = "y".repeat(500)
  const a = buildAttribution({ utm_source: big, utm_medium: big, utm_campaign: big, utm_content: big, referrer: "https://x.com" })
  assert.ok(a.length <= 255)
  assert.ok(a.startsWith("utm_source=" + "y".repeat(100) + "; utm_medium="))
})

test("attribution: semicolons in any UTM are replaced so the separator stays unambiguous", () => {
  assert.equal(buildAttribution({ utm_source: "a;b;c", utm_content: ";" }), "utm_source=a,b,c; utm_content=,")
})

// ---------------- tag names / labels ----------------

test("tagNamesFor / cityLabel: province-less (UK style) and multi-comma cities", () => {
  const london = input({ email: "a@x.com", city: "London" }).choice
  assert.deepEqual(tagNamesFor(london), [WAITLIST_TAG, `${WAITLIST_TAG} - London`, SERIES_TAG])
  assert.equal(cityLabel(london), "London")
  const dc = input({ email: "a@x.com", city: "Washington, D.C., US" }).choice
  assert.equal(cityLabel(dc), "Washington")
  assert.equal(tagNamesFor(dc)[1], `${WAITLIST_TAG} - Washington, D.C., US`)
  const other = input({ email: "a@x.com", city: "Other", otherCity: "Paris, France" }).choice
  assert.deepEqual(tagNamesFor(other), [WAITLIST_TAG, OTHER, SERIES_TAG])
  assert.equal(cityLabel(other), "Paris, France")
})

// ---------------- joinWaitlist ----------------

test("UK-style city end to end", async () => {
  const k = fakeKit()
  const r = await joinWaitlist(k.kit, input({ email: "uk@x.com", city: "London" }), NOW)
  assert.deepEqual(r, { ok: true, city: "London" })
  assert.ok(k.subs.get("uk@x.com")!.tags.has(`${WAITLIST_TAG} - London`))
})

test("nothing is written before validation passes: invalid bodies never need a Kit", async () => {
  const k = fakeKit()
  for (const body of [{ email: "bad", city: "London" }, { email: "a@x.com", city: "Nope" }, { email: "a@x.com", city: "Other" }, { email: "a@x.com", city: "London", dcc_hp: "x" }]) {
    const v = validateWaitlist(body, CITIES)
    if (v.ok) await joinWaitlist(k.kit, v.input, NOW)
  }
  assert.deepEqual(k.calls, [])
})

test("call order: find, listTags, (creates), then tag writes, then read-back; no write before lookup", async () => {
  const k = fakeKit()
  await joinWaitlist(k.kit, input({ email: "o@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(k.calls[0], "find")
  assert.equal(k.calls[1], "listTags")
  const firstWrite = k.calls.findIndex((c) => c.startsWith("tag:"))
  const lastCreate = k.calls.map((c) => c.startsWith("create:")).lastIndexOf(true)
  assert.ok(lastCreate < firstWrite, "all tags created before any subscribe")
  assert.deepEqual(k.calls.slice(-2), ["find", "subTags"])
  assert.deepEqual(tagCalls(k.calls), [`tag:${WAITLIST_TAG}`, `tag:${TOR}`, `tag:${SERIES_TAG}`])
})

test("failed lookup, tag list failure, or tag create failure: zero subscribe calls", async () => {
  for (const f of ["find", "listTags", `create:${WAITLIST_TAG}`, `create:${TOR}`, `create:${SERIES_TAG}`]) {
    const k = fakeKit()
    k.fail.add(f)
    const r = await joinWaitlist(k.kit, input({ email: "f@x.com", city: "Toronto, ON" }), NOW)
    assert.equal(r.ok, false, f)
    assert.deepEqual(tagCalls(k.calls), [], f)
    assert.equal(k.subs.size, 0, f)
  }
})

test("createTag fails only for the third tag: reports it, no subscriber written, retry works", async () => {
  const k = fakeKit()
  k.fail.add(`create:${SERIES_TAG}`)
  const r = await joinWaitlist(k.kit, input({ email: "t@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, false)
  assert.ok(!r.ok && r.reason.includes(SERIES_TAG), JSON.stringify(r))
  assert.equal(k.subs.size, 0)
  // First two tags were created; retry must reuse them and only create the third.
  k.fail.clear()
  k.calls.length = 0
  const r2 = await joinWaitlist(k.kit, input({ email: "t@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r2.ok, true)
  assert.deepEqual(k.calls.filter((c) => c.startsWith("create:")), [`create:${SERIES_TAG}`])
})

test("tag id 0 from Kit is a valid id, not a failure", async () => {
  const k = fakeKit()
  k.tags.push({ id: 0, name: WAITLIST_TAG })
  // fakeKit's tagName uses find by id; id 0 works with it.
  const r = await joinWaitlist(k.kit, input({ email: "z@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, true)
})

test("consent (and attribution) are sent on the FIRST tag call only", async () => {
  const k = fakeKit()
  await joinWaitlist(k.kit, input({ email: "c@x.com", city: "Other", otherCity: "Paris", utm_source: "ig" }), NOW)
  assert.equal(k.payloads.length, 3)
  const [first, ...rest] = k.payloads
  assert.equal(first.tag, WAITLIST_TAG)
  assert.ok(first.payload.fields)
  assert.ok(FIELD_CONSENT in first.payload.fields!)
  assert.equal(first.payload.fields![FIELD_ATTRIBUTION], "utm_source=ig")
  assert.equal(first.payload.fields![FIELD_OTHER_CITY], "Paris")
  for (const p of rest) assert.equal(p.payload.fields, undefined, p.tag)
  for (const p of k.payloads) assert.equal(p.payload.email, "c@x.com")
})

test("existing active person who already has the waitlist tag: fields ride on the first call actually made", async () => {
  const k = fakeKit()
  k.subs.set("e@x.com", { id: 7, email: "e@x.com", state: "active", fields: {}, tags: new Set([WAITLIST_TAG, SERIES_TAG]) })
  await joinWaitlist(k.kit, input({ email: "e@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(k.payloads.length, 1)
  assert.equal(k.payloads[0].tag, TOR)
  assert.ok(FIELD_CONSENT in (k.payloads[0].payload.fields ?? {}))
})

test("attribution: existing value is never overwritten; empty attribution is never written", async () => {
  const k = fakeKit()
  k.subs.set("a@x.com", { id: 7, email: "a@x.com", state: "active", fields: { [FIELD_ATTRIBUTION]: "utm_source=tiktok" }, tags: new Set() })
  await joinWaitlist(k.kit, input({ email: "a@x.com", city: "Toronto, ON", utm_source: "ig" }), NOW)
  for (const p of k.payloads) assert.ok(!(FIELD_ATTRIBUTION in (p.payload.fields ?? {})))
  assert.equal(k.subs.get("a@x.com")!.fields![FIELD_ATTRIBUTION], "utm_source=tiktok")

  const k2 = fakeKit()
  await joinWaitlist(k2.kit, input({ email: "n@x.com", city: "Toronto, ON" }), NOW)
  for (const p of k2.payloads) assert.ok(!(FIELD_ATTRIBUTION in (p.payload.fields ?? {})))
  assert.ok(!(FIELD_ATTRIBUTION in k2.subs.get("n@x.com")!.fields!))
})

test("existing attribution empty string or null counts as none; null fields object is handled", async () => {
  for (const fields of [{ [FIELD_ATTRIBUTION]: "" }, { [FIELD_ATTRIBUTION]: null }, null] as const) {
    const k = fakeKit()
    k.subs.set("a@x.com", { id: 7, email: "a@x.com", state: "active", fields: fields as never, tags: new Set() })
    const r = await joinWaitlist(k.kit, input({ email: "a@x.com", city: "Toronto, ON", utm_source: "ig" }), NOW)
    assert.equal(r.ok, true, JSON.stringify(fields))
    assert.equal(k.payloads[0].payload.fields![FIELD_ATTRIBUTION], "utm_source=ig", JSON.stringify(fields))
  }
})

test("listed city never writes the other-city field", async () => {
  const k = fakeKit()
  await joinWaitlist(k.kit, input({ email: "l@x.com", city: "Toronto, ON", otherCity: "Paris" }), NOW)
  assert.ok(!(FIELD_OTHER_CITY in k.subs.get("l@x.com")!.fields!))
})

test("Kit state is capitalized (\"Active\"): treated as active, no repeat tag calls", async () => {
  const k = fakeKit()
  k.subs.set("A@x.com".toLowerCase(), { id: 7, email: "a@x.com", state: "Active", fields: {}, tags: new Set([WAITLIST_TAG, TOR, SERIES_TAG]) })
  const r = await joinWaitlist(k.kit, input({ email: "a@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, true)
  assert.deepEqual(tagCalls(k.calls), [])
})

test("Kit state capitalized \"Bounced\"/\"Complained\": still refused, no writes", async () => {
  for (const state of ["Bounced", "COMPLAINED", "Blocked"]) {
    const k = fakeKit()
    k.subs.set("b@x.com", { id: 7, email: "b@x.com", state, fields: {}, tags: new Set() })
    const r = await joinWaitlist(k.kit, input({ email: "b@x.com", city: "Toronto, ON" }), NOW)
    assert.equal(r.ok, false, state)
    assert.deepEqual(k.calls.filter((c) => c.startsWith("tag:") || c.startsWith("create:")), [], state)
  }
})

test("existing subscriber in state inactive: every tag call re-made; fails if still inactive after", async () => {
  const k = fakeKit()
  k.subs.set("i@x.com", { id: 7, email: "i@x.com", state: "inactive", fields: {}, tags: new Set([WAITLIST_TAG, TOR, SERIES_TAG]) })
  const r = await joinWaitlist(k.kit, input({ email: "i@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(tagCalls(k.calls).length, 3)
  assert.equal(r.ok, false)
  assert.ok(!r.ok && /inactive/.test(r.reason))
})

test("existing subscriber in state inactive that Kit reactivates: success", async () => {
  const k = fakeKit()
  k.subs.set("i@x.com", { id: 7, email: "i@x.com", state: "inactive", fields: {}, tags: new Set() })
  const orig = k.kit.tagSubscribe
  k.kit.tagSubscribe = async (id, p) => {
    const ok = await orig(id, p)
    k.subs.get("i@x.com")!.state = "active"
    return ok
  }
  const r = await joinWaitlist(k.kit, input({ email: "i@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, true)
  assert.equal(tagCalls(k.calls).length, 3)
})

test("read-back: find returns null after successful tag calls", async () => {
  const k = fakeKit()
  let n = 0
  const orig = k.kit.findSubscriber
  k.kit.findSubscriber = async (e) => (++n === 1 ? orig(e) : null)
  const r = await joinWaitlist(k.kit, input({ email: "g@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, false)
})

test("read-back: find returns undefined (lookup failed) after tagging", async () => {
  const k = fakeKit()
  let n = 0
  const orig = k.kit.findSubscriber
  k.kit.findSubscriber = async (e) => (++n === 1 ? orig(e) : undefined)
  const r = await joinWaitlist(k.kit, input({ email: "g@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, false)
})

test("read-back: state is capitalized \"Active\" -> success", async () => {
  const k = fakeKit()
  const orig = k.kit.findSubscriber
  k.kit.findSubscriber = async (e) => {
    const s = await orig(e)
    return s ? { ...s, state: "Active" } : s
  }
  const r = await joinWaitlist(k.kit, input({ email: "g@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, true)
})

test("read-back: tag list missing exactly one tag -> failure naming it", async () => {
  for (const drop of [WAITLIST_TAG, TOR, SERIES_TAG]) {
    const k = fakeKit()
    const orig = k.kit.subscriberTags
    k.kit.subscriberTags = async (id) => ((await orig(id)) ?? []).filter((t) => t !== drop)
    const r = await joinWaitlist(k.kit, input({ email: "m@x.com", city: "Toronto, ON" }), NOW)
    assert.equal(r.ok, false, drop)
    assert.ok(!r.ok && r.reason.includes(drop) && r.reason.startsWith("missing after signup"), JSON.stringify(r))
  }
})

test("read-back: tag names returned in different case still count", async () => {
  const k = fakeKit()
  const orig = k.kit.subscriberTags
  k.kit.subscriberTags = async (id) => ((await orig(id)) ?? []).map((t) => t.toUpperCase())
  const r = await joinWaitlist(k.kit, input({ email: "m@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, true)
})

test("read-back: subscriberTags returns null only on the read-back (new person, no earlier call)", async () => {
  const k = fakeKit()
  k.fail.add("subTags")
  const r = await joinWaitlist(k.kit, input({ email: "new@x.com", city: "Toronto, ON" }), NOW)
  assert.deepEqual(r, { ok: false, reason: "read-back tags failed" })
  // Tags were written, so a retry later succeeds without re-adding.
  k.fail.clear()
  k.calls.length = 0
  const r2 = await joinWaitlist(k.kit, input({ email: "new@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r2.ok, true)
  assert.deepEqual(tagCalls(k.calls), [])
})

test("read-back: subscriberTags works before but fails on read-back (existing person)", async () => {
  const k = fakeKit()
  k.subs.set("x@x.com", { id: 7, email: "x@x.com", state: "active", fields: {}, tags: new Set() })
  let n = 0
  const orig = k.kit.subscriberTags
  k.kit.subscriberTags = async (id) => (++n === 1 ? orig(id) : null)
  const r = await joinWaitlist(k.kit, input({ email: "x@x.com", city: "Toronto, ON" }), NOW)
  assert.deepEqual(r, { ok: false, reason: "read-back tags failed" })
})

test("tag subscribe fails on the third call only: error names the tag, first two landed", async () => {
  const k = fakeKit()
  k.fail.add(`tag:${SERIES_TAG}`)
  const r = await joinWaitlist(k.kit, input({ email: "p@x.com", city: "Toronto, ON" }), NOW)
  assert.deepEqual(r, { ok: false, reason: `tag failed: ${SERIES_TAG}` })
  assert.deepEqual([...k.subs.get("p@x.com")!.tags].sort(), [WAITLIST_TAG, TOR].sort())
})

test("first tag call (the one carrying fields) fails: retry still sends consent", async () => {
  const k = fakeKit()
  k.fail.add(`tag:${WAITLIST_TAG}`)
  await joinWaitlist(k.kit, input({ email: "p@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(k.subs.size, 0)
  k.fail.clear()
  k.payloads.length = 0
  const r = await joinWaitlist(k.kit, input({ email: "p@x.com", city: "Toronto, ON" }), NOW)
  assert.equal(r.ok, true)
  assert.ok(FIELD_CONSENT in k.subs.get("p@x.com")!.fields!)
})

test("consent value format is version | ISO time | page", async () => {
  const k = fakeKit()
  await joinWaitlist(k.kit, input({ email: "q@x.com", city: "Toronto, ON" }), new Date("2027-01-02T03:04:05.678Z"))
  assert.equal(k.subs.get("q@x.com")!.fields![FIELD_CONSENT], "dcc-2027-v1 | 2027-01-02T03:04:05.678Z | andpacker.com/daycarecomedy")
})

test("Other city twice with different text: second text is stored (or at least not silently dropped)", async () => {
  const k = fakeKit()
  await joinWaitlist(k.kit, input({ email: "oo@x.com", city: "Other", otherCity: "Paris" }), NOW)
  await joinWaitlist(k.kit, input({ email: "oo@x.com", city: "Other", otherCity: "Berlin" }), NOW)
  assert.equal(k.subs.get("oo@x.com")!.fields![FIELD_OTHER_CITY], "Paris; Berlin") // Other cities accumulate (design choice)
})
