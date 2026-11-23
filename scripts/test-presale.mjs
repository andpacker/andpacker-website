/**
 * Tests for the presale ("Tickets Soon") feature: the URL matcher and
 * ticketState in scripts/punchup-parse.js, and the waitlist helpers in
 * lib/waitlist.ts. Plain node, no browser.
 *
 * NEVER require scrape-tour-dates.js here: it runs a live scrape.
 *
 * Run with: node scripts/test-presale.mjs
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { PRESALE_URL, isPresaleUrl, ticketState } = require("./punchup-parse.js");

const HERE = path.dirname(fileURLToPath(import.meta.url));

// lib/waitlist.ts only imports a type, so strip the type import and the
// annotations by loading it through node's type stripping from a temp copy.
const tmp = mkdtempSync(path.join(tmpdir(), "presale-test-"));
const src = readFileSync(path.join(HERE, "..", "lib", "waitlist.ts"), "utf8")
  .replace(/^import type .*$/m, "type Show = any");
const tmpFile = path.join(tmp, "waitlist.ts");
writeFileSync(tmpFile, src);
const { hasWaitlist, findWaitlistShow, presaleTag } = await import(tmpFile);

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (e) {
    console.log(`  [FAIL] ${name}\n    ${e.message.split("\n").join("\n    ")}`);
    failed++;
  }
}

console.log("\n=== isPresaleUrl: must match ===");
for (const u of [
  "https://andpacker.com/presale",
  "http://andpacker.com/presale",
  "https://www.andpacker.com/presale",
  "https://andpacker.com/presale/",
  "https://andpacker.com/presale?q=1",
  "https://andpacker.com/presale#f",
  "https://AndPacker.COM/Presale",
  "andpacker.com/presale",
  "  https://andpacker.com/presale  ",
  "https://punchup.live/andpacker.com/presale",
]) test(`matches ${JSON.stringify(u)}`, () => assert.equal(isPresaleUrl(u), true));

console.log("\n=== isPresaleUrl: must not match ===");
for (const u of [
  "https://notandpacker.com/presale",
  "https://andpacker.com.evil/presale",
  "https://andpacker.com.evil.com/presale",
  "https://andpacker.com/presale-foo",
  "https://andpacker.com/presales",
  "https://andpacker.com/",
  "https://andpacker.com/shows/presale",
  "https://example.com/?u=andpacker.com/presale-x",
  "",
  "https://punchup.live/e/abc",
]) test(`rejects ${JSON.stringify(u)}`, () => assert.equal(isPresaleUrl(u), false));
for (const u of [undefined, null, 0, 42, {}, [], ["https://andpacker.com/presale"], true])
  test(`rejects non-string ${JSON.stringify(u)}`, () => assert.equal(isPresaleUrl(u), false));

console.log("\n=== PRESALE_URL / ticketState ===");
test("PRESALE_URL is canonical", () => assert.equal(PRESALE_URL, "https://andpacker.com/presale"));
test("ticketState: presale link -> coming_soon + canonical", () =>
  assert.deepEqual(ticketState("on_sale", "https://andpacker.com/presale"), { status: "coming_soon", ticketUrl: PRESALE_URL }));
test("ticketState: variant link is canonicalised", () =>
  assert.deepEqual(ticketState("on_sale", "https://punchup.live/andpacker.com/presale"), { status: "coming_soon", ticketUrl: PRESALE_URL }));
test("ticketState: presale beats sold_out status", () =>
  assert.deepEqual(ticketState("sold_out", "andpacker.com/presale/"), { status: "coming_soon", ticketUrl: PRESALE_URL }));
test("ticketState: ordinary link unchanged", () =>
  assert.deepEqual(ticketState("on_sale", "https://eventbrite.com/e/1"), { status: "on_sale", ticketUrl: "https://eventbrite.com/e/1" }));
test("ticketState: sold_out with empty URL unchanged", () =>
  assert.deepEqual(ticketState("sold_out", ""), { status: "sold_out", ticketUrl: "" }));
test("ticketState: undefined URL unchanged", () =>
  assert.deepEqual(ticketState("low_tickets", undefined), { status: "low_tickets", ticketUrl: undefined }));

console.log("\n=== waitlist.ts: hasWaitlist / findWaitlistShow ===");
const show = (o) => ({ slug: "v", venue: "V", city: "Tacoma, WA", date: "2027-01-15", time: "7 PM", ticketUrl: "x", status: "coming_soon", ...o });
test("hasWaitlist true for sold_out and coming_soon only", () => {
  assert.equal(hasWaitlist(show({ status: "sold_out" })), true);
  assert.equal(hasWaitlist(show({ status: "coming_soon" })), true);
  assert.equal(hasWaitlist(show({ status: "on_sale" })), false);
  assert.equal(hasWaitlist(show({ status: "low_tickets" })), false);
});
const list = [
  show({ slug: "a", status: "on_sale" }),
  show({ slug: "b", time: "7 PM" }),
  show({ slug: "b", time: "9 PM", status: "sold_out" }),
  show({ slug: "c", time: undefined }),
];
test("findWaitlistShow: exact date+slug+time", () =>
  assert.equal(findWaitlistShow(list, "2027-01-15", "b", "9 PM"), list[2]));
test("findWaitlistShow: distinguishes double-header by time", () =>
  assert.equal(findWaitlistShow(list, "2027-01-15", "b", "7 PM"), list[1]));
test("findWaitlistShow: wrong time -> null", () =>
  assert.equal(findWaitlistShow(list, "2027-01-15", "b", "8 PM"), null));
test("findWaitlistShow: on_sale show -> null", () =>
  assert.equal(findWaitlistShow(list, "2027-01-15", "a", "7 PM"), null));
test("findWaitlistShow: wrong date -> null", () =>
  assert.equal(findWaitlistShow(list, "2027-01-16", "b", "7 PM"), null));
test("findWaitlistShow: missing time means empty", () => {
  assert.equal(findWaitlistShow(list, "2027-01-15", "c", undefined), list[3]);
  assert.equal(findWaitlistShow(list, "2027-01-15", "c", ""), list[3]);
  assert.equal(findWaitlistShow(list, "2027-01-15", "b", undefined), null);
});
test("findWaitlistShow: non-string date/slug -> null", () => {
  assert.equal(findWaitlistShow(list, 5, "b", "7 PM"), null);
  assert.equal(findWaitlistShow(list, "2027-01-15", null, "7 PM"), null);
  assert.equal(findWaitlistShow(list, undefined, undefined, undefined), null);
});
test("findWaitlistShow: non-string time treated as empty", () =>
  assert.equal(findWaitlistShow(list, "2027-01-15", "c", 7), list[3]));
test("findWaitlistShow: empty list -> null", () =>
  assert.equal(findWaitlistShow([], "2027-01-15", "b", ""), null));

console.log("\n=== waitlist.ts: presaleTag ===");
test("presaleTag with time", () =>
  assert.equal(presaleTag(show({})), "Presale - Tacoma, WA - Jan 15 2027 7 PM"));
test("presaleTag without time", () =>
  assert.equal(presaleTag(show({ time: undefined })), "Presale - Tacoma, WA - Jan 15 2027"));
test("presaleTag with empty time", () =>
  assert.equal(presaleTag(show({ time: "" })), "Presale - Tacoma, WA - Jan 15 2027"));
test("presaleTag strips accents", () =>
  assert.equal(presaleTag(show({ city: "Montréal, QC", date: "2027-03-05", time: "8 PM" })), "Presale - Montreal, QC - Mar 5 2027 8 PM"));
test("presaleTag does not fold markets", () =>
  assert.equal(presaleTag(show({ city: "Cambridge, MA" })), "Presale - Cambridge, MA - Jan 15 2027 7 PM"));
test("presaleTag: day not zero-padded; Dec 31 and Jan 1 stable across timezone", () => {
  assert.equal(presaleTag(show({ date: "2027-12-31", time: undefined })), "Presale - Tacoma, WA - Dec 31 2027");
  assert.equal(presaleTag(show({ date: "2027-01-01", time: undefined })), "Presale - Tacoma, WA - Jan 1 2027");
});
test("presaleTag has no em dash", () => assert.ok(!presaleTag(show({})).includes("—")));

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${"─".repeat(60)}\nTests run: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
process.exit(failed ? 1 : 0);
