"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CITIES, VALID_CITIES } from "@/lib/cities"
import { CONSENT_TEXT, GENERIC_ERROR, OTHER_CITY } from "@/lib/dayCareWaitlist"

// Day Care Comedy 2027 first-access form: email + the city someone would attend.
// Posts to /api/daycare-waitlist, which only answers success once Kit has the
// person active with all their tags. Nothing here depends on the Meta pixel:
// the Lead event fires after a confirmed sign-up, and only if the pixel loaded.

const OTHER_LABEL = "Other / nearby city"
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

type Option = { value: string; label: string; group?: string }

/** True when any word of the city starts with the query ("tor" -> Toronto, "york" -> New York). */
function startsAWord(city: string, q: string): boolean {
  const c = city.toLowerCase()
  return c.startsWith(q) || c.split(/[\s,.()-]+/).some((w) => w.startsWith(q))
}

function trackLead() {
  const w = window as unknown as { fbq?: (...args: unknown[]) => void }
  if (typeof w.fbq !== "function") return
  try {
    w.fbq("track", "Lead", { content_name: "Day Care Comedy 2027 Waitlist" })
  } catch {
    // An ad blocker or a broken pixel must never affect the sign-up.
  }
}

export default function DayCareWaitlistForm() {
  const [email, setEmail] = useState("")
  const [cityInput, setCityInput] = useState("")
  const [city, setCity] = useState("")
  const [otherCity, setOtherCity] = useState("")
  const [hp, setHp] = useState("") // honeypot
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [errors, setErrors] = useState<{ email?: string; city?: string; other?: string }>({})
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [formError, setFormError] = useState("")
  const [joinedCity, setJoinedCity] = useState("")

  const boxRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  // Filtered cities, flattened for keyboard navigation. "Other" is always last.
  const options = useMemo<Option[]>(() => {
    const q = cityInput.trim().toLowerCase()
    const showAll = !q || cityInput === OTHER_LABEL || VALID_CITIES.has(cityInput)
    const list: Option[] = []
    for (const g of CITIES) {
      for (const c of g.cities) {
        if (showAll || startsAWord(c, q)) {
          list.push({ value: c, label: c, group: g.group })
        }
      }
    }
    list.push({ value: OTHER_CITY, label: OTHER_LABEL })
    return list
  }, [cityInput])

  useEffect(() => {
    function onOutside(e: MouseEvent | TouchEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    document.addEventListener("touchstart", onOutside)
    return () => {
      document.removeEventListener("mousedown", onOutside)
      document.removeEventListener("touchstart", onOutside)
    }
  }, [])

  useEffect(() => {
    if (status === "success") successRef.current?.focus()
  }, [status])

  useEffect(() => {
    if (active < 0 || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${active}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [active])

  function choose(opt: Option) {
    setCity(opt.value)
    setCityInput(opt.label)
    setOpen(false)
    setActive(-1)
    setErrors((e) => ({ ...e, city: undefined }))
  }

  function onCityKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && open && active >= 0) {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")

    const next: typeof errors = {}
    const cleanEmail = email.trim()
    if (!EMAIL_RE.test(cleanEmail)) next.email = "Enter a valid email address."
    if (!city) next.city = "Choose a city from the list, or pick Other."
    if (city === OTHER_CITY && otherCity.trim().length < 2) {
      next.other = "Type the city you'd attend."
    }
    setErrors(next)
    if (Object.keys(next).length) return

    const params = new URLSearchParams(window.location.search)
    const payload: Record<string, string> = {
      email: cleanEmail,
      city,
      dcc_hp: hp,
      referrer: document.referrer,
    }
    if (city === OTHER_CITY) payload.otherCity = otherCity.trim()
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const v = params.get(key)
      if (v) payload[key] = v
    }

    setStatus("loading")
    try {
      const res = await fetch("/api/daycare-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success && typeof data.city === "string") {
        setJoinedCity(data.city)
        setStatus("success")
        trackLead()
      } else {
        setFormError(typeof data.error === "string" ? data.error : GENERIC_ERROR)
        setStatus("error")
      }
    } catch {
      setFormError("Connection problem. Check your signal and try again.")
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="outline-none py-8 text-center">
        <p className="text-white font-[family-name:var(--font-display)] font-bold text-2xl uppercase tracking-wide">
          You&apos;re on the list for {joinedCity}.
        </p>
        <p className="text-white/70 mt-2">
          You&apos;ll get first access to tickets before they go on sale to the public.
        </p>
      </div>
    )
  }

  const inputClass =
    "w-full bg-white/10 border border-white/30 text-white placeholder-white/50 px-5 py-4 outline-none focus:border-white transition-colors text-base"
  const labelClass = "block text-left text-sm font-semibold text-white mb-1.5"
  const errorClass = "mt-1.5 text-left text-sm text-red-300"

  let lastGroup: string | undefined

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 max-w-md mx-auto text-left">
      <div>
        <label htmlFor="dcc-email" className={labelClass}>
          Email address
        </label>
        <input
          id="dcc-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrors((x) => ({ ...x, email: undefined }))
          }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "dcc-email-error" : undefined}
          className={inputClass}
        />
        {errors.email && (
          <p id="dcc-email-error" role="alert" className={errorClass}>
            {errors.email}
          </p>
        )}
      </div>

      <div ref={boxRef} className="relative">
        <label htmlFor="dcc-city" className={labelClass}>
          Which city would you attend?
        </label>
        <input
          id="dcc-city"
          name="city"
          type="text"
          role="combobox"
          autoComplete="off"
          placeholder="Start typing a city"
          aria-expanded={open}
          aria-controls={open ? "dcc-city-list" : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `dcc-opt-${active}` : undefined}
          aria-invalid={Boolean(errors.city)}
          aria-describedby={errors.city ? "dcc-city-error" : undefined}
          value={cityInput}
          onChange={(e) => {
            setCityInput(e.target.value)
            setCity("")
            setOpen(true)
            setActive(-1)
            setErrors((x) => ({ ...x, city: undefined, other: undefined }))
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onCityKey}
          className={inputClass}
        />
        {open && (
          <ul
            id="dcc-city-list"
            ref={listRef}
            role="listbox"
            aria-label="Cities"
            className="absolute left-0 right-0 top-full z-30 max-h-[40vh] overflow-y-auto bg-[#0b35a8] border border-t-0 border-white/30 shadow-lg"
          >
            {options.map((opt, i) => {
              const heading =
                opt.group && opt.group !== lastGroup ? (lastGroup = opt.group) : null
              const isOther = opt.value === OTHER_CITY
              return (
                <li key={opt.value} role="presentation">
                  {heading && (
                    <div className="px-4 pt-2 pb-1 text-xs uppercase tracking-widest text-white/40 select-none">
                      {heading}
                    </div>
                  )}
                  <div
                    id={`dcc-opt-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={city === opt.value}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      choose(opt)
                    }}
                    className={`px-5 py-3 text-base text-white cursor-pointer ${
                      i === active ? "bg-white/20" : "hover:bg-white/10"
                    } ${isOther ? "border-t border-white/20 font-semibold" : ""}`}
                  >
                    {opt.label}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {errors.city && (
          <p id="dcc-city-error" role="alert" className={errorClass}>
            {errors.city}
          </p>
        )}
      </div>

      {city === OTHER_CITY && (
        <div>
          <label htmlFor="dcc-other" className={labelClass}>
            Your city
          </label>
          <input
            id="dcc-other"
            name="otherCity"
            type="text"
            autoComplete="address-level2"
            maxLength={80}
            value={otherCity}
            onChange={(e) => {
              setOtherCity(e.target.value)
              setErrors((x) => ({ ...x, other: undefined }))
            }}
            aria-invalid={Boolean(errors.other)}
            aria-describedby={errors.other ? "dcc-other-error" : undefined}
            className={inputClass}
          />
          {errors.other && (
            <p id="dcc-other-error" role="alert" className={errorClass}>
              {errors.other}
            </p>
          )}
        </div>
      )}

      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="dcc-hp">Leave this empty</label>
        <input
          id="dcc-hp"
          name="dcc_hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />
      </div>

      {status === "error" && formError && (
        <p role="alert" className="text-white/80 text-sm bg-white/10 px-4 py-3 text-left">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-white text-[#0D41CB] hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm px-8 py-4 transition-colors"
      >
        {status === "loading" ? "Saving..." : "Get First Access"}
      </button>

      <p className="text-xs leading-relaxed text-white/50 text-center">
        {CONSENT_TEXT} Joining the waitlist does not reserve a ticket.{" "}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener"
          className="underline underline-offset-2 hover:text-white transition-colors"
        >
          Privacy
        </a>
      </p>
    </form>
  )
}
