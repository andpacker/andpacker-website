"use client";

import { useState } from "react";

interface Special {
  title: string;
  year: string;
  youtubeId: string | null;
  angelUrl: string | null;
  description: string;
  image?: string | null;
  playlistUrl?: string | null;
  listenLinks?: { platform: string; url: string; color: string; icon: 'spotify' | 'apple' | 'podlink' }[];
}

const SPECIALS: Special[] = [
  {
    title: "Never Call Her Crazy",
    year: "2026",
    youtubeId: null,
    angelUrl: "https://www.angel.com/shareandrewp",
    description: "Andrew's first clean comedy special — safe for the whole family. Streaming now on Angel.",
    image: "/images/never-call-her-crazy.png",
  },
  {
    title: "On Guard",
    year: "2023",
    youtubeId: "wBo6-8DoiRU",
    angelUrl: null,
    description: "Andrew Packer's debut comedy special — streaming now on YouTube.",
  },
  {
    title: "Laugh It Off w/ Andrew Packer",
    year: "Podcast",
    youtubeId: null,
    angelUrl: null,
    description: "A group therapy comedy show hosted by a therapist and his comedian son.",
    image: "/images/laugh-it-off-artwork.jpg",
    playlistUrl: "https://youtube.com/playlist?list=PLekDw2qplsR74ehfNP5Ce9EaHcCTHF90k",
    listenLinks: [
      { platform: "Spotify", url: "https://open.spotify.com/show/45GCMsEKtagVf9C9JmjGSb", color: "#1DB954", icon: "spotify" },
      { platform: "Apple Podcasts", url: "https://podcasts.apple.com/us/podcast/id1800539752", color: "#9933CC", icon: "apple" },
      { platform: "All Platforms", url: "https://pod.link/1800539752", color: "#333", icon: "podlink" },
    ],
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

function SpotifyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
  );
}

function PodlinkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

export default function Specials() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <section id="watch" className="py-24 px-6 bg-[#0A0A0A]">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,4rem)] leading-none tracking-tight text-white mb-12">
          Watch & Listen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECIALS.map((special, i) => {
            const thumb = special.youtubeId
              ? `https://img.youtube.com/vi/${special.youtubeId}/maxresdefault.jpg`
              : special.image ?? null;
            const imageLink = special.angelUrl ?? special.playlistUrl ?? null;

            const imageArea = (
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
            );

            return (
              <div key={i} className="group relative bg-[#141414] overflow-hidden">
                {imageLink ? (
                  <a href={imageLink} target="_blank" rel="noopener noreferrer" className="block">
                    {imageArea}
                  </a>
                ) : (
                  imageArea
                )}

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
                    {special.playlistUrl && (
                      <a
                        href={special.playlistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-white bg-[#FF0000] px-3 py-1.5 hover:bg-[#cc0000] transition-colors font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        Watch on YouTube
                      </a>
                    )}
                    {special.listenLinks?.map((link) => (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-white px-3 py-1.5 transition-opacity hover:opacity-80 font-medium"
                        style={{ backgroundColor: link.color }}
                      >
                        {link.icon === 'spotify' && <SpotifyIcon />}
                        {link.icon === 'apple' && <AppleIcon />}
                        {link.icon === 'podlink' && <PodlinkIcon />}
                        {link.platform}
                      </a>
                    ))}
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
