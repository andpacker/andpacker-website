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
  "Newfoundland and Labrador": "NL", Newfoundland: "NL", Labrador: "NL",
  "Prince Edward Island": "PE", "Northwest Territories": "NT", Nunavut: "NU", Yukon: "YT",
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA",
  Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
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

// ─── Exact copy: titleCaseVenue ──────────────────────────────────────────────
function titleCaseVenue(v) {
  if (!v) return v;
  const minor = new Set(["and", "of", "the", "or", "a", "an", "for", "to", "in", "on", "at", "by", "with"]);
  const allCaps = !/[a-zà-ÿ]/.test(v);
  const base = allCaps ? v.toLowerCase() : v;
  return base
    .split(" ")
    .map((word, i) => {
      if (!word) return word;
      if (/[A-ZÀ-Þ]/.test(word)) return word;
      if (!/[a-zà-ÿ]/.test(word)) return word;
      if (i > 0 && minor.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
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

// ─── Suite 7: titleCaseVenue ─────────────────────────────────────────────────
console.log("\n=== titleCaseVenue ===");
{
  const cases = [
    ["Simcoe Street theatre", "Simcoe Street Theatre", "fixes mid-name lowercase content word"],
    ["CAMPFIRE COMEDY CLUB", "Campfire Comedy Club", "ALL-CAPS fallback title-cases every word"],
    ["ROYAL GARDEN | CHINESE RESTAURANT", "Royal Garden | Chinese Restaurant", "ALL-CAPS keeps | separator"],
    ["YUK YUK'S COMEDY CLUB - CALGARY", "Yuk Yuk's Comedy Club - Calgary", "ALL-CAPS possessive + hyphen"],
    ["Naukabout Brewery and Taproom", "Naukabout Brewery and Taproom", "mid-name minor word stays lowercase"],
    ["Théâtre Sainte-Catherine", "Théâtre Sainte-Catherine", "accented mixed case preserved"],
    ["Yuk Yuk's Comedy Club - Calgary", "Yuk Yuk's Comedy Club - Calgary", "already-correct mixed case unchanged"],
    ["the comedy spot", "The Comedy Spot", "leading minor word is capitalized"],
    ["The BMO Centre", "The BMO Centre", "acronym preserved"],
    ["", "", "empty string unchanged"],
  ];
  for (const [input, expected, desc] of cases) {
    const got = titleCaseVenue(input);
    assert(`${desc}: ${JSON.stringify(input)} -> ${JSON.stringify(expected)}`, got === expected, expected, got);
  }
}

// ─── Exact copy: TIME_OVERRIDES ──────────────────────────────────────────────
const TIME_OVERRIDES = {
  "day-care-comedy-with-andrew-packer": "11:30 AM",
  "laugh-it-off-with-andrew-packer": "6:30 PM",
};

// ─── Exact copy: showTypeFor ─────────────────────────────────────────────────
function showTypeFor(ticketUrl, venue) {
  const url = (ticketUrl || "").toLowerCase();
  const v = (venue || "").toLowerCase();
  if (url.includes("day-care")) return { showType: "day_care_comedy" };
  if (url.includes("laugh-it-off")) return { showType: "laugh_it_off" };
  if (v.includes("othership")) return { showType: "sauna_comedy" };
  if (v.includes("chefs hall")) return { showType: "new_material" };
  return {};
}

// ─── Exact copy: the TIME_OVERRIDES application loop ─────────────────────────
function applyTimeOverrides(shows) {
  for (const show of shows) {
    const url = (show.ticketUrl || "").toLowerCase();
    for (const [needle, time] of Object.entries(TIME_OVERRIDES)) {
      if (url.includes(needle)) {
        show.time = time;
        break;
      }
    }
  }
  return shows;
}

// ─── Suite 8: showTypeFor ────────────────────────────────────────────────────
console.log("\n=== showTypeFor ===");
{
  const cases = [
    [
      "https://topsecretcomedyclub.com/events-listings/day-care-comedy-with-andrew-packer/",
      "Top Secret Comedy Club - New York",
      { showType: "day_care_comedy" },
      "Day Care ticket URL -> day_care_comedy",
    ],
    [
      "https://topsecretcomedyclub.com/events-listings/laugh-it-off-with-andrew-packer/",
      "Top Secret Comedy Club - New York",
      { showType: "laugh_it_off" },
      "same-venue/same-date sibling URL -> laugh_it_off (double-header disambiguated)",
    ],
    [
      "https://comedybar.ca/shows/laugh-it-off",
      "Comedy Bar - Toronto",
      { showType: "laugh_it_off" },
      "Toronto LIO URL still -> laugh_it_off (unchanged by the new rule)",
    ],
    [
      "https://www.eventbrite.ca/e/friday-pro-stand-up-comedy-chefs-hall-toronto-tickets-1987789785759",
      "Chefs Hall",
      { showType: "new_material" },
      "Chefs Hall venue -> new_material",
    ],
    [
      "https://www.eventbrite.ca/e/friday-pro-stand-up-comedy-chefs-hall-toronto-tickets-798883922317?aff=oddtdtcreator&keep_tld=true",
      "Chefs Hall",
      { showType: "new_material" },
      "Chefs Hall with query string -> new_material",
    ],
    [
      "https://www.othership.us/events/comedy",
      "Othership Yorkville",
      { showType: "sauna_comedy" },
      "Othership venue -> sauna_comedy (unchanged)",
    ],
    [
      "https://www.prekindle.com/event/56327-andrew-packer-730pm-dallas",
      "Dallas Comedy Club",
      {},
      "plain touring date -> no showType key",
    ],
    ["", "", {}, "empty inputs -> no showType key"],
    [
      "https://topsecretcomedyclub.com/events-listings/DAY-CARE-COMEDY-WITH-ANDREW-PACKER/",
      "Top Secret Comedy Club - New York",
      { showType: "day_care_comedy" },
      "uppercase URL casing still matches (case-insensitive)",
    ],
    [
      "https://www.prekindle.com/event/99999-andrew-packer",
      "OTHERSHIP TORONTO",
      { showType: "sauna_comedy" },
      "uppercase venue still matches othership (case-insensitive)",
    ],
    [
      "https://www.eventbrite.ca/e/some-other-slug-tickets-123",
      "Friday Pro Stand Up Comedy @ CheFs HAll Toronto",
      { showType: "new_material" },
      "mixed-case 'Chefs Hall' embedded in a longer venue string still matches",
    ],
    [
      undefined,
      "Chefs Hall",
      { showType: "new_material" },
      "undefined ticketUrl (not just empty string) falls back to venue rule",
    ],
    [
      "https://topsecretcomedyclub.com/events-listings/day-care-comedy-with-andrew-packer/",
      undefined,
      { showType: "day_care_comedy" },
      "undefined venue does not break a URL-rule match",
    ],
    [
      undefined,
      undefined,
      {},
      "undefined ticketUrl AND undefined venue -> no showType key (not just empty string)",
    ],
    [
      "https://example.com/day-care-comedy-and-laugh-it-off-double-bill-with-andrew-packer",
      "Top Secret Comedy Club - New York",
      { showType: "day_care_comedy" },
      "URL containing BOTH 'day-care' and 'laugh-it-off' -> day_care_comedy wins (checked first)",
    ],
    [
      "https://example.com/day-care-comedy-with-andrew-packer",
      "Othership Yorkville",
      { showType: "day_care_comedy" },
      "URL rule wins over venue rule even when venue independently matches 'othership'",
    ],
    [
      "https://example.com/plain-ticket-link",
      "Othership Chefs Hall Pop-Up",
      { showType: "sauna_comedy" },
      "venue containing BOTH 'othership' and 'chefs hall' -> sauna_comedy wins (checked first)",
    ],
    [
      "https://www.eventbrite.com/e/laugh-it-off-with-andrew-packer-tickets-123456789?aff=ebdssbdestsearch",
      "Top Secret Comedy Club - New York",
      { showType: "laugh_it_off" },
      "laugh-it-off URL with trailing query string -> laugh_it_off",
    ],
  ];
  for (const [url, venue, expected, desc] of cases) {
    const got = showTypeFor(url, venue);
    assert(desc, deepEqual(got, expected), expected, got);
  }
}

// ─── Suite 9: TIME_OVERRIDES ─────────────────────────────────────────────────
console.log("\n=== TIME_OVERRIDES ===");
{
  const shows = applyTimeOverrides([
    {
      date: "2026-11-08",
      slug: "top-secret-comedy-club-new-york",
      ticketUrl: "https://topsecretcomedyclub.com/events-listings/day-care-comedy-with-andrew-packer/",
    },
    {
      date: "2026-11-08",
      slug: "top-secret-comedy-club-new-york",
      ticketUrl: "https://topsecretcomedyclub.com/events-listings/laugh-it-off-with-andrew-packer/",
    },
    {
      date: "2026-08-29",
      slug: "comedy-bar-toronto",
      ticketUrl: "https://comedybar.ca/shows/laugh-it-off",
      time: "7 PM",
    },
    {
      date: "2026-10-09",
      slug: "dallas-comedy-club",
      ticketUrl: "https://www.prekindle.com/event/56327-andrew-packer-730pm-dallas",
      time: "7:30 PM",
    },
    {
      date: "2026-09-05",
      slug: "some-club",
      ticketUrl: "https://EXAMPLE.com/events/DAY-CARE-COMEDY-WITH-ANDREW-PACKER-tickets-5",
    },
    {
      date: "2026-09-06",
      slug: "unknown-venue",
      // no ticketUrl at all — must not throw, must not set a time
    },
    {
      date: "2026-09-07",
      slug: "eventbrite-club",
      ticketUrl: "https://www.eventbrite.com/e/laugh-it-off-with-andrew-packer-tickets-987654321?aff=x",
    },
    {
      date: "2026-09-08",
      slug: "hybrid-show",
      ticketUrl:
        "https://example.com/day-care-comedy-with-andrew-packer-and-laugh-it-off-with-andrew-packer",
    },
  ]);

  assert("Nov 8 Day Care -> 11:30 AM", shows[0].time === "11:30 AM", "11:30 AM", shows[0].time);
  assert("Nov 8 Laugh It Off -> 6:30 PM", shows[1].time === "6:30 PM", "6:30 PM", shows[1].time);
  assert(
    "Toronto Comedy Bar LIO keeps 7 PM (needle requires -with-andrew-packer)",
    shows[2].time === "7 PM",
    "7 PM",
    shows[2].time
  );
  assert("unmatched show keeps its derived time", shows[3].time === "7:30 PM", "7:30 PM", shows[3].time);
  assert(
    "the two Nov 8 shows get DIFFERENT times despite sharing date|slug",
    shows[0].time !== shows[1].time,
    "different times",
    `${shows[0].time} vs ${shows[1].time}`
  );
  assert(
    "uppercase ticketUrl casing still matches needle -> 11:30 AM",
    shows[4].time === "11:30 AM",
    "11:30 AM",
    shows[4].time
  );
  assert(
    "missing ticketUrl entirely -> no override applied, time stays undefined",
    shows[5].time === undefined,
    undefined,
    shows[5].time
  );
  assert(
    "laugh-it-off needle with trailing query string -> 6:30 PM",
    shows[6].time === "6:30 PM",
    "6:30 PM",
    shows[6].time
  );
  assert(
    "URL matching BOTH needles -> day-care wins (first key in TIME_OVERRIDES insertion order)",
    shows[7].time === "11:30 AM",
    "11:30 AM",
    shows[7].time
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
