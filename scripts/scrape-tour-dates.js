#!/usr/bin/env node
/**
 * Scrapes tour dates from https://punchup.live/AndrewPacker using Playwright.
 * Writes results to data/tour-dates.json.
 *
 * Flags:
 *   --check-today   Only run full scrape if a show is today (used by hourly cron).
 *                   Exits with code 0 immediately if no show is today.
 *
 * Environment:
 *   TOUR_DATES_OUTPUT       Write the result here instead of data/tour-dates.json
 *                           (a local dry run; the previous list is still read
 *                           from data/tour-dates.json).
 *   TOUR_ALLOW_LARGE_DROP=1 Accept a list that shrank by more than half (a real
 *                           mass cancellation). Workflow input: allow_large_drop.
 *   SCRAPE_FAILURE_FILE     On failure, the reason is written here (the workflow
 *                           posts it to Discord).
 *
 * SAFETY: the scrape exits non-zero WITHOUT writing tour-dates.json when any show
 * on punchup fails to parse, when "See All" does not expand, or when the list comes
 * back empty or under half its previous size. The last good list stays live and
 * the GitHub Action goes red. A show that is gone from punchup (a cancellation)
 * still drops normally. Parsing + guards live in ./punchup-parse.js.
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const {
  extractEvents,
  parsePunchupDate,
  findParseFailures,
  checkListSize,
} = require("./punchup-parse");

const PUNCHUP_URL = "https://punchup.live/AndrewPacker";
// punchup's own event links (relative or absolute), never Eventbrite's /e/ URLs.
const PUNCHUP_EVENT_LINK = 'a[href^="/e/"], a[href*="//punchup.live/e/"]';
const DATA_PATH = path.join(__dirname, "..", "data", "tour-dates.json");
const OUTPUT_PATH = process.env.TOUR_DATES_OUTPUT || DATA_PATH;
const CHECK_TODAY = process.argv.includes("--check-today");
const ALLOW_LARGE_DROP = process.env.TOUR_ALLOW_LARGE_DROP === "1";

// Logs a failure, hands the reason to the workflow (Discord alert + run summary),
// and leaves tour-dates.json untouched. The caller exits non-zero.
function reportFailure(lines) {
  const text = [
    "Tour-date scrape FAILED. tour-dates.json was NOT written; the last good list stays live.",
    ...lines,
  ].join("\n");
  console.error(text);
  try {
    if (process.env.SCRAPE_FAILURE_FILE) fs.writeFileSync(process.env.SCRAPE_FAILURE_FILE, text + "\n");
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "### Tour-date scrape failed\n```\n" + text + "\n```\n");
    }
  } catch (err) {
    console.error("Could not write the failure report:", err.message);
  }
}

// Ticket-URL overrides, keyed by `${date}|${slug}`.
//
// WHY THIS EXISTS: the scraper copies each show's ticket URL verbatim from the
// "Buy Tickets" button on punchup.live. When punchup's button points at the WRONG
// Eventbrite listing, that bad URL flows straight into tour-dates.json and every
// daily scrape re-copies it — so a hand-edit here is clobbered within 24h. This map
// is applied AFTER scrape + merge and forces the correct live listing regardless of
// what punchup serves, making the fix durable across cron runs.
//
// Each override is a stopgap for a punchup data error. The REAL fix is in punchup's
// admin (Andrew's action): repoint the Buy Tickets button to the correct listing.
// Once punchup is corrected AND a daily scrape has confirmed the right URL flows
// through on its own, the matching line below can be deleted.
//
// 2026-07-11: punchup's Buy Tickets for BOTH recurring "Friday Pro Stand Up Comedy
// @ Chefs Hall" shows points at Eventbrite 798883922317 — a PAST Feb 16 2024 show
// (verified live via the Eventbrite API). Repointed to the correct live listings:
//   Jul 24 2026 -> event 1987789780744 (status "live")
//   Aug 28 2026 -> event 1987789785759 (status "live")
const TICKET_URL_OVERRIDES = {
  "2026-07-24|chefs-hall":
    "https://www.eventbrite.ca/e/friday-pro-stand-up-comedy-chefs-hall-toronto-tickets-1987789780744",
  "2026-08-28|chefs-hall":
    "https://www.eventbrite.ca/e/friday-pro-stand-up-comedy-chefs-hall-toronto-tickets-1987789785759",
};

// Show-time overrides, keyed by a substring of the ticket URL.
//
// WHY THIS EXISTS: when punchup supplies no time for a show and `timeFromUrl` can't
// recover one from the ticket URL, a hand-set `time` normally survives via the
// non-destructive merge below — but for same-venue/same-date double-headers that
// merge falls back to a `date|slug|time` key, which can't match a show that has no
// time, so a hand-set time on one would be lost on the next cron run. Keying on the ticket URL disambiguates
// them, since that is the one field unique to each show.
//
// EMPTY as of 2026-09-08. Both former entries were for the Nov 8 Top Secret pair, and
// punchup now serves the correct time for each, which the DOM scrape below reads
// directly. The day-care line was actively HARMFUL by then: it forced the retired
// 11:30 AM over punchup's corrected 2:00 PM on every nightly rebuild.
// Add a line only for a show punchup gets wrong; delete it once punchup is fixed.
const TIME_OVERRIDES = {};

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function showIsToday(dateStr) {
  return dateStr === todayUTC();
}

// Derive a show's format brand. Ticket-URL rules come first because a URL is unique
// per show — it is the only signal that can tell a same-venue/same-date double-header
// apart (the Nov 8 Top Secret pair). Venue rules catch recurring residencies, so any
// future date punchup adds at that venue is labeled with no further edit here.
// Returns a spreadable object so an unmatched show adds no `showType` key at all.
function showTypeFor(ticketUrl, venue) {
  const url = (ticketUrl || "").toLowerCase();
  const v = (venue || "").toLowerCase();
  if (url.includes("day-care")) return { showType: "day_care_comedy" };
  if (url.includes("laugh-it-off")) return { showType: "laugh_it_off" };
  if (v.includes("othership")) return { showType: "sauna_comedy" };
  if (v.includes("chefs hall")) return { showType: "new_material" };
  return {};
}

// Build a URL-safe slug from a venue name.
// Verified byte-for-byte against existing slugs (incl. accented Latin and apostrophes).
function slugify(v) {
  return v.toLowerCase()
    .replace(/['’]/g, "")          // drop apostrophes: Yuk Yuk's -> yukyuks
    .replace(/[^a-z0-9À-ɏ]+/g, "-") // non-alnum (keep Latin accents) -> hyphen
    .replace(/^-+|-+$/g, "");      // trim
}

// Province/state full-name -> 2-letter abbreviation. Punchup sometimes renders
// the full region name (e.g. "Thunder Bay, Ontario") while the site convention is
// the abbreviation ("Thunder Bay, ON"). Normalizing here stops the daily cron from
// silently reverting hand-abbreviated cities. Mirrors _PROVINCE_STATE_ABBR in
// .claude/skills/meta-ads/scripts/analyze_history.py — keep the two in sync.
const PROVINCE_STATE_ABBR = {
  // Canadian provinces + territories
  Ontario: "ON", "British Columbia": "BC", Alberta: "AB", Quebec: "QC", "Québec": "QC",
  Manitoba: "MB", Saskatchewan: "SK", "Nova Scotia": "NS", "New Brunswick": "NB",
  "Newfoundland and Labrador": "NL", Newfoundland: "NL", Labrador: "NL",
  "Prince Edward Island": "PE", "Northwest Territories": "NT", Nunavut: "NU", Yukon: "YT",
  // US states + DC
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

// Convert "City, <full region>" -> "City, <abbr>"; leave anything else untouched.
function normalizeCity(cityStr) {
  if (!cityStr || !cityStr.includes(", ")) return cityStr;
  const idx = cityStr.lastIndexOf(", ");
  const cityPart = cityStr.slice(0, idx);
  const region = cityStr.slice(idx + 2).trim();
  const abbr = PROVINCE_STATE_ABBR[region];
  return abbr ? `${cityPart}, ${abbr}` : cityStr;
}

// Title-case a venue name for display. Two cases:
//   1. Fully ALL-CAPS (punchup's CSS text-transform leaking through textContent,
//      e.g. "CAMPFIRE COMEDY CLUB"): lowercase first, then title-case every word.
//   2. Normal mixed case: leave existing capitals alone so acronyms, possessives
//      (Yuk Yuk's), and accented names (Théâtre) survive — only fix all-lowercase
//      content words punchup sometimes emits (e.g. "Simcoe Street theatre").
// Either way: words that already contain a capital are preserved, separators/digits
// are left as-is, and minor connective words stay lowercase unless they lead.
function titleCaseVenue(v) {
  if (!v) return v;
  const minor = new Set(["and", "of", "the", "or", "a", "an", "for", "to", "in", "on", "at", "by", "with"]);
  const allCaps = !/[a-zà-ÿ]/.test(v); // no lowercase letter anywhere
  const base = allCaps ? v.toLowerCase() : v;
  return base
    .split(" ")
    .map((word, i) => {
      if (!word) return word;
      if (/[A-ZÀ-Þ]/.test(word)) return word;   // already capitalized (acronym, proper, accented)
      if (!/[a-zà-ÿ]/.test(word)) return word;  // separators (-, |), digits
      if (i > 0 && minor.has(word)) return word; // mid-name minor word stays lowercase
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// Normalizes a time scraped from the DOM ("7:00 PM", "9:30 pm") into the exact shape
// timeFromUrl() emits: uppercase meridiem, and a ":00" dropped so the row renders as
// "VENUE – 7 PM". Returns "" for anything that isn't a time.
function normalizeTime(raw) {
  if (!raw) return "";
  const m = String(raw).match(/(\d{1,2}):(\d{2})\s*([APap][Mm])/);
  if (!m) return "";
  const h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  return min === "00" ? `${h} ${ampm}` : `${h}:${min} ${ampm}`;
}

function timeFromUrl(url) {
  // Decode percent-encoded colons (%3A) before matching
  const decoded = url.replace(/%3A/gi, ":");

  // Match ISO-style time in URL: T19:00:00
  const isoM = decoded.match(/T(\d{2}):(\d{2}):\d{2}/);
  if (isoM) {
    let h = parseInt(isoM[1], 10);
    const min = isoM[2];
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return min === "00" ? `${h} ${ampm}` : `${h}:${min} ${ampm}`;
  }

  // Match plain-text time slug in URL: 730pm, 930pm, 800pm, etc.
  const slugM = url.match(/[^a-z](\d{1,2})(\d{2})(am|pm)\b/i);
  if (slugM) {
    let h = parseInt(slugM[1], 10);
    const min = slugM[2];
    const ampm = slugM[3].toUpperCase();
    return min === "00" ? `${h} ${ampm}` : `${h}:${min} ${ampm}`;
  }

  return "";
}

async function main() {
  // The live list, read before scraping: the merge carries fields forward from it
  // and the list-size guard compares against it.
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch {
    // no existing file (first run): nothing to merge or compare against
  }

  if (CHECK_TODAY) {
    if (existing.length > 0 && !existing.some((s) => showIsToday(s.date))) {
      console.log("No show today — skipping hourly scrape.");
      process.exit(0);
    }
    console.log("Show today detected — running full scrape.");
  }

  const browser = await chromium.launch({ headless: true, timeout: 30000 });
  const fail = async (lines) => {
    reportFailure(lines);
    await browser.close().catch(() => {});
    process.exit(1);
  };
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  // Bound every page.* op so a hung SPA/network fails fast instead of stalling the
  // CI job for minutes (the workflow also has a job-level timeout-minutes ceiling).
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(60000);

  console.log(`Navigating to ${PUNCHUP_URL}...`);
  await page.goto(PUNCHUP_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Wait for the show list. Every show row, on sale or sold out, links to its
  // punchup event page (/e/<id>), so that is what we wait for.
  try {
    await page.waitForSelector(PUNCHUP_EVENT_LINK, { timeout: 20000 });
  } catch {
    // Timed out: the list-size guard below decides whether "no shows" is real.
  }

  // Distinct punchup event ids on the page (its own /e/<id> links only; Eventbrite
  // ticket URLs also contain "/e/").
  const countEventIds = () =>
    page.evaluate((sel) => {
      const ids = new Set();
      for (const a of document.querySelectorAll(sel)) {
        const m = (a.getAttribute("href") || "").match(/\/e\/([^/?#]+)/);
        if (m) ids.add(m[1]);
      }
      return ids.size;
    }, PUNCHUP_EVENT_LINK);

  // punchup shows 5 dates until "See All" is clicked. If the button is there, the
  // click MUST expand the list (a "Show Less" button appears or more events load);
  // otherwise the run fails rather than publishing a 5-show list.
  const seeAll = page
    .locator("button")
    .filter({ hasText: /^\s*(see all|view all|show all|show more|load more|view more)\b/i })
    .first();
  if ((await seeAll.count()) > 0) {
    const before = await countEventIds();
    console.log(`Found "See All" (${before} events showing) — clicking to expand the full list...`);
    await seeAll.click();
    const expanded = await page
      .waitForFunction(
        ({ b, sel }) => {
          const ids = new Set();
          for (const a of document.querySelectorAll(sel)) {
            const m = (a.getAttribute("href") || "").match(/\/e\/([^/?#]+)/);
            if (m) ids.add(m[1]);
          }
          const less = Array.from(document.querySelectorAll("button")).some((x) =>
            /^\s*(show less|see less|view less)\b/i.test(x.textContent || "")
          );
          return ids.size > b || less;
        },
        { b: before, sel: PUNCHUP_EVENT_LINK },
        { timeout: 10000 }
      )
      .then(() => true)
      .catch(() => false);
    if (!expanded) {
      await fail([`"See All" was clicked but the list did not expand (still ${before} events).`]);
    }
    // Scroll to the bottom so any lazy-loaded rows render, then let them settle.
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    console.log(`Expansion complete: ${await countEventIds()} events.`);
  } else {
    console.log('No "See All" button found — the full list is already showing.');
  }

  const scraped = await page.evaluate(extractEvents);
  console.log(
    `Parsed ${scraped.events.length} of ${scraped.pageEventCount} punchup events:`
  );
  for (const e of scraped.events) {
    console.log(
      `  ${e.eventHref}  ${e.dateRaw} ${e.timeRaw} | ${e.city} | ${e.venue} | ${e.status}${e.ticketUrl ? "" : " (no ticket link)"}`
    );
  }

  if (scraped.pageEventCount === 0) {
    try {
      fs.writeFileSync("/tmp/punchup-debug.html", await page.content());
      console.warn("WARNING: no shows found on punchup. Page HTML saved to /tmp/punchup-debug.html.");
    } catch {
      // debug dump only
    }
  }

  // Completeness guard: every event punchup shows must parse into a usable row.
  const parseFailures = findParseFailures(scraped);
  if (parseFailures.length > 0) {
    await fail([
      `${parseFailures.length} punchup event(s) failed to parse. Fix the parser in scripts/punchup-parse.js:`,
      ...parseFailures.map((f) => `  - ${f}`),
    ]);
  }

  const shows = scraped.events;

  // Normalize and deduplicate
  const seen = new Set();
  const enriched = [];
  // Sold-out show -> its punchup event page, used only if the merge finds no earlier
  // ticket URL. Kept off the show object so it never reaches tour-dates.json.
  const soldOutFallbackUrl = new Map();

  for (const show of shows) {
    const dateStr = parsePunchupDate(show.dateRaw);
    const resolvedTime = normalizeTime(show.timeRaw) || timeFromUrl(show.ticketUrl);

    // The time is part of the key so a same-venue/same-date double-header sold off a
    // SINGLE ticket listing survives. Mic Drop Comedy Chandler runs 7 PM + 9:30 PM on
    // both Feb 19 and Feb 20 2027 through one URL, and the old
    // date|city|venue|ticketUrl key silently dropped the late show on each night —
    // two real dates missing from the site with nothing in the log to say so.
    // The desktop/mobile copies punchup renders of one row carry the same time, so
    // they still collapse.
    const key = `${dateStr}|${show.city}|${show.venue}|${show.ticketUrl}|${resolvedTime}`;

    if (seen.has(key)) continue;
    seen.add(key);

    const venue = titleCaseVenue(show.venue || "");
    const soldOutNoUrl = show.status === "sold_out" && !show.ticketUrl;

    const entry = {
      slug: slugify(venue),
      date: dateStr,
      city: normalizeCity(show.city || "TBD"),
      venue,
      // Left empty for a sold-out row so the merge carries the real ticket URL (and
      // the showType derived from it) forward from the previous night's entry.
      ticketUrl: soldOutNoUrl ? "" : show.ticketUrl || PUNCHUP_URL,
      status: show.status,
      ...(resolvedTime ? { time: resolvedTime } : {}),
      ...showTypeFor(show.ticketUrl, venue),
    };
    if (soldOutNoUrl) soldOutFallbackUrl.set(entry, show.eventHref || PUNCHUP_URL);
    enriched.push(entry);
  }

  // Sort chronologically and remove past shows
  const today = todayUTC();
  const future = enriched
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  console.log(`${future.length} upcoming shows after dedup + filtering past dates.`);

  // List-size guard: an empty or far shorter list is a broken scrape, not a
  // cancellation spree. Override for a real mass cancellation with
  // TOUR_ALLOW_LARGE_DROP=1 (workflow input allow_large_drop).
  const prevUpcoming = existing.filter((s) => s.date >= today).length;
  const sizeError = checkListSize(prevUpcoming, future.length);
  if (sizeError) {
    if (ALLOW_LARGE_DROP) {
      console.warn(`WARNING: ${sizeError}. Accepted because TOUR_ALLOW_LARGE_DROP=1.`);
    } else {
      await fail([
        `${sizeError}.`,
        "If the shows really were removed, re-run the workflow with allow_large_drop checked.",
      ]);
    }
  }

  // Non-destructive merge: carry forward any field on the prior entry that this
  // run did NOT (re)produce. This generically defeats the recurring "field-strip"
  // pattern — the scraper rebuilds the file from scratch and only writes fields it
  // authors, so any field added by another feature (or hand-set) would otherwise be
  // silently dropped on the next cron run. It protects:
  //   - hand-set showType the scraper can't auto-detect (comedy_special_recording)
  //   - a `time` the scraper could derive before but can't from a changed ticket URL
  //   - any field a future feature adds to tour-dates.json
  // A field the scraper DID produce (ticketUrl, city, venue, status, slug, date, and
  // time-when-derivable) is always present, so the fresh value wins — venue casing
  // and city normalization are not reverted.
  //
  // Keyed on date|slug — stable across the casing/region reformatting the scraper
  // applies to venue/city (slug is casing-independent) AND across ticketUrl changes,
  // both of which broke the old date|city|venue|ticketUrl key. Same-venue/same-date
  // double-headers (e.g. two Dallas shows on one night) collide on this key, so for
  // those it falls back to date|slug|time. A sold-out row arrives with NO ticketUrl,
  // so without this a sold-out half of a pair (the Nov 8 Top Secret Day Care show
  // beside its Laugh It Off show) would lose its ticket URL and its showType. A pair
  // that shares a time, or has none, is still ambiguous and keeps fresh data only.
  // A key must be unique on BOTH sides: when a sold-out show reappears beside its
  // pair, the old file holds one show at that date|slug and the fresh scrape two, and
  // matching on date|slug alone would hand the other show's ticket URL to both.
  const stableKey = (s) => `${s.date}|${s.slug || slugify(s.venue || "")}`;
  const timedKey = (s) => `${stableKey(s)}|${s.time || ""}`;
  const countBy = (shows, keyFn) => {
    const counts = {};
    for (const s of shows) counts[keyFn(s)] = (counts[keyFn(s)] || 0) + 1;
    return counts;
  };
  const keyCounts = countBy(existing, stableKey);
  const timedKeyCounts = countBy(existing, timedKey);
  const freshKeyCounts = countBy(future, stableKey);
  const freshTimedKeyCounts = countBy(future, timedKey);
  const existingByKey = {};
  const existingByTimedKey = {};
  for (const s of existing) {
    existingByKey[stableKey(s)] = s;
    existingByTimedKey[timedKey(s)] = s;
  }
  for (const show of future) {
    const k = stableKey(show);
    const tk = timedKey(show);
    let prev;
    if (keyCounts[k] === 1 && freshKeyCounts[k] === 1) prev = existingByKey[k];
    else if (show.time && timedKeyCounts[tk] === 1 && freshTimedKeyCounts[tk] === 1) prev = existingByTimedKey[tk];
    else continue; // ambiguous double-header — keep fresh data only
    for (const [field, value] of Object.entries(prev)) {
      const cur = show[field];
      if (cur === undefined || cur === null || cur === "") {
        show[field] = value;
      }
    }
  }

  // A sold-out show the site never saw on sale has no earlier ticket URL to inherit.
  // Point it at its punchup event page so the schema gate below still passes.
  for (const show of future) {
    if (!show.ticketUrl && soldOutFallbackUrl.has(show)) {
      show.ticketUrl = soldOutFallbackUrl.get(show);
    }
  }

  // Apply ticket-URL overrides (see TICKET_URL_OVERRIDES above). Runs AFTER scrape +
  // merge so it wins over whatever punchup served, keeping the corrected URL stable
  // across every daily cron run. A key that matches nothing is a silent no-op.
  // Like the merge block, the date|slug key can't disambiguate a same-venue/same-date
  // double-header — both rows would take the same override URL. Not a risk today
  // (one entry per key); add time to the key if such a collision ever arises.
  for (const show of future) {
    const overrideKey = `${show.date}|${show.slug || slugify(show.venue || "")}`;
    const override = TICKET_URL_OVERRIDES[overrideKey];
    if (override && show.ticketUrl !== override) {
      console.log(
        `Ticket URL override: ${overrideKey}\n    ${show.ticketUrl}\n -> ${override}`
      );
      show.ticketUrl = override;
    }
  }

  // Apply show-time overrides (see TIME_OVERRIDES above). Runs after the ticket-URL
  // overrides so it matches against the corrected URL, and before the schema gate.
  for (const show of future) {
    const url = (show.ticketUrl || "").toLowerCase();
    for (const [needle, time] of Object.entries(TIME_OVERRIDES)) {
      if (url.includes(needle)) {
        if (show.time !== time) {
          console.log(`Time override: ${show.date}|${show.slug} -> ${time}`);
        }
        show.time = time;
        break;
      }
    }
  }

  // Inline schema gate — every entry MUST have these as non-empty strings.
  // (time/showType are optional and intentionally excluded.) On any failure, log
  // the offending entry and exit non-zero WITHOUT writing, so the Action's commit
  // step is skipped (red check) rather than freezing the site on broken data.
  const REQUIRED_STRING_FIELDS = ["date", "city", "venue", "ticketUrl", "status", "slug"];
  for (const entry of future) {
    for (const field of REQUIRED_STRING_FIELDS) {
      const val = entry[field];
      if (typeof val !== "string" || val.trim() === "") {
        await fail([
          `SCHEMA GATE FAILED: entry missing non-empty string "${field}". Offending entry:`,
          JSON.stringify(entry, null, 2),
        ]);
      }
    }
  }
  console.log("Schema gate passed. venue -> slug map:");
  for (const entry of future) {
    console.log(`  ${entry.venue} -> ${entry.slug}`);
  }

  if (JSON.stringify(future) === JSON.stringify(existing)) {
    console.log("Tour dates unchanged — no commit needed.");
  } else {
    // Write to a temp file, then rename, so a killed run can never leave a truncated JSON.
    fs.writeFileSync(`${OUTPUT_PATH}.tmp`, JSON.stringify(future, null, 2));
    fs.renameSync(`${OUTPUT_PATH}.tmp`, OUTPUT_PATH);
    console.log(`Updated ${OUTPUT_PATH} with ${future.length} upcoming shows.`);
  }

  await browser.close();
}

main().catch((err) => {
  reportFailure([`Scraper error: ${err && err.stack ? err.stack : err}`]);
  process.exit(1);
});
