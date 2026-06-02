import raw from "@/data/tour-dates.json"

export interface Show {
  slug: string
  venue: string
  city: string
  country?: string
  date: string
  time?: string
  ticketUrl: string
  status: "on_sale" | "low_tickets" | "sold_out"
  showType?: "laugh_it_off" | "sauna_comedy" | "comedy_special_recording" | "standup"
}

export const tourDates = raw as Show[]
