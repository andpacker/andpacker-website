"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SOCIALS, SocialIcon } from "@/lib/socials";

const NAV_SOCIALS = SOCIALS.filter((s) => s.inNav);

export default function Nav() {
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
        scrolled ? "bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#222]" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] font-bold text-xl tracking-widest text-white uppercase"
        >
          Andrew Packer
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#tour" className="text-sm tracking-widest uppercase text-[#888] hover:text-white transition-colors">
            Tour
          </Link>
          <Link href="#special" className="text-sm tracking-widest uppercase text-[#888] hover:text-white transition-colors">
            Watch
          </Link>
          <Link href="#jointhepack" className="text-sm tracking-widest uppercase text-[#888] hover:text-white transition-colors">
            Join the Pack
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {NAV_SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.ariaLabel}
                className="text-[#888] hover:text-white transition-colors"
              >
                <SocialIcon path={s.path} className="w-5 h-5" />
              </a>
            ))}
          </div>

          <button
            className="md:hidden text-white"
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
        <div className="md:hidden bg-[#0A0A0A] border-t border-[#222] px-6 py-6 flex flex-col gap-6">
          {[
            { label: "tour", href: "#tour" },
            { label: "watch", href: "#special" },
            { label: "Join the Pack", href: "#jointhepack" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-sm tracking-widest uppercase text-[#888] hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
          <div className="flex items-center gap-5 pt-2">
            {NAV_SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.ariaLabel}
                className="text-[#888] hover:text-white transition-colors"
              >
                <SocialIcon path={s.path} className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
