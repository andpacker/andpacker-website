/**
 * Fixture tests for the punchup parser and the scrape safety guards
 * (scripts/punchup-parse.js). Runs the REAL extractEvents() inside headless
 * Chromium against static HTML served at punchup's URL, with every network
 * request blocked, so it is offline and deterministic.
 *
 * Needs Playwright + Chromium installed locally (the same ones the scraper uses):
 *   npm install --no-save playwright@1.64.1 && npx playwright install chromium
 *
 * Run with: node scripts/test-punchup-parse.mjs
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const {
  extractEvents,
  parsePunchupDate,
  findParseFailures,
  checkListSize,
} = require("./punchup-parse.js");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUNCHUP_URL = "https://punchup.live/AndrewPacker";

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${String(err && err.message).split("\n").join("\n        ")}`);
  }
}

// ─── Fixture builders, modelled on punchup's real row markup (Nov 2026) ─────────
// A real row is a grid of 4 children: [date+city links] [time+venue link]
// [ticket control] [share button]. Sold-out rows swap the ticket LINK for a
// "Join Waitlist" BUTTON. Collingwood's row (Nov 2026) has a 5th, empty div.
function controlHtml(control) {
  switch (control.type) {
    case "ticket":
      return `<a target="_blank" class="bg-primary rounded-lg text-white" href="${control.url}">Buy Tickets</a>`;
    case "waitlist":
      return `<button type="button" class="bg-primary rounded-lg text-white">Join Waitlist</button>`;
    case "ticket-button":
      return `<button type="button" class="bg-primary rounded-lg text-white">Buy Tickets</button>`;
    case "none":
      return "";
    default:
      throw new Error(`unknown control ${control.type}`);
  }
}

function row({
  id,
  href = `/e/${id}`,
  date,
  city,
  weekday = "Friday",
  time,
  venue,
  subtitle = "",
  control,
  emptySlot = false,     // the 5th, empty child seen on Collingwood
  wrapDepth = 0,         // extra wrapper divs around the whole row
  innerPadding = false,  // empty divs sprinkled between and inside the children
  venueClass = "text-sm font-semibold text-secondary-blue uppercase",
}) {
  const pad = innerPadding ? `<div></div><div><div></div></div>` : "";
  const timeSpans = time ? `<span>${weekday} – </span><span>${time}</span>` : `<span>${weekday}</span>`;
  let html =
    `<div class="grid gap-x-3 items-center grid-cols-[205px_1fr_180px_205px_50px]">` +
    `<div class="flex flex-col space-y-1.5">${pad}<div class="flex flex-col gap-1.5">` +
    `<a href="${href}"><p class="text-lg font-bold text-primary-blue leading-tight line-clamp-1">${date}</p></a>` +
    `<a href="${href}"><p class="text-base text-primary-blue font-medium line-clamp-1">${city}</p></a>` +
    `</div></div>${pad}` +
    `<div class="flex flex-col"><a class="flex flex-row items-center" href="${href}"><div class="flex flex-col gap-2"><div class="flex flex-col gap-1">` +
    `<p class="text-primary-blue text-sm md:text-base font-semibold">${timeSpans}</p>` +
    `<p class="${venueClass}">${venue}</p>` +
    (subtitle ? `<p class="text-primary-blue text-sm line-clamp-2">${subtitle}</p>` : "") +
    `</div></div></a></div>` +
    (emptySlot ? `<div class="flex flex-row justify-start pr-4"><div class="flex flex-col items-center gap-y-2 w-full"></div></div>` : "") +
    `<div class="flex flex-col-reverse md:flex-col gap-2 w-full">${pad}${controlHtml(control)}</div>` +
    `<div class="flex flex-row justify-end items-center"><button class="p-1.5 rounded-sm" aria-label="Share show"></button></div>` +
    `</div>`;
  for (let i = 0; i < wrapDepth; i++) html = `<div class="wrap-${i}">${html}</div>`;
  return html;
}

function page(rowsHtml, { header = true } = {}) {
  return (
    `<!doctype html><html><body><main>` +
    (header ? `<section><h1>Andrew Packer</h1><p>Toronto, ON</p><button>Subscribe for free</button></section>` : "") +
    `<section><h2>Upcoming Shows</h2><div class="flex flex-col divide-y">${rowsHtml}</div>` +
    `<button>Show Less</button></section></main></body></html>`
  );
}

// ─── Browser harness ─────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
async function parse(html) {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const p = await context.newPage();
  await p.route("**/*", (route) =>
    route.request().url() === PUNCHUP_URL
      ? route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html })
      : route.abort()
  );
  await p.goto(PUNCHUP_URL);
  const result = await p.evaluate(extractEvents);
  await context.close();
  return result;
}
const byId = (result) => Object.fromEntries(result.events.map((e) => [e.eventId, e]));

