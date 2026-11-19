/**
 * Offline tests for scripts/eventbrite-status.js (Low Tickets / Sold Out from
 * Andrew's own Eventbrite counts). Fetch is injected; no network.
 *
 * Run with: node scripts/test-eventbrite-status.mjs
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const {
  EVENTBRITE_API,
  LOW_TICKETS_AT,
  eventbriteIdFrom,
  statusFromEvent,
  applyEventbriteStatus,
  applyStatusOverrides,
  overrideFor,
} = require("./eventbrite-status.js");

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL ${name}\n       ${err.message.split("\n").join("\n       ")}`);
  }
}

const MINE = "111";
const OTHER = "999";
const ORGS = new Set([MINE]);

// One live event of Andrew's. `classes` = [sold, total, extra fields].
function ev({ classes, capacity = null, status = "live", org = MINE, isSoldOut = false, date = "2026-11-27", seriesParent = false } = {}) {
  return {
    organization_id: org,
    status,
    start: { local: `${date}T20:30:00` },
    is_series_parent: seriesParent,
    capacity,
    ticket_availability: { is_sold_out: isSoldOut },
    ticket_classes: classes.map(([sold, total, extra = {}]) => ({
      quantity_sold: sold,
      quantity_total: total,
      on_sale_status: sold >= total ? "SOLD_OUT" : "AVAILABLE",
      hidden: false,
      ...extra,
    })),
  };
}
const status = (e) => statusFromEvent(e, ORGS, "2026-11-27").status;

console.log("eventbriteIdFrom");
await test("slugged .ca URL", () =>
  assert.equal(
    eventbriteIdFrom("https://www.eventbrite.ca/e/andrew-packer-stand-up-comedy-live-in-collingwood-830-pm-show-tickets-1988930483617"),
    "1988930483617"
  ));
await test("slugged .com URL with ?aff", () =>
  assert.equal(eventbriteIdFrom("https://www.eventbrite.com/e/laugh-it-off-tickets-2003019235453?aff=ebdssbdestsearch"), "2003019235453"));
await test("slug-less URL with ?aff (real form on this site)", () =>
  assert.equal(eventbriteIdFrom("https://www.eventbrite.ca/e/1990575761688?aff=oddtdtcreator"), "1990575761688"));
await test("trailing slash and #fragment", () => {
  assert.equal(eventbriteIdFrom("https://www.eventbrite.ca/e/show-tickets-2004738078559/"), "2004738078559");
  assert.equal(eventbriteIdFrom("https://www.eventbrite.ca/e/show-tickets-2004738078559#tickets"), "2004738078559");
  assert.equal(eventbriteIdFrom("https://www.eventbrite.co.uk/e/2004738078559/#x"), "2004738078559");
});
await test("not Eventbrite: punchup, presale, Comedy Bar, empty, undefined", () => {
  assert.equal(eventbriteIdFrom("https://punchup.live/e/8c666789-cd33-4a94-8695-85ad5f742a31"), null);
  assert.equal(eventbriteIdFrom("https://andpacker.com/presale"), null);
  assert.equal(eventbriteIdFrom("https://comedybar.ca/shows/laugh-it-off-1234567890"), null);
  assert.equal(eventbriteIdFrom(""), null);
  assert.equal(eventbriteIdFrom(undefined), null);
});
await test("a digit run that merely ends in the slug is not mistaken for a longer id", () =>
  assert.equal(eventbriteIdFrom("https://www.eventbrite.ca/e/show-2026-tickets-1988930483617?x=1"), "1988930483617"));

console.log("statusFromEvent");
await test("Collingwood 8:30 today: GA 95/97 + accessible 2/2, cap 99 -> low_tickets", () =>
  assert.equal(status(ev({ classes: [[95, 97], [2, 2]], capacity: 99 })), "low_tickets"));
await test("Collingwood 6 PM today: 36/97 + 0/2, cap 99 -> on_sale", () =>
  assert.equal(status(ev({ classes: [[36, 97], [0, 2]], capacity: 99 })), "on_sale"));
await test(`threshold is ${LOW_TICKETS_AT}: 80/100 low, 79/100 on_sale`, () => {
  assert.equal(LOW_TICKETS_AT, 0.8);
  assert.equal(status(ev({ classes: [[80, 100]], capacity: 100 })), "low_tickets");
  assert.equal(status(ev({ classes: [[79, 100]], capacity: 100 })), "on_sale");
});
await test("99/99 -> sold_out", () =>
  assert.equal(status(ev({ classes: [[97, 97], [2, 2]], capacity: 99 })), "sold_out"));
await test("is_sold_out flag wins even if counts show seats", () =>
  assert.equal(status(ev({ classes: [[50, 99]], capacity: 99, isSoldOut: true })), "sold_out"));
await test("hidden comps use up capacity: cap 99, 90 visible sold + 9 hidden -> sold_out", () =>
  assert.equal(status(ev({ classes: [[90, 99], [9, 9, { hidden: true }]], capacity: 99 })), "sold_out"));
await test("hidden class seats are never 'left': visible 99/99, hidden 0/10, no capacity -> sold_out", () =>
  assert.equal(status(ev({ classes: [[99, 99], [0, 10, { hidden: true, on_sale_status: "AVAILABLE" }]] })), "sold_out"));
await test("capacity null falls back to the class sum: 85/100 -> low", () =>
  assert.equal(status(ev({ classes: [[85, 100]] })), "low_tickets"));
await test("ended early-bird seats are not 'left': EB ended 15/20, GA 79/80, cap 100 -> low", () =>
  assert.equal(status(ev({ classes: [[15, 20, { on_sale_status: "SALES_ENDED" }], [79, 80]], capacity: 100 })), "low_tickets"));
await test("nothing on sale right now (all NOT_YET_ON_SALE) -> null, no warning", () => {
  const d = statusFromEvent(ev({ classes: [[0, 99, { on_sale_status: "NOT_YET_ON_SALE" }]], capacity: 99 }), ORGS, "2026-11-27");
  assert.deepEqual(d, { status: null, warning: null });
});
await test("not live (completed / deleted / draft / canceled) -> null, no warning", () => {
  for (const s of ["completed", "deleted", "draft", "canceled", "ended"]) {
    assert.deepEqual(statusFromEvent(ev({ classes: [[99, 99]], capacity: 99, status: s, isSoldOut: true }), ORGS, "2026-11-27"), { status: null, warning: null }, s);
  }
});
await test("started counts as live", () =>
  assert.equal(status(ev({ classes: [[95, 99]], capacity: 99, status: "started" })), "low_tickets"));
await test("NOT his org -> null with no warning, even with is_sold_out true", () => {
  assert.deepEqual(statusFromEvent(ev({ classes: [[99, 99]], capacity: 99, org: OTHER, isSoldOut: true }), ORGS), { status: null, warning: null });
});
await test("200 for another promoter's event (no quantity_sold, capacity null) -> null, no warning", () => {
  const theirs = {
    organization_id: OTHER, status: "live", capacity: null,
    ticket_availability: { is_sold_out: false },
    ticket_classes: [{ name: "GA", on_sale_status: "AVAILABLE" }],
  };
  assert.deepEqual(statusFromEvent(theirs, ORGS, "2026-11-27"), { status: null, warning: null });
});
await test("HIS live event with no quantity_sold -> null + 'counts unreadable' warning", () => {
  const e = ev({ classes: [[0, 99]], capacity: 99 });
  delete e.ticket_classes[0].quantity_sold;
  const d = statusFromEvent(e, ORGS, "2026-11-27");
  assert.equal(d.status, null);
  assert.match(d.warning, /counts unreadable/);
});
await test("HIS live event with a class missing quantity_total (donation) -> warning", () => {
  const e = ev({ classes: [[40, 99], [3, 0]], capacity: 99 });
  delete e.ticket_classes[1].quantity_total;
  assert.match(statusFromEvent(e, ORGS, "2026-11-27").warning, /counts unreadable/);
});
await test("HIS live event with no ticket classes -> warning", () => {
  const e = ev({ classes: [] });
  assert.match(statusFromEvent(e, ORGS, "2026-11-27").warning, /counts unreadable/);
});
await test("series parent (Chefs Hall 798883922317, 'started' since 2024) never decides, no warning", () =>
  assert.deepEqual(
    statusFromEvent(ev({ classes: [[10, 150]], capacity: 150, status: "started", date: "2024-02-16", seriesParent: true }), ORGS, "2026-11-20"),
    { status: null, warning: null }
  ));
await test("own event dated a different day than the show -> null + 'check the ticket link' warning", () => {
  const d = statusFromEvent(ev({ classes: [[97, 99]], capacity: 99, date: "2026-10-03" }), ORGS, "2026-11-27");
  assert.equal(d.status, null);
  assert.match(d.warning, /dated 2026-10-03 but the show is 2026-11-27/);
});
await test("another promoter's event on the wrong date: still silent", () =>
  assert.deepEqual(statusFromEvent(ev({ classes: [[1, 9]], org: OTHER, date: "2025-01-01" }), ORGS, "2026-11-27"), { status: null, warning: null }));
await test("organization_id compared as a string (API sends strings, Set holds strings)", () =>
  assert.equal(statusFromEvent(ev({ classes: [[97, 99]], capacity: 99, org: 111 }), ORGS, "2026-11-27").status, "low_tickets"));

console.log("applyEventbriteStatus");
const URL_830 = "https://www.eventbrite.ca/e/andrew-packer-stand-up-comedy-live-in-collingwood-830-pm-show-tickets-1988930483617";
const URL_6PM = "https://www.eventbrite.ca/e/andrew-packer-stand-up-comedy-live-in-collingwood-6-pm-show-tickets-2004738078559";
const ORGS_BODY = { organizations: [{ id: MINE }] };

// fetchJson stub: routes by URL; counts calls.
function stub(events, { orgsStatus = 200, eventStatus = {} } = {}) {
  const calls = [];
  const fetchJson = async (url, token) => {
    calls.push({ url, token });
    if (url === `${EVENTBRITE_API}/users/me/organizations/`) return { status: orgsStatus, body: orgsStatus === 200 ? ORGS_BODY : null };
    const id = url.match(/events\/(\d+)\//)[1];
    if (eventStatus[id]) return { status: eventStatus[id], body: null };
    return events[id] ? { status: 200, body: events[id] } : { status: 404, body: null };
  };
  return { fetchJson, calls };
}
const quiet = () => {};
const show = (o) => ({ date: "2026-11-27", slug: "simcoe-street-theatre", ...o });

await test("punchup sold_out + EB 2 left -> low_tickets, logged without counts", async () => {
  const s = show({ time: "8:30 PM", ticketUrl: URL_830, status: "sold_out" });
  const logs = [];
  const { fetchJson } = stub({ "1988930483617": ev({ classes: [[95, 97], [2, 2]], capacity: 99 }) });
  const r = await applyEventbriteStatus([s], { token: "t", fetchJson, log: (l) => logs.push(l) });
  assert.equal(s.status, "low_tickets");
  assert.deepEqual(r.warnings, []);
  assert.ok(r.decided.has(s));
  assert.deepEqual(logs, ["Eventbrite 1988930483617 -> low_tickets (punchup: sold_out)"]);
  assert.ok(!/\d+\s*\/\s*\d+|95|97|99/.test(logs[0].replace("1988930483617", "")), "a count leaked into the log");
});
await test("punchup sold_out + EB 40% sold -> on_sale (Eventbrite wins, Andrew's call)", async () => {
  const s = show({ ticketUrl: URL_6PM, status: "sold_out" });
  const { fetchJson } = stub({ "2004738078559": ev({ classes: [[40, 100]], capacity: 100 }) });
  await applyEventbriteStatus([s], { token: "t", fetchJson, log: quiet });
  assert.equal(s.status, "on_sale");
});
await test("punchup on_sale + EB 0 left -> sold_out", async () => {
  const s = show({ ticketUrl: URL_6PM, status: "on_sale" });
  const { fetchJson } = stub({ "2004738078559": ev({ classes: [[97, 97], [2, 2]], capacity: 99 }) });
  await applyEventbriteStatus([s], { token: "t", fetchJson, log: quiet });
  assert.equal(s.status, "sold_out");
});
await test("another promoter's event: punchup status stands, no warning", async () => {
  const s = show({ ticketUrl: URL_6PM, status: "on_sale" });
  const { fetchJson } = stub({ "2004738078559": ev({ classes: [[99, 99]], capacity: 99, org: OTHER, isSoldOut: true }) });
  const r = await applyEventbriteStatus([s], { token: "t", fetchJson, log: quiet });
  assert.equal(s.status, "on_sale");
  assert.deepEqual(r.warnings, []);
  assert.equal(r.decided.size, 0);
});
await test("no token: nothing changes, one warning, no fetch", async () => {
  const s = show({ ticketUrl: URL_830, status: "sold_out" });
  const { fetchJson, calls } = stub({});
  const r = await applyEventbriteStatus([s], { token: "", fetchJson, log: quiet });
  assert.equal(s.status, "sold_out");
  assert.equal(calls.length, 0);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /EVENTBRITE_API_TOKEN missing/);
});
await test("no Eventbrite shows at all: no warning even without a token", async () => {
  const r = await applyEventbriteStatus([show({ ticketUrl: "https://comedybar.ca/x", status: "on_sale" })], { token: "", log: quiet });
  assert.deepEqual(r.warnings, []);
});
await test("token rejected (401 on organizations): nothing changes, warning names the secret", async () => {
  const s = show({ ticketUrl: URL_830, status: "sold_out" });
  const { fetchJson, calls } = stub({}, { orgsStatus: 401 });
  const r = await applyEventbriteStatus([s], { token: "bad", fetchJson, log: quiet });
  assert.equal(s.status, "sold_out");
  assert.equal(calls.length, 1);
  assert.match(r.warnings[0], /401.*EVENTBRITE_API_TOKEN/);
});
await test("organizations unreadable (500 / network): nothing changes, warning", async () => {
  for (const code of [500, 0]) {
    const s = show({ ticketUrl: URL_830, status: "sold_out" });
    const { fetchJson } = stub({}, { orgsStatus: code });
    const r = await applyEventbriteStatus([s], { token: "t", fetchJson, log: quiet });
    assert.equal(s.status, "sold_out");
    assert.match(r.warnings[0], /organizations/);
  }
});
await test("event fetch error: punchup status stands, warning names the id", async () => {
  const s = show({ ticketUrl: URL_830, status: "sold_out" });
  const { fetchJson } = stub({}, { eventStatus: { "1988930483617": 500 } });
  const r = await applyEventbriteStatus([s], { token: "t", fetchJson, log: quiet });
  assert.equal(s.status, "sold_out");
  assert.match(r.warnings[0], /1988930483617.*HTTP 500/);
});
await test("own live event with a class missing quantity_total: no change + 'counts unreadable' warning", async () => {
  const e = ev({ classes: [[95, 97], [2, 2]], capacity: 99 });
  delete e.ticket_classes[1].quantity_total;
  const s = show({ ticketUrl: URL_830, status: "sold_out" });
  const { fetchJson } = stub({ "1988930483617": e });
  const r = await applyEventbriteStatus([s], { token: "t", fetchJson, log: quiet });
  assert.equal(s.status, "sold_out");
  assert.match(r.warnings[0], /1988930483617: own live event, counts unreadable/);
});
await test("presale / punchup URLs are never fetched or touched", async () => {
  const a = show({ ticketUrl: "https://andpacker.com/presale", status: "coming_soon" });
  const b = show({ ticketUrl: "https://punchup.live/e/8c666789", status: "sold_out" });
  const { fetchJson, calls } = stub({});
  const r = await applyEventbriteStatus([a, b], { token: "t", fetchJson, log: quiet });
  assert.equal(calls.length, 0);
  assert.equal(a.status, "coming_soon");
  assert.equal(b.status, "sold_out");
  assert.deepEqual(r.warnings, []);
});
await test("one listing shared by two rows is fetched once and sets both", async () => {
  const a = show({ time: "7 PM", ticketUrl: URL_6PM, status: "on_sale" });
  const b = show({ time: "9 PM", ticketUrl: URL_6PM + "?aff=x", status: "on_sale" });
  const { fetchJson, calls } = stub({ "2004738078559": ev({ classes: [[90, 100]], capacity: 100 }) });
  await applyEventbriteStatus([a, b], { token: "t", fetchJson, log: quiet });
  assert.equal(calls.filter((c) => c.url.includes("/events/")).length, 1);
  assert.equal(a.status, "low_tickets");
  assert.equal(b.status, "low_tickets");
});
await test("rows on two dates behind one listing are judged per row (only the matching date decides)", async () => {
  const today = show({ date: "2026-11-27", ticketUrl: URL_6PM, status: "on_sale" });
  const other = show({ date: "2026-12-04", ticketUrl: URL_6PM, status: "on_sale" });
  const { fetchJson } = stub({ "2004738078559": ev({ classes: [[95, 100]], capacity: 100, date: "2026-11-27" }) });
  const r = await applyEventbriteStatus([today, other], { token: "t", fetchJson, log: quiet });
  assert.equal(today.status, "low_tickets");
  assert.equal(other.status, "on_sale");
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /show is 2026-12-04/);
});
await test("the token is passed to every call", async () => {
  const { fetchJson, calls } = stub({ "1988930483617": ev({ classes: [[1, 99]], capacity: 99 }) });
  await applyEventbriteStatus([show({ ticketUrl: URL_830, status: "on_sale" })], { token: "secret-t", fetchJson, log: quiet });
  assert.ok(calls.length === 2 && calls.every((c) => c.token === "secret-t"));
});

await test("total deadline: stops calling Eventbrite, keeps punchup's status for the rest, warns", async () => {
  let t = 0;
  const a = show({ ticketUrl: URL_830, status: "sold_out" });
  const b = show({ ticketUrl: URL_6PM, status: "on_sale" });
  const events = { "1988930483617": ev({ classes: [[97, 99]], capacity: 99 }), "2004738078559": ev({ classes: [[99, 99]], capacity: 99 }) };
  const base = stub(events);
  // every call "takes" 40 s of the 60 s budget
  const slow = async (url, tok) => { t += 40000; return base.fetchJson(url, tok); };
  const r = await applyEventbriteStatus([a, b], { token: "t", fetchJson: slow, log: quiet, now: () => t });
  assert.equal(a.status, "low_tickets");
  assert.equal(b.status, "on_sale");
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /too slow.*2004738078559/);
});

console.log("applyStatusOverrides");
await test("applies to an on_sale club row", () => {
  const s = show({ slug: "comedy-bar", ticketUrl: "https://comedybar.ca/shows/laugh-it-off", status: "on_sale" });
  applyStatusOverrides([s], { "comedybar.ca/shows/laugh-it-off": "low_tickets" }, new Set(), quiet);
  assert.equal(s.status, "low_tickets");
});
await test("never applies to a sold_out row (punchup marked it sold out)", () => {
  const s = show({ ticketUrl: "https://comedybar.ca/shows/laugh-it-off", status: "sold_out" });
  applyStatusOverrides([s], { "comedybar.ca/shows/laugh-it-off": "low_tickets" }, new Set(), quiet);
  assert.equal(s.status, "sold_out");
});
await test("never overrides an Eventbrite decision", () => {
  const s = show({ ticketUrl: URL_6PM, status: "on_sale" });
  applyStatusOverrides([s], { "2004738078559": "low_tickets" }, new Set([s]), quiet);
  assert.equal(s.status, "on_sale");
});
await test("only low_tickets is accepted as an override value", () => {
  const s = show({ ticketUrl: "https://comedybar.ca/x", status: "on_sale" });
  applyStatusOverrides([s], { "comedybar.ca/x": "sold_out" }, new Set(), quiet);
  assert.equal(s.status, "on_sale");
});

await test("an empty or blank needle matches nothing", () => {
  const s = show({ ticketUrl: "https://comedybar.ca/x", status: "on_sale" });
  applyStatusOverrides([s], { "": "low_tickets", "  ": "low_tickets" }, new Set(), quiet);
  assert.equal(s.status, "on_sale");
});

console.log("overrideFor");
const MAP = {
  "2026-11-27|simcoe-street-theatre|8:30 PM": "EB-830",
  "2026-07-24|chefs-hall": "EB-CH",
};
await test("timed key hits ONLY the 8:30 row of the Collingwood pair", () => {
  assert.deepEqual(overrideFor(MAP, show({ time: "8:30 PM" })), { key: "2026-11-27|simcoe-street-theatre|8:30 PM", value: "EB-830" });
  assert.equal(overrideFor(MAP, show({ time: "6 PM" })), null);
  assert.equal(overrideFor(MAP, show({})), null);
});
await test("date|slug key still hits every show that night", () => {
  assert.equal(overrideFor(MAP, { date: "2026-07-24", slug: "chefs-hall", time: "8 PM" }).value, "EB-CH");
  assert.equal(overrideFor(MAP, { date: "2026-07-24", slug: "chefs-hall" }).value, "EB-CH");
});
await test("timed key wins over date|slug when both exist", () => {
  const m = { "2026-11-27|simcoe-street-theatre": "ALL", "2026-11-27|simcoe-street-theatre|8:30 PM": "LATE" };
  assert.equal(overrideFor(m, show({ time: "8:30 PM" })).value, "LATE");
  assert.equal(overrideFor(m, show({ time: "6 PM" })).value, "ALL");
});
await test("inherited (prototype) keys are not overrides", () => {
  const inherited = Object.create({ "2026-11-27|simcoe-street-theatre": "PROTO" });
  assert.equal(overrideFor(inherited, show({ time: "6 PM" })), null);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
