import type { Show } from "@/lib/tour"

// Where a sold-out show's waitlist sign-ups are filed in Kit: the "City, ST" tag
// Pack signups already use, plus a show-series tag, so Andrew can email everyone
// in a city or only the people who wanted that series there ("Toronto, ON" +
// "Day Care Comedy").

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

/**
 * The sold-out show a waitlist request names, or null. date + slug + time is the
 * one combination unique to a show (same-night double-headers share date + slug).
 */
export function findSoldOutShow(
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
        s.status === "sold_out" &&
        s.date === date &&
        s.slug === slug &&
        (s.time ?? "") === wantTime
    ) ?? null
  )
}
