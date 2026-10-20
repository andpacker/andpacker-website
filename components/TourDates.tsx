"use client";

import { useState } from "react";
import Image from "next/image";
import { tourDates, type Show } from "@/lib/tour";
import ShowTypeBadge, { SoldOutTag, showTypeRing } from "@/components/ShowTypeBadge";
import WaitlistForm from "@/components/WaitlistForm";

type ShowStatus = Show["status"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return {
    month: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
    day: d.toLocaleString("en-US", { day: "2-digit", timeZone: "UTC" }),
    year: d.toLocaleString("en-US", { year: "numeric", timeZone: "UTC" }),
    weekday: d.toLocaleString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase(),
  };
}

// One per show; a same-night double-header shares date + slug, so time is in it.
function showKey(show: Show) {
  return `${show.date}|${show.slug}|${show.time ?? ""}`;
}

function TicketButton({
  status,
  url,
  showType,
  waitlistOpen,
  onToggleWaitlist,
}: {
  status: ShowStatus;
  url: string;
  showType?: Show["showType"];
  waitlistOpen: boolean;
  onToggleWaitlist: () => void;
}) {
  if (status === "sold_out") {
    // An inset ring, not a border, so it is exactly the size of Get Tickets.
    return (
      <button
        type="button"
        onClick={onToggleWaitlist}
        aria-expanded={waitlistOpen}
        className="inline-block ring-1 ring-inset ring-white text-white hover:bg-white hover:text-black font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs px-5 py-2 transition-colors"
      >
        <span className="md:hidden">Waitlist</span>
        <span className="hidden md:inline">Join Waitlist</span>
      </button>
    );
  }

  const isLow = status === "low_tickets";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs px-5 py-2 transition-colors ${
        isLow
          ? "bg-amber-500 hover:bg-amber-400 text-black"
          : `bg-[#0D41CB] hover:bg-[#0b35a8] text-white${showTypeRing(showType)}`
      }`}
    >
      {isLow ? "Low Tickets" : "Get Tickets"}
    </a>
  );
}

export default function TourDates() {
  const [expanded, setExpanded] = useState(false);
  // The show whose waitlist form is open; one at a time.
  const [openWaitlist, setOpenWaitlist] = useState<string | null>(null);
  const PREVIEW_COUNT = 5;

  const upcomingShows = tourDates.filter(
    (s) => new Date(s.date + "T23:59:59Z") >= new Date()
  );
  const visibleShows = expanded ? upcomingShows : upcomingShows.slice(0, PREVIEW_COUNT);

  return (
    <section id="tour" className="pt-7 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,4rem)] leading-none tracking-tight text-white">
            Tour Dates
          </h2>
        </div>

        {upcomingShows.length === 0 ? (
          <div className="border border-[#222] py-16 text-center">
            <p className="text-[#888] tracking-widest uppercase text-sm">
              No upcoming dates right now. Check back soon.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {visibleShows.map((show, i) => {
              const d = formatDate(show.date);
              const key = showKey(show);
              const waitlistOpen = openWaitlist === key;
              return (
                <div
                  key={i}
                  className="py-6 group hover:bg-[#0f0f0f] transition-colors -mx-4 px-4"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 text-center flex-shrink-0">
                      <div className="text-[#0D41CB] font-[family-name:var(--font-display)] font-bold text-xs tracking-widest">
                        {d.month}
                      </div>
                      <div className="text-white font-[family-name:var(--font-display)] font-extrabold text-3xl leading-none">
                        {d.day}
                      </div>
                      <div className="text-[#555] text-xs">{d.year}</div>
                    </div>
  
                    <div className="h-10 w-px bg-[#222] flex-shrink-0" />
  
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">{show.city}</div>
                      <div className="flex items-center gap-1.5 text-[#888] text-sm min-w-0">
                        <span className="truncate">{show.venue}</span>
                        {show.time && <span className="flex-shrink-0">– {show.time}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-1.5">
                        <ShowTypeBadge showType={show.showType} />
                        {show.status === "sold_out" && <SoldOutTag />}
                      </div>
                    </div>
  
                    <div className="flex-shrink-0">
                      <TicketButton
                        status={show.status}
                        url={show.ticketUrl}
                        showType={show.showType}
                        waitlistOpen={waitlistOpen}
                        onToggleWaitlist={() => setOpenWaitlist(waitlistOpen ? null : key)}
                      />
                    </div>
                  </div>
                  {waitlistOpen && <WaitlistForm show={show} />}
                </div>
              );
            })}
          </div>
        )}

        {upcomingShows.length > PREVIEW_COUNT && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-block font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs px-8 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors"
            >
              {expanded ? "Show Less ↑" : "See All Upcoming Shows ↓"}
            </button>
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Image
            src="/birth-plan-tour-poster.jpg"
            alt="Andrew Packer Birth Plan Tour poster, listing the tour dates and cities including November 18 in Boston, January 20 in Chicago and January 22 to 23 in Minneapolis"
            width={1080}
            height={1350}
            sizes="(max-width: 624px) calc(100vw - 48px), 576px"
            className="h-auto w-full max-w-xl"
          />
        </div>
      </div>
    </section>
  );
}
