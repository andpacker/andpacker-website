"use client"

import { useEffect } from "react"
import type { Show } from "@/lib/tour"
import { showTypeRing } from "@/components/ShowTypeBadge"
import { cardWhen, ticketSite, type ShowGroup } from "./showDetails"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

function TicketButton({ show, venue }: { show: Show; venue: string }) {
  if (show.status === "sold_out") {
    return (
      <span className="flex min-h-12 w-full items-center justify-center bg-[#222] text-[#555] font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm cursor-not-allowed">
        Sold Out
      </span>
    )
  }
  return (
    <a
      href={show.ticketUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        window.fbq?.("trackCustom", "TicketClickOut", {
          content_name: venue,
          show_date: show.date,
        })
        window.fbq?.("track", "AddToCart", {
          content_name: venue,
          content_type: "product",
          show_date: show.date,
        })
      }}
      className={`flex min-h-12 w-full items-center justify-center font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm bg-[#0D41CB] hover:bg-[#0b35a8] text-white transition-colors${showTypeRing(
        show.showType
      )}`}
    >
      {show.status === "low_tickets" ? "Low Tickets" : "Get Tickets"}
    </a>
  )
}

function Disclosure({ site }: { site: string }) {
  return (
    <p className="mt-3 text-sm text-[#888]">
      {`You'll buy tickets on ${site}.`}
    </p>
  )
}

/**
 * One card per show type: what the show is, then every date with its own
 * ticket button, then where the tickets are sold. `venue` is the raw venue
 * string from tour-dates.json; the pixel events below key on it, so keep it raw.
 */
export default function VenueShowList({
  groups,
  venue,
  thisYear,
  hideNotes = [],
}: {
  groups: ShowGroup[]
  venue: string
  /** "2026". Dates in any other year print their year. */
  thisYear: string
  /** Notes shown once in the page's venue section, left off the cards. */
  hideNotes?: string[]
}) {
  useEffect(() => {
    window.fbq?.("track", "ViewContent", {
      content_name: venue,
      content_type: "venue",
    })
  }, [venue])

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const facts = [group.price, group.length].filter(Boolean).join(" · ")
        const notes = (group.notes ?? []).filter((n) => !hideNotes.includes(n))
        // One line for the whole card when every date sells on the same site,
        // otherwise a line under each button.
        const oneSite = group.ticketSites.length === 1
        return (
          <section
            key={group.key}
            className="border border-[#222] bg-[#111] p-5 sm:p-8"
          >
            <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-3xl leading-none tracking-tight">
              {group.name}
            </h2>
            {group.tagline && (
              <p className="mt-2 font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs text-[#888]">
                {group.tagline}
              </p>
            )}
            <p className="mt-4 leading-relaxed">{group.description}</p>
            {facts && <p className="mt-3 text-sm text-[#888]">{facts}</p>}
            {notes.length > 0 && (
              <p className="mt-1 text-sm text-[#888]">{notes.join(" ")}</p>
            )}
            <ul className="mt-6 space-y-6">
              {group.shows.map((show, i) => {
                const site = oneSite ? null : ticketSite(show.ticketUrl)
                return (
                  <li key={i}>
                    <p className="mb-2 text-lg font-semibold">
                      {cardWhen(show, thisYear)}
                    </p>
                    <TicketButton show={show} venue={venue} />
                    {site && <Disclosure site={site} />}
                  </li>
                )
              })}
            </ul>
            {oneSite && <Disclosure site={group.ticketSites[0]} />}
          </section>
        )
      })}
    </div>
  )
}
