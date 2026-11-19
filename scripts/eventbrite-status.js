/**
 * Low Tickets / Sold Out from Andrew's own Eventbrite counts.
 *
 * Used by scripts/scrape-tour-dates.js (the nightly sync) after the punchup scrape,
 * and by scripts/test-eventbrite-status.mjs (offline tests, fetch injected).
 *
 * WHY THIS EXISTS: punchup only knows "on sale" or "Join Waitlist". On 2026-11-18
 * two seats opened on the sold-out Collingwood 8:30 PM show; punchup still said
 * Join Waitlist, so the site said Sold Out and nobody could buy them. For a show
 * sold on Andrew's OWN Eventbrite, Eventbrite is the box office, so it decides
 * (Andrew's call, 2026-11-19), even over punchup:
 *   0 seats left             -> sold_out    (site shows its Kit waitlist form)
 *   LOW_TICKETS_AT+ sold     -> low_tickets (yellow tag, normal Get Tickets)
 *   anything else, seats left-> on_sale
 * Any show this module cannot judge keeps punchup's status.
 *
 * ⚠️ Eventbrite returns HTTP 200 for ANY public event, including other promoters'
 * and clubs' events, just without quantity_sold. Ownership is checked against the
 * token's organizations, and every ticket class must carry real counts.
 * ⚠️ A ticket link can point at a recurring SERIES parent (Chefs Hall's
 * 798883922317 has status "started" since Feb 2024): its counts are not one night's,
 * so a series parent never decides, and the event's own date must be the show's date.
 *
 * The repo and its Actions logs are public: log decisions, never ticket counts.
 */

const EVENTBRITE_API = "https://www.eventbriteapi.com/v3";

// Andrew, 2026-11-19: "low tickets should appear at 80% sold and above". This is
// the SITE tag only; his "almost sold out only at 90%+" rule for ad copy and
// emails is separate and unchanged.
const LOW_TICKETS_AT = 0.8;

// "started" = the show has begun (a show-day sync); still his live box office.
const LIVE_STATUSES = new Set(["live", "started"]);
// Ticket classes nobody can buy right now. Their unsold seats are not "left".
const NOT_BUYABLE = new Set(["NOT_YET_ON_SALE", "SALES_ENDED", "UNAVAILABLE"]);

// eventbrite.<tld>/e/<slug>-<id> or the slug-less eventbrite.<tld>/e/<id>, with or
// without ?aff=..., a trailing slash, or a #fragment.
const EVENTBRITE_ID_RE = /^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:[^/?#@]*\.)?eventbrite\.[a-z.]+\/e\/(?:[^/?#]*-)?(\d{9,})(?=[/?#]|$)/i;

function eventbriteIdFrom(url) {
  if (typeof url !== "string") return null;
  const m = url.trim().match(EVENTBRITE_ID_RE);
  return m ? m[1] : null;
}

const isCount = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0;

/**
 * One Eventbrite event, for the show dated `showDate` (YYYY-MM-DD) -> { status, warning }.
 *   status   "sold_out" | "low_tickets" | "on_sale", or null = no opinion
 *   warning  set only when this is HIS live event and it cannot be judged
 * Not his event, not live (completed / deleted / draft / canceled), or a recurring
 * series parent: null, silent.
 */
function statusFromEvent(ev, myOrgIds, showDate) {
  const none = { status: null, warning: null };
  if (!ev || typeof ev !== "object") return none;
  if (!myOrgIds || !myOrgIds.has(String(ev.organization_id))) return none;
  if (!LIVE_STATUSES.has(ev.status)) return none;
  if (ev.is_series_parent === true) return none;
  const eventDate = ev.start && typeof ev.start.local === "string" ? ev.start.local.slice(0, 10) : "";
  if (showDate && eventDate !== showDate) {
    return {
      status: null,
      warning: `own event is dated ${eventDate || "(no date)"} but the show is ${showDate} (check the ticket link)`,
    };
  }

  const unreadable = { status: null, warning: "own live event, counts unreadable" };
  const classes = Array.isArray(ev.ticket_classes) ? ev.ticket_classes : [];
  if (classes.length === 0) return unreadable;
  if (!classes.every((tc) => tc && typeof tc === "object" && isCount(tc.quantity_sold) && isCount(tc.quantity_total))) return unreadable;

  const visible = classes.filter((tc) => !tc.hidden);
  const buyable = visible.filter((tc) => !NOT_BUYABLE.has(tc.on_sale_status));
  // Nothing on sale right now (sales not open yet, or closed): not "sold out".
  if (buyable.length === 0) return none;

  // Sold and size come from the SAME tickets: hidden comps/holds use up the event
  // capacity, so they count toward allSold whenever capacity is the size.
  const allSold = classes.reduce((n, tc) => n + tc.quantity_sold, 0);
  const visibleLeft = buyable.reduce((n, tc) => n + Math.max(0, tc.quantity_total - tc.quantity_sold), 0);
  const capacity = isCount(ev.capacity) && ev.capacity > 0 ? ev.capacity : null;
  const left = capacity !== null ? Math.min(visibleLeft, Math.max(0, capacity - allSold)) : visibleLeft;
  const size = capacity !== null ? capacity : classes.reduce((n, tc) => n + tc.quantity_total, 0);
  if (size <= 0) return unreadable;

  const soldOutFlag = ev.ticket_availability && ev.ticket_availability.is_sold_out === true;
  if (soldOutFlag || left <= 0) return { status: "sold_out", warning: null };
  if ((size - left) / size >= LOW_TICKETS_AT) return { status: "low_tickets", warning: null };
  return { status: "on_sale", warning: null };
}

async function defaultFetchJson(url, token) {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      // non-JSON error page: status is enough
    }
    return { status: res.status, body };
  } catch (err) {
    return { status: 0, body: null, error: err && err.message ? err.message : String(err) };
  }
}

