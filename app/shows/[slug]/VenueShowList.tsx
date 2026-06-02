"use client"

import { useEffect } from "react"
import type { Show } from "@/lib/tour"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z")
  return {
    month: d
      .toLocaleString("en-US", { month: "short", timeZone: "UTC" })
      .toUpperCase(),
    day: d.toLocaleString("en-US", { day: "2-digit", timeZone: "UTC" }),
    year: d.toLocaleString("en-US", { year: "numeric", timeZone: "UTC" }),
  }
}

export default function VenueShowList({
  shows,
  venue,
}: {
  shows: Show[]
  venue: string
}) {
  useEffect(() => {
    window.fbq?.("track", "ViewContent", {
      content_name: venue,
      content_type: "venue",
    })
  }, [venue])

  return (
    <div className="divide-y divide-[#1a1a1a]">
      {shows.map((show, i) => {
        const d = formatDate(show.date)
        const isSoldOut = show.status === "sold_out"
        return (
          <div
            key={i}
            className="flex items-center gap-6 py-6 -mx-4 px-4 hover:bg-[#0f0f0f] transition-colors"
          >
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
              <div className="text-white font-semibold truncate">
                {show.city.split(",")[0]}
              </div>
              {show.time && (
                <div className="text-[#888] text-sm">{show.time}</div>
              )}
            </div>
            <div className="flex-shrink-0">
              {isSoldOut ? (
                <span className="inline-block bg-[#222] text-[#555] font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs px-5 py-2 cursor-not-allowed">
                  Sold Out
                </span>
              ) : (
                <a
                  href={show.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    window.fbq?.("trackCustom", "TicketClickOut", {
                      content_name: venue,
                      show_date: show.date,
                    })
                  }
                  className="inline-block font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs px-5 py-2 bg-[#0D41CB] hover:bg-[#0b35a8] text-white transition-colors"
                >
                  {show.status === "low_tickets" ? "Low Tickets" : "Get Tickets"}
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
