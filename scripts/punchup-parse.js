/**
 * Parsing + safety guards for the punchup.live tour-date scrape.
 *
 * Shared by scripts/scrape-tour-dates.js (the nightly sync) and
 * scripts/test-punchup-parse.mjs (fixture tests), so the tests run the real code.
 *
 * WHY THIS EXISTS: the old parser walked up from each ticket button to a row with
 * EXACTLY 4 child elements. When punchup added a 5th (empty) div to a sold-out row,
 * the Collingwood Nov 27 show silently vanished from andpacker.com on the Nov 4 2026
 * sync, and nothing failed. Rows are now found by their punchup event link
 * (/e/<id>) and every field is read by its content, never by its position. A guard
 * then refuses to write tour-dates.json if any event on punchup failed to parse.
 */

/**
 * Runs INSIDE the browser via page.evaluate(extractEvents), so it must stay
 * self-contained: no references to anything outside this function body.
 *
 * Event identity = the punchup event id in /e/<id> links. punchup renders each
 * show more than once (desktop + mobile copies, and again in the expanded list);
 * all copies share the id and are merged into one event here.
 *
 * Returns { events, orphanControls, pageEventCount }:
 *   events          one entry per distinct event id, with the raw fields the
 *                   scraper normalizes (dateRaw, timeRaw, city, venue, ticketUrl,
 *                   status, eventHref)
 *   orphanControls  ticket / waitlist controls that belong to no event link: a
 *                   show punchup lists that we cannot identify
 *   pageEventCount  distinct /e/ ids on the page
 */