const NORMAL = {
  id: "aaa-normal", date: "November 13", city: "Halifax, NS", time: "7:00 PM",
  venue: "The Bus Stop Theatre", control: { type: "ticket", url: "https://www.eventbrite.com/e/halifax-123" },
};
const SOLD_OUT = {
  id: "bbb-soldout", date: "December 6", city: "Toronto, ON", weekday: "Sunday", time: "1:00 PM",
  venue: "Society Clubhouse", subtitle: "Day Care Comedy: Bring Your Baby", control: { type: "waitlist" },
};
const COLLINGWOOD_LATE = {
  id: "ccc-colling-830", date: "November 27", city: "Collingwood, ON", time: "8:30 PM",
  venue: "Simcoe Street theatre", control: { type: "waitlist" }, emptySlot: true,
};
const COLLINGWOOD_EARLY = {
  id: "ddd-colling-600", date: "November 27", city: "Collingwood, ON", time: "6:00 PM",
  venue: "Simcoe Street theatre", control: { type: "ticket", url: "https://www.eventbrite.ca/e/collingwood-6pm-111" }, emptySlot: true,
};

console.log("\n=== extractEvents: row shapes ===");

await test("normal 4-child row parses every field", async () => {
  const r = await parse(page(row(NORMAL)));
  assert.equal(r.events.length, 1);
  const e = r.events[0];
  assert.equal(e.eventId, "aaa-normal");
  assert.equal(e.eventHref, "https://punchup.live/e/aaa-normal");
  assert.equal(e.dateRaw, "November 13");
  assert.equal(e.timeRaw, "7:00 PM");
  assert.equal(e.city, "Halifax, NS");
  assert.equal(e.venue, "The Bus Stop Theatre");
  assert.equal(e.ticketUrl, "https://www.eventbrite.com/e/halifax-123");
  assert.equal(e.status, "on_sale");
  assert.deepEqual(findParseFailures(r), []);
});

await test("sold-out row (Join Waitlist button, no ticket link) is sold_out, venue is not the subtitle", async () => {
  const r = await parse(page(row(SOLD_OUT)));
  const e = r.events[0];
  assert.equal(e.status, "sold_out");
  assert.equal(e.ticketUrl, "");
  assert.equal(e.venue, "Society Clubhouse");
  assert.equal(e.city, "Toronto, ON");
  assert.equal(e.timeRaw, "1:00 PM");
  assert.deepEqual(findParseFailures(r), []);
});

await test("Collingwood 5-child shape: both same-night shows parse with their own time and state", async () => {
  const r = await parse(page(row(COLLINGWOOD_EARLY) + row(COLLINGWOOD_LATE)));
  assert.equal(r.events.length, 2);
  const ev = byId(r);
  assert.equal(ev["ddd-colling-600"].timeRaw, "6:00 PM");
  assert.equal(ev["ddd-colling-600"].status, "on_sale");
  assert.equal(ev["ddd-colling-600"].ticketUrl, "https://www.eventbrite.ca/e/collingwood-6pm-111");
  assert.equal(ev["ccc-colling-830"].timeRaw, "8:30 PM");
  assert.equal(ev["ccc-colling-830"].status, "sold_out");
  assert.equal(ev["ccc-colling-830"].ticketUrl, "");
  for (const e of r.events) {
    assert.equal(e.dateRaw, "November 27");
    assert.equal(e.city, "Collingwood, ON");
    assert.equal(e.venue, "Simcoe Street theatre");
  }
  assert.deepEqual(findParseFailures(r), []);
});

