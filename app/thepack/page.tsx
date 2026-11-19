import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import EmailSignup from "@/components/EmailSignup";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Join the Pack | Andrew Packer",
  description:
    "Tell me your city and I'll let you know the moment I add a show near you, with an early heads-up before tickets go on sale.",
  openGraph: {
    title: "Join the Pack | Andrew Packer",
    description:
      "Tell me your city and I'll let you know the moment I add a show near you, with an early heads-up before tickets go on sale.",
    url: "https://andpacker.com/thepack",
    siteName: "Andrew Packer",
    type: "website",
  },
};

// Fan photos behind the form: a 2x2 grid on landscape screens, 4 stacked bands on portrait ones
// (an upright tablet in the 2x2 crops each photo to a tall sliver).
// One objectPosition serves both: laptop cells (~1.6:1) barely crop these 3:2 photos,
// so the Y value only matters for the wide phone bands, where it keeps the faces in frame.
const PACK_PHOTOS = [
  { src: "/pack-fans-1.jpg", objectPosition: "50% 55%" }, // Sep 19: fans posing behind Andrew
  { src: "/pack-fans-2.jpg", objectPosition: "50% 36%" }, // Sep 19: group in the hallway
  { src: "/pack-fans-3.jpg", objectPosition: "50% 25%" }, // LIO Jan 18: handshake
  { src: "/pack-fans-4.jpg", objectPosition: "50% 34%" }, // Sep 19: stairwell chat
];

const VALUE_POINTS = [
  "New shows near you hit your inbox before I post them anywhere else.",
  "You get an early heads-up before tickets go on sale, so you are not scrambling for seats.",
  "I only email when it actually matters. No spam, unsubscribe anytime.",
];

export default function ThePackPage() {
  return (
    <>
      <Nav />
      <main>
        {/* One above-the-fold capture moment: headline + one line + form, all visible on load. */}
        <section className="relative min-h-svh flex items-center justify-center overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 grid grid-cols-1 grid-rows-4 landscape:grid-cols-2 landscape:grid-rows-2 gap-[2px] bg-[#0A0A0A]"
          >
            {PACK_PHOTOS.map((photo) => (
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
          {/* Dark under the nav, clear through the middle, solid at the bottom into the next section. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0) 16%, rgba(10,10,10,0) 84%, #0A0A0A 100%)",
            }}
          />

          <div className="relative z-10 w-full max-w-xl mx-auto px-6 pt-24 pb-12 text-center">
            <p className="font-[family-name:var(--font-display)] font-bold text-[#0D41CB] tracking-[0.3em] uppercase text-sm md:text-base mb-3">
              The Pack
            </p>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-white uppercase leading-none text-[clamp(3rem,12vw,6rem)] tracking-tight mb-5">
              Join the Pack
            </h1>
            <p className="text-white/85 text-lg md:text-xl leading-relaxed mb-8 max-w-md mx-auto">
              Tell me your city and I&apos;ll let you know the moment I add a show near you.
            </p>

            <EmailSignup bare compact source="thepack" buttonLabel="Join the Pack" />

            <p className="text-white/45 text-xs uppercase tracking-widest mt-6">
              Seen on Netflix, Just For Laughs, and Kill Tony
            </p>
          </div>
        </section>

        {/* Below the fold: the why + the honest aside. */}
        <section className="bg-[#0A0A0A] py-20 px-6">
          <div className="max-w-3xl mx-auto grid gap-10 md:grid-cols-3">
            {VALUE_POINTS.map((point, i) => (
              <div key={point.slice(0, 24)} className="text-center md:text-left">
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[#0D41CB] text-3xl mb-3">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="text-[#888] text-base leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
          <p className="max-w-3xl mx-auto text-[#666] text-base leading-relaxed mt-14 text-center md:text-left">
            Yes, it is another email list. But this one only shows up when I am actually headed to your town.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
