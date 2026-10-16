import type { Show } from "@/lib/tour"

// Copy and metadata helpers for the /shows/[slug] venue pages.
//
// tour-dates.json is rewritten nightly by the scraper, so anything it does not
// carry (show descriptions, addresses, prices) lives here, hand-maintained.
//
// COPY RULES (from Andrew, apply to every string in this file):
// - No em dashes.
// - Laugh It Off's therapist is only ever "a licensed therapist of 35 years".
//   Never a name, never a family relationship (US visa issue).
// - Day Care Comedy: the age is a recommendation, never a cap. Never "all ages
//   welcome", never nap-timing language. The brand is "Day Care Comedy", no
//   "Laugh It Off" prefix.
// - No selling-out / nearly-sold-out claims.
// - Only verified facts. Leave a field out rather than guess.

export const SITE_URL = "https://andpacker.com"

type ShowType = NonNullable<Show["showType"]>

type ShowTypeInfo = {
  /** Heading on the page, and the show name used in the <title>. */
  name: string
  /** Small line under the heading. */
  tagline?: string
  /** What the show is, in one or two plain sentences. */
  description: string
  /** Lower-case clause for the meta description. Leave out for plain stand-up. */
  metaBlurb?: string
}

const STANDUP: ShowTypeInfo = {
  name: "Stand-Up Comedy",
  description: "Andrew Packer live: stand-up comedy.",
}

const SHOW_TYPES: Record<ShowType, ShowTypeInfo> = {
  standup: STANDUP,
  laugh_it_off: {
    name: "Laugh It Off",
    tagline: "Group Therapy Comedy Show",
    description:
      "A group therapy comedy show. Comedians perform, and a licensed therapist of 35 years joins them on stage to work through stories from the audience.",
    metaBlurb:
      "a group therapy comedy show with a licensed therapist of 35 years",
  },
  day_care_comedy: {
    name: "Day Care Comedy",
    tagline: "Comedy for new parents",
    description: "A stand-up show for new parents where you bring the baby.",
    metaBlurb: "a stand-up show for new parents where you bring the baby",
  },
  new_material: {
    name: "Stand-Up Comedy",
    tagline: "New material set",
    description: "Andrew Packer live: a stand-up set of new material.",
  },
  sauna_comedy: {
    name: "Sauna Comedy",
    description: "Andrew Packer live: stand-up comedy.",
  },
  comedy_special_recording: {
    name: "Comedy Special Recording",
    description:
      "Andrew Packer live: stand-up comedy, recorded for a comedy special.",
  },
}

/** Street address, keyed by slug. Only add one that has been verified. */
const VENUE_ADDRESS: Record<string, string> = {
  "top-secret-comedy-club-new-york": "44 Avenue A",
}

type ShowFacts = {
  /** Replaces the show type's generic description on this venue's page. */
  description?: string
  price?: string
  length?: string
  notes?: string[]
}

/**
 * Verified per-show facts, keyed "<slug>|<showType>" because one venue can run
 * two shows a day (Top Secret NY on Nov 8: Day Care Comedy, then Laugh It Off).
 */
const SHOW_FACTS: Record<string, ShowFacts> = {
  "top-secret-comedy-club-new-york|day_care_comedy": {
    description:
      "A stand-up show for new parents where you bring the baby. Babies come free. It works best for pre-walkers, so roughly 15 months and under.",
    price: "$25",
    length: "About 75 minutes",
    notes: ["Part of the New York Comedy Festival.", "No drink minimum."],
  },
  "top-secret-comedy-club-new-york|laugh_it_off": {
    price: "$25",
    length: "About 75 minutes",
    notes: ["Part of the New York Comedy Festival.", "No drink minimum."],
  },
}

export type ShowGroup = {
  key: string
  name: string
  tagline?: string
  description: string
  metaBlurb?: string
  price?: string
  length?: string
  notes?: string[]
  shows: Show[]
  /** Sites the Get Tickets buttons go to, e.g. "topsecretcomedyclub.com". */
  ticketSites: string[]
}

function utcNoon(ymd: string) {
  return new Date(ymd + "T12:00:00Z")
}

function fmt(ymd: string, opts: Intl.DateTimeFormatOptions) {
  return utcNoon(ymd).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" })
}

/** "a", "a and b", "a, b and c" */
export function joinAnd(parts: string[]) {
  if (parts.length <= 1) return parts.join("")
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
}

/** "Sun, Nov 8 · 2 PM". The year is added only when it is not this year. */
export function cardWhen(show: Show, thisYear: string) {
  const date = fmt(show.date, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(show.date.slice(0, 4) !== thisYear ? { year: "numeric" as const } : {}),
  })
  return show.time ? `${date} · ${show.time}` : date
}

/**
 * Page header date line. One date: "Sunday, November 8". Several: "Nov 28 and
 * Dec 20", or "Oct 23 to Dec 20" past three. The year is added only when it is
 * not this year.
 */
