import type { Show } from "@/lib/tour"

type ShowType = NonNullable<Show["showType"]>

type BadgeSpec = {
  /** Label shown at every breakpoint (and below `md` when `long` is set). */
  short: string
  /** Optional longer label swapped in at `md` and up. */
  long?: string
  /**
   * Tailwind classes, stored as COMPLETE strings on purpose. The JIT scanner reads
   * source text, so an interpolated `text-[${hex}]` would never be emitted.
   */
  text: string
  border: string
  ring: string
  /** Overrides the default tracking/size when a label needs to fit tighter. */
  size?: string
}

const DEFAULT_SIZE = "tracking-widest text-[10px]"
// For a label long enough that the default size would wrap or overflow on mobile.
const TIGHT_SIZE = "whitespace-nowrap tracking-wide md:tracking-widest text-[8px] md:text-[10px]"

// A showType with no entry here renders no badge and no ring (e.g. "standup").
const BADGES: Partial<Record<ShowType, BadgeSpec>> = {
  laugh_it_off: {
    short: "Laugh It Off",
    long: "Laugh It Off – Group Therapy Comedy Show",
    text: "text-[#FBBF24]",
    border: "border-[#FBBF24]",
    ring: "ring-[#FBBF24]",
  },
  sauna_comedy: {
    short: "Sauna Comedy",
    text: "text-[#C4A882]",
    border: "border-[#C4A882]",
    ring: "ring-[#C4A882]",
  },
  comedy_special_recording: {
    short: "Comedy Special Recording",
    text: "text-[#FACC15]",
    border: "border-[#FACC15]",
    ring: "ring-[#FACC15]",
    size: TIGHT_SIZE,
  },
  day_care_comedy: {
    // The "bring the baby" beat exists because the title alone reads as kids'
    // comedy, which is the one thing this show is not. Andrew chose the md-gated
    // swap (short on mobile, full label from md up), matching how laugh_it_off
    // already behaves. To carry the beat at every breakpoint instead, drop `long`,
    // move its text into `short`, and add `size: TIGHT_SIZE`.
    short: "Day Care Comedy",
    long: "Day Care Comedy – Bring The Baby",
    text: "text-[#89CFF0]",
    border: "border-[#89CFF0]",
    ring: "ring-[#89CFF0]",
  },
  new_material: {
    short: "New Material Set",
    text: "text-[#4ADE80]",
    border: "border-[#4ADE80]",
    ring: "ring-[#4ADE80]",
  },
}

/** Ticket-button ring matching the badge color. Empty string for untyped shows. */
export function showTypeRing(showType?: Show["showType"]) {
  const spec = showType ? BADGES[showType] : undefined
  return spec ? ` ring-1 ${spec.ring} ring-offset-2 ring-offset-[#0A0A0A]` : ""
}

export default function ShowTypeBadge({ showType }: { showType?: Show["showType"] }) {
  const spec = showType ? BADGES[showType] : undefined
  if (!spec) return null

  return (
    <span
      className={`mt-1 inline-block font-[family-name:var(--font-display)] font-bold uppercase ${
        spec.size ?? DEFAULT_SIZE
      } ${spec.text} border ${spec.border} px-2 py-0.5`}
    >
      {spec.long ? (
        <>
          <span className="md:hidden">{spec.short}</span>
          <span className="hidden md:inline">{spec.long}</span>
        </>
      ) : (
        spec.short
      )}
    </span>
  )
}
