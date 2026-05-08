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

  // Wait for at least one Buy Tickets link to appear
  try {
    await page.waitForSelector('a:has-text("Buy Tickets")', { timeout: 15000 });
  } catch {
    // May have timed out — try anyway
  }

  // Click "See All" button if present to expand the full show list
  try {
    const seeAllBtn = await page.$('button:has-text("See All")');
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

    // Find all Buy Tickets anchors
    const ticketLinks = Array.from(
      document.querySelectorAll("a")
    ).filter((a) => (a.innerText || a.textContent || "").trim() === "Buy Tickets");

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
      let city = "";

      if (eventLinks.length >= 1) {
        const firstP = eventLinks[0].querySelector("p");
        dateRaw = firstP ? (firstP.innerText || firstP.textContent || "").trim() : "";
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

      // Extract venue — punchup styles venue names with "uppercase" in className
      let venue = "";
      const allP = Array.from(row.querySelectorAll("p"));
      for (const p of allP) {
        const cls = p.className || "";
        if (cls.includes("uppercase") && cls.includes("semibold")) {
          const t = (p.innerText || p.textContent || "").trim();
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
            const t = (p.innerText || p.textContent || "").trim();
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

      results.push({ dateRaw, city, venue, ticketUrl, status });
    }

    return results;
  });

  console.log(`Extracted ${shows.length} raw show entries.`);

  if (shows.length === 0) {
    const html = await page.content();
    fs.writeFileSync("/tmp/punchup-debug.html", html);
    console.error(
      "Could not find any shows. Page HTML saved to /tmp/punchup-debug.html"
    );
    await browser.close();
    process.exit(1);
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

    enriched.push({
      date: dateStr,
      city: show.city || "TBD",
      venue: show.venue || "",
      ticketUrl: show.ticketUrl || PUNCHUP_URL,
      status: show.status,
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
