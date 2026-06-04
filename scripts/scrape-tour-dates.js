#!/usr/bin/env node
/**
 * Scrapes tour dates from https://punchup.live/AndrewPacker using Playwright.
 * Writes results to data/tour-dates.json.
 *
 * Flags:
 *   --check-today   Only run full scrape if a show is today (used by hourly cron).
 *                   Exits with code 0 immediately if no show is today.
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const PUNCHUP_URL = "https://punchup.live/AndrewPacker";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "tour-dates.json");
const CHECK_TODAY = process.argv.includes("--check-today");

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function showIsToday(dateStr) {
  return dateStr === todayUTC();
}

// Parse "May 15" or "May 15, 2026" style date strings into YYYY-MM-DD.
// Falls back to current year if year is omitted.
function parsePunchupDate(raw) {
  if (!raw) return "";
  const cleaned = raw.trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  const currentYear = new Date().getFullYear();
  // Try with year appended if not present
  const withYear = /\d{4}/.test(cleaned)
    ? cleaned
    : `${cleaned}, ${currentYear}`;
  const parsed = new Date(withYear);
  if (!isNaN(parsed.getTime())) {
    // Use UTC to avoid timezone shifting the date
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return cleaned;
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

// Punchup applies CSS text-transform:uppercase, so innerText returns ALL-CAPS.
// textContent (used at extraction) preserves the true casing; this is a defensive
// fallback that Title-cases an ALL-CAPS string while leaving mixed-case untouched.
// Punctuation/separators (-, |, etc.) and short connective words stay as-is.
function titleCaseVenue(v) {
  if (!v) return v;
  // Only normalize strings that are effectively all-uppercase (no lowercase letters).
  if (/[a-z]/.test(v)) return v;
  const minor = new Set(["and", "of", "the", "or", "a", "an", "for", "to", "in", "on"]);
  return v
    .toLowerCase()
    .split(/\b/)
    .map((tok) => {
      if (!/[a-z]/.test(tok)) return tok; // separators, digits
      if (minor.has(tok)) return tok;
      return tok.charAt(0).toUpperCase() + tok.slice(1);
    })
    .join("");
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
  if (CHECK_TODAY) {
    let existing = [];
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
    } catch {
      // no existing file — run scrape anyway
    }
    if (existing.length > 0 && !existing.some((s) => showIsToday(s.date))) {
      console.log("No show today — skipping hourly scrape.");
      process.exit(0);
    }
    console.log("Show today detected — running full scrape.");
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  console.log(`Navigating to ${PUNCHUP_URL}...`);
  await page.goto(PUNCHUP_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  // punchup.live renders show rows as grid divs with exactly 4 direct children:
  //   [0] date/city column, [1] info column, [2] ticket button column, [3] share button column
  //
  // The page also renders wider wrapper containers (childCount >= 8) that span multiple rows
  // and pollute the data — we must filter those out by requiring childCount === 4.
  //
  // Strategy: find all "Buy Tickets" anchors, walk up to the nearest 4-child container,
  // then extract date, city, and venue from siblings within that row.

  // Wait for at least one ticket link to appear (try multiple button text variants)
  try {
    await page.waitForSelector(
      'a:has-text("Buy Tickets"), a:has-text("Tickets"), a:has-text("Get Tickets")',
      { timeout: 15000 }
    );
  } catch {
    // May have timed out — try anyway
  }

  // Click "See All" button if present to expand the full show list
  try {
    const seeAllBtn = await page.$('button:has-text("See All"), button:has-text("View All"), button:has-text("Load More"), button:has-text("Show All"), button:has-text("Show More")');
    if (seeAllBtn) {
      console.log("Found 'See All' button — clicking to expand full show list...");
      await seeAllBtn.click();
      // Scroll to bottom to trigger any lazy-loaded rows, then wait for network to settle
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      // Wait for additional ticket links to appear beyond the initial batch
      await page.waitForFunction(
        () => document.querySelectorAll('a').length > 10,
        { timeout: 10000 }
      ).catch(() => console.log("waitForFunction timed out — continuing anyway"));
      console.log("Expansion complete.");
    } else {
      console.log("No 'See All' button found — scraping visible shows only.");
    }
  } catch (err) {
    console.log("See All click failed:", err.message, "— continuing anyway.");
  }

  const shows = await page.evaluate(() => {
    const results = [];

    // Find all ticket anchors — match "Buy Tickets", "Tickets", "Get Tickets", etc.
    const ticketLinks = Array.from(
      document.querySelectorAll("a")
    ).filter((a) => {
      const t = (a.innerText || a.textContent || "").trim().toLowerCase();
      return t === "buy tickets" || t === "tickets" || t === "get tickets" || t === "purchase tickets" || t === "ticket";
    });

    for (const ticketLink of ticketLinks) {
      const ticketUrl = ticketLink.href || "";

      // Walk up to find the individual show row: exactly 4 direct children.
      // Stop before reaching a container that has many children (multi-row wrapper).
      let row = ticketLink.parentElement;
      for (let i = 0; i < 6; i++) {
        if (!row) break;
        if (row.children.length === 4) break;
        row = row.parentElement;
      }

      // Only accept rows with exactly 4 children (clean individual show rows)
      if (!row || row.children.length !== 4) continue;

      const rowText = row.innerText || row.textContent || "";

      // Extract date and city — they appear in anchor tags pointing to /e/<uuid>
      const eventLinks = Array.from(row.querySelectorAll('a[href^="/e/"]'));
      let dateRaw = "";
      let timeRaw = "";
      let city = "";

      if (eventLinks.length >= 1) {
        const allPs = Array.from(eventLinks[0].querySelectorAll("p"));
        dateRaw = allPs[0] ? (allPs[0].innerText || allPs[0].textContent || "").trim() : "";
        // Look for a time string (e.g. "7:00 PM") in remaining <p> elements
        const timeRe = /\d{1,2}:\d{2}\s*[APap][Mm]/;
        for (let j = 1; j < allPs.length; j++) {
          const t = (allPs[j].innerText || allPs[j].textContent || "").trim();
          if (timeRe.test(t)) { timeRaw = t; break; }
        }
        // Fallback: scan full innerText of the first event link
        if (!timeRaw) {
          const linkText = eventLinks[0].innerText || "";
          const m = linkText.match(timeRe);
          if (m) timeRaw = m[0].trim();
        }
      }
      if (eventLinks.length >= 2) {
        const secondP = eventLinks[1].querySelector("p");
        city = secondP ? (secondP.innerText || secondP.textContent || "").trim() : "";
      }

      // Fallback: split first event link text on newline
      if (!city && eventLinks.length === 1) {
        const parts = (eventLinks[0].innerText || "").trim().split("\n").map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          dateRaw = parts[0];
          city = parts[1];
        }
      }

      // Extract venue — punchup styles venue names with "uppercase" in className.
      // Use textContent (NOT innerText) so we get the source casing rather than the
      // CSS-uppercased rendering; titleCaseVenue() normalizes any all-caps stragglers.
      let venue = "";
      const allP = Array.from(row.querySelectorAll("p"));
      for (const p of allP) {
        const cls = p.className || "";
        if (cls.includes("uppercase") && cls.includes("semibold")) {
          const t = (p.textContent || "").trim();
          if (t && t.length < 100) {
            venue = t;
            break;
          }
        }
      }
      // Fallback: computed textTransform
      if (!venue) {
        for (const p of allP) {
          if (window.getComputedStyle(p).textTransform === "uppercase") {
            const t = (p.textContent || "").trim();
            if (t && t.length < 100) {
              venue = t;
              break;
            }
          }
        }
      }

      // Status detection
      const cardText = rowText.toLowerCase();
      let status = "on_sale";
      if (cardText.includes("sold out")) status = "sold_out";
      else if (cardText.includes("low ticket") || cardText.includes("almost sold")) status = "low_tickets";

      results.push({ dateRaw, timeRaw, city, venue, ticketUrl, status });
    }

    return results;
  });

  console.log(`Extracted ${shows.length} raw show entries.`);

  if (shows.length === 0) {
    const html = await page.content();
    fs.writeFileSync("/tmp/punchup-debug.html", html);
    console.warn(
      "WARNING: Could not find any shows. Page HTML saved to /tmp/punchup-debug.html. Preserving existing tour-dates.json unchanged."
    );
    await browser.close();
    process.exit(0);
  }

  // Normalize and deduplicate
  const seen = new Set();
  const enriched = [];

  for (const show of shows) {
    const dateStr = parsePunchupDate(show.dateRaw);
    const key = `${dateStr}|${show.city}|${show.venue}|${show.ticketUrl}`;

    // Skip duplicates (punchup renders desktop + mobile copies of each row)
    if (seen.has(key)) continue;
    seen.add(key);

    const resolvedTime = show.timeRaw || timeFromUrl(show.ticketUrl);
    const venue = titleCaseVenue(show.venue || "");

    enriched.push({
      slug: slugify(venue),
      date: dateStr,
      city: normalizeCity(show.city || "TBD"),
      venue,
      ticketUrl: show.ticketUrl || PUNCHUP_URL,
      status: show.status,
      ...(resolvedTime ? { time: resolvedTime } : {}),
      ...(show.ticketUrl.toLowerCase().includes("laugh-it-off")
        ? { showType: "laugh_it_off" }
        : (show.venue || "").toLowerCase().includes("othership")
        ? { showType: "sauna_comedy" }
        : {}),
    });
  }

  // Sort chronologically and remove past shows
  const today = todayUTC();
  const future = enriched
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  console.log(`${future.length} upcoming shows after dedup + filtering past dates.`);

  const existingRaw = fs.existsSync(OUTPUT_PATH)
    ? fs.readFileSync(OUTPUT_PATH, "utf8")
    : "[]";
  const existing = JSON.parse(existingRaw);

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
  // double-headers (e.g. two Dallas shows on one night) collide on this key; for
  // those we skip carry-forward (their distinguishing fields — time, ticketUrl — are
  // always re-derived fresh, so nothing is lost).
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

  // Inline schema gate — every entry MUST have these as non-empty strings.
  // (time/showType are optional and intentionally excluded.) On any failure, log
  // the offending entry and exit non-zero WITHOUT writing, so the Action's commit
  // step is skipped (red check) rather than freezing the site on broken data.
  const REQUIRED_STRING_FIELDS = ["date", "city", "venue", "ticketUrl", "status", "slug"];
  for (const entry of future) {
    for (const field of REQUIRED_STRING_FIELDS) {
      const val = entry[field];
      if (typeof val !== "string" || val.trim() === "") {
        console.error(
          `SCHEMA GATE FAILED: entry missing non-empty string "${field}". Offending entry:`
        );
        console.error(JSON.stringify(entry, null, 2));
        await browser.close();
        process.exit(1);
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
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(future, null, 2));
    console.log(`Updated tour-dates.json with ${future.length} upcoming shows.`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error("Scraper error:", err);
  process.exit(1);
});
