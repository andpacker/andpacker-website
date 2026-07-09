import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import { tourDates } from "@/lib/tour"
import VenueShowList from "./VenueShowList"

export const revalidate = 3600

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
    src: "/laugh-it-off-poster.jpg",
    alt: "Laugh It Off — Andrew Packer's group therapy comedy show with his therapist dad, June 27 at Comedy Bar Toronto",
    width: 1920,
    height: 1080,
  },
  "spotlight-comedy-club": {
    src: "/spotlight-banner.jpg",
    alt: "Andrew Packer live at Spotlight Comedy Club in St. Catharines, July 17 & 18, 2026",
    width: 1400,
    height: 636,
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
        <VenueShowList shows={upcoming} venue={upcoming[0].venue} />
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
