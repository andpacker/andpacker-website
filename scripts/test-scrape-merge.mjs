/**
 * Standalone tests for pure logic extracted from scrape-tour-dates.js.
 * Copies exact implementations — do NOT modify the logic here; fix the source.
 *
 * Run with: node scripts/test-scrape-merge.mjs
 */

// ─── Exact copy: PROVINCE_STATE_ABBR ────────────────────────────────────────
const PROVINCE_STATE_ABBR = {
  Ontario: "ON", "British Columbia": "BC", Alberta: "AB", Quebec: "QC", "Québec": "QC",
  Manitoba: "MB", Saskatchewan: "SK", "Nova Scotia": "NS", "New Brunswick": "NB",
  "Newfoundland and Labrador": "NL", Newfoundland: "NL", "Prince Edward Island": "PE",
  "Northwest Territories": "NT", Nunavut: "NU", Yukon: "YT",
  California: "CA", Texas: "TX", "New York": "NY", Florida: "FL",
  Massachusetts: "MA", Illinois: "IL", Washington: "WA", Colorado: "CO",
  Georgia: "GA", Arizona: "AZ", Tennessee: "TN", Oregon: "OR",
  Nevada: "NV", Minnesota: "MN", Wisconsin: "WI", Michigan: "MI",
};

// ─── Exact copy: normalizeCity ───────────────────────────────────────────────
function normalizeCity(cityStr) {
  if (!cityStr || !cityStr.includes(", ")) return cityStr;
  const idx = cityStr.lastIndexOf(", ");
  const cityPart = cityStr.slice(0, idx);
  const region = cityStr.slice(idx + 2).trim();
  const abbr = PROVINCE_STATE_ABBR[region];
  return abbr ? `${cityPart}, ${abbr}` : cityStr;
}

// ─── Exact copy: slugify ─────────────────────────────────────────────────────
function slugify(v) {
  return v.toLowerCase()
    .replace(/['']/g, "")           // drop apostrophes: Yuk Yuk's -> yukyuks
    .replace(/[^a-z0-9À-ɏ]+/g, "-") // non-alnum (keep Latin accents) -> hyphen
    .replace(/^-+|-+$/g, "");       // trim
}

// ─── Exact copy: merge block, wrapped for testing ───────────────────────────
// Mirrors lines 380-398 of scrape-tour-dates.js verbatim.
// `existing` = prior tour-dates.json array
// `future`   = freshly-scraped + enriched array (will be mutated in place)
// Returns the mutated `future` array.
function mergeForward(existing, future) {
  const stableKey = (s) => `${s.date}|${s.slug || slugify(s.venue || "")}`;
  const existingByKey = {};
  const keyCounts = {};
  for (const s of existing) {
    const k = stableKey(s);
    keyCounts[k] = (keyCounts[k] || 0) + 1;
    existingByKey[k] = s;
  }
  for (const show of future) {
    const k = stableKey(show);
    if (keyCounts[k] !== 1) continue; // ambiguous double-header — keep fresh data only
    const prev = existingByKey[k];
    for (const [field, value] of Object.entries(prev)) {
      const cur = show[field];
      if (cur === undefined || cur === null || cur === "") {
        show[field] = value;
      }
    }
  }
  return future;
}

// ─── Test harness ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function assert(name, condition, expected, got) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${name}`);
    failed++;
    failures.push({ name, expected, got });
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ─── Suite 1: normalizeCity ──────────────────────────────────────────────────
console.log("\n=== normalizeCity ===");

// 1a. Full province name -> abbreviation
{
  const result = normalizeCity("Thunder Bay, Ontario");
  assert(
    'normalizeCity("Thunder Bay, Ontario") -> "Thunder Bay, ON"',
    result === "Thunder Bay, ON",
    "Thunder Bay, ON",
    result
  );
}