await test("extra wrapper and empty divs do not matter", async () => {
  const r = await parse(
    page(
      row({ ...NORMAL, wrapDepth: 3, innerPadding: true }) +
        row({ ...SOLD_OUT, wrapDepth: 2, innerPadding: true, emptySlot: true })
    )
  );
  const ev = byId(r);
  assert.equal(r.events.length, 2);
  assert.equal(ev["aaa-normal"].ticketUrl, "https://www.eventbrite.com/e/halifax-123");
  assert.equal(ev["aaa-normal"].status, "on_sale");
  assert.equal(ev["bbb-soldout"].status, "sold_out");
  assert.deepEqual(findParseFailures(r), []);
});

await test("desktop + mobile copies of one show merge into ONE event", async () => {
  const r = await parse(page(row(NORMAL) + row(SOLD_OUT) + row(NORMAL) + row(SOLD_OUT)));
  assert.equal(r.events.length, 2);
  assert.equal(r.pageEventCount, 2);
  assert.deepEqual(findParseFailures(r), []);
});

await test("next-year date keeps its year; absolute /e/ links count", async () => {
  const r = await parse(
    page(row({ ...NORMAL, id: "eee-abs", href: "https://punchup.live/e/eee-abs", date: "January 20, 2027", city: "Chicago, IL" }))
  );
  const e = r.events[0];
  assert.equal(e.eventId, "eee-abs");
  assert.equal(e.dateRaw, "January 20, 2027");
  assert.equal(parsePunchupDate(e.dateRaw), "2027-01-20");
});

await test("full region name is the city, not a subtitle that also has a comma", async () => {
  const r = await parse(
    page(row({ ...NORMAL, city: "Thunder Bay, Ontario", subtitle: "Live in Thunder Bay, ON" }))
  );
  assert.equal(r.events[0].city, "Thunder Bay, Ontario");
  assert.equal(r.events[0].venue, "The Bus Stop Theatre");
});

await test("venue still found if punchup drops the uppercase class (not the weekday span)", async () => {
  const r = await parse(page(row({ ...SOLD_OUT, venueClass: "text-sm font-semibold" })));
  assert.equal(r.events[0].venue, "Society Clubhouse");
  assert.equal(r.events[0].city, "Toronto, ON");
  assert.equal(r.events[0].timeRaw, "1:00 PM");
});

console.log("\n=== Completeness guard (findParseFailures) ===");

await test("guard fires on an event whose date cannot be read, and names it", async () => {
  const r = await parse(page(row(NORMAL) + row({ ...SOLD_OUT, id: "fff-tba", date: "Date TBA" })));
  const f = findParseFailures(r);
  assert.equal(f.length, 1, f.join("\n"));
  assert.match(f[0], /e\/fff-tba/);
  assert.match(f[0], /no date/);
});

await test("guard fires on an event with no ticket link and no waitlist control", async () => {
  const r = await parse(page(row(NORMAL) + row({ ...NORMAL, id: "ggg-noctl", control: { type: "none" } })));
  const f = findParseFailures(r);
  assert.equal(f.length, 1, f.join("\n"));
  assert.match(f[0], /e\/ggg-noctl.*no ticket link and no Join Waitlist/);
});

await test("guard fires on a Buy Tickets BUTTON with no link", async () => {
  const r = await parse(page(row({ ...NORMAL, id: "hhh-btn", control: { type: "ticket-button" } })));
  const f = findParseFailures(r);
  assert.equal(f.length, 1, f.join("\n"));
  assert.match(f[0], /ticket button has no link/);
});

