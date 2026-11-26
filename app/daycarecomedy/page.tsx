import type { Metadata } from "next"
import Image from "next/image"
import DayCareWaitlistForm from "@/components/DayCareWaitlistForm"

// Day Care Comedy 2027 first-access waitlist. Same layout as /thepack (Andrew,
// 2026-11-26): event photos behind the form, darkened most behind it, headline +
// form centred on top. One goal, so no site nav and no links out except Privacy
// (the Meta pixel runs here). Copy is Andrew's, word for word.
// Photos: Toronto Oct 25 (covered by the Oct 26 opt-out email) and New York Nov 8
// (Andrew: the room had a photo notice). No date captions (Andrew).

const PAGE_URL = "https://andpacker.com/daycarecomedy"
const TITLE = "Day Care Comedy 2027: Get First Access | Andrew Packer"
const DESCRIPTION =
  "A stand-up show for Grown-Ups where you bring the baby. Choose the city you'd attend and get first access to tickets before they go on sale to the public."
const OG_IMAGE = {
  url: "https://andpacker.com/day-care-waitlist-og.jpg",
  width: 1200,
  height: 630,
  alt: "A packed room of parents with babies watching Andrew Packer at Day Care Comedy in Toronto",
}

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
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
}

// As on /thepack: a 2x2 grid on landscape screens, 4 stacked bands on portrait
// ones. 1600x1067 each, EXIF/GPS stripped. objectPosition keeps faces in frame
// in the wide phone bands. Each photo has its own filename: a same-name swap can
// show the old image from Vercel's edge cache for a minute.
const PHOTOS = [
  { src: "/day-care-waitlist-toronto-dad.jpg", objectPosition: "50% 45%" }, // Toronto: dad laughing with baby (DSC05702)
  { src: "/day-care-waitlist-michael.jpg", objectPosition: "50% 30%" }, // NYC: Michael Moses on stage (IMG_7085)
  { src: "/day-care-waitlist-andrew.jpg", objectPosition: "60% 30%" }, // NYC: Andrew laughing on stage (IMG_7467)
  { src: "/day-care-waitlist-nyc-dad.jpg", objectPosition: "25% 40%" }, // NYC: dad beaming with baby, packed room (IMG_7369)
]

export default function DayCareComedyWaitlistPage() {
  return (
    <main>
      <section className="relative min-h-svh flex items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-1 grid-rows-4 landscape:grid-cols-2 landscape:grid-rows-2 gap-[2px] bg-[#0A0A0A]"
        >
          {PHOTOS.map((photo) => (
            <div key={photo.src} className="relative overflow-hidden">
              <Image
                src={photo.src}
                alt=""
                fill
                loading="eager"
                sizes="(orientation: landscape) 50vw, 100vw"
                className="object-cover"
                style={{ objectPosition: photo.objectPosition }}
              />
            </div>
          ))}
        </div>
        {/* Darkest behind the form so it reads; lighter at the edges so the faces show. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.76) 40%, rgba(10,10,10,0.45) 100%)",
          }}
        />
        {/* Dark at the top, clear through the middle, solid at the bottom into the footer. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0) 16%, rgba(10,10,10,0) 84%, #0A0A0A 100%)",
          }}
        />

        <div className="relative z-10 w-full max-w-xl mx-auto px-6 pt-10 pb-12 text-center">
          {/* White, larger and tighter than /thepack's blue eyebrow: the blue read too
              dark over the photos (Andrew, Nov 26). */}
          <p className="font-[family-name:var(--font-display)] font-extrabold text-white tracking-[0.15em] uppercase text-lg md:text-2xl mb-3 [text-shadow:0_2px_12px_rgba(0,0,0,0.8)]">
            Andrew Packer &amp; Michael Moses
          </p>
          <h1 className="font-[family-name:var(--font-display)] font-extrabold text-white uppercase leading-none text-[clamp(3rem,12vw,6rem)] tracking-tight mb-3">
            Day Care Comedy
          </h1>
          <p className="font-[family-name:var(--font-display)] font-bold uppercase tracking-wide text-lg md:text-xl leading-tight text-[#89CFF0] mb-4">
            A stand-up show for Grown-Ups where you bring the baby.
          </p>
          <p className="text-white/85 text-lg md:text-xl leading-relaxed mb-8 max-w-md mx-auto">
            We&apos;re planning a 2027 tour. Choose the city you&apos;d most likely
            attend to get first access to tickets before they go on sale to the
            public.
          </p>

          <DayCareWaitlistForm />
        </div>
      </section>

      <footer className="bg-[#0A0A0A] px-6 py-6 text-center">
        <a
          href="/privacy"
          className="text-[#555] text-sm tracking-widest uppercase hover:text-white transition-colors"
        >
          Privacy
        </a>
      </footer>
    </main>
  )
}
