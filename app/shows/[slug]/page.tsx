import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import { tourDates } from "@/lib/tour"
import VenueShowList from "./VenueShowList"

export const revalidate = 3600

// Per-show artwork, keyed "<slug>|<showType>" because one venue can run two
// different shows on the same day. Top Secret NY on Nov 8 is Day Care Comedy at
// 2 PM and Laugh It Off at 6:30. The slug-keyed banner map below cannot tell
// them apart, so anything show-specific belongs here.
// NOTE: the key must stay slug-scoped, not showType-only. "laugh_it_off" runs in
// both Toronto and New York, and those two markets require DIFFERENT artwork:
// Toronto uses the banner with Andrew's dad, New York must not show his face at
// all, for visa reasons.
const showBanners: Record<
  string,
  { src: string; alt: string; width: number; height: number }
> = {
  "top-secret-comedy-club-new-york|day_care_comedy": {
    src: "/day-care-comedy-banner.png",
    alt: "Day Care Comedy, comedy for new parents with Andrew Packer, November 8 at Top Secret Comedy Club in New York, part of the New York Comedy Festival",
    width: 1920,
    height: 1080,
  },
}

const VENUE_BANNERS: Record<
  string,
  { src: string; alt: string; width: number; height: number }
> = {
  "the-corner-comedy-club": {
    src: "/trilogy-banner.png",
    alt: "Trilogy — Andrew Packer's comedy special recording, June 25–26 at The Corner Comedy Club, exclusive 40-person seating",
    width: 600,
    height: 200,
  },
  "comedy-bar-toronto": {
    src: "/laugh-it-off-banner.jpg",
    alt: "Laugh It Off, Andrew Packer's group therapy comedy show with his therapist dad, October 3 at Comedy Bar Bloor in Toronto",
    width: 1920,
    height: 1080,
  },
  "spotlight-comedy-club": {
    src: "/spotlight-banner.jpg",
    alt: "Andrew Packer live at Spotlight Comedy Club in St. Catharines, July 17 & 18, 2026",
    width: 1400,
    height: 636,
  },
  // US shows use the faces-free artwork on purpose. The Toronto banner shows
  // Andrew's dad, who cannot be advertised on US-facing assets for visa reasons.
  // Copy here is role-only: "a licensed therapist of 35 years", never a name and
  // never a family relationship. Do not swap this for a banner with faces.
  "top-secret-comedy-club-new-york": {
    src: "/laugh-it-off-banner-nofaces.jpg",
    alt: "Laugh It Off, Andrew Packer's group therapy comedy show with a licensed therapist of 35 years, November 8 at Top Secret Comedy Club in New York",
    width: 1920,
    height: 1080,
  },
}

function getTodayYMD(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" })
}

export function generateStaticParams() {
  return [...new Set(tourDates.map((s) => s.slug))].map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const shows = tourDates.filter((s) => s.slug === slug)
  if (!shows.length) return {}
  return {
    title: `${shows[0].venue} — Andrew Packer`,
    description: `Andrew Packer live at ${shows[0].venue}. Get tickets.`,
  }
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const banner = VENUE_BANNERS[slug]
  const today = getTodayYMD()
  const upcoming = tourDates
    .filter((s) => s.slug === slug && s.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time ?? "").localeCompare(b.time ?? "")
    )

  // Unknown slug, or a venue whose shows are all in the past: fall back to
  // the homepage tour section instead of 404ing. Temporary (307) on purpose —
  // tour-dates.json revalidates hourly, so a venue can gain new dates later.
  if (!upcoming.length) redirect("/#tour")

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-2xl mx-auto px-6 pt-16 pb-24">
        <a
          href="/"
          className="text-[#555] text-sm tracking-widest uppercase hover:text-white transition-colors"
        >
          ← Andrew Packer
        </a>
        <h1 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-tight mt-6 mb-2">
          {upcoming[0].venue}
        </h1>
        <p className="text-[#888] mb-12">{upcoming[0].city.split(",")[0]}</p>
        <VenueShowList
          shows={upcoming}
          venue={upcoming[0].venue}
          showBanners={showBanners}
        />
        {banner && (
          <div className="mt-12 flex justify-center">
            <Image
              src={banner.src}
              alt={banner.alt}
              width={banner.width}
              height={banner.height}
              className="h-auto w-full max-w-xl rounded-lg"
            />
          </div>
        )}
      </div>
    </main>
  )
}