await test("guard fires on a show row with no event link at all (orphan control)", async () => {
  const orphan =
    `<div class="grid"><div><p>November 30</p><p>Barrie, ON</p></div><div><p>8:00 PM</p><p class="uppercase">Mystery Venue</p></div>` +
    `<div><button type="button">Join Waitlist</button></div><div></div></div>`;
  const r = await parse(page(row(NORMAL) + orphan + row(SOLD_OUT)));
  const f = findParseFailures(r);
  assert.equal(f.length, 1, f.join("\n"));
  assert.match(f[0], /no punchup event link: button "Join Waitlist"/);
  // the orphan's waitlist button must NOT be credited to a neighbouring show
  assert.equal(byId(r)["aaa-normal"].status, "on_sale");
});

console.log("\n=== Live snapshot: punchup.live/AndrewPacker, 2026-11-12, See All expanded ===");

await test("every event on the live page parses: 19 events, 0 failures", async () => {
  const html = readFileSync(path.join(HERE, "fixtures/punchup/live-2026-11-12.html"), "utf8");
  const r = await parse(`<!doctype html><html>${html}</html>`);
  assert.equal(r.pageEventCount, 19);
  assert.equal(r.events.length, 19);
  assert.deepEqual(findParseFailures(r), []);

  const colling = r.events.filter((e) => e.city === "Collingwood, ON");
  assert.equal(colling.length, 2, "both Collingwood shows");
  const early = colling.find((e) => e.timeRaw === "6:00 PM");
  const late = colling.find((e) => e.timeRaw === "8:30 PM");
  assert.ok(early && late, "6:00 PM and 8:30 PM");
  assert.equal(early.status, "on_sale");
  assert.match(early.ticketUrl, /^https:\/\/www\.eventbrite\.ca\//);
  assert.equal(late.status, "sold_out");
  assert.equal(late.ticketUrl, "");
  for (const e of colling) {
    assert.equal(e.dateRaw, "November 27");
    assert.equal(e.venue, "Simcoe Street theatre");
  }

  const dayCare = r.events.find((e) => e.venue === "Society Clubhouse");
  assert.equal(dayCare.status, "sold_out");

  const sold = r.events.filter((e) => e.status === "sold_out").map((e) => e.venue).sort();
  assert.deepEqual(sold, ["Simcoe Street theatre", "Society Clubhouse"]);

  // Cancelled on Nov 11 and gone from punchup: must not appear.
  const text = JSON.stringify(r.events).toLowerCase();
  for (const gone of ["comedy studio", "tree bar", "scituate", "braintree", "cambridge"]) {
    assert.ok(!text.includes(gone), `${gone} should be absent`);
  }
});

await browser.close();

console.log("\n=== List-size guard (checkListSize) ===");

const sizeCases = [
  // [previous upcoming, fresh, should fail]
  [17, 17, false],
  [17, 18, false],
  [20, 17, false], // three cancellations (Nov 11 2026) drop normally
  [17, 9, false],
  [17, 8, true],   // under half: a broken scrape, not cancellations
  [17, 5, true],   // See All never expanded
  [17, 0, true],   // empty scrape
  [3, 0, true],    // empty is never accepted while shows are live
  [2, 1, false],   // small lists only fail when empty
  [4, 2, false],
  [4, 1, true],
  [0, 0, false],   // nothing live, nothing on punchup
  [0, 5, false],
];
for (const [prev, fresh, shouldFail] of sizeCases) {
  await test(`previous ${prev} -> scraped ${fresh}: ${shouldFail ? "fails" : "ok"}`, async () => {
    const err = checkListSize(prev, fresh);
    assert.equal(Boolean(err), shouldFail, String(err));
  });
}

// ---- parsePunchupDate: year rollover ----
const at = (y, m, d) => new Date(y, m - 1, d, 12, 0, 0); // local noon
const dateCases = [
  ["January 20", at(2026, 12, 28), "2027-01-20"], // Dec -> Jan rolls forward
  ["Jan 5", at(2026, 12, 28), "2027-01-05"],
  ["December 30", at(2026, 12, 28), "2026-12-30"], // future, same year
  ["December 27", at(2026, 12, 28), "2026-12-27"], // yesterday stays in the past
  ["December 28", at(2026, 12, 28), "2026-12-28"], // today
  ["November 11", at(2026, 11, 12), "2026-11-11"], // yesterday, mid-year
  ["January 20", at(2026, 11, 12), "2027-01-20"], // 296 days ago -> rolls (>183d)
  ["June 1", at(2026, 11, 12), "2026-06-01"], // ~164 days ago stays in the past
  ["January 20, 2026", at(2026, 12, 28), "2026-01-20"], // explicit year respected
  ["January 20, 2025", at(2026, 12, 28), "2025-01-20"],
  ["2026-01-20", at(2026, 12, 28), "2026-01-20"], // ISO passthrough
  ["  2027-03-04 ", at(2026, 12, 28), "2027-03-04"], // ISO with whitespace
];
for (const [raw, now, want] of dateCases) {
  await test(`parsePunchupDate("${raw}") on ${now.toDateString()} -> ${want}`, async () => {
    assert.equal(parsePunchupDate(raw, now), want);
  });
}
await test("parsePunchupDate: empty -> empty string", async () => {
  assert.equal(parsePunchupDate("", at(2026, 12, 28)), "");
});
await test("parsePunchupDate: garbage is returned unchanged (guard flags it)", async () => {
  assert.equal(parsePunchupDate("TBA", at(2026, 12, 28)), "TBA");
});

// ---- notify-discord-failure.js ----
const { spawnSync } = require("node:child_process");
const { createServer } = require("node:http");
const NOTIFY = path.join(HERE, "notify-discord-failure.js");
const cleanEnv = { ...process.env };
delete cleanEnv.DISCORD_ALERT_WEBHOOK_URL;
delete cleanEnv.DRY_RUN;

await test("notify: unset webhook exits 0 with a notice", async () => {
  const r = spawnSync("node", [NOTIFY], { env: cleanEnv, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /DISCORD_ALERT_WEBHOOK_URL is not set/);
});
await test("notify: DRY_RUN prints payload with reason and no mentions", async () => {
  const r = spawnSync("node", [NOTIFY], {
    env: { ...cleanEnv, DRY_RUN: "1", RUN_URL: "https://example.test/run/1", GITHUB_RUN_ATTEMPT: "3" },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr);
  const payload = JSON.parse(r.stdout);
  assert.match(payload.content, /FAILED \(attempt 3 of 3\)/);
  assert.match(payload.content, /example\.test\/run\/1/);
  assert.deepEqual(payload.allowed_mentions, { parse: [] });
});
await test("notify: set webhook POSTs the payload to a local stub (no real Discord)", async () => {
  const got = [];
  const srv = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      got.push({ url: req.url, method: req.method, body });
      res.statusCode = 200;
      res.end("{}");
    });
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${srv.address().port}/hook`;
  const r = await new Promise((resolve) => {
    const { spawn } = require("node:child_process");
    const c = spawn("node", [NOTIFY], { env: { ...cleanEnv, DISCORD_ALERT_WEBHOOK_URL: url } });
    let out = "";
    c.stdout.on("data", (d) => (out += d));
    c.on("close", (code) => resolve({ code, out }));
  });
  srv.close();
  assert.equal(r.code, 0, r.out);
  assert.equal(got.length, 1);
  assert.equal(got[0].method, "POST");
  assert.match(got[0].url, /^\/hook\?wait=true/);
  assert.match(JSON.parse(got[0].body).content, /tour-date sync FAILED/);
});
await test("notify: non-2xx from webhook exits 1", async () => {
  const srv = createServer((req, res) => { res.statusCode = 500; res.end("boom"); });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${srv.address().port}/hook`;
  const { spawn } = require("node:child_process");
  const code = await new Promise((resolve) => {
    const c = spawn("node", [NOTIFY], { env: { ...cleanEnv, DISCORD_ALERT_WEBHOOK_URL: url }, stdio: "ignore" });
    c.on("close", resolve);
  });
  srv.close();
  assert.equal(code, 1);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
