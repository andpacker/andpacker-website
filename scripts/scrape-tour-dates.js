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
  await page.goto(PUNCHUP_URL, { waitUntil: "networkidle", timeout: 60000 });

  // Wait for event cards to appear — punchup.live is a React SPA
  // Try multiple possible selectors
  const CARD_SELECTORS = [
    '[data-testid="event-card"]',
    ".event-card",
    "[class*='event']",
    "[class*='show']",
    "article",
  ];

  let cardSelector = null;
  for (const sel of CARD_SELECTORS) {
    const count = await page.locator(sel).count();
    if (count > 0) {
      cardSelector = sel;
      console.log(`Found ${count} event cards with selector: ${sel}`);
      break;
    }
  }

  if (!cardSelector) {
    // Try waiting a bit longer for JS to render
    console.log("No event cards found immediately, waiting 5s for JS render...");
    await page.waitForTimeout(5000);

    for (const sel of CARD_SELECTORS) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        cardSelector = sel;
        console.log(`Found ${count} cards after wait with selector: ${sel}`);
        break;
      }
    }
  }

  if (!cardSelector) {
    // Dump page content for debugging
    const html = await page.content();
    fs.writeFileSync("/tmp/punchup-debug.html", html);
    console.error(
      "Could not find event cards. Page HTML saved to /tmp/punchup-debug.html"
    );
    await browser.close();
    process.exit(1);
  }

  const shows = await page.evaluate((selector) => {
    const cards = Array.from(document.querySelectorAll(selector));
    return cards.map((card) => {
      const text = card.innerText || card.textContent || "";

      // Extract date — look for ISO date or formatted date text
      let date = "";
      const dateEl =
        card.querySelector("[class*='date']") ||
        card.querySelector("time") ||
        card.querySelector("[datetime]");
      if (dateEl) {
        date =
          dateEl.getAttribute("datetime") ||
          dateEl.getAttribute("data-date") ||
          dateEl.innerText ||
          "";
      }

      // Extract city/venue
      const cityEl =
        card.querySelector("[class*='city']") ||
        card.querySelector("[class*='location']") ||
        card.querySelector("h3") ||
        card.querySelector("h2");
      const city = cityEl ? cityEl.innerText.trim() : "";

      const venueEl =
        card.querySelector("[class*='venue']") ||
        card.querySelector("[class*='name']") ||
        card.querySelector("p");
      const venue = venueEl ? venueEl.innerText.trim() : "";

      // Extract ticket link — look for an anchor inside the card
      const linkEl =
        card.querySelector("a[href*='ticket']") ||
        card.querySelector("a[href*='event']") ||
        card.querySelector("a[href]");
      const ticketUrl = linkEl ? linkEl.href : "";

      // Extract status — look for sold out / low tickets badge text
      const cardText = text.toLowerCase();
      let status = "on_sale";
      if (cardText.includes("sold out")) status = "sold_out";
      else if (
        cardText.includes("low ticket") ||
        cardText.includes("almost sold")
      )
        status = "low_tickets";

      return { date, city, venue, ticketUrl, status, _rawText: text.slice(0, 200) };
    });
  }, cardSelector);

  console.log(`Extracted ${shows.length} raw show entries.`);

  // If the simple approach got us nothing useful, try clicking each card for details
  const enriched = [];
  for (const show of shows) {
    let ticketUrl = show.ticketUrl;

    if (!ticketUrl || ticketUrl.includes("punchup.live")) {
      // Navigate to the show detail page to get the real external ticket link
      const cardLinks = await page.locator(`${cardSelector} a`).all();
      for (const link of cardLinks) {
        const href = await link.getAttribute("href");
        if (href && !href.includes("punchup.live") && href.startsWith("http")) {
          ticketUrl = href;
          break;
        }
      }
    }

    // Normalize date to YYYY-MM-DD
    let dateStr = show.date;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      dateStr = parsed.toISOString().slice(0, 10);
    }

    enriched.push({
      date: dateStr,
      city: show.city || show._rawText.split("\n")[0] || "TBD",
      venue: show.venue || "",
      ticketUrl: ticketUrl || PUNCHUP_URL,
      status: show.status,
    });
  }

  // Sort chronologically and remove past shows
  const today = todayUTC();
  const future = enriched
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const existing = JSON.parse(
    fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, "utf8") : "[]"
  );

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
