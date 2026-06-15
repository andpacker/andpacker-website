import type { Metadata } from "next";
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
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/85 via-[#0A0A0A]/65 to-[#0A0A0A]/90" />

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
