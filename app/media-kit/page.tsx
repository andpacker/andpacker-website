"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Constants ───────────────────────────────────────────────────────────────

const CONTACT_EMAIL = "info@andpacker.com";
const MAILTO_GENERAL =
  "mailto:info@andpacker.com?subject=Partnership%20Inquiry%20%E2%80%94%20Andrew%20Packer";
const MAILTO_PRENATAL =
  "mailto:info@andpacker.com?subject=Prenatal%20Integration%20Inquiry";
const MAILTO_SHORTFORM =
  "mailto:info@andpacker.com?subject=Short-Form%20Campaign%20Inquiry";
const MAILTO_PODCAST =
  "mailto:info@andpacker.com?subject=Podcast%20Sponsorship%20Inquiry";

const SOCIAL_URLS: Record<string, string> = {
  TikTok:    "https://www.tiktok.com/@andpacker",
  YouTube:   "https://www.youtube.com/@andpacker",
  Instagram: "https://www.instagram.com/andpacker/",
  Facebook:  "https://www.facebook.com/andpacker",
};

// ─── Light nav (inline, scoped to this page) ─────────────────────────────────

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
          ? "bg-white/98 backdrop-blur-sm shadow-sm"
          : "bg-white border-b border-gray-100"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] font-black text-lg tracking-widest text-[#111111] uppercase"
        >
          Andrew Packer
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/#contact"
            className="text-sm text-[#111] hover:text-[#0D41CB] transition-colors"
          >
            Contact
          </Link>

          <div className="w-px h-4 bg-gray-300" />

          {/* TikTok */}
          <a href="https://www.tiktok.com/@andpacker" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-[#111] hover:text-[#0D41CB] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z"/>
            </svg>
          </a>

          {/* YouTube */}
          <a href="https://www.youtube.com/@andpacker" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-[#111] hover:text-[#0D41CB] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 002.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
            </svg>
          </a>

          {/* Instagram */}
          <a href="https://www.instagram.com/andpacker/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-[#111] hover:text-[#0D41CB] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>

          {/* Facebook */}
          <a href="https://www.facebook.com/andpacker" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-[#111] hover:text-[#0D41CB] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>

        <button
          className="md:hidden text-[#111]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
          {[
            { label: "Tours", href: "/#tours" },
            { label: "Watch", href: "/#watch" },
            { label: "Listen", href: "/#listen" },
            { label: "Contact", href: "/#contact" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-[#111] hover:text-[#0D41CB] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Sticky in-page nav ───────────────────────────────────────────────────────

function InPageNav() {
  return (
    <div className="sticky top-14 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-center gap-6 md:gap-10 py-3 overflow-x-auto">
          {[
            { label: "AUDIENCE", href: "#audience" },
            { label: "STATS", href: "#stats" },
            { label: "BRAND WORK", href: "#brand-work" },
            { label: "PRENATAL", href: "#prenatal" },
            { label: "PACKAGES", href: "#packages" },
            { label: "CONTACT", href: "#contact" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-xs tracking-widest font-medium text-gray-600 hover:text-[#0D41CB] transition-colors whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section header pattern ───────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  light = false,
}: {
  title: string;
  subtitle: string;
  light?: boolean;
}) {
  return (
    <div className="mb-10">
      <h2
        className={`font-[family-name:var(--font-display)] font-black text-3xl md:text-4xl uppercase tracking-tight leading-none ${
          light ? "text-white" : "text-[#111111]"
        }`}
      >
        {title}
      </h2>
      <p
        className={`text-xs tracking-widest uppercase mt-2 ${
          light ? "text-white/60" : "text-gray-400"
        }`}
      >
        {subtitle}
      </p>
      <hr
        className={`mt-4 border-0 h-px w-24 mx-auto ${
          light ? "bg-white/30" : "bg-gray-200"
        }`}
      />
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const PRESS_LOGOS = [
  { file: "nypost.png",        name: "New York Post", year: "2025", cls: "max-h-20 w-auto" }, // 80px → 78×80 = 6,240 px²
  { file: "cbc.png",           name: "CBC",           year: "2026", cls: "max-h-10 w-auto" }, // 40px → 157×40 = 6,280 px²
  { file: "bellmedia.png",     name: "Bell Media",    year: "2025", cls: "max-h-10 w-auto" }, // 40px → 161×40 = 6,440 px²
  { file: "amny.png",          name: "amNY",          year: "2025", cls: "max-h-10 w-auto" }, // 40px → 145×40 = 5,800 px²
  { file: "ctv.png",           name: "CTV",           year: "2026", cls: "max-h-12 w-auto" }, // 48px → 152×48 = 7,296 px²
  { file: "deadline.png",      name: "Deadline",      year: "2025", cls: "max-h-8 w-auto"  }, // 32px → 248×32 = 7,936 px²
  { file: "angel-studios.svg", name: "Angel Studios", year: "2026", cls: "h-12 w-auto"     }, // exact h (SVG is 32px natural, max-h won't scale up)
];

const PLATFORM_STATS = [
  { platform: "TikTok", count: "2.9M", label: "FOLLOWERS" },
  { platform: "YouTube", count: "1.2M", label: "SUBSCRIBERS" },
  { platform: "Instagram", count: "617K", label: "FOLLOWERS" },
  { platform: "Facebook", count: "180K", label: "FOLLOWERS" },
  { platform: "Combined", count: "5M+", label: "TOTAL REACH" },
  { platform: "Live Tour", count: "26+", label: "DATES / YEAR" },
];

const BRAND_GRID = [
  {
    name: "OPTIMUM",
    format: "MAN NEWS",
    url: "https://www.tiktok.com/@andpacker/video/7603834660698836244",
    note: "Renewed for a second integration",
  },
  {
    name: "OPTIMUM",
    format: "MAN NEWS — SECOND CAMPAIGN",
    url: "https://www.tiktok.com/@andpacker/video/7640243712605392149",
    note: null,
  },
  {
    name: "NISSAN",
    format: "SKETCH COMEDY",
    url: "https://www.tiktok.com/@andpacker/video/7349287739914767622",
    note: null,
  },
  {
    name: "PARAMOUNT+",
    format: "MAN NEWS",
    url: "https://www.instagram.com/p/Cy1VKDMvpKc/",
    note: null,
  },
  {
    name: "MINTIER MOUTHTAPE",
    format: "SKETCH COMEDY",
    url: "https://www.instagram.com/reel/DI6mx_Wp4Ly/",
    note: null,
  },
  {
    name: "COZEY",
    format: "LIFESTYLE",
    url: "https://www.tiktok.com/@andpacker/video/7314312960170593542",
    note: null,
  },
  {
    name: "BULLDOG",
    format: "MAN NEWS",
    url: "https://www.tiktok.com/@andpacker/video/7362283212845878533",
    note: null,
  },
  {
    name: "FAT BASTARD BURRITO",
    format: "IRL",
    url: "https://www.instagram.com/reel/C5OzyidP_yM/",
    note: null,
  },
];

const FORMAT_CARDS = [
  {
    format: "MAN NEWS",
    pitch: "Andrew becomes the anchor. Your brand is the story.",
    bestFor: "Consumer products · entertainment · tech",
    primaryUrl: "https://www.tiktok.com/@andpacker/video/7603834660698836244",
    thumbs: [
      { name: "OPTIMUM", url: "https://www.tiktok.com/@andpacker/video/7603834660698836244", type: "placeholder", youtubeId: undefined },
      { name: "PARAMOUNT+", url: "https://www.instagram.com/p/Cy1VKDMvpKc/", type: "placeholder", youtubeId: undefined },
    ],
  },
  {
    format: "SKETCH COMEDY",
    pitch: "Scripted premise, brand woven into the bit. Memorable and shareable.",
    bestFor: "Challenger brands · products with a personality",
    primaryUrl: "https://www.tiktok.com/@andpacker/video/7349287739914767622",
    thumbs: [
      { name: "NISSAN", url: "https://www.tiktok.com/@andpacker/video/7349287739914767622", type: "placeholder", youtubeId: undefined },
      { name: "MINTIER", url: "https://www.instagram.com/reel/DI6mx_Wp4Ly/", type: "placeholder", youtubeId: undefined },
    ],
  },
  {
    format: "IRL / LIFESTYLE",
    pitch: "Andrew uses it in real life. Feels like a recommendation, not an ad.",
    bestFor: "Everyday products · food & beverage · home goods",
    primaryUrl: "https://www.tiktok.com/@andpacker/video/7314312960170593542",
    thumbs: [
      { name: "COZEY", url: "https://www.tiktok.com/@andpacker/video/7314312960170593542", type: "placeholder", youtubeId: undefined },
      { name: "FAT BASTARD BURRITO", url: "https://www.instagram.com/reel/C5OzyidP_yM/", type: "placeholder", youtubeId: undefined },
    ],
  },
  {
    format: "HERO CONTENT",
    pitch: "Brand integrated into long-form production. Perpetual organic reach.",
    bestFor: "Premium brands · Prenatal campaign · parenting category",
    primaryUrl: "https://www.youtube.com/watch?v=wBo6-8DoiRU",
    thumbs: [
      { name: "ON GUARD", url: "https://www.youtube.com/watch?v=wBo6-8DoiRU", type: "youtube", youtubeId: "wBo6-8DoiRU" },
      { name: "PRENATAL", url: "#prenatal", type: "prenatal", youtubeId: undefined },
    ],
  },
];

const HOW_I_WORK = [
  { label: "Turnaround", value: "2–3 weeks from brief to publish. Rush turnaround available." },
  { label: "Approval", value: "Brand reviews script + final cut before publish" },
  { label: "Short-form organic", value: "3 months" },
  { label: "Special integrations", value: "In perpetuity" },
  { label: "Paid whitelisting", value: "Negotiated per campaign" },
  { label: "Category exclusivity", value: "Available on request" },
];

// ─── Brand grid thumbnail card ────────────────────────────────────────────────

function BrandCard({ item }: { item: typeof BRAND_GRID[number] }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      {/* Thumbnail placeholder — styled dark card with brand name */}
      <div className="aspect-square bg-gray-900 flex items-center justify-center rounded-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950" />
        <span className="relative font-[family-name:var(--font-display)] font-black text-white text-center px-4 text-sm uppercase tracking-widest leading-tight group-hover:text-[#0D41CB] transition-colors">
          {item.name}
        </span>
      </div>
      {/* Label block */}
      <div className="mt-2">
        <p className="text-xs font-bold tracking-widest text-[#111111] uppercase">{item.name}</p>
        <p className="text-xs italic text-gray-500 mt-0.5">{item.format}</p>
        {item.note && (
          <p className="text-xs text-[#0D41CB] mt-0.5">{item.note} &rarr;</p>
        )}
      </div>
    </a>
  );
}

// ─── Package card ─────────────────────────────────────────────────────────────

function PackageCard({
  title,
  category,
  items,
  mailto,
}: {
  title: string;
  category: string;
  items: string[];
  mailto: string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 flex flex-col">
      <div className="mb-4">
        <h3 className="font-[family-name:var(--font-display)] font-black text-xl uppercase text-[#111111] leading-tight">
          {title}
        </h3>
        <p className="text-xs tracking-widest uppercase text-[#0D41CB] mt-1">{category}</p>
      </div>
      <hr className="border-gray-200 mb-4" />
      <ul className="flex flex-col flex-grow">
        {items.map((item, i) => (
          <li key={i}>
            <p className="text-sm text-gray-600 py-2.5 leading-relaxed">{item}</p>
            {i < items.length - 1 && <hr className="border-gray-100" />}
          </li>
        ))}
      </ul>
      <a
        href={mailto}
        className="mt-6 block text-center bg-[#111111] text-white text-sm py-2.5 rounded font-medium hover:bg-[#0D41CB] transition-colors"
      >
        Let&apos;s Talk
      </a>
    </div>
  );
}

// ─── Format card ─────────────────────────────────────────────────────────────

function FormatCard({ card }: { card: typeof FORMAT_CARDS[number] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-2 gap-0.5 bg-gray-200">
        {card.thumbs.map((thumb) => (
          <a
            key={thumb.name}
            href={thumb.url}
            target={thumb.url.startsWith("#") ? undefined : "_blank"}
            rel={thumb.url.startsWith("#") ? undefined : "noopener noreferrer"}
            className="group block aspect-video bg-gray-900 overflow-hidden relative"
          >
            {thumb.type === "youtube" && thumb.youtubeId && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://img.youtube.com/vi/${thumb.youtubeId}/maxresdefault.jpg`}
                alt={thumb.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            {thumb.type === "prenatal" && (
              <Image
                src="/images/prenatal-thumb.png"
                alt="Prenatal"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                style={{ objectPosition: "center 15%" }}
              />
            )}
            {thumb.type === "placeholder" && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="relative font-[family-name:var(--font-display)] font-black text-white/70 text-xs tracking-widest uppercase text-center px-3 leading-tight">
                    {thumb.name}
                  </span>
                </div>
              </>
            )}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
          </a>
        ))}
      </div>
      <div className="p-5">
        <p className="text-[10px] tracking-widest uppercase text-[#0D41CB] mb-1">Format</p>
        <h3 className="font-[family-name:var(--font-display)] font-black text-2xl uppercase leading-tight text-[#111111]">
          {card.format}
        </h3>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{card.pitch}</p>
        <p className="text-xs text-gray-400 mt-3">Best for: {card.bestFor}</p>
        <a
          href={card.primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-[#0D41CB] hover:underline mt-4"
        >
          See examples &rarr;
        </a>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MediaKitPage() {
  return (
    <div className="bg-white text-[#111111] min-h-screen">
      {/* Light nav — scoped to this page, does NOT modify the main Nav component */}
      <LightNav />

      {/* ── 1. HERO (full-bleed, dark) ─────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-14">
        {/* TODO: Andrew drops media-kit-hero.jpg into /public/ — currently falls back to hero.jpg */}
        <Image
          src="/media-kit-hero-opt.jpg"
          alt=""
          fill
          priority
          className="object-cover object-[center_center] md:object-[40%_center]"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Headline */}
          <h1 className="font-[family-name:var(--font-display)] font-black text-6xl md:text-8xl text-white uppercase leading-none tracking-tight">
            The Dad Audience.
            <br />
            At Scale.
          </h1>

          {/* Stat pillars row */}
          <div className="mt-10 flex items-center justify-center">
            <div className="flex items-stretch gap-0">
              {[
                { num: "5M+", label: "FOLLOWERS" },
                { num: "89%", label: "MALE" },
                { num: "25–44", label: "AGE RANGE" },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-stretch">
                  {i > 0 && (
                    <div className="w-px bg-white/30 mx-6 self-stretch" />
                  )}
                  <div className="text-center">
                    <div className="font-[family-name:var(--font-display)] font-black text-5xl text-white leading-none">
                      {stat.num}
                    </div>
                    <div className="text-xs tracking-widest uppercase text-white/70 mt-1.5 font-[family-name:var(--font-display)]">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Separator */}
          <hr className="border-0 h-px bg-white/20 w-[120px] mx-auto mt-8" />

          {/* Identity */}
          <p className="font-[family-name:var(--font-display)] font-bold text-2xl text-white mt-6">
            Andrew Packer
          </p>
          <p className="font-[family-name:var(--font-body,var(--font-sans,Inter))] text-sm text-white/80 mt-1 tracking-wide">
            comedian &middot; content creator &middot; podcast host
          </p>

          {/* Badge */}
          <p className="font-[family-name:var(--font-display)] font-black text-sm uppercase text-white/80 tracking-tight mt-4">
            First Baby Due August 2026
          </p>

          {/* CTA */}
          <div className="mt-8">
            <a
              href={MAILTO_GENERAL}
              className="inline-block border border-white text-white text-sm tracking-widest uppercase px-8 py-3.5 hover:bg-white hover:text-[#111] transition-colors font-medium"
            >
              Let&apos;s Talk
            </a>
          </div>
        </div>
      </section>

      {/* Sticky in-page nav */}
      <InPageNav />

      {/* ── 2. AS SEEN IN (warm cream) ────────────────────────────────────── */}
      <section className="py-14 px-6" style={{ backgroundColor: "#F5F0EB" }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs tracking-widest uppercase text-gray-500 mb-6">As Seen In</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14">
            {PRESS_LOGOS.map((logo) => (
              <div key={logo.name} className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/press/${logo.file}`}
                  alt={logo.name}
                  className={`${logo.cls} grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300`}
                />
                <span className="text-xs text-gray-400">{logo.year}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. AUDIENCE + STATS (full-bleed dark) ────────────────────────── */}
      <section id="audience" className="relative py-20 px-6 overflow-hidden">
        {/* Background: hero.jpg with dark overlay */}
        <div
          className="mk-stats-bg absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/75" />

        <div id="stats" className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center">
            <SectionHeader
              title="The Numbers"
              subtitle="Audience &amp; Reach"
              light
            />
          </div>

          {/* Lead stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="font-[family-name:var(--font-display)] font-black text-7xl md:text-8xl text-white leading-none">10M+</div>
              <p className="text-sm text-white/60 mt-2 tracking-wide uppercase">YouTube views / 90 days</p>
              <p className="text-xs text-white/40 mt-1">81% from non-subscribers</p>
            </div>
            <div className="text-center">
              <div className="font-[family-name:var(--font-display)] font-black text-7xl md:text-8xl text-white leading-none">32M+</div>
              <p className="text-sm text-white/60 mt-2 tracking-wide uppercase">Facebook views / 90 days</p>
            </div>
          </div>

          <hr className="border-0 h-px bg-white/20 w-48 mx-auto my-8" />

          {/* Platform grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {PLATFORM_STATS.map((stat) => {
              const url = SOCIAL_URLS[stat.platform];
              const inner = (
                <>
                  <div className="font-[family-name:var(--font-display)] font-black text-5xl text-white leading-none">
                    {stat.count}
                  </div>
                  <div className="text-xs tracking-widest uppercase text-white/60 mt-2 group-hover:underline underline-offset-2">
                    {stat.platform}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
                </>
              );
              return url ? (
                <a
                  key={stat.platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center group"
                >
                  {inner}
                </a>
              ) : (
                <div key={stat.platform} className="text-center">
                  {inner}
                </div>
              );
            })}
          </div>

          <hr className="border-0 h-px bg-white/20 w-48 mx-auto my-8" />

          {/* Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { num: "89%", label: "MALE" },
              { num: "25–44", label: "AGE RANGE" },
              { num: "US · CA · UK · AU", label: "TOP MARKETS" },
            ].map((d) => (
              <div key={d.label}>
                <div className="font-[family-name:var(--font-display)] font-black text-3xl text-white leading-none">
                  {d.num}
                </div>
                <div className="text-xs tracking-widest uppercase text-white/60 mt-2">{d.label}</div>
              </div>
            ))}
          </div>

          {/* Positioning line */}
          <p className="mt-10 text-center text-sm italic text-white/60 max-w-2xl mx-auto leading-relaxed">
            &ldquo;Baby marketing is saturated with mom-focused creators. Dads co-research and co-decide on big-ticket gear — and almost nobody is marketing to them. This is that audience, at scale.&rdquo;
          </p>
        </div>
      </section>

      {/* ── 4. WHY DADS, WHY NOW (white) ──────────────────────────────────── */}
      <section id="opportunity" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title="Why Dads, Why Now" subtitle="The Marketing Opportunity" />
          <p className="max-w-2xl mx-auto text-center text-base text-gray-700 leading-relaxed">
            Dads co-decide on cars, electronics, baby gear, home furnishings, food delivery,
            insurance, finance, and alcohol. They&apos;re systematically under-targeted because
            most lifestyle creators at scale skew female. The few reaching men at scale are
            sports, finance, and news — not lifestyle and family. Andrew is the gap. And with
            his first baby due August 2026, he&apos;s building into this content arc at exactly
            the moment his audience hits peak buying age for everything in the parenting category.
          </p>
        </div>
      </section>

      {/* ── 5. ENGAGEMENT PROOF (warm cream) ─────────────────────────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: "#F5F0EB" }}>
        <div className="max-w-5xl mx-auto">
          <SectionHeader title="Engagement" subtitle="What the Audience Actually Does" />

          <p className="italic text-sm text-gray-500 mb-8 text-center">
            Reach is how many people could see it. Engagement is what they do with it.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                platform: "TikTok",
                num: "7.5%",
                label: "Engagement Rate",
                note: "Industry benchmark: 3–5%",
              },
              {
                platform: "Instagram",
                num: "5.9%",
                label: "Engagement Rate",
                note: "Content travels beyond existing audience",
              },
              {
                platform: "YouTube",
                num: "81%",
                label: "Non-Subscriber Views",
                note: "Audience is growing, not just loyal",
              },
            ].map((e) => (
              <div
                key={e.platform}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">
                  {e.platform}
                </p>
                <div className="font-[family-name:var(--font-display)] font-black text-5xl text-[#0D41CB] leading-none">
                  {e.num}
                </div>
                <p className="text-sm font-semibold text-[#111111] mt-2">{e.label}</p>
                <p className="text-xs text-gray-400 mt-1">{e.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. BRAND SAFETY (white) ───────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center flex flex-col gap-4">
          <p className="text-sm italic text-gray-600 leading-relaxed">
            &ldquo;Every partner listed below ran their integration through their own legal and brand
            safety review — Nissan, Paramount+, and Optimum included.&rdquo;
          </p>
          <p className="text-sm italic text-gray-600 leading-relaxed">
            &ldquo;Andrew&apos;s branded content is observational and family-safe. No politics. No
            controversy. Full script and final-cut review on every integration. Andrew only
            partners with products he&apos;d genuinely use.&rdquo;
          </p>
        </div>
      </section>

      {/* ── 7. BRAND WORK (white) ─────────────────────────────────────────── */}
      <section id="brand-work" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title="Brand Work" subtitle="A Portfolio of Sponsored Content" />

          {/* 4-across desktop, 2-across mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {BRAND_GRID.map((item, i) => (
              <BrandCard key={i} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. PRENATAL (full-bleed brand blue) ───────────────────────────── */}
      <section
        id="prenatal"
        className="py-20 px-6"
        style={{ backgroundColor: "#0D41CB" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <SectionHeader
              title="Prenatal"
              subtitle="A Comedy Special About What to Expect When You're Expecting"
              light
            />
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <p className="text-white text-base leading-relaxed mb-8">
              Andrew&apos;s third comedy special launches in 2026, built entirely around the
              experience of becoming a dad for the first time. This is a rare opportunity to
              integrate a brand into original long-form comedy content at the exact life moment
              the audience is actively living through.
            </p>

            <hr className="border-0 h-px bg-white/20 w-32 mx-auto mb-8" />

            <p className="text-xs tracking-widest uppercase text-white/60 mb-4">
              Why specials outperform posts
            </p>
            <p className="text-white/90 text-base leading-relaxed mb-6">
              Comedy specials accumulate views indefinitely. Andrew&apos;s previous special
              &ldquo;On Guard&rdquo; has 190,000 YouTube views and 10M+ combined clip views
              across platforms — with no paid promotion. A brand integration inside
              &ldquo;Prenatal&rdquo; reaches millions of dads in a format they&apos;ll return
              to and share, not scroll past.
            </p>

            <p className="text-white/70 text-sm italic mb-8">
              Brand integrations are woven into the narrative — not ad breaks. Limited
              availability.
            </p>

            <a
              href={MAILTO_PRENATAL}
              className="inline-block border border-white text-white text-sm tracking-widest uppercase px-8 py-3.5 hover:bg-white hover:text-[#0D41CB] transition-colors font-medium"
            >
              Discuss Integration &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── 9. CONTENT (warm cream) ──────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: "#F5F0EB" }}>
        <div className="max-w-5xl mx-auto">

          {/* Part A: Content Formats */}
          <SectionHeader title="Content Formats" subtitle="Brand Integration Opportunities" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {FORMAT_CARDS.map((card) => (
              <FormatCard key={card.format} card={card} />
            ))}
          </div>

          {/* Part B: Featured Projects */}
          <SectionHeader title="Featured Projects" subtitle="Production &amp; Press" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 1. Prenatal */}
            <a href="#prenatal" className="group block">
              <div className="aspect-video bg-gray-200 rounded-sm overflow-hidden">
                <Image
                  src="/images/prenatal-thumb.png"
                  alt="Prenatal"
                  width={300}
                  height={168}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ objectPosition: "center 15%" }}
                />
              </div>
              <div className="mt-2 p-1">
                <p className="font-[family-name:var(--font-display)] font-black text-sm uppercase text-[#111111] leading-tight">
                  Prenatal
                </p>
                <p className="text-xs italic text-gray-500 mt-0.5">2026 · In production · Brand integration available</p>
              </div>
            </a>

            {/* 2. Never Call Her Crazy */}
            <a
              href="https://www.angel.com/watch/andrew-packer-never-call-her-crazy"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="aspect-video bg-gray-200 rounded-sm overflow-hidden">
                <Image
                  src="/images/never-call-her-crazy.png"
                  alt="Never Call Her Crazy"
                  width={300}
                  height={168}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="mt-2 p-1">
                <p className="font-[family-name:var(--font-display)] font-black text-sm uppercase text-[#111111] leading-tight">
                  Never Call Her Crazy
                </p>
                <p className="text-xs italic text-gray-500 mt-0.5">2026 · Angel Studios</p>
              </div>
            </a>

            {/* 3. On Guard */}
            <a
              href="https://www.youtube.com/watch?v=wBo6-8DoiRU"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="aspect-video bg-gray-200 rounded-sm overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://img.youtube.com/vi/wBo6-8DoiRU/maxresdefault.jpg"
                  alt="On Guard"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="mt-2 p-1">
                <p className="font-[family-name:var(--font-display)] font-black text-sm uppercase text-[#111111] leading-tight">
                  On Guard
                </p>
                <p className="text-xs italic text-gray-500 mt-0.5">2023 · 190K YouTube views + 10M+ clip views</p>
              </div>
            </a>

            {/* 4. Laugh It Off */}
            <a
              href="https://pod.link/laughitoff"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="aspect-video bg-gray-200 rounded-sm overflow-hidden">
                <Image
                  src="/images/laugh-it-off-artwork.jpg"
                  alt="Laugh It Off"
                  width={300}
                  height={168}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="mt-2 p-1">
                <p className="font-[family-name:var(--font-display)] font-black text-sm uppercase text-[#111111] leading-tight">
                  Laugh It Off
                </p>
                <p className="text-xs italic text-gray-500 mt-0.5">Podcast · Group Therapy Comedy Show</p>
              </div>
            </a>

            {/* 5. Sauna Comedy */}
            <a
              href="https://nypost.com/2025/11/12/health/inside-a-comedy-show-in-a-sauna-and-why-its-great-for-health/"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="aspect-video bg-gray-200 rounded-sm overflow-hidden">
                <SaunaPlaceholder />
              </div>
              <div className="mt-2 p-1">
                <p className="font-[family-name:var(--font-display)] font-black text-sm uppercase text-[#111111] leading-tight">
                  Sauna Comedy
                </p>
                <p className="text-xs italic text-gray-500 mt-0.5">Original live format · Creator &amp; host</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Photo: McKenzie Beard / N.Y. Post</p>
              </div>
            </a>
          </div>

        </div>
      </section>

      {/* ── 10. PACKAGES (white) ──────────────────────────────────────────── */}
      <section id="packages" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title="Packages" subtitle="Three Ways to Work Together" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PackageCard
              title="Short-Form Campaign"
              category="Brand Awareness &amp; Conversion"
              items={[
                "Brand-integrated sketch or Man News episode",
                "Cross-posted to TikTok + Instagram Reels",
                "60-second format",
                "3-month organic window",
                "UTM / promo code tracking available",
                "Typical campaign: 1–3 pieces",
              ]}
              mailto={MAILTO_SHORTFORM}
            />
            <PackageCard
              title="Comedy Special Integration"
              category="Prenatal — 2026 · Perpetual Reach"
              items={[
                "Brand woven into \"Prenatal\" narrative",
                "Not an ad break — part of the show",
                "Perpetual organic reach",
                "On Guard precedent: 190K YouTube + 10M+ clips",
                "Full creative collaboration",
                "Script & final cut review included",
                "Limited slots for 2026",
              ]}
              mailto={MAILTO_PRENATAL}
            />
            <PackageCard
              title="Podcast Sponsorship"
              category="Wellness &amp; Therapy Brands"
              items={[
                "Host-read on Laugh It Off",
                "Group Therapy Comedy Show",
                "Audience engaged in mental health & wellness",
                "High-intent, targeted listeners",
                "Exclusively for wellness-aligned brands",
              ]}
              mailto={MAILTO_PODCAST}
            />
          </div>

          <p className="text-center italic text-sm text-gray-500 mt-8">
            Tiers can be combined. Pricing on request.
          </p>
        </div>
      </section>

      {/* ── 11. HOW I WORK (warm cream) ───────────────────────────────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: "#F5F0EB" }}>
        <div className="max-w-5xl mx-auto">
          <SectionHeader title="How I Work" subtitle="Process &amp; Terms" />

          <div className="max-w-3xl">
            {HOW_I_WORK.map((row, i) => (
              <div key={row.label}>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-12 py-4">
                  <span className="font-semibold text-sm text-[#111111] sm:w-48 flex-shrink-0">
                    {row.label}
                  </span>
                  <span className="text-sm text-gray-600">{row.value}</span>
                </div>
                {i < HOW_I_WORK.length - 1 && <hr className="border-gray-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. CONTACT (white) ───────────────────────────────────────────── */}
      <section id="contact" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title="Contact" subtitle="" />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-20">
            {/* Email */}
            <div className="text-center">
              {/* Envelope icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-[#0D41CB] mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              <p className="text-xs tracking-widest uppercase text-gray-400 mt-2">Get in Touch</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-lg font-semibold text-[#111111] hover:text-[#0D41CB] transition-colors mt-1 block"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            {/* Location */}
            <div className="text-center">
              {/* Pin icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-[#0D41CB] mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              <p className="text-xs tracking-widest uppercase text-gray-400 mt-2">Based In</p>
              <p className="text-lg font-semibold text-[#111111] mt-1">Toronto &middot; New York</p>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center justify-center gap-8 mt-10">
            {[
              {
                name: "TikTok",
                url: "https://www.tiktok.com/@andpacker",
                svg: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.85a8.16 8.16 0 004.77 1.53V6.93a4.85 4.85 0 01-1-.24z"/>
                  </svg>
                ),
              },
              {
                name: "YouTube",
                url: "https://www.youtube.com/@andpacker",
                svg: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.6 12 3.6 12 3.6s-7.54 0-9.38.45A3.02 3.02 0 00.5 6.19C.06 8.04 0 12 0 12s.06 3.96.5 5.81a3.02 3.02 0 002.12 2.14C4.46 20.4 12 20.4 12 20.4s7.54 0 9.38-.45a3.02 3.02 0 002.12-2.14C23.94 15.96 24 12 24 12s-.06-3.96-.5-5.81zM9.6 15.6V8.4l6.28 3.6-6.28 3.6z"/>
                  </svg>
                ),
              },
              {
                name: "Instagram",
                url: "https://www.instagram.com/andpacker/",
                svg: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                ),
              },
              {
                name: "Facebook",
                url: "https://www.facebook.com/andpacker",
                svg: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                ),
              },
            ].map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="text-[#0D41CB] hover:text-[#111111] transition-colors"
              >
                {s.svg}
              </a>
            ))}
          </div>

          {/* Copyable fallback */}
          <p className="text-center text-sm text-gray-400 mt-10">{CONTACT_EMAIL}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-[family-name:var(--font-display)] font-black uppercase tracking-widest text-[#111111] text-base">
            Andrew Packer
          </span>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Andrew Packer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Sauna Comedy image with onError fallback ─────────────────────────────────

function SaunaPlaceholder() {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <span className="font-[family-name:var(--font-display)] font-black text-white text-center px-4 text-sm uppercase tracking-widest leading-tight">
          Sauna Comedy
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/sauna-comedy.jpg"
      alt="Sauna Comedy"
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => setErrored(true)}
    />
  );
}