// 1b. Already abbreviated province — unchanged
{
  const result = normalizeCity("Toronto, ON");
  assert(
    'normalizeCity("Toronto, ON") -> "Toronto, ON" (unchanged)',
    result === "Toronto, ON",
    "Toronto, ON",
    result
  );
}

// 1c. Already abbreviated US state — unchanged
{
  const result = normalizeCity("Dallas, TX");
  assert(
    'normalizeCity("Dallas, TX") -> "Dallas, TX" (unchanged)',
    result === "Dallas, TX",
    "Dallas, TX",
    result
  );
}

// 1d. Full US state name -> abbreviation
{
  const result = normalizeCity("Mashpee, Massachusetts");
  assert(
    'normalizeCity("Mashpee, Massachusetts") -> "Mashpee, MA"',
    result === "Mashpee, MA",
    "Mashpee, MA",
    result
  );
}

// 1e. No comma — unchanged
{
  const result = normalizeCity("Chicago");
  assert(
    'normalizeCity("Chicago") -> "Chicago" (no comma, unchanged)',
    result === "Chicago",
    "Chicago",
    result
  );
}

// 1f. Empty string — unchanged
{
  const result = normalizeCity("");
  assert(
    'normalizeCity("") -> "" (empty, unchanged)',
    result === "",
    "",
    result
  );
}

// 1g. Accented French province name -> QC
{
  const result = normalizeCity("Montréal, Québec");
  assert(
    'normalizeCity("Montréal, Québec") -> "Montréal, QC"',
    result === "Montréal, QC",
    "Montréal, QC",
    result
  );
}

// ─── Suite 2: mergeForward — carry forward hand-set showType ────────────────
console.log("\n=== mergeForward: carry forward showType (single occurrence) ===");
{
  const existing = [
    {
      date: "2026-06-25",
      slug: "the-corner-comedy-club",
      showType: "comedy_special_recording",
      venue: "The Corner Comedy Club",
      city: "Toronto, ON",
      ticketUrl: "https://example.com/show",
      status: "on_sale",
    },
  ];
  const future = [
    {
      date: "2026-06-25",
      slug: "the-corner-comedy-club",
      venue: "The Corner Comedy Club",
      city: "Toronto, ON",
      ticketUrl: "https://example.com/show",
      status: "on_sale",
      // NO showType — simulating a fresh scrape that didn't auto-detect it
    },
  ];
  mergeForward(existing, future);
  assert(
    "single-occurrence key carries forward showType onto fresh entry",
    future[0].showType === "comedy_special_recording",
    "comedy_special_recording",
    future[0].showType
  );
}

// ─── Suite 3: mergeForward — must NOT overwrite a fresh field ───────────────
console.log("\n=== mergeForward: fresh field must not be overwritten ===");
{
  const existing = [
    {
      date: "2026-07-10",
      slug: "comedy-bar",
      city: "Thunder Bay, Ontario",  // old full-name form
      venue: "Comedy Bar",
      ticketUrl: "https://example.com/cb",
      status: "on_sale",
    },
  ];
  const future = [
    {
      date: "2026-07-10",
      slug: "comedy-bar",
      city: "Thunder Bay, ON",  // already normalized by current scraper
      venue: "Comedy Bar",
      ticketUrl: "https://example.com/cb",
      status: "on_sale",
    },
  ];
  mergeForward(existing, future);
  assert(
    "fresh city 'Thunder Bay, ON' is NOT overwritten by old 'Thunder Bay, Ontario'",
    future[0].city === "Thunder Bay, ON",
    "Thunder Bay, ON",
    future[0].city
  );
}

