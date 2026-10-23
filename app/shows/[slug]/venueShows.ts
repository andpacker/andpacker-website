import { tourDates, type Show } from "@/lib/tour"

// Which upcoming shows a /shows/<slug> page lists. Shared by the venue page
// (page.tsx) and the Laugh It Off landing page (laugh-it-off/page.tsx).

export function getTodayYMD(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" })
}

// A venue gets no page when EVERY one of its upcoming shows sells on
// Eventbrite. Those tickets sell on Andrew's own Eventbrite, which carries his
// Meta pixel, and both the homepage Get Tickets buttons and his ads go
// straight to Eventbrite, so a page in between adds nothing. It is a rule, not
// a list, so a new Eventbrite date added by the nightly scraper never gets a
// page either. A venue with mixed ticket sites (some Eventbrite, some not)
// keeps its page.
// A skipped venue is treated exactly like a venue with no upcoming shows: no
// metadata, not prebuilt, and a visit to its venue page redirects to /#tour.
// The homepage tour list still shows its dates.
const EVENTBRITE_DOMAINS = ["eventbrite.com", "eventbrite.ca"]

// True for eventbrite.com, eventbrite.ca and any subdomain of them
// (www.eventbrite.ca, andrewscituate.eventbrite.com). Matches the hostname
// suffix, not a substring. An unparsable URL counts as not Eventbrite.
function isEventbriteUrl(ticketUrl: string): boolean {
  try {
    const host = new URL(ticketUrl).hostname.toLowerCase()
    return EVENTBRITE_DOMAINS.some((d) => host === d || host.endsWith("." + d))
  } catch {
    return false
  }
}

export function sellsOnlyOnEventbrite(shows: Show[]): boolean {
  return shows.length > 0 && shows.every((s) => isEventbriteUrl(s.ticketUrl))
}

export function getUpcomingShows(slug: string): Show[] {
  const today = getTodayYMD()
  return tourDates
    .filter((s) => s.slug === slug && s.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time ?? "").localeCompare(b.time ?? "")
    )
}

// Upcoming shows for a venue that gets a page; empty means no page.
export function getUpcoming(slug: string): Show[] {
  const upcoming = getUpcomingShows(slug)
  return sellsOnlyOnEventbrite(upcoming) ? [] : upcoming
}
