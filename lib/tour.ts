import raw from "@/data/tour-dates.json"

export interface Show {
  slug: string
  venue: string
  city: string
  country?: string
  date: string
  time?: string
  ticketUrl: string
  // coming_soon: announced, tickets not on sale yet. Its ticketUrl is the presale
  // page (https://andpacker.com/presale), never a ticket link; the site shows
  // Notify Me in place of Get Tickets (scripts/punchup-parse.js ticketState).
  // low_tickets: 80%+ sold on Andrew's own Eventbrite (set nightly by
  // scripts/eventbrite-status.js), or hand-set for a club show (STATUS_OVERRIDES in
  // scripts/scrape-tour-dates.js). Normal Get Tickets plus a yellow Low Tickets tag.
  status: "on_sale" | "low_tickets" | "sold_out" | "coming_soon"
  showType?:
    | "laugh_it_off"
    | "sauna_comedy"
    | "comedy_special_recording"
    | "day_care_comedy"
    | "new_material"
    | "standup"
}

export const tourDates = raw as Show[]
