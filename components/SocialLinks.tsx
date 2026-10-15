import { SOCIALS, SocialIcon } from "@/lib/socials";

// Card colours per platform; links and icons come from lib/socials.
const CARD_BG: Record<string, string> = {
  Instagram: "from-[#833ab4] via-[#fd1d1d] to-[#fcb045]",
  TikTok: "from-[#25F4EE] via-[#010101] to-[#FE2C55]",
  YouTube: "from-[#FF0000] to-[#cc0000]",
  Facebook: "from-[#1877F2] to-[#0d5fcf]",
};

const PLATFORMS = SOCIALS.filter((s) => s.label in CARD_BG).map((s) => ({
  ...s,
  handle: "@andpacker",
  bg: CARD_BG[s.label],
}));

export default function SocialLinks() {
  return (
    <section id="social" className="py-24 px-6 bg-[#0A0A0A]">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,4rem)] leading-none tracking-tight text-white mb-12">
          Follow Along
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLATFORMS.map((p) => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.ariaLabel}
              className={`group relative overflow-hidden bg-gradient-to-br ${p.bg} p-8 flex flex-col gap-4 hover:opacity-90 transition-opacity`}
            >
              <div className="text-white/90">
                <SocialIcon path={p.path} className="w-10 h-10" />
              </div>
              <div>
                <div className="text-white font-[family-name:var(--font-display)] font-bold text-2xl uppercase tracking-wide">
                  {p.label}
                </div>
                <div className="text-white/70 text-sm">{p.handle}</div>
              </div>
              <div className="absolute bottom-6 right-6 text-white/30 group-hover:text-white/60 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
