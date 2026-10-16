import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import { tourDates, type Show } from "@/lib/tour"
import VenueShowList from "./VenueShowList"
import {
  SITE_URL,
  groupShows,
  longWhen,
  pageDescription,
  pageTitle,
  venueWhere,
} from "./showDetails"

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

// Link-preview image (og:image / twitter:image), keyed by slug. Facebook reads
// these when an ad or a share points at the page. Only US-safe artwork for US
// venues: never the Toronto Laugh It Off banner (visa rule, see the note on
// VENUE_BANNERS), and the Day Care Comedy banner is New York specific (it
// carries the NY Comedy Festival logo). Everything else gets DEFAULT_OG_IMAGE.
const OG_IMAGES: Record<
  string,
  { src: string; alt: string; width: number; height: number }[]
> = {
  "top-secret-comedy-club-new-york": [
    showBanners["top-secret-comedy-club-new-york|day_care_comedy"],
    VENUE_BANNERS["top-secret-comedy-club-new-york"],
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

function getUpcoming(slug: string): Show[] {
  const today = getTodayYMD()
  return tourDates
    .filter((s) => s.slug === slug && s.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time ?? "").localeCompare(b.time ?? "")
    )
}

export function generateStaticParams() {
  return [...new Set(tourDates.map((s) => s.slug))].map((slug) => ({ slug }))
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
  const banner = VENUE_BANNERS[slug]
  const upcoming = getUpcoming(slug)

  // Unknown slug, or a venue whose shows are all in the past: fall back to
  // the homepage tour section instead of 404ing. Temporary (307) on purpose —
  // tour-dates.json revalidates hourly, so a venue can gain new dates later.
  if (!upcoming.length) redirect("/#tour")

  const groups = groupShows(upcoming)

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
        <div className="mt-16 space-y-12">
          {groups.map((group) => (
            <section
              key={group.key}
              className="border-t border-[#1a1a1a] pt-8"
            >
              <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-3xl leading-none tracking-tight">
                {group.name}
              </h2>
              {group.tagline && (
                <p className="mt-2 font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs text-[#888]">
                  {group.tagline}
                </p>
              )}
              <p className="mt-4 leading-relaxed">{group.description}</p>
              <dl className="mt-6 grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-3 text-sm">
                <dt className="text-[#555] uppercase tracking-widest text-xs pt-0.5">
                  When
                </dt>
                <dd>
                  {group.shows.map((show, i) => (
                    <div key={i}>{longWhen(show)}</div>
                  ))}
                </dd>
                <dt className="text-[#555] uppercase tracking-widest text-xs pt-0.5">
                  Where
                </dt>
                <dd>{venueWhere(group.shows[0])}</dd>
                {group.price && (
                  <>
                    <dt className="text-[#555] uppercase tracking-widest text-xs pt-0.5">
                      Price
                    </dt>
                    <dd>{group.price}</dd>
                  </>
                )}
                {group.length && (
                  <>
                    <dt className="text-[#555] uppercase tracking-widest text-xs pt-0.5">
                      Length
                    </dt>
                    <dd>{group.length}</dd>
                  </>
                )}
                {group.ticketSites.length > 0 && (
                  <>
                    <dt className="text-[#555] uppercase tracking-widest text-xs pt-0.5">
                      Tickets
                    </dt>
                    <dd>Sold through {group.ticketSites.join(", ")}</dd>
                  </>
                )}
              </dl>
              {group.notes && group.notes.length > 0 && (
                <p className="mt-4 text-sm text-[#888]">
                  {group.notes.join(" ")}
                </p>
              )}
            </section>
          ))}
        </div>
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
