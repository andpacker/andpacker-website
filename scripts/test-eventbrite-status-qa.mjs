import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { eventbriteIdFrom, statusFromEvent, applyEventbriteStatus, applyStatusOverrides, overrideFor } = require("./eventbrite-status.js");

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ok  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message.split("\n").join("\n       ")}`); }
}
const ORGS = new Set(["111"]);
const tc = (sold, total, x = {}) => ({ quantity_sold: sold, quantity_total: total, ...x });
const ev = (o = {}) => ({ organization_id: "111", status: "live", start: { local: "2026-11-27T20:30:00" }, ticket_classes: [tc(0, 100)], ...o });
const st = (e, d = "2026-11-27") => statusFromEvent(e, ORGS, d);

// URL
await test("uppercase host", () => assert.equal(eventbriteIdFrom("https://WWW.EVENTBRITE.COM/E/Show-123456789"), "123456789"));
await test("eventbrite.com.au", () => assert.equal(eventbriteIdFrom("https://www.eventbrite.com.au/e/x-y-123456789012"), "123456789012"));
await test("eventbrite.ca slugless + query", () => assert.equal(eventbriteIdFrom("https://eventbrite.ca/e/123456789?aff=x"), "123456789"));
await test("8-digit id null", () => assert.equal(eventbriteIdFrom("https://eventbrite.com/e/show-12440078"), null));
await test("whitespace trimmed", () => assert.equal(eventbriteIdFrom("  https://eventbrite.com/e/s-123456789/  \n"), "123456789"));
await test("fragment", () => assert.equal(eventbriteIdFrom("https://eventbrite.com/e/s-123456789#tix"), "123456789"));
await test("non-string / empty", () => { for (const v of [null, undefined, 5, {}, ""]) assert.equal(eventbriteIdFrom(v), null); });
await test("id followed by letters not matched", () => assert.equal(eventbriteIdFrom("https://eventbrite.com/e/s-123456789abc"), null));
await test("non-/e/ path null", () => assert.equal(eventbriteIdFrom("https://eventbrite.com/o/org-123456789"), null));
await test("other host null", () => assert.equal(eventbriteIdFrom("https://punchup.live/e/s-123456789"), null));
await test("lookalike host (evil.com/?u=eventbrite.com/e/..) null", () => assert.equal(eventbriteIdFrom("https://evil.com/?u=eventbrite.com/e/s-123456789"), null));

// statusFromEvent
await test("numeric org id compared as string", () => assert.equal(st(ev({ organization_id: 111 })).status, "on_sale"));
await test("negative count unreadable", () => assert.equal(st(ev({ ticket_classes: [tc(-1, 100)] })).warning, "own live event, counts unreadable"));
await test("NaN/Infinity/string count unreadable", () => { for (const bad of [NaN, Infinity, "5", null]) assert.equal(st(ev({ ticket_classes: [tc(bad, 100)] })).status, null); });
await test("null ticket class entry does not throw", () => { const r = st(ev({ ticket_classes: [null] })); assert.equal(r.status, null); assert.ok(r.warning); });
await test("empty classes unreadable", () => assert.ok(st(ev({ ticket_classes: [] })).warning));
await test("capacity 0 falls back to class sum", () => assert.equal(st(ev({ capacity: 0, ticket_classes: [tc(80, 100)] })).status, "low_tickets"));
await test("all totals 0, no capacity -> unreadable not crash", () => assert.equal(st(ev({ ticket_classes: [tc(0, 0)] })).status, null));
await test("capacity smaller than class sum caps left", () => assert.equal(st(ev({ capacity: 100, ticket_classes: [tc(0, 200)] })).status, "on_sale"));
await test("capacity < sold -> sold_out", () => assert.equal(st(ev({ capacity: 100, ticket_classes: [tc(100, 200)] })).status, "sold_out"));
await test("hidden sold counts toward allSold -> sold_out", () => assert.equal(st(ev({ capacity: 100, ticket_classes: [tc(10, 100), tc(90, 90, { hidden: true })] })).status, "sold_out"));
await test("hidden unsold not counted as left", () => assert.equal(st(ev({ ticket_classes: [tc(100, 100), tc(0, 50, { hidden: true })] })).status, "sold_out"));
await test("exactly 80% -> low_tickets", () => assert.equal(st(ev({ ticket_classes: [tc(80, 100)] })).status, "low_tickets"));
await test("79% -> on_sale", () => assert.equal(st(ev({ ticket_classes: [tc(79, 100)] })).status, "on_sale"));
await test("float counts don't crash", () => assert.ok(["on_sale", "low_tickets", "sold_out", null].includes(st(ev({ ticket_classes: [tc(0.5, 10.5)] })).status)));
await test("is_sold_out flag wins", () => assert.equal(st(ev({ ticket_availability: { is_sold_out: true } })).status, "sold_out"));
await test("is_sold_out string 'true' ignored", () => assert.equal(st(ev({ ticket_availability: { is_sold_out: "true" } })).status, "on_sale"));
await test("not-yet-on-sale only -> null, no warning", () => { const r = st(ev({ ticket_classes: [tc(0, 100, { on_sale_status: "NOT_YET_ON_SALE" })] })); assert.deepEqual(r, { status: null, warning: null }); });
await test("SALES_ENDED class excluded from left", () => assert.equal(st(ev({ ticket_classes: [tc(50, 50), tc(0, 50, { on_sale_status: "SALES_ENDED" })] })).status, "sold_out"));
await test("status started ok; draft/canceled/completed silent", () => { assert.equal(st(ev({ status: "started" })).status, "on_sale"); for (const s of ["draft", "canceled", "completed", undefined]) assert.deepEqual(st(ev({ status: s })), { status: null, warning: null }); });
await test("series parent silent", () => assert.deepEqual(st(ev({ is_series_parent: true })), { status: null, warning: null }));
await test("not mine silent even with bad counts", () => assert.deepEqual(st(ev({ organization_id: "9", ticket_classes: [] })), { status: null, warning: null }));
await test("missing org id silent", () => { const e = ev(); delete e.organization_id; assert.deepEqual(st(e), { status: null, warning: null }); });
await test("date mismatch warns", () => { const r = st(ev(), "2026-11-28"); assert.equal(r.status, null); assert.match(r.warning, /2026-11-27/); });
await test("missing start warns on mismatch", () => { const e = ev(); delete e.start; const r = st(e); assert.equal(r.status, null); assert.ok(r.warning); });
await test("junk inputs silent", () => { for (const e of [null, undefined, 5, "x"]) assert.deepEqual(statusFromEvent(e, ORGS, "d"), { status: null, warning: null }); assert.deepEqual(statusFromEvent(ev(), null, "d"), { status: null, warning: null }); });
await test("no showDate skips date check", () => assert.equal(statusFromEvent(ev(), ORGS, undefined).status, "on_sale"));

// applyEventbriteStatus
const mk = (url, date = "2026-11-27") => ({ date, slug: "s", ticketUrl: url, status: "sold_out" });
const U = "https://eventbrite.ca/e/s-123456789";
const okOrgs = { status: 200, body: { organizations: [{ id: "111" }] } };
const router = (event) => async (u) => u.includes("organizations") ? okOrgs : event;
await test("fetchJson throwing on orgs does not throw", async () => {
  const s = [mk(U)];
  const r = await applyEventbriteStatus(s, { token: "t", fetchJson: async () => { throw new Error("boom"); }, log() {} });
  assert.equal(s[0].status, "sold_out"); assert.ok(r.warnings.length >= 1);
});
await test("fetchJson throwing on event does not throw, other shows still processed", async () => {
  const s = [mk(U), mk("https://eventbrite.ca/e/t-222222222")];
  const f = async (u) => { if (u.includes("organizations")) return okOrgs; if (u.includes("123456789")) throw new Error("x"); return { status: 200, body: ev({ ticket_classes: [tc(0, 100)] }) }; };
  const r = await applyEventbriteStatus(s, { token: "t", fetchJson: f, log() {} });
  assert.equal(s[0].status, "sold_out"); assert.equal(s[1].status, "on_sale"); assert.ok(r.warnings.length >= 1);
});
await test("orgs list containing null does not throw", async () => {
  const s = [mk(U)];
  await applyEventbriteStatus(s, { token: "t", fetchJson: async (u) => u.includes("organizations") ? { status: 200, body: { organizations: [null, { id: 111 }] } } : { status: 200, body: ev() }, log() {} });
  assert.equal(s[0].status, "on_sale");
});
await test("numeric org ids in organizations response", async () => {
  const s = [mk(U)];
  await applyEventbriteStatus(s, { token: "t", fetchJson: async (u) => u.includes("organizations") ? { status: 200, body: { organizations: [{ id: 111 }] } } : { status: 200, body: ev() }, log() {} });
  assert.equal(s[0].status, "on_sale");
});
await test("status 200 body null warns", async () => {
  const s = [mk(U)];
  const r = await applyEventbriteStatus(s, { token: "t", fetchJson: router({ status: 200, body: null }), log() {} });
  assert.equal(s[0].status, "sold_out"); assert.equal(r.warnings.length, 1);
});
await test("orgs 200 body null / non-array warns", async () => {
  for (const body of [null, {}, { organizations: "x" }]) {
    const s = [mk(U)];
    const r = await applyEventbriteStatus(s, { token: "t", fetchJson: async () => ({ status: 200, body }), log() {} });
    assert.equal(s[0].status, "sold_out"); assert.equal(r.warnings.length, 1);
  }
});
await test("401 warns once, no event fetches", async () => {
  let n = 0; const s = [mk(U)];
  const r = await applyEventbriteStatus(s, { token: "t", fetchJson: async () => { n++; return { status: 401, body: null }; }, log() {} });
  assert.equal(n, 1); assert.match(r.warnings[0], /401/);
});
await test("missing token: no fetch, warning; no eventbrite shows: no warning", async () => {
  let n = 0; const f = async () => { n++; return {}; };
  const r = await applyEventbriteStatus([mk(U)], { fetchJson: f, log() {} });
  assert.equal(n, 0); assert.equal(r.warnings.length, 1);
  const r2 = await applyEventbriteStatus([mk("https://x.com"), mk(undefined), mk(null)], { fetchJson: f, log() {} });
  assert.equal(r2.warnings.length, 0); assert.equal(n, 0);
});
await test("404 / 500 / network error event -> warning, status kept", async () => {
  for (const status of [404, 500, 0]) {
    const s = [mk(U)];
    const r = await applyEventbriteStatus(s, { token: "t", fetchJson: router({ status, body: null }), log() {} });
    assert.equal(s[0].status, "sold_out"); assert.equal(r.warnings.length, 1);
  }
});
await test("logs never contain counts", async () => {
  const logs = []; const s = [mk(U)];
  await applyEventbriteStatus(s, { token: "t", fetchJson: router({ status: 200, body: ev({ ticket_classes: [tc(877, 4321)] }) }), log: (m) => logs.push(m) });
  const all = logs.join(" "); assert.ok(logs.length); assert.ok(!/877|4321/.test(all));
});
await test("same event, two dates: per-show decision, deduped warning", async () => {
  const s = [mk(U, "2026-11-27"), mk(U, "2026-11-28"), mk(U, "2026-11-29")];
  const r = await applyEventbriteStatus(s, { token: "t", fetchJson: router({ status: 200, body: ev() }), log() {} });
  assert.equal(s[0].status, "on_sale"); assert.equal(s[1].status, "sold_out"); assert.equal(r.decided.size, 1);
  assert.equal(r.warnings.length, 2);
});
await test("shows empty / token with no ids", async () => { const r = await applyEventbriteStatus([], { token: "t" }); assert.deepEqual(r.warnings, []); });

// overrides
await test("override applies only to undecided on_sale", () => {
  const a = { date: "d", slug: "s", ticketUrl: "https://X.com/Tix", status: "on_sale" };
  const b = { ...a }, c = { ...a, status: "sold_out" };
  applyStatusOverrides([a, b, c], { "x.com/tix": "low_tickets" }, new Set([b]), () => {});
  assert.equal(a.status, "low_tickets"); assert.equal(b.status, "on_sale"); assert.equal(c.status, "sold_out");
});
await test("override ignores non low_tickets values; null overrides ok", () => {
  const a = { date: "d", slug: "s", ticketUrl: "https://x.com", status: "on_sale" };
  applyStatusOverrides([a], { "x.com": "sold_out" }, undefined, () => {}); assert.equal(a.status, "on_sale");
  applyStatusOverrides([a], null, undefined, () => {}); assert.equal(a.status, "on_sale");
});
await test("overrideFor precedence and own keys", () => {
  const sh = { date: "2026-11-27", slug: "s", time: "8:30 PM" };
  const m = { "2026-11-27|s": 1, "2026-11-27|s|8:30 PM": 2 };
  assert.equal(overrideFor(m, sh).value, 2);
  assert.equal(overrideFor(m, { ...sh, time: "6 PM" }).value, 1);
  assert.equal(overrideFor(m, { ...sh, time: undefined }).value, 1);
  assert.equal(overrideFor({}, sh), null);
  assert.equal(overrideFor({}, { date: "constructor", slug: "", time: "" }), null);
  assert.equal(overrideFor(Object.create({ "2026-11-27|s": 9 }), sh), null);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
