"use client"

import { useEffect, useState } from "react"
import type { Show } from "@/lib/tour"
import { SoldOutTag, showTypeRing } from "@/components/ShowTypeBadge"
import WaitlistForm from "@/components/WaitlistForm"
import { cardWhen, ticketSite, type ShowGroup } from "./showDetails"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

// A sold-out date: Join Waitlist in place of Get Tickets, opening the form below.
function WaitlistButton({ show }: { show: Show }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-center ring-1 ring-inset ring-white text-white hover:bg-white hover:text-black font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm transition-colors"
      >
        Join Waitlist
      </button>
      {open && <WaitlistForm show={show} />}
    </>
  )
}

// Which show a ticket click was for. One venue can run two shows a day (Top
// Secret NY on Nov 8: Day Care Comedy at 2 PM, Laugh It Off at 6:30 PM), and
// content_name is the venue for both. The event names and content_name stay
// exactly as they were: the branch B ad sets optimize on this AddToCart.
function showParams(show: Show) {
  return {
    content_category: show.showType ?? "standup",
    ...(show.time ? { show_time: show.time } : {}),
  }
}

/**
 * Get Tickets for one date, firing TicketClickOut + AddToCart on click. `venue`
 * is the raw venue string from tour-dates.json; the pixel events key on it, so
 * keep it raw.
 */
export function TicketButton({ show, venue }: { show: Show; venue: string }) {
  if (show.status === "sold_out") return <WaitlistButton show={show} />
  return (
    <a
      href={show.ticketUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        window.fbq?.("trackCustom", "TicketClickOut", {
          content_name: venue,
          show_date: show.date,
          ...showParams(show),
        })
        window.fbq?.("track", "AddToCart", {
          content_name: venue,
          content_type: "product",
          show_date: show.date,
          ...showParams(show),
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

/** The venue's ViewContent event, once per page view. Renders nothing. */
export function ViewContentPixel({ venue }: { venue: string }) {
  useEffect(() => {
    window.fbq?.("track", "ViewContent", {
      content_name: venue,
      content_type: "venue",
    })
  }, [venue])
  return null
}

/**
 * Every date of one show type, each with its own ticket button, then where the
 * tickets are sold: one line for the whole list when every date sells on the
 * same site, otherwise a line under each button.
 */
export function TicketList({
  group,
  venue,
  thisYear,
  showWhen = true,
}: {
  group: ShowGroup
  venue: string
  thisYear: string
  /** The date line above each button. Off when the page heading already says it. */
  showWhen?: boolean
}) {
  const oneSite = group.ticketSites.length === 1
  return (
    <>
      <ul className="mt-6 space-y-6">
        {group.shows.map((show, i) => {
          const site = oneSite ? null : ticketSite(show.ticketUrl)
          return (
            <li key={i}>
              {showWhen && (
                <p className="mb-2 text-lg font-semibold">
                  {cardWhen(show, thisYear)}
                  {show.status === "sold_out" && (
                    <span className="ml-2 align-middle">
                      <SoldOutTag />
                    </span>
                  )}
                </p>
              )}
              <TicketButton show={show} venue={venue} />
              {site && <Disclosure site={site} />}
            </li>
          )
        })}
      </ul>
      {oneSite && <Disclosure site={group.ticketSites[0]} />}
    </>
  )
}

/** One show type's card: what the show is, then its dates and ticket buttons. */
export function ShowCard({
  group,
  venue,
  thisYear,
  hideNotes = [],
  showFacts = true,
}: {
  group: ShowGroup
  venue: string
  thisYear: string
  hideNotes?: string[]
  /** The price and length line. */
  showFacts?: boolean
}) {
  const facts = showFacts
    ? [group.price, group.length].filter(Boolean).join(" · ")
    : ""
  const notes = (group.notes ?? []).filter((n) => !hideNotes.includes(n))
  return (
    <section className="border border-[#222] bg-[#111] p-5 sm:p-8">
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
      <TicketList group={group} venue={venue} thisYear={thisYear} />
    </section>
  )
}

/**
 * One card per show type, in the order the shows appear. `venue` is the raw
 * venue string from tour-dates.json; the pixel events key on it, so keep it raw.
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
  return (
    <div className="space-y-6">
      <ViewContentPixel venue={venue} />
      {groups.map((group) => (
        <ShowCard
          key={group.key}
          group={group}
          venue={venue}
          thisYear={thisYear}
          hideNotes={hideNotes}
        />
      ))}
    </div>
  )
}
