import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { tourDates } from "@/lib/tour"
import ShowTypeBadge from "@/components/ShowTypeBadge"
import { WaitlistButton } from "../shows/[slug]/VenueShowList"
import { SITE_URL, cardWhen, venueName } from "../shows/[slug]/showDetails"
import { getTodayYMD } from "../shows/[slug]/venueShows"

// Shows announced before tickets go on sale. Andrew puts this page's URL in
// punchup's ticket field for a booked show with no ticket link yet, so punchup's
// Buy Tickets button lands here, and the nightly sync lists the show on the site
// as "coming_soon" (scripts/punchup-parse.js ticketState). Each sign-up is filed
// in Kit under the show's city, series and its own presale tag (lib/waitlist.ts
// presaleTag), the list that gets the ticket link first.
//
// With no coming-soon show this page redirects to the tour list, like an expired
// venue page. tour-dates.json revalidates hourly.

export const revalidate = 3600

const TITLE = "Tickets Soon | Andrew Packer"
const DESCRIPTION =
  "Andrew Packer shows that are booked but not on sale yet. Leave your name and email and get the ticket link first."
const PAGE_URL = `${SITE_URL}/presale`
const IMAGE = {
  url: `${SITE_URL}/hero.jpg`,
  width: 1440,
  height: 1800,
  alt: "Andrew Packer on stage with a microphone",
}

// Every field is set: a child's openGraph replaces the root layout's wholesale,
// and the root's og:url is the homepage.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "Andrew Packer",
    type: "website",
    images: [IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE],
  },
}

function comingSoonShows() {
  const today = getTodayYMD()
  return tourDates
    .filter((s) => s.status === "coming_soon" && s.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time ?? "").localeCompare(b.time ?? "")
    )
}

export default function PresalePage() {
  const shows = comingSoonShows()
  if (!shows.length) redirect("/#tour")
  const thisYear = getTodayYMD().slice(0, 4)
  // One show: its form is already open. Several: tap the one you want.
  const openFirst = shows.length === 1

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-24">
        <Link
          href="/"
          className="text-[#555] text-sm tracking-widest uppercase hover:text-white transition-colors"
        >
          ← Andrew Packer
        </Link>
        <h1 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-tight mt-6">
          Tickets Soon
        </h1>
        <p className="mt-3 mb-8 text-[#888]">
          {shows.length === 1
            ? "This show is booked, but tickets aren't on sale yet. Leave your name and email and you'll get the link first."
            : "These shows are booked, but tickets aren't on sale yet. Pick yours, leave your name and email, and you'll get the link first."}
        </p>
        <ul className="space-y-6">
          {shows.map((show) => (
            <li
              key={`${show.date}|${show.slug}|${show.time ?? ""}`}
              className="border border-[#222] bg-[#111] p-5 sm:p-8"
            >
              <p className="text-lg font-semibold">{cardWhen(show, thisYear)}</p>
              <p className="text-[#888]">
                {venueName(show)}, {show.city}
              </p>
              <ShowTypeBadge showType={show.showType} />
              <div className="mt-4">
                <WaitlistButton show={show} defaultOpen={openFirst} />
              </div>
            </li>
          ))}
        </ul>
        {/* The Meta pixel runs here, so the privacy notice is one tap away. */}
        <p className="mt-12">
          <Link
            href="/privacy"
            className="text-[#555] text-sm tracking-widest uppercase hover:text-white transition-colors"
          >
            Privacy
          </Link>
        </p>
      </div>
    </main>
  )
}