function extractEvents() {
  const TICKET_TEXTS = new Set([
    "buy tickets", "tickets", "get tickets", "purchase tickets", "ticket", "buy ticket",
  ]);
  const SOLD_OUT_TEXTS = new Set(["join waitlist", "sold out", "waitlist", "join the waitlist"]);
  const MONTHS = {
    jan: "January", feb: "February", mar: "March", apr: "April", may: "May", jun: "June",
    jul: "July", aug: "August", sep: "September", oct: "October", nov: "November", dec: "December",
  };
  const DATE_RE = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/i;
  const TIME_RE = /\b(\d{1,2}):(\d{2})\s*([AaPp])\.?\s*[Mm]\b/;
  const TIME_NO_MIN_RE = /\b(\d{1,2})\s*([AaPp])\.?\s*[Mm]\b/;
  // Region names punchup may print in full ("Thunder Bay, Ontario").
  const REGION_NAMES = new Set([
    "ontario", "british columbia", "alberta", "quebec", "québec", "manitoba", "saskatchewan",
    "nova scotia", "new brunswick", "newfoundland and labrador", "newfoundland", "labrador",
    "prince edward island", "northwest territories", "nunavut", "yukon",
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
    "delaware", "district of columbia", "florida", "georgia", "hawaii", "idaho", "illinois",
    "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts",
    "michigan", "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada",
    "new hampshire", "new jersey", "new mexico", "new york", "north carolina", "north dakota",
    "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina",
    "south dakota", "tennessee", "texas", "utah", "vermont", "virginia", "washington",
    "west virginia", "wisconsin", "wyoming",
  ]);

  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const lower = (s) => norm(s).toLowerCase();

  // Only punchup's OWN /e/<id> links identify a show. Eventbrite ticket URLs also
  // contain "/e/" (eventbrite.com/e/...), so the host must be checked.
  function eventIdOf(a) {
    const raw = a.getAttribute("href") || "";
    let path = raw;
    try {
      const u = new URL(raw, location.href);
      const ownHost = u.hostname === location.hostname || /(^|\.)punchup\.live$/.test(u.hostname);
      if (!ownHost) return null;
      path = u.pathname;
    } catch {
      // unresolvable base (e.g. about:blank): only a site-relative path counts
    }
    const m = path.match(/^\/e\/([^/?#]+)/);
    return m ? m[1] : null;
  }
  function controlKind(el) {
    const t = lower(el.textContent);
    if (TICKET_TEXTS.has(t)) return "ticket";
    if (SOLD_OUT_TEXTS.has(t)) return "soldout";
    return null;
  }

  const eventAnchors = new Map(); // id -> [anchor]
  for (const a of document.querySelectorAll('a[href*="/e/"]')) {
    const id = eventIdOf(a);
    if (!id) continue;
    if (!eventAnchors.has(id)) eventAnchors.set(id, []);
    eventAnchors.get(id).push(a);
  }
  const controls = Array.from(document.querySelectorAll("a, button")).filter(
    (el) => controlKind(el) && !eventIdOf(el)
  );

  const hasOtherEvent = (el, id) =>
    Array.from(el.querySelectorAll('a[href*="/e/"]')).some((x) => {
      const xid = eventIdOf(x);
      return xid && xid !== id;
    });
  const hasControl = (el) => controls.some((c) => el.contains(c));

  // A show's row, from one of its event links: the SMALLEST ancestor that also
  // holds a ticket / waitlist control, never climbing into an ancestor that holds
  // another event's link. No child counting, so extra or empty wrapper divs do not
  // matter. A copy with no control climbs to the largest single-event ancestor.
  function rowFor(anchor, id) {
    let el = anchor;
    while (!hasControl(el)) {
      const parent = el.parentElement;
      if (!parent || parent === document.documentElement || hasOtherEvent(parent, id)) break;
      el = parent;
    }
    return el;
  }

  function leavesOf(anchors) {
    const out = [];
    for (const a of anchors) {
      for (const el of [a, ...a.querySelectorAll("*")]) {
        if (el.childElementCount === 0 && norm(el.textContent)) out.push(el);
      }
    }
    return out;
  }

  const events = [];
  const rowsOfAll = [];
  for (const [id, anchors] of eventAnchors) {
    const rows = Array.from(new Set(anchors.map((a) => rowFor(a, id))));
    rowsOfAll.push(...rows);
    const leaves = leavesOf(anchors);
    const used = new Set();

    let dateRaw = "";
    for (const el of leaves) {
      const m = norm(el.textContent).match(DATE_RE);
      if (!m) continue;
      const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
      dateRaw = `${month} ${parseInt(m[2], 10)}${m[3] ? `, ${m[3]}` : ""}`;
      used.add(el);
      break;
    }

    let timeRaw = "";
    for (const re of [TIME_RE, TIME_NO_MIN_RE]) {
      for (const el of leaves) {
        if (used.has(el)) continue;
        const m = norm(el.textContent).match(re);
        if (!m) continue;
        const min = re === TIME_RE ? m[2] : "00";
        const ap = (re === TIME_RE ? m[3] : m[2]).toUpperCase();
        timeRaw = `${parseInt(m[1], 10)}:${min} ${ap}M`;
        used.add(el);
        break;
      }
      if (timeRaw) break;
    }
    // punchup splits "Friday – 8:30 PM" into two spans; the bare weekday is part of
    // the time, never a venue or city.
    for (const el of leaves) {
      if (/^(mon|tues|wednes|thurs|fri|satur|sun)day\b[\s,–—-]*$/i.test(norm(el.textContent))) used.add(el);
    }

    // Venue: punchup styles it uppercase. textContent keeps the source casing.
    let venue = "";
    let venueEl = leaves.find((el) => !used.has(el) && /\buppercase\b/.test(el.className || ""));
    if (!venueEl) {
      venueEl = leaves.find(
        (el) => !used.has(el) && window.getComputedStyle(el).textTransform === "uppercase"
      );
    }

    // City: "Place, Region". Prefer a known province/state (2-letter code or full
    // name); else the first "x, y" text, which keeps a foreign city parseable.
    const cityLike = (el) => {
      const t = norm(el.textContent);
      const m = t.match(/^([^,\d]{2,}),\s*([^,\d]{2,})$/);
      return m ? m : null;
    };
    const cityCandidates = leaves.filter((el) => !used.has(el) && el !== venueEl && cityLike(el));
    const cityEl =
      cityCandidates.find((el) => {
        const region = cityLike(el)[2].trim();
        return /^[A-Z]{2}$/.test(region) || REGION_NAMES.has(region.toLowerCase());
      }) || cityCandidates[0];
    const city = cityEl ? norm(cityEl.textContent) : "";
    if (cityEl) used.add(cityEl);

    if (!venueEl) venueEl = leaves.find((el) => !used.has(el));
    if (venueEl) venue = norm(venueEl.textContent);

    let ticketUrl = "";
    let soldOutControl = false;
    let ticketButtonWithoutLink = false;
    let rowText = "";
    for (const row of rows) {
      rowText += " " + lower(row.textContent);
      for (const c of controls) {
        if (!row.contains(c)) continue;
        const kind = controlKind(c);
        if (kind === "soldout") soldOutControl = true;
        if (kind === "ticket") {
          if (c.tagName === "A" && c.href) ticketUrl = ticketUrl || c.href;
          else ticketButtonWithoutLink = true;
        }
      }
    }

    let status = "on_sale";
    if (soldOutControl || rowText.includes("sold out") || rowText.includes("join waitlist")) status = "sold_out";
    else if (rowText.includes("low ticket") || rowText.includes("almost sold")) status = "low_tickets";

    events.push({
      eventId: id,
      eventHref: anchors[0].href,
      dateRaw,
      timeRaw,
      city,
      venue,
      ticketUrl,
      status,
      ticketButtonWithoutLink,
    });
  }

  const orphanControls = controls
    .filter((c) => !rowsOfAll.some((row) => row.contains(c)))
    .map((c) => `${c.tagName.toLowerCase()} "${norm(c.textContent)}"${c.href ? ` -> ${c.href}` : ""}`);

  return { events, orphanControls, pageEventCount: eventAnchors.size };
}

// Parse "May 15" or "May 15, 2026" into YYYY-MM-DD. Falls back to the current year
// when the year is omitted (punchup prints the year only for next year's dates).
function parsePunchupDate(raw, now = new Date()) {
  if (!raw) return "";
  const cleaned = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const hasYear = /\d{4}/.test(cleaned);
  // A yearless string with no "Month day" shape (e.g. "TBA") must not be coerced into a
  // date by Date()'s lenient parsing; return it as-is so the completeness guard flags it.
  if (!hasYear && !/[A-Za-z]{3,}\.?\s+\d{1,2}\b|\b\d{1,2}\s+[A-Za-z]{3,}/.test(cleaned)) return cleaned;
  const withYear = hasYear ? cleaned : `${cleaned}, ${now.getFullYear()}`;
  const parsed = new Date(withYear);
  // Year rollover: a yearless date more than ~6 months in the past is next year's show
  // (e.g. "January 20" read in late December). A show from yesterday stays in the past.
  if (!hasYear && !isNaN(parsed.getTime()) && now - parsed > 183 * 86400000) {
    parsed.setFullYear(parsed.getFullYear() + 1);
  }
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return cleaned;
}

/**
 * Completeness guard. Returns one line per problem; empty means every event punchup
 * shows parsed into a usable row. A sold-out show needs no ticket URL (the merge
 * carries the old one forward), but it must still have date, city and venue.
 */
function findParseFailures({ events, orphanControls }) {
  const failures = [];
  for (const e of events) {
    const problems = [];
    if (!e.dateRaw) problems.push("no date");
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(parsePunchupDate(e.dateRaw))) problems.push(`unparseable date "${e.dateRaw}"`);
    if (!e.city) problems.push("no city");
    if (!e.venue) problems.push("no venue");
    if (!e.ticketUrl && e.status !== "sold_out") {
      problems.push(
        e.ticketButtonWithoutLink
          ? "ticket button has no link"
          : "no ticket link and no Join Waitlist / Sold Out control"
      );
    }
    if (problems.length) {
      const label = [e.dateRaw, e.city, e.venue].filter(Boolean).join(" | ") || "(unlabelled)";
      failures.push(`${e.eventHref} [${label}]: ${problems.join(", ")}`);
    }
  }
  for (const c of orphanControls || []) {
    failures.push(`ticket/waitlist control with no punchup event link: ${c}`);
  }
  return failures;
}

/**
 * List-size guard. A scrape that comes back empty or far shorter than the list
 * already live is treated as a broken scrape (a half-rendered page, a See All
 * that did not expand), not as cancellations. `prevUpcoming` = rows in the current
 * tour-dates.json dated today or later. Returns an error string, or null if fine.
 */
function checkListSize(prevUpcoming, fresh) {
  if (prevUpcoming > 0 && fresh === 0) {
    return `scrape found 0 upcoming shows but the live list has ${prevUpcoming}`;
  }
  if (prevUpcoming >= 4 && fresh < Math.ceil(prevUpcoming / 2)) {
    return `scrape found ${fresh} upcoming shows, under half of the ${prevUpcoming} on the live list`;
  }
  return null;
}

module.exports = { extractEvents, parsePunchupDate, findParseFailures, checkListSize };