// ─── Suite 4: mergeForward — carry forward `time` when fresh lacks one ──────
console.log("\n=== mergeForward: carry forward time when fresh lacks it ===");
{
  const existing = [
    {
      date: "2026-08-15",
      slug: "yuk-yuks",
      venue: "Yuk Yuks",
      city: "Ottawa, ON",
      ticketUrl: "https://example.com/yy",
      status: "on_sale",
      time: "7 PM",
    },
  ];
  const future = [
    {
      date: "2026-08-15",
      slug: "yuk-yuks",
      venue: "Yuk Yuks",
      city: "Ottawa, ON",
      ticketUrl: "https://example.com/yy",
      status: "on_sale",
      // NO time field — changed ticket URL means timeFromUrl() returned ""
    },
  ];
  mergeForward(existing, future);
  assert(
    "time carried forward from existing when fresh entry has no time",
    future[0].time === "7 PM",
    "7 PM",
    future[0].time
  );
}

// ─── Suite 5: double-header skip ─────────────────────────────────────────────
console.log("\n=== mergeForward: double-header skip (keyCounts != 1) ===");
{
  const existing = [
    {
      date: "2026-10-09",
      slug: "dallas-comedy-club",
      venue: "Dallas Comedy Club",
      city: "Dallas, TX",
      ticketUrl: "https://example.com/dallas1",
      status: "on_sale",
      time: "7 PM",
      showType: "comedy_special_recording",  // hand-set on first show
    },
    {
      date: "2026-10-09",
      slug: "dallas-comedy-club",
      venue: "Dallas Comedy Club",
      city: "Dallas, TX",
      ticketUrl: "https://example.com/dallas2",
      status: "on_sale",
      time: "9 PM",
    },
  ];
  const future = [
    {
      date: "2026-10-09",
      slug: "dallas-comedy-club",
      venue: "Dallas Comedy Club",
      city: "Dallas, TX",
      ticketUrl: "https://example.com/dallas1",
      status: "on_sale",
      time: "7 PM",
      // NO showType
    },
    {
      date: "2026-10-09",
      slug: "dallas-comedy-club",
      venue: "Dallas Comedy Club",
      city: "Dallas, TX",
      ticketUrl: "https://example.com/dallas2",
      status: "on_sale",
      time: "9 PM",
      // NO showType
    },
  ];
  mergeForward(existing, future);

  assert(
    "double-header: first fresh entry showType NOT carried forward (keyCounts === 2)",
    future[0].showType === undefined,
    undefined,
    future[0].showType
  );
  assert(
    "double-header: second fresh entry showType NOT carried forward",
    future[1].showType === undefined,
    undefined,
    future[1].showType
  );
}

// ─── Suite 6: missing slug on existing falls back to slugify(venue) ──────────
console.log("\n=== mergeForward: slug fallback via slugify(venue) ===");
{
  // Existing entry was written before slug field existed (or slug is absent)
  const existing = [
    {
      date: "2026-09-20",
      // NO slug field — stableKey must fall back to slugify(venue)
      venue: "Yuk Yuk's Comedy Club",
      city: "Vancouver, BC",
      ticketUrl: "https://example.com/yy2",
      status: "on_sale",
      showType: "comedy_special_recording",
    },
  ];
  // Fresh entry carries the derived slug (as the scraper would produce)
  const derivedSlug = slugify("Yuk Yuk's Comedy Club");
  const future = [
    {
      date: "2026-09-20",
      slug: derivedSlug,
      venue: "Yuk Yuk's Comedy Club",
      city: "Vancouver, BC",
      ticketUrl: "https://example.com/yy2",
      status: "on_sale",
      // NO showType
    },
  ];
  mergeForward(existing, future);
  assert(
    `slug fallback: existing entry (no slug) matches fresh slug "${derivedSlug}" via slugify(venue)`,
    future[0].showType === "comedy_special_recording",
    "comedy_special_recording",
    future[0].showType
  );
}

// ─── Results summary ─────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log(`Tests run: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

if (failures.length > 0) {
  console.log("\n=== Failures ===");
  for (const f of failures) {
    console.log(`\n[FAIL] ${f.name}`);
    console.log(`  Expected: ${JSON.stringify(f.expected)}`);
    console.log(`  Got:      ${JSON.stringify(f.got)}`);
  }
  process.exit(1);
} else {
  console.log("\nAll tests passed.");
  process.exit(0);
}
