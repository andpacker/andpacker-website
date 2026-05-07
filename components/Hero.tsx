import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/60 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full">
        <p className="font-[family-name:var(--font-display)] font-bold text-[#0D41CB] tracking-[0.3em] uppercase text-sm md:text-base mb-4">
          Stand-Up Comedian
        </p>
        <h1 className="font-[family-name:var(--font-display)] font-extrabold text-white uppercase leading-none text-[clamp(3.5rem,12vw,9rem)] tracking-tight">
          Andrew
          <br />
          Packer
        </h1>
        <p className="mt-6 text-[#888] text-lg max-w-md leading-relaxed">
          Live comedy that hits different. Catch Andrew on tour across North America and beyond.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="#tour"
            className="inline-block bg-[#0D41CB] hover:bg-[#0b35a8] text-white font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm px-8 py-4 transition-colors"
          >
            See Tour Dates
          </Link>
          <Link
            href="#watch"
            className="inline-block border border-white/30 hover:border-white text-white font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm px-8 py-4 transition-colors"
          >
            Watch
          </Link>
        </div>
      </div>
    </section>
  );
}
