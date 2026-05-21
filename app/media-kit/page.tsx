"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONTACT_EMAIL = "info@andpacker.com";
const MAILTO =
  "mailto:info@andpacker.com?subject=Partnership%20Inquiry%20%E2%80%94%20Andrew%20Packer";

// ─── Light nav (inline, scoped to this page) ────────────────────────────────

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://instagram.com/andpacker",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@andpacker",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@andpacker",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.87a8.2 8.2 0 0 0 4.79 1.52V6.94a4.84 4.84 0 0 1-1.02-.25z" />
      </svg>
    ),
  },
];

function LightNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm border-b border-[#e5e5e5]"
          : "bg-white/90 border-b border-[#e5e5e5]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] font-bold text-xl tracking-widest text-[#111111] uppercase"
        >
          Andrew Packer
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm tracking-widest uppercase text-[#666] hover:text-[#111] transition-colors"
          >
            Home
          </Link>
          <a
            href={MAILTO}
            className="text-sm tracking-widest uppercase text-[#0D41CB] hover:text-[#0b35a8] transition-colors font-medium"
          >
            Get in Touch
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-[#999] hover:text-[#111] transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>

          <button
            className="md:hidden text-[#111]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#e5e5e5] px-6 py-6 flex flex-col gap-6">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-sm tracking-widest uppercase text-[#666] hover:text-[#111] transition-colors"
          >
            Home
          </Link>
          <a
            href={MAILTO}
            onClick={() => setMenuOpen(false)}
            className="text-sm tracking-widest uppercase text-[#0D41CB] font-medium"
          >
            Get in Touch
          </a>
          <div className="flex items-center gap-5 pt-2">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-[#999] hover:text-[#111] transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const PARTNERS = [
  {
    name: "Optimum",
    url: "https://www.tiktok.com/@andpacker/video/7603834660698836244",
    extraUrl: "https://www.tiktok.com/@andpacker/video/7640243712605392149",
    outcome: "Two-campaign partnership — renewed for a second integration",
  },
  {
    name: "Nissan",
    url: "https://www.tiktok.com/@andpacker/video/7349287739914767622",
    extraUrl: null,
    outcome: null,
  },
  {
    name: "Paramount+",
    url: "https://www.instagram.com/p/Cy1VKDMvpKc/",
    extraUrl: null,
    outcome: null,
  },
  {
    name: "Mintier Mouthtape",
    url: "https://www.instagram.com/reel/DI6mx_Wp4Ly/",
    extraUrl: null,
    outcome: null,
  },
  {
    name: "Cozey",
    url: "https://www.tiktok.com/@andpacker/video/7314312960170593542",
    extraUrl: null,
    outcome: null,
  },
  {
    name: "Bulldog Face Moisturizer",
    url: "https://www.tiktok.com/@andpacker/video/7362283212845878533",
    extraUrl: null,
    outcome: null,
  },
  {
    name: "Fat Bastard Burrito",
    url: "https://www.instagram.com/reel/C5OzyidP_yM/",
    extraUrl: null,
    outcome: null,
  },
];

const PORTFOLIO = [
  {
    title: "Prenatal",
    year: "2026",
    badge: "In production",
    note: "Brand integration available",
    image: null,
    href: "#prenatal",
    internal: true,
    accent: true,
  },
  {
    title: "Never Call Her Crazy",
    year: "2026",
    badge: "Angel Studios",
    note: null,
    image: "/images/never-call-her-crazy.png",
    href: "https://www.angel.com/watch/andrew-packer-never-call-her-crazy",
    internal: false,
    accent: false,
  },
  {
    title: "On Guard",
    year: "2023",
    badge: "190K YouTube views + 10M+ clip views",
    note: "One Bone brand integration inside",
    image: `https://img.youtube.com/vi/wBo6-8DoiRU/maxresdefault.jpg`,
    href: "https://www.youtube.com/watch?v=wBo6-8DoiRU",
    internal: false,
    accent: false,
  },
  {
    title: "Laugh It Off w/ Andrew Packer",
    year: "Podcast",
    badge: "Group Therapy Comedy Show",
    note: "Wellness brands",
    image: "/images/laugh-it-off-artwork.jpg",
    href: "https://pod.link/laughitoff",
    internal: false,
    accent: false,
  },
  {
    title: "Sauna Comedy",
    year: "Live format",
    badge: "Creator & host",
    note: "NY Post · Chortle · amNY",
    image: null,
    href: "https://nypost.com/2025/11/12/health/inside-a-comedy-show-in-a-sauna-and-why-its-great-for-health/",
    internal: false,
    accent: false,
  },
];

const PACKAGES = [
  {
    title: "Short-Form Campaign",
    subtitle: null,
    bestFor: "Brand awareness, product launches, conversion tracking",
    items: [
      "Brand-integrated sketch or Man News episode",
      "Cross-posted to TikTok + Instagram Reels",
      "60-second format",
      "3-month organic window",
      "UTM link or promo code tracking available",
      "Typical campaign: 1–3 pieces of content",
    ],
  },
  {
    title: "Comedy Special Integration",
    subtitle: "Prenatal — 2026",
    bestFor: "Family, baby, dad-category, and lifestyle brands — perpetual organic reach",
    items: [
      "Brand woven into the narrative of \"Prenatal\" — not an ad break, part of the show",
      "Perpetual organic reach (On Guard precedent: 190K YouTube + 10M+ clip views, no paid promotion)",
      "Full creative collaboration — script and final cut review included",
      "Limited slots available for 2026",
    ],
  },
  {
    title: "Podcast Sponsorship",
    subtitle: "Wellness & Therapy Brands Only",
    bestFor: "Mental health, wellness, therapy, and self-improvement brands",
    items: [
      "Host-read integration inside Laugh It Off — the Group Therapy Comedy Show",
      "Audience actively engaged in mental health and wellness — not general consumer",
      "Highly targeted, limited volume, high-intent listeners",
      "Available exclusively to brands aligned with the show's theme",
    ],
  },
];

const HOW_WE_WORK = [
  { label: "Turnaround", value: "2–3 weeks from brief to publish. Rush turnaround available." },
  { label: "Approval", value: "Brand reviews script + final cut before publish" },
  { label: "Short-form organic", value: "3 months" },
  { label: "Special integrations", value: "In perpetuity" },
  { label: "Paid whitelisting", value: "Negotiated per campaign" },
  { label: "Category exclusivity", value: "Available on request" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MediaKitPage() {
  return (
    <div style={{ backgroundColor: "#FFFFFF", color: "#111111", minHeight: "100vh" }}>
      <LightNav />

      {/* 1. Hero */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/70 to-transparent" />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-16">
          <p className="font-[family-name:var(--font-display)] font-bold text-[#0D41CB] tracking-[0.3em] uppercase text-sm md:text-base mb-4">
            Brand Partnerships
          </p>
          <h1 className="font-[family-name:var(--font-display)] font-extrabold text-white uppercase leading-none text-[clamp(3rem,10vw,7rem)] tracking-tight">
            The dad audience.
            <br />
            At scale.
          </h1>
          <p className="mt-6 text-[#ccc] text-lg max-w-lg leading-relaxed">
            5M+ followers. 89% male. 25–44. Andrew Packer — comedian, content creator, podcast host. First baby due August 2026.
          </p>
          <div className="mt-10">
            <a
              href={MAILTO}
              className="inline-block bg-[#0D41CB] hover:bg-[#0b35a8] text-white font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm px-8 py-4 transition-colors"
            >
              Let&apos;s Talk
            </a>
          </div>
        </div>
      </section>

      {/* Narrow column wrapper for all sections below hero */}
      <div style={{ backgroundColor: "#FFFFFF" }}>

        {/* 2. Press / As Seen In */}
        <section className="py-12 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs tracking-[0.25em] uppercase text-[#888] mb-5">As seen in</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-[#444]">
              {[
                "New York Post (2025)",
                "CBC (2026)",
                "Bell Media / CTV (2025)",
                "amNew York (2025)",
                "Chortle UK (2025)",
                "Georgia Straight (2026)",
              ].map((outlet, i, arr) => (
                <span key={outlet} className="flex items-center gap-6">
                  {outlet}
                  {i < arr.length - 1 && (
                    <span className="text-[#ccc] hidden sm:inline">·</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Audience Demographics */}
        <section className="py-16 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-[#0D41CB] mb-3">Audience</p>
            <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-tight text-[#111] mb-10">
              Who&apos;s watching
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="p-6 border border-[#e5e5e5] rounded-sm">
                <div className="text-xs tracking-widest uppercase text-[#888] mb-2">Gender</div>
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[clamp(2.5rem,6vw,4rem)] leading-none text-[#0D41CB]">89%</div>
                <div className="text-sm text-[#444] mt-1">male</div>
              </div>
              <div className="p-6 border border-[#e5e5e5] rounded-sm">
                <div className="text-xs tracking-widest uppercase text-[#888] mb-2">Age</div>
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[clamp(2.5rem,6vw,4rem)] leading-none text-[#111]">25–44</div>
                <div className="text-sm text-[#444] mt-1">parenting cohort</div>
              </div>
              <div className="p-6 border border-[#e5e5e5] rounded-sm">
                <div className="text-xs tracking-widest uppercase text-[#888] mb-2">Top markets</div>
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[clamp(1.6rem,4vw,2.5rem)] leading-none text-[#111] mt-2">US · CA · UK · AU</div>
              </div>
            </div>

            <p className="text-[#444] text-base leading-relaxed max-w-2xl">
              Baby marketing is saturated with mom-focused creators. Dads co-research and co-decide on big-ticket gear — and almost nobody is marketing to them. This is that audience, at scale.
            </p>
          </div>
        </section>

        {/* 4. Why Dads, Why Now */}
        <section className="py-16 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto">
            <div
              className="p-8 rounded-sm"
              style={{
                backgroundColor: "#F3F3F1",
                borderLeft: "4px solid #0D41CB",
              }}
            >
              <p className="text-xs tracking-[0.25em] uppercase text-[#0D41CB] mb-3">The opportunity</p>
              <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(1.5rem,4vw,2.5rem)] leading-none tracking-tight text-[#111] mb-6">
                The most underpriced audience in brand marketing.
              </h2>
              <p className="text-[#444] text-base leading-relaxed">
                Dads co-decide on cars, electronics, baby gear, home furnishings, food delivery, insurance, finance, and alcohol. They&apos;re systematically under-targeted because most lifestyle creators at scale skew female. The few reaching men at scale are sports, finance, and news — not lifestyle and family. Andrew is the gap. And with his first baby due August 2026, he&apos;s building into this content arc at exactly the moment his audience hits peak buying age for everything in the parenting category.
              </p>
            </div>
          </div>
        </section>

        {/* 5. The Numbers */}
        <section className="py-16 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-[#0D41CB] mb-3">Scale</p>
            <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-tight text-[#111] mb-10">
              The numbers
            </h2>

            {/* Lead stat */}
            <div className="mb-12 p-8 bg-[#F3F3F1] rounded-sm">
              <div className="font-[family-name:var(--font-display)] font-extrabold text-[#0D41CB] text-[clamp(4rem,12vw,8rem)] leading-none tracking-tight">
                10M+
              </div>
              <div className="font-[family-name:var(--font-display)] font-bold uppercase text-[#111] text-xl tracking-wide mt-2">
                YouTube views in the last 90 days.
              </div>
              <div className="text-[#666] text-base mt-1">81% from non-subscribers.</div>
            </div>

            {/* Platform grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { platform: "TikTok", count: "2.9M" },
                { platform: "YouTube", count: "1.2M" },
                { platform: "Instagram", count: "617K" },
                { platform: "Facebook", count: "177K" },
              ].map(({ platform, count }) => (
                <div key={platform} className="text-center p-4 border border-[#e5e5e5] rounded-sm">
                  <div className="font-[family-name:var(--font-display)] font-extrabold text-[clamp(1.8rem,4vw,2.8rem)] leading-none text-[#111]">
                    {count}
                  </div>
                  <div className="text-xs tracking-widest uppercase text-[#888] mt-1">{platform}</div>
                </div>
              ))}
            </div>

            <p className="text-[#666] text-sm text-center">
              Combined 5M+ followers · 26+ live tour dates/year
            </p>
          </div>
        </section>

        {/* 6. Engagement Proof */}
        <section className="py-16 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-[#0D41CB] mb-3">Proof</p>
            <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-tight text-[#111] mb-4">
              Engagement
            </h2>
            <p className="text-[#666] text-base mb-10 max-w-xl">
              Reach is how many people could see it. Engagement is what they do with it.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 border border-[#e5e5e5] rounded-sm">
                <div className="text-xs tracking-widest uppercase text-[#888] mb-3">TikTok</div>
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[clamp(2.5rem,5vw,3.5rem)] leading-none text-[#0D41CB]">7.5%</div>
                <div className="text-sm font-medium text-[#111] mt-1">engagement rate</div>
                <div className="text-xs text-[#888] mt-2">Industry benchmark: 3–5%</div>
              </div>
              <div className="p-6 border border-[#e5e5e5] rounded-sm">
                <div className="text-xs tracking-widest uppercase text-[#888] mb-3">Instagram Reels</div>
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[clamp(2.5rem,5vw,3.5rem)] leading-none text-[#0D41CB]">5.9%</div>
                <div className="text-sm font-medium text-[#111] mt-1">engagement · ~3,000 shares/Reel</div>
                <div className="text-xs text-[#888] mt-2">2% share rate — content travels beyond existing audience</div>
              </div>
              <div className="p-6 border border-[#e5e5e5] rounded-sm">
                <div className="text-xs tracking-widest uppercase text-[#888] mb-3">YouTube</div>
                <div className="font-[family-name:var(--font-display)] font-extrabold text-[clamp(2.5rem,5vw,3.5rem)] leading-none text-[#0D41CB]">81%</div>
                <div className="text-sm font-medium text-[#111] mt-1">watch time from non-subscribers</div>
                <div className="text-xs text-[#888] mt-2">Audience is growing, not just loyal</div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Brand Safety */}
        <section className="py-12 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-3">
              <p className="text-[#444] text-base leading-relaxed">
                Every partner listed below ran their integration through their own legal and brand safety review — Nissan, Paramount+, and Optimum included.
              </p>
              <p className="text-[#444] text-base leading-relaxed">
                Andrew&apos;s branded content is observational and family-safe. No politics. No controversy. Full script and final-cut review on every integration. Andrew only partners with products he&apos;d genuinely use.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Past Partners */}
        <section className="py-16 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-[#0D41CB] mb-3">Track record</p>
            <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-tight text-[#111] mb-4">
              Past Partners
            </h2>
            <p className="text-[#666] text-base mb-10">
              Brands that have already worked with Andrew:
            </p>

            <div className="flex flex-col divide-y divide-[#eeeeee]">
              {PARTNERS.map((p) => (
                <div key={p.name} className="py-4 flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-[#111] underline decoration-transparent hover:decoration-[#0D41CB] hover:text-[#0D41CB] transition-colors underline-offset-2"
                    >
                      {p.name}
                    </a>
                    {p.extraUrl && (
                      <a
                        href={p.extraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#0D41CB] hover:underline"
                      >
                        (+1 more)
                      </a>
                    )}
                  </div>
                  {p.outcome && (
                    <p className="text-sm text-[#888]">{p.outcome}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Prenatal — Brand Integration Opportunity */}
        <section id="prenatal" className="py-16 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto">
            <div
              className="p-8 rounded-sm"
              style={{
                backgroundColor: "#EEF3FF",
                borderLeft: "4px solid #0D41CB",
              }}
            >
              <p className="text-xs tracking-[0.25em] uppercase text-[#0D41CB] mb-3">Flagship integration opportunity</p>
              <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(1.5rem,4vw,2.5rem)] leading-none tracking-tight text-[#111] mb-6">
                Prenatal — A Comedy Special About What to Expect When You&apos;re Expecting
              </h2>
              <p className="text-[#333] text-base leading-relaxed mb-6">
                Andrew&apos;s third comedy special launches in 2026, built entirely around the experience of becoming a dad for the first time. This is a rare opportunity to integrate a brand into original long-form comedy content at the exact life moment the audience is actively living through.
              </p>

              <div className="border-t border-[#d0daf7] pt-6 mb-6">
                <p className="text-[#333] text-base leading-relaxed">
                  Comedy specials accumulate views indefinitely. Andrew&apos;s previous special &ldquo;On Guard&rdquo; has 190,000 YouTube views and 10M+ combined clip views across platforms — with no paid promotion. A brand integration inside &ldquo;Prenatal&rdquo; reaches millions of dads in a format they&apos;ll return to and share, not scroll past.
                </p>
              </div>

              <p className="text-[#555] text-sm italic">
                Brand integrations are woven into the narrative — not ad breaks. Limited availability. Reach out to discuss fit.
              </p>
            </div>
          </div>
        </section>

        {/* 10. Content Portfolio */}
        <section className="py-16 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-[#0D41CB] mb-3">Content</p>
            <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-tight text-[#111] mb-10">
              Portfolio
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {PORTFOLIO.map((item) => {
                const cardContent = (
                  <div
                    className="group relative overflow-hidden rounded-sm h-full flex flex-col border border-[#e5e5e5] hover:border-[#0D41CB] transition-colors"
                    style={item.accent ? { borderColor: "#0D41CB", backgroundColor: "#EEF3FF" } : {}}
                  >
                    {/* Image or placeholder */}
                    <div className="relative aspect-video overflow-hidden bg-[#f0f0ee] flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={item.accent ? { backgroundColor: "#dce8ff" } : {}}
                        >
                          <span
                            className="font-[family-name:var(--font-display)] font-bold text-xs tracking-widest uppercase text-center px-2"
                            style={{ color: item.accent ? "#0D41CB" : "#999" }}
                          >
                            {item.title}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-3 flex flex-col gap-1">
                      <div
                        className="text-[10px] tracking-widest uppercase font-medium"
                        style={{ color: "#0D41CB" }}
                      >
                        {item.year}
                      </div>
                      <div className="font-[family-name:var(--font-display)] font-bold text-[#111] text-sm uppercase leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[#666]">{item.badge}</div>
                      {item.note && (
                        <div className="text-[10px] text-[#888] italic">{item.note}</div>
                      )}
                    </div>
                  </div>
                );

                if (item.internal) {
                  return (
                    <a key={item.title} href={item.href} className="block h-full">
                      {cardContent}
                    </a>
                  );
                }
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    {cardContent}
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* 11. Partnership Packages */}
        <section className="py-16 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-[#0D41CB] mb-3">Work together</p>
            <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-tight text-[#111] mb-4">
              Packages
            </h2>
            <p className="text-[#666] text-base mb-10">Three ways to work together:</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {PACKAGES.map((pkg) => (
                <div key={pkg.title} className="border border-[#e5e5e5] rounded-sm p-6 flex flex-col gap-4">
                  <div>
                    <div className="font-[family-name:var(--font-display)] font-bold uppercase text-[#111] text-lg tracking-wide leading-tight">
                      {pkg.title}
                    </div>
                    {pkg.subtitle && (
                      <div className="text-xs text-[#0D41CB] font-medium mt-1">{pkg.subtitle}</div>
                    )}
                    <div className="text-xs text-[#888] mt-2 leading-relaxed">
                      <span className="font-medium text-[#555]">Best for:</span> {pkg.bestFor}
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {pkg.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[#444] leading-relaxed">
                        <span className="text-[#0D41CB] mt-0.5 flex-shrink-0">&#8594;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="text-[#666] text-sm text-center">
              Tiers can be combined. Pricing on request. Reach out to discuss fit and availability.
            </p>
          </div>
        </section>

        {/* 12. How We Work */}
        <section className="py-16 px-6 border-b border-[#eeeeee]">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-[#0D41CB] mb-3">Process</p>
            <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-tight text-[#111] mb-10">
              How we work
            </h2>

            <div className="border border-[#e5e5e5] rounded-sm overflow-hidden">
              {HOW_WE_WORK.map((row, i) => (
                <div
                  key={row.label}
                  className={`flex flex-col sm:flex-row gap-1 sm:gap-8 p-5 ${
                    i < HOW_WE_WORK.length - 1 ? "border-b border-[#eeeeee]" : ""
                  }`}
                >
                  <div className="text-xs tracking-widest uppercase font-medium text-[#888] sm:w-44 flex-shrink-0 pt-0.5">
                    {row.label}
                  </div>
                  <div className="text-sm text-[#333] leading-relaxed">{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 13. CTA */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(3rem,8vw,6rem)] leading-none tracking-tight text-[#111] mb-4">
              Let&apos;s talk.
            </h2>
            <p className="text-[#666] text-lg mb-10 max-w-md mx-auto">
              Tell us about your brand and what you&apos;re building. We&apos;ll figure out if there&apos;s a fit.
            </p>
            <a
              href={MAILTO}
              className="inline-block bg-[#0D41CB] hover:bg-[#0b35a8] text-white font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm px-10 py-5 transition-colors mb-6"
            >
              Get in Touch
            </a>
            <div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm text-[#888] hover:text-[#0D41CB] transition-colors"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#eeeeee] py-10 px-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-[#111] text-lg">
              Andrew Packer
            </div>
            <p className="text-[#aaa] text-xs">
              &copy; {new Date().getFullYear()} Andrew Packer. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
