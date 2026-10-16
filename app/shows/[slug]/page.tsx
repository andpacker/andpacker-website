import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { tourDates, type Show } from "@/lib/tour"
import VenueShowList from "./VenueShowList"
import {
  SITE_URL,
  dateSummary,
  groupShows,
  pageDescription,
  pageTitle,
  sharedNotes,
  venueName,
  venuePlace,
} from "./showDetails"

export const revalidate = 3600

// The page body carries no artwork on purpose: paid ads land here, and the page
// is the show facts plus the ticket buttons, nothing else.
//
// Link-preview image (og:image / twitter:image), keyed by slug. Facebook reads
// these when an ad or a share points at the page. They are metadata only and
// never render on the page.
// US-SAFETY (visa): only US-safe artwork for US venues. Never the Toronto Laugh
// It Off banner (laugh-it-off-banner.jpg), which shows Andrew's dad; he cannot
// be advertised on US-facing assets. US Laugh It Off uses the faces-free
// artwork, and its copy is role-only: "a licensed therapist of 35 years", never
// a name and never a family relationship. Do not swap it for a banner with
// faces. The Day Care Comedy banner is New York specific (it carries the NY
// Comedy Festival logo). Everything else gets DEFAULT_OG_IMAGE.
const OG_IMAGES: Record<
  string,
  { src: string; alt: string; width: number; height: number }[]
> = {
  "top-secret-comedy-club-new-york": [
    {
      src: "/day-care-comedy-banner.png",
      alt: "Day Care Comedy, comedy for new parents with Andrew Packer, November 8 at Top Secret Comedy Club in New York, part of the New York Comedy Festival",
      width: 1920,
      height: 1080,
    },
    {
      src: "/laugh-it-off-banner-nofaces.jpg",
      alt: "Laugh It Off, Andrew Packer's group therapy comedy show with a licensed therapist of 35 years, November 8 at Top Secret Comedy Club in New York",
      width: 1920,
      height: 1080,
    },
  ],
}

const DEFAULT_OG_IMAGE = {
  src: "/hero.jpg",
  alt: "Andrew Packer on stage with a microphone",
  width: 1440,
  height: 1800,
}

function getTodayYMD(): string {
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
// metadata, not prebuilt, and a visit redirects to /#tour. The homepage tour
// list still shows its dates.
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

function sellsOnlyOnEventbrite(shows: Show[]): boolean {
  return shows.length > 0 && shows.every((s) => isEventbriteUrl(s.ticketUrl))
}

function getUpcomingShows(slug: string): Show[] {
  const today = getTodayYMD()
  return tourDates
    .filter((s) => s.slug === slug && s.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time ?? "").localeCompare(b.time ?? "")
    )
}

// Upcoming shows for a venue that gets a page; empty means redirect.
function getUpcoming(slug: string): Show[] {
  const upcoming = getUpcomingShows(slug)
  return sellsOnlyOnEventbrite(upcoming) ? [] : upcoming
}

export function generateStaticParams() {
  return [...new Set(tourDates.map((s) => s.slug))]
    .filter((slug) => !sellsOnlyOnEventbrite(getUpcomingShows(slug)))
    .map((slug) => ({ slug }))
}

// Every field is set explicitly because a child's openGraph REPLACES the root
// layout's openGraph wholesale (shallow merge). Without this the page inherited
// og:url = the homepage, which Meta's ad review read as a deceptive link.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const upcoming = getUpcoming(slug)
  if (!upcoming.length) return {}
  const groups = groupShows(upcoming)
  const title = pageTitle(upcoming, groups)
  const description = pageDescription(upcoming, groups)
  const url = `${SITE_URL}/shows/${upcoming[0].slug}`
  const images = (OG_IMAGES[upcoming[0].slug] ?? [DEFAULT_OG_IMAGE]).map(
    (img) => ({
      url: `${SITE_URL}${img.src}`,
      width: img.width,
      height: img.height,
      alt: img.alt,
    })
  )
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Andrew Packer",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  }
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const upcoming = getUpcoming(slug)

  // Unknown slug, or a venue whose shows are all in the past: fall back to
  // the homepage tour section instead of 404ing. Temporary (307) on purpose —
  // tour-dates.json revalidates hourly, so a venue can gain new dates later.
  if (!upcoming.length) redirect("/#tour")

  const first = upcoming[0]
  const groups = groupShows(upcoming)
  const thisYear = getTodayYMD().slice(0, 4)
  const venueNotes = sharedNotes(groups)
  const name = venueName(first)
  const place = venuePlace(first)

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-24">
        <a
          href="/"
          className="text-[#555] text-sm tracking-widest uppercase hover:text-white transition-colors"
        >
          ← Andrew Packer
        </a>
        <h1 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-tight mt-6">
          {name}
        </h1>
        {/* Two lines on phones, one line with a dot from sm up. */}
        <p className="mt-3 mb-8 text-[#888]">
          <span className="block sm:inline">{place}</span>
          <span className="hidden sm:inline" aria-hidden="true">
            {" · "}
          </span>
          <span className="block sm:inline">
            {dateSummary(upcoming, thisYear)}
          </span>
        </p>
        <VenueShowList
          groups={groups}
          venue={first.venue}
          thisYear={thisYear}
          hideNotes={venueNotes}
        />
        <section className="mt-12 border-t border-[#1a1a1a] pt-8">
          <h2 className="font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs text-[#888]">
            Venue
          </h2>
          <p className="mt-3 font-semibold">{name}</p>
          <p className="text-[#888]">{place}</p>
          {venueNotes.length > 0 && (
            <p className="mt-3 text-sm text-[#888]">{venueNotes.join(" ")}</p>
          )}
        </section>
      </div>
    </main>
  )
}
