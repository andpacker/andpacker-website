import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { SoldOutTag } from "@/components/ShowTypeBadge"
import { ShowCard, TicketList, ViewContentPixel } from "../VenueShowList"
import {
  LIO_LANDING,
  SITE_URL,
  dateSummary,
  groupShows,
  joinAnd,
  monthDay,
  pageTitle,
  sharedNotes,
  shortWhen,
  venueName,
  venuePlace,
  venueWhere,
  type ShowGroup,
} from "../showDetails"
import { getTodayYMD, getUpcoming } from "../venueShows"

// Laugh It Off ad landing page: the Laugh It Off show first, then anything
// else at the venue as a secondary listing. Built only for slugs in
// LIO_LANDING (showDetails.ts) while they have an upcoming Laugh It Off show.
// Every other /shows/<slug>/laugh-it-off is a 404, and so is this one once the
// show has passed (the hourly revalidate picks that up).

export const revalidate = 3600
export const dynamicParams = false

function getLanding(slug: string) {
  const copy = LIO_LANDING[slug]
  if (!copy) return null
  const groups = groupShows(getUpcoming(slug))
  const lio = groups.find((g) => g.shows[0].showType === "laugh_it_off")
  if (!lio) return null
  return { copy, groups, lio, others: groups.filter((g) => g !== lio) }
}

/** "Also on Nov 8" when the other shows share its date, else "Also at <venue>". */
function alsoHeading(
  lio: ShowGroup,
  others: ShowGroup[],
  thisYear: string,
  venue: string
) {
  const lioDates = new Set(lio.shows.map((s) => s.date))
  const dates = [...new Set(others.flatMap((g) => g.shows.map((s) => s.date)))]
  return dates.length === 1 && lioDates.has(dates[0])
    ? `Also on ${monthDay(dates[0], thisYear)}`
    : `Also at ${venue}`
}

export function generateStaticParams() {
  return Object.keys(LIO_LANDING)
    .filter((slug) => getLanding(slug))
    .map((slug) => ({ slug }))
}

// Every field is set explicitly, like the venue page: a child's openGraph
// replaces the root layout's wholesale, and an inherited og:url (the homepage)
// is what Meta's ad review flagged as a deceptive link.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const landing = getLanding(slug)
  if (!landing) return {}
  const { copy, lio } = landing
  const first = lio.shows[0]
  const title = pageTitle(lio.shows, [lio])
  const description = `${copy.metaPitch} ${joinAnd(
    lio.shows.map(shortWhen)
  )}, ${venueWhere(first)}.`
  const url = `${SITE_URL}/shows/${first.slug}/laugh-it-off`
  const images = [
    {
      url: `${SITE_URL}${copy.ogImage.src}`,
      width: copy.ogImage.width,
      height: copy.ogImage.height,
      alt: copy.ogImage.alt,
    },
  ]
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

export default async function LaughItOffPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const landing = getLanding(slug)
  if (!landing) notFound()

  const { copy, groups, lio, others } = landing
  const first = lio.shows[0]
  // Raw venue string from tour-dates.json: the pixel events key on it.
  const venue = first.venue
  const thisYear = getTodayYMD().slice(0, 4)
  // Notes every show here shares go once, in the venue section.
  const venueNotes = sharedNotes(groups)
  const notes = (lio.notes ?? []).filter((n) => !venueNotes.includes(n))
  const facts = [lio.price, lio.length].filter(Boolean).join(" · ")
  // One date: the heading carries the time and the button needs no date line.
  const only = lio.shows.length === 1 ? first : null
  const when = dateSummary(lio.shows, thisYear)

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <ViewContentPixel venue={venue} />
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-24">
        {/* prefetch off: ad visitors are here for the ticket button, so the
            page loads nothing extra for the homepage or privacy page. */}
        <Link
          href="/"
          prefetch={false}
          className="text-[#555] text-sm tracking-widest uppercase hover:text-white transition-colors"
        >
          ← Andrew Packer
        </Link>
        {copy.eyebrow && (
          <p className="mt-6 font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm text-[#FBBF24]">
            {copy.eyebrow}
          </p>
        )}
        <h1
          className={`${
            copy.eyebrow ? "mt-2" : "mt-6"
          } font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2.75rem,11vw,4.5rem)] leading-none tracking-tight`}
        >
          {lio.name}
        </h1>
        <p className="mt-3 font-[family-name:var(--font-display)] font-bold uppercase tracking-wide text-xl leading-tight">
          {copy.tagline}
        </p>
        <p className="mt-6 text-lg font-semibold">
          {only?.time ? `${when} · ${only.time}` : when}
          {only?.status === "sold_out" && (
            <span className="ml-2 align-middle">
              <SoldOutTag />
            </span>
          )}
        </p>
        {/* Venue and address on two lines on phones, one line from sm up. */}
        <p className="text-[#888]">
          <span className="block sm:inline">{venueName(first)}</span>
          <span className="hidden sm:inline">, </span>
          <span className="block sm:inline">{venuePlace(first)}</span>
        </p>
        <p className="mt-6 leading-relaxed">{copy.description}</p>
        {facts && <p className="mt-3 text-sm text-[#888]">{facts}</p>}
        {notes.length > 0 && (
          <p className="mt-1 text-sm text-[#888]">{notes.join(" ")}</p>
        )}
        <TicketList
          group={lio}
          venue={venue}
          thisYear={thisYear}
          showWhen={!only}
        />

        {others.length > 0 && (
          <section className="mt-12 border-t border-[#1a1a1a] pt-8">
            <h2 className="font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs text-[#888]">
              {alsoHeading(lio, others, thisYear, venueName(first))}
            </h2>
            <div className="mt-6 space-y-6">
              {/* No price line here: the secondary listing stays short. */}
              {others.map((group) => (
                <ShowCard
                  key={group.key}
                  group={group}
                  venue={venue}
                  thisYear={thisYear}
                  hideNotes={venueNotes}
                  showFacts={false}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 border-t border-[#1a1a1a] pt-8">
          <h2 className="font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs text-[#888]">
            Venue
          </h2>
          <p className="mt-3 font-semibold">{venueName(first)}</p>
          <p className="text-[#888]">{venuePlace(first)}</p>
          {venueNotes.length > 0 && (
            <p className="mt-3 text-sm text-[#888]">{venueNotes.join(" ")}</p>
          )}
        </section>
        {/* The Meta pixel runs here, so the privacy notice is one tap away. */}
        <p className="mt-12">
          <Link
            href="/privacy"
            prefetch={false}
            className="text-[#555] text-sm tracking-widest uppercase hover:text-white transition-colors"
          >
            Privacy
          </Link>
        </p>
      </div>
    </main>
  )
}