export function dateSummary(shows: Show[], thisYear: string) {
  const dates = [...new Set(shows.map((s) => s.date))].sort()
  const years = new Set(dates.map((d) => d.slice(0, 4)))
  const sameYear = years.size === 1
  const needYear = !sameYear || !years.has(thisYear)
  if (dates.length === 1) {
    return fmt(dates[0], {
      weekday: "long",
      month: "long",
      day: "numeric",
      ...(needYear ? { year: "numeric" as const } : {}),
    })
  }
  const parts = dates.map((d) =>
    fmt(d, {
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "numeric" as const }),
    })
  )
  const joined =
    parts.length > 3 ? `${parts[0]} to ${parts[parts.length - 1]}` : joinAnd(parts)
  return sameYear && needYear ? `${joined}, ${dates[0].slice(0, 4)}` : joined
}

/** "Sun Nov 8 at 2 PM" */
function shortWhen(show: Show) {
  const date = `${fmt(show.date, { weekday: "short" })} ${fmt(show.date, {
    month: "short",
    day: "numeric",
  })}`
  return show.time ? `${date} at ${show.time}` : date
}

/** "Nov 8, 2026", "Nov 28 and Dec 20, 2026", "Dec 20, 2026 and Jan 20, 2027" */
export function dateLabel(shows: Show[]) {
  const dates = [...new Set(shows.map((s) => s.date))].sort()
  const monthDay = (d: string) => fmt(d, { month: "short", day: "numeric" })
  const year = (d: string) => fmt(d, { year: "numeric" })
  const sameYear = new Set(dates.map(year)).size === 1
  const parts = dates.map((d) => (sameYear ? monthDay(d) : `${monthDay(d)}, ${year(d)}`))
  const joined =
    parts.length > 3 ? `${parts[0]} to ${parts[parts.length - 1]}` : joinAnd(parts)
  return sameYear ? `${joined}, ${year(dates[0])}` : joined
}

/** "Top Secret Comedy Club - New York" -> "Top Secret Comedy Club" */
export function venueName(show: Show) {
  const suffix = ` - ${show.city.split(",")[0].trim()}`
  return show.venue.endsWith(suffix)
    ? show.venue.slice(0, -suffix.length)
    : show.venue
}

/** "44 Avenue A, New York, NY", or just "Calgary, AB" with no verified address. */
export function venuePlace(show: Show) {
  return [VENUE_ADDRESS[show.slug], show.city].filter(Boolean).join(", ")
}

/** "Top Secret Comedy Club, 44 Avenue A, New York, NY" */
export function venueWhere(show: Show) {
  return [venueName(show), VENUE_ADDRESS[show.slug], show.city]
    .filter(Boolean)
    .join(", ")
}

/** "https://www.eventbrite.ca/e/..." -> "eventbrite.ca" */
export function ticketSite(url: string): string | null {
  try {
    return new URL(url).hostname.split(".").slice(-2).join(".")
  } catch {
    return null
  }
}

/** One group per show type, in the order the shows appear. */
export function groupShows(shows: Show[]): ShowGroup[] {
  const groups = new Map<string, ShowGroup>()
  for (const show of shows) {
    const type: ShowType = show.showType ?? "standup"
    const key = `${show.slug}|${type}`
    let group = groups.get(key)
    if (!group) {
      const info = SHOW_TYPES[type] ?? STANDUP
      const facts = SHOW_FACTS[key] ?? {}
      group = {
        key,
        name: info.name,
        tagline: info.tagline,
        description: facts.description ?? info.description,
        metaBlurb: info.metaBlurb,
        price: facts.price,
        length: facts.length,
        notes: facts.notes,
        shows: [],
        ticketSites: [],
      }
      groups.set(key, group)
    }
    group.shows.push(show)
    const site = ticketSite(show.ticketUrl)
    if (site && !group.ticketSites.includes(site)) group.ticketSites.push(site)
  }
  return [...groups.values()]
}

/**
 * Notes every group carries (NYC: festival + no drink minimum on both shows).
 * The page shows these once, in the venue section, instead of on every card.
 */
export function sharedNotes(groups: ShowGroup[]): string[] {
  const [first, ...rest] = groups
  return (first?.notes ?? []).filter((note) =>
    rest.every((g) => g.notes?.includes(note))
  )
}

/** "Day Care Comedy and Laugh It Off at Top Secret Comedy Club, New York, Nov 8, 2026 | Andrew Packer" */
export function pageTitle(shows: Show[], groups: ShowGroup[]) {
  const names = joinAnd([...new Set(groups.map((g) => g.name))])
  const city = shows[0].city.split(",")[0].trim()
  return `${names} at ${venueName(shows[0])}, ${city}, ${dateLabel(shows)} | Andrew Packer`
}

/** Plain-sentence summary for the meta / og / twitter description. */
export function pageDescription(shows: Show[], groups: ShowGroup[]) {
  const sentences = groups.map((g) => {
    const when = joinAnd(g.shows.map(shortWhen))
    return g.metaBlurb
      ? `${g.name}, ${when}: ${g.metaBlurb}.`
      : `${g.name}, ${when}.`
  })
  return `Andrew Packer live at ${venueWhere(shows[0])}. ${sentences.join(" ")}`
}
