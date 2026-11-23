import type { Show } from "@/lib/tour"

// Where a sold-out show's waitlist sign-ups are filed in Kit: the "City, ST" tag
// Pack signups already use, plus a show-series tag, so Andrew can email everyone
// in a city or only the people who wanted that series there ("Toronto, ON" +
// "Day Care Comedy"). A coming-soon show's presale sign-ups get those two plus a
// tag for that one show (presaleTag), so its list can hear first when tickets
// go on sale.

// Tour cities that sit inside a bigger market on the signup form's city list
// (components/EmailSignup.tsx). Filing them under the market keeps one tag per
// market, so a second show there reaches the waitlist AND the existing Pack.
const MARKET_CITY: Record<string, string> = {
  "Cambridge, MA": "Boston, MA",
  "Braintree, MA": "Boston, MA",
  "Scituate, MA": "Boston, MA",
  "Kingston, MA": "Boston, MA",
  "West Hollywood, CA": "Los Angeles, CA",
  "Chandler, AZ": "Phoenix, AZ",
}

/**
 * Kit city tag for a show's city. Accents are dropped first because Kit matches
 * tag names by exact spelling: punchup's "Montréal, QC" must land in the
 * "Montreal, QC" tag the signup form writes.
 */
export function waitlistCity(city: string): string {
  const plain = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  return MARKET_CITY[plain] ?? plain
}

// Show series -> Kit tag. Chefs Hall dates are all `new_material`, and "Chefs Hall"
// is the group tag the Eventbrite buyer import already applies to them, so buyers
// and waitlisters share it. A regular headline show has no series: city tag only.
const SERIES_TAG: Partial<Record<NonNullable<Show["showType"]>, string>> = {
  day_care_comedy: "Day Care Comedy",
  laugh_it_off: "Laugh It Off",
  sauna_comedy: "Sauna Comedy",
  new_material: "Chefs Hall",
  comedy_special_recording: "Comedy Special Recording",
}

export function seriesTag(showType: Show["showType"]): string | null {
  return (showType && SERIES_TAG[showType]) || null
}

/** A show people can join a list for: sold out, or announced before tickets. */
export function hasWaitlist(show: Show): boolean {
  return show.status === "sold_out" || show.status === "coming_soon"
}

/**
 * The show a waitlist request names, or null when it has no list. date + slug +
 * time is the one combination unique to a show (same-night double-headers share
 * date + slug).
 */
export function findWaitlistShow(
  shows: Show[],
  date: unknown,
  slug: unknown,
  time: unknown
): Show | null {
  if (typeof date !== "string" || typeof slug !== "string") return null
  const wantTime = typeof time === "string" ? time : ""
  return (
    shows.find(
      (s) =>
        hasWaitlist(s) &&
        s.date === date &&
        s.slug === slug &&
        (s.time ?? "") === wantTime
    ) ?? null
  )
}

/**
 * The per-show Kit tag for a coming-soon show's presale list, in the dated-tag
 * style the Eventbrite buyer imports use: "Presale - Tacoma, WA - Jan 15 2027 7 PM".
 * When the ticket link arrives, this is the tag that hears first. The city keeps
 * its own name (no market folding) and loses its accents, like the city tag.
 */
export function presaleTag(show: Show): string {
  const city = show.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  const d = new Date(`${show.date}T12:00:00Z`)
  const part = (o: Intl.DateTimeFormatOptions) =>
    d.toLocaleString("en-US", { ...o, timeZone: "UTC" })
  const when = `${part({ month: "short" })} ${part({ day: "numeric" })} ${part({ year: "numeric" })}`
  return `Presale - ${city} - ${when}${show.time ? ` ${show.time}` : ""}`
}
