import type { Metadata } from "next";
import Nav from "@/components/Nav";
import EmailSignup from "@/components/EmailSignup";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Join The Pack | Andrew Packer",
  description:
    "Be the first to know when I add a show near you, with an early heads-up before tickets go on sale.",
  openGraph: {
    title: "Join The Pack | Andrew Packer",
    description:
      "Be the first to know when I add a show near you, with an early heads-up before tickets go on sale.",
    url: "https://andpacker.com/pack",
    siteName: "Andrew Packer",
    type: "website",
  },
};

const VALUE_POINTS = [
  "New shows near you hit your inbox before I post them anywhere else.",
  "You get an early heads-up before tickets go on sale, so you are not scrambling for seats.",
  "I only email when it actually matters. No spam, unsubscribe anytime.",
];

export default function PackPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Slim hero: carries the message once. hero.jpg + dark overlay, kept short so
            the form lands at or near the mobile fold. */}
        <section className="relative min-h-[68vh] flex items-end overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-no-repeat hero-bg"
            style={{ backgroundImage: "url('/hero.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/60 to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-8 w-full">
            <p className="font-[family-name:var(--font-display)] font-bold text-[#0D41CB] tracking-[0.3em] uppercase text-sm md:text-base mb-4">
              The Pack
            </p>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-white uppercase leading-none text-[clamp(3rem,10vw,7rem)] tracking-tight">
              Join The Pack
            </h1>
            <p className="mt-6 text-white/80 text-lg md:text-xl max-w-xl leading-relaxed">
              Be the first to know when I add a show near you, with an early heads-up before tickets go on sale.
            </p>
            <p className="mt-4 text-[#888] text-sm uppercase tracking-widest">
              Seen on Netflix, Just For Laughs, and Kill Tony
            </p>
            <p className="mt-3 text-[#888] text-base max-w-xl leading-relaxed">
              Yes, it is another email list. But this one only shows up when I am actually headed to your town.
            </p>
          </div>
        </section>

        <EmailSignup
          compact
          source="pack"
          heading=""
          subhead=""
          secondLine=""
          buttonLabel="Join The Pack"
        />

        <section className="bg-[#0A0A0A] py-20 px-6">
          <div className="max-w-3xl mx-auto grid gap-10 md:grid-cols-3">
            {VALUE_POINTS.map((point) => (
              <div key={point.slice(0, 24)} className="text-center md:text-left">
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[#0D41CB] text-3xl mb-3">
                  {String(VALUE_POINTS.indexOf(point) + 1).padStart(2, "0")}
                </div>
                <p className="text-[#888] text-base leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
