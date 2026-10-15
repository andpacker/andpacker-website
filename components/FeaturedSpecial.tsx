"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// The special featured right under the hero. Swap this when a new special comes out.
// The YouTube player only loads after a click, so it costs nothing on page load.
const FEATURED = {
  title: "Never Call Her Crazy",
  youtubeId: "qC5NNRB5c6Q",
  year: "2026",
  // The thumbnail YouTube shows for the video (i.ytimg.com maxresdefault, 1280x720).
  poster: "/images/never-call-her-crazy-youtube.jpg",
  description:
    "Andrew's first clean comedy special. Put it on when family's over and not worry about who's in the room. Watch the whole thing free, right here.",
};

export default function FeaturedSpecial() {
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);

  // The poster button unmounts on play; hand keyboard focus to the player.
  useEffect(() => {
    if (playing) playerRef.current?.focus();
  }, [playing]);

  const play = () => {
    if (playing) return;
    setPlaying(true);
    window.fbq?.("trackCustom", "WatchSpecial", { content_name: FEATURED.title });
  };

  return (
    <section id="special" className="scroll-mt-8 pt-14 pb-16 px-6 bg-[#0A0A0A]">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,4rem)] leading-none tracking-tight text-white mb-8">
          Special
        </h2>

        <div className="relative aspect-video bg-[#141414] border border-white/10 overflow-hidden">
          {playing ? (
            <iframe
              ref={playerRef}
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${FEATURED.youtubeId}?autoplay=1&rel=0`}
              title={`${FEATURED.title} (full special)`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              onClick={play}
              aria-label={`Play ${FEATURED.title}`}
              className="group absolute inset-0 w-full h-full"
            >
              <Image
                src={FEATURED.poster}
                alt={`${FEATURED.title}, a stand-up special by Andrew Packer`}
                width={1280}
                height={720}
                sizes="(max-width: 1072px) calc(100vw - 48px), 1024px"
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors" />
              {/* Hover-only so it never sits on the poster title; WATCH NOW is the always-visible cue. */}
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                <span className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-[#0D41CB] group-hover:bg-[#0b35a8] group-hover:scale-105 transition flex items-center justify-center shadow-[0_8px_30px_rgb(0_0_0/0.45)]">
                  <svg className="w-7 h-7 md:w-10 md:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          )}
        </div>

        {!playing && (
          <div className="flex justify-center">
            <button
              onClick={play}
              className="flex items-center gap-3 bg-[#0D41CB] hover:bg-[#0b35a8] text-white font-[family-name:var(--font-display)] font-extrabold uppercase tracking-widest text-xl md:text-2xl px-10 md:px-14 py-3 md:py-4 transition-colors"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Now
            </button>
          </div>
        )}

        <div className={`${playing ? "mt-6" : "mt-5"} flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-8`}>
          <div className="max-w-2xl">
            <div className="text-[#0D41CB] text-xs tracking-widest uppercase mb-1">{FEATURED.year}</div>
            <h3 className="font-[family-name:var(--font-display)] font-bold text-white text-2xl md:text-3xl uppercase tracking-wide mb-2">
              {FEATURED.title}
            </h3>
            <p className="text-[#888] text-base leading-relaxed">{FEATURED.description}</p>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${FEATURED.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm tracking-widest uppercase text-[#888] hover:text-white transition-colors"
          >
            Watch on YouTube ↗
          </a>
        </div>
      </div>
    </section>
  );
}
