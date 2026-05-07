import tourDates from "@/data/tour-dates.json";

type ShowStatus = "on_sale" | "low_tickets" | "sold_out";

interface Show {
  date: string;
  city: string;
  venue: string;
  ticketUrl: string;
  status: ShowStatus;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return {
    month: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
    day: d.toLocaleString("en-US", { day: "2-digit", timeZone: "UTC" }),
    year: d.toLocaleString("en-US", { year: "numeric", timeZone: "UTC" }),
    weekday: d.toLocaleString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase(),
  };
}

function TicketButton({ status, url }: { status: ShowStatus; url: string }) {
  if (status === "sold_out") {
    return (
      <span className="inline-block bg-[#222] text-[#555] font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs px-5 py-2 cursor-not-allowed">
        Sold Out
      </span>
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
          : "bg-[#0D41CB] hover:bg-[#0b35a8] text-white"
      }`}
    >
      {isLow ? "Low Tickets" : "Get Tickets"}
    </a>
  );
}

export default function TourDates() {
  const shows = (tourDates as Show[]).filter(
    (s) => new Date(s.date + "T23:59:59Z") >= new Date()
  );

  return (
    <section id="tour" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,4rem)] leading-none tracking-tight text-white">
            Tour Dates
          </h2>
          <p className="text-[#555] text-xs tracking-widest uppercase hidden md:block">
            Updated daily from punchup.live
          </p>
        </div>

        {shows.length === 0 ? (
          <div className="border border-[#222] py-16 text-center">
            <p className="text-[#888] tracking-widest uppercase text-sm">
              No upcoming dates right now — check back soon.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {shows.map((show, i) => {
              const d = formatDate(show.date);
              return (
                <div
                  key={i}
                  className="flex items-center gap-6 py-6 group hover:bg-[#0f0f0f] transition-colors -mx-4 px-4"
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
                    <div className="text-white font-semibold truncate">{show.city}</div>
                    <div className="text-[#888] text-sm truncate">{show.venue}</div>
                  </div>

                  <div className="flex-shrink-0">
                    <TicketButton status={show.status} url={show.ticketUrl} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
