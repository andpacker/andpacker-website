"use client";

import { useState } from "react";

interface Special {
  title: string;
  year: string;
  youtubeId: string | null;
  angelUrl: string | null;
  description: string;
}

const SPECIALS: Special[] = [
  {
    title: "Never Call Her Crazy",
    year: "2023",
    youtubeId: null,
    angelUrl: "https://www.angel.com/shareandrewp",
    description: "Andrew Packer's debut comedy special — streaming now on Angel.",
  },
  {
    title: "On Guard",
    year: "2022",
    youtubeId: "wBo6-8DoiRU",
    angelUrl: null,
    description: "Andrew Packer live — watch the full special on YouTube.",
  },
];

function YouTubeModal({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl aspect-video"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors text-sm tracking-widest uppercase"
        >
          Close ✕
        </button>
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="Comedy Special"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default function Specials() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <section id="watch" className="py-24 px-6 bg-[#0A0A0A]">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,4rem)] leading-none tracking-tight text-white mb-12">
          Watch
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECIALS.map((special, i) => {
            const thumb = special.youtubeId
              ? `https://img.youtube.com/vi/${special.youtubeId}/maxresdefault.jpg`
              : null;

            return (
              <div key={i} className="group relative bg-[#141414] overflow-hidden">
                <div className="relative aspect-video bg-[#1a1a1a] overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={special.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[#333] text-4xl">▶</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

                  {special.youtubeId && (
                    <button
                      onClick={() => setActiveVideo(special.youtubeId)}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Watch ${special.title}`}
                    >
                      <div className="w-14 h-14 rounded-full bg-[#0D41CB] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </button>
                  )}
                </div>

                <div className="p-5">
                  <div className="text-[#0D41CB] text-xs tracking-widest uppercase mb-1">{special.year}</div>
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-white text-xl uppercase tracking-wide mb-2">
                    {special.title}
                  </h3>
                  <p className="text-[#888] text-sm leading-relaxed mb-4">{special.description}</p>

                  <div className="flex gap-3 flex-wrap">
                    {special.youtubeId && (
                      <button
                        onClick={() => setActiveVideo(special.youtubeId)}
                        className="flex items-center gap-2 text-xs text-white bg-[#FF0000] px-3 py-1.5 hover:bg-[#cc0000] transition-colors font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        Watch on YouTube
                      </button>
                    )}
                    {special.angelUrl && (
                      <a
                        href={special.angelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-white bg-[#222] px-3 py-1.5 hover:bg-[#333] transition-colors font-medium"
                      >
                        Watch on Angel
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeVideo && (
        <YouTubeModal videoId={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </section>
  );
}