/**
 * Sets `status` on every show whose ticket URL is one of Andrew's live Eventbrite
 * events. Never throws and never fails the sync: anything it cannot read leaves
 * punchup's status and, where Andrew should know, adds a warning (the workflow
 * posts warnings to Discord #bot-errors).
 * Returns { warnings: string[], decided: Set<show> }.
 */
// Total time for every Eventbrite call in one sync. The workflow kills the scraper
// step at 3 minutes; Playwright needs the rest. Past this, unchecked shows keep
// punchup's status and a warning says so: a slow Eventbrite never fails the sync.
const TOTAL_DEADLINE_MS = 60000;

async function applyEventbriteStatus(
  shows,
  { token, fetchJson = defaultFetchJson, log = console.log, deadlineMs = TOTAL_DEADLINE_MS, now = Date.now } = {}
) {
  const startedAt = now();
  const warnings = [];
  const decided = new Set();

  const byId = new Map();
  for (const show of shows) {
    const id = eventbriteIdFrom(show.ticketUrl);
    if (!id) continue;
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(show);
  }
  if (byId.size === 0) return { warnings, decided };

  if (!token) {
    warnings.push("EVENTBRITE_API_TOKEN missing: Low Tickets / Sold Out were not checked against Eventbrite.");
    return { warnings, decided };
  }

  const safeFetch = async (u) => {
    try {
      return (await fetchJson(u, token)) || { status: 0, body: null };
    } catch {
      return { status: 0, body: null };
    }
  };
  const orgs = await safeFetch(`${EVENTBRITE_API}/users/me/organizations/`);
  if (orgs.status === 401) {
    warnings.push("Eventbrite token rejected (401): Low Tickets / Sold Out were not checked. Replace the EVENTBRITE_API_TOKEN repo secret.");
    return { warnings, decided };
  }
  const orgList = orgs.status === 200 && orgs.body && Array.isArray(orgs.body.organizations) ? orgs.body.organizations : null;
  if (!orgList) {
    warnings.push(`Could not read the Eventbrite organizations (HTTP ${orgs.status || "network error"}): Low Tickets / Sold Out were not checked.`);
    return { warnings, decided };
  }
  const myOrgIds = new Set(orgList.filter((o) => o && o.id != null).map((o) => String(o.id)));

  for (const [id, group] of byId) {
    if (now() - startedAt > deadlineMs) {
      const left = [...byId.keys()].slice([...byId.keys()].indexOf(id));
      warnings.push(`Eventbrite was too slow: stopped after ${Math.round(deadlineMs / 1000)}s; kept punchup's status for ${left.join(", ")}.`);
      break;
    }
    const res = await safeFetch(`${EVENTBRITE_API}/events/${id}/?expand=ticket_classes,ticket_availability`);
    if (res.status !== 200 || !res.body) {
      // Ownership unknown (or a dead ticket link): punchup's status stands.
      warnings.push(`Eventbrite ${id}: could not read the event (HTTP ${res.status || "network error"}); kept punchup's status.`);
      continue;
    }
    // Judged per show: one listing can sit behind rows on different dates.
    for (const show of group) {
      const decision = statusFromEvent(res.body, myOrgIds, show.date);
      if (decision.warning) {
        const w = `Eventbrite ${id}: ${decision.warning}; kept punchup's status.`;
        if (!warnings.includes(w)) warnings.push(w);
      }
      if (!decision.status) continue;
      const was = show.status;
      show.status = decision.status;
      decided.add(show);
      log(`Eventbrite ${id} -> ${decision.status}${was !== decision.status ? ` (punchup: ${was})` : ""}`);
    }
  }
  return { warnings, decided };
}

/**
 * Hand-set Low Tickets for club shows (no Eventbrite count to read). Map of
 * ticket-URL substring -> "low_tickets". Applies only to an `on_sale` row that
 * Eventbrite did not decide, so once punchup marks the show sold out the line
 * stops applying and can never hold a sold-out show at Low Tickets.
 */
function applyStatusOverrides(shows, overrides, decided = new Set(), log = console.log) {
  for (const show of shows) {
    if (decided.has(show) || show.status !== "on_sale") continue;
    const url = (show.ticketUrl || "").toLowerCase();
    for (const [needle, status] of Object.entries(overrides || {})) {
      // An empty needle would match every URL.
      if (status === "low_tickets" && needle.trim() && url.includes(needle.trim().toLowerCase())) {
        show.status = status;
        log(`Status override: ${show.date}|${show.slug} -> ${status}`);
        break;
      }
    }
  }
}

/**
 * Looks a show up in a map keyed `date|slug|time` (one show of a same-venue
 * double-header) or `date|slug` (every show that night). The timed key wins.
 */
function overrideFor(map, show) {
  const base = `${show.date}|${show.slug}`;
  if (show.time && Object.prototype.hasOwnProperty.call(map, `${base}|${show.time}`)) {
    return { key: `${base}|${show.time}`, value: map[`${base}|${show.time}`] };
  }
  if (Object.prototype.hasOwnProperty.call(map, base)) return { key: base, value: map[base] };
  return null;
}

module.exports = {
  EVENTBRITE_API,
  LOW_TICKETS_AT,
  eventbriteIdFrom,
  statusFromEvent,
  applyEventbriteStatus,
  applyStatusOverrides,
  overrideFor,
};
