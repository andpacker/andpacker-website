"use client";

import { useState, useRef, useEffect, useMemo } from "react";

const CITIES = [
  { group: "Canada", cities: ["Calgary, AB", "Edmonton, AB", "Halifax, NS", "Hamilton, ON", "Kelowna, BC", "Kitchener-Waterloo, ON", "London, ON", "Montreal, QC", "New Westminster, BC", "Niagara Falls, ON", "Oshawa, ON", "Ottawa, ON", "Regina, SK", "Saint John, NB", "Saskatoon, SK", "Toronto, ON", "Vancouver, BC", "Victoria, BC", "Windsor, ON", "Winnipeg, MB"] },
  { group: "United States", cities: ["Albany, NY", "Albuquerque, NM", "Atlanta, GA", "Austin, TX", "Baltimore, MD", "Birmingham, AL", "Bloomington, IN", "Boston, MA", "Bozeman, MT", "Buffalo, NY", "Burlington, VT", "Burbank, CA", "Charlotte, NC", "Chattanooga, TN", "Chicago, IL", "Cincinnati, OH", "Cleveland, OH", "Colorado Springs, CO", "Columbus, OH", "Dallas, TX", "Dayton, OH", "Denver, CO", "Des Moines, IA", "Detroit, MI", "El Paso, TX", "Fargo, ND", "Fort Lauderdale, FL", "Fort Worth, TX", "Grand Rapids, MI", "Greenville, SC", "Hartford, CT", "Honolulu, HI", "Houston, TX", "Huntsville, AL", "Indianapolis, IN", "Jackson, MS", "Jacksonville, FL", "Kansas City, MO", "Las Vegas, NV", "Lexington, KY", "Long Island, NY", "Los Angeles, CA", "Louisville, KY", "Madison, WI", "Miami, FL", "Milwaukee, WI", "Minneapolis, MN", "Nashville, TN", "New Brunswick, NJ", "New Orleans, LA", "New York, NY", "Newport News, VA", "Oklahoma City, OK", "Omaha, NE", "Orlando, FL", "Peoria, IL", "Philadelphia, PA", "Phoenix, AZ", "Pittsburgh, PA", "Portland, ME", "Portland, OR", "Providence, RI", "Raleigh, NC", "Reno, NV", "Richmond, VA", "Sacramento, CA", "Salt Lake City, UT", "San Antonio, TX", "San Diego, CA", "San Francisco, CA", "San Jose, CA", "Seattle, WA", "Spokane, WA", "St. Louis, MO", "Syracuse, NY", "Tacoma, WA", "Tampa, FL", "Toledo, OH", "Tucson, AZ", "Tulsa, OK", "Virginia Beach, VA", "Washington, DC"] },
  { group: "United Kingdom", cities: ["Birmingham", "Bristol", "Edinburgh", "Glasgow", "Leeds", "Liverpool", "London", "Manchester"] },
  { group: "Australia", cities: ["Adelaide", "Brisbane", "Gold Coast", "Hobart", "Melbourne", "Perth", "Sydney"] },
  { group: "Europe", cities: ["Amsterdam", "Antwerp", "Barcelona", "Berlin", "Brussels", "Budapest", "Cologne", "Copenhagen", "Dublin", "Frankfurt", "Gothenburg", "Hamburg", "Helsinki", "Krakow", "Lisbon", "Madrid", "Munich", "Oslo", "Paris", "Prague", "Rome", "Rotterdam", "Stockholm", "Tallinn", "Vienna", "Warsaw", "Zurich"] },
  { group: "South Africa", cities: ["Cape Town", "Durban", "Johannesburg"] },
];

const VALID_CITIES = new Set(CITIES.flatMap((g) => g.cities));

type EmailSignupProps = {
  /** Hide the first/last name fields (email + city only). For mobile bio-link traffic. */
  compact?: boolean;
  /** Render only the form (no blue section wrapper / heading) so the page owns layout + background. */
  bare?: boolean;
  /** Channel attribution value sent to Kit. */
  source?: string;
  heading?: string;
  secondLine?: string;
  subhead?: string;
  buttonLabel?: string;
};

export default function EmailSignup({
  compact = false,
  bare = false,
  source = "website",
  heading = "Join the Pack",
  subhead = "I'll let you know the second I add a show near you, plus an early heads-up before tickets go on sale.",
  secondLine = "Already see your town? Join anyway and get the early heads-up before tickets go on sale.",
  buttonLabel = "Join the Pack",
}: EmailSignupProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [cityError, setCityError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const comboboxRef = useRef<HTMLDivElement>(null);

  const filteredGroups = useMemo(() => {
    if (!cityInput.trim()) return CITIES;
    const q = cityInput.toLowerCase();
    return CITIES.map((g) => ({
      ...g,
      cities: g.cities.filter((c) => c.toLowerCase().includes(q)),
    })).filter((g) => g.cities.length > 0);
  }, [cityInput]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        if (cityInput && !VALID_CITIES.has(cityInput)) {
          setCityInput("");
          setCity("");
        }
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [cityInput]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    if (!city || !VALID_CITIES.has(city)) {
      setCityError("Please select a city from the dropdown.");
      setStatus("idle");
      return;
    }

    const payload: Record<string, string> = { email, city, source };
    if (!compact) {
      payload.firstName = firstName;
      payload.lastName = lastName;
    }

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Something went wrong. Try again.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Connection error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section id="jointhepack" className={bare ? "w-full" : "py-24 px-6 bg-[#0D41CB]"}>
      <div className={bare ? "w-full max-w-md mx-auto text-center" : "max-w-2xl mx-auto text-center"}>
        {!bare && heading && (
          <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-tight text-white mb-3">
            {heading}
          </h2>
        )}
        {!bare && subhead && (
          <p className="text-white/70 text-lg mb-2">
            {subhead}
          </p>
        )}
        {!bare && secondLine && (
          <p className="text-white/50 text-sm mb-10">
            {secondLine}
          </p>
        )}

        {status === "success" ? (
          <div className="py-8">
            <p className="text-white font-[family-name:var(--font-display)] font-bold text-2xl uppercase tracking-wide">
              You&apos;re in the Pack.
            </p>
            <p className="text-white/70 mt-2">
              You&apos;ll be first to know when I&apos;m near {city}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md mx-auto">
            {!compact && (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="flex-1 bg-white/10 border border-white/30 text-white placeholder-white/50 px-5 py-4 outline-none focus:border-white transition-colors text-sm min-w-0"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="flex-1 bg-white/10 border border-white/30 text-white placeholder-white/50 px-5 py-4 outline-none focus:border-white transition-colors text-sm min-w-0"
                />
              </div>
            )}
            <input
              type="email"
              placeholder="Your email address"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/30 text-white placeholder-white/50 px-5 py-4 outline-none focus:border-white transition-colors text-sm"
            />
            <div ref={comboboxRef} className="relative">
              <input
                type="text"
                placeholder="Closest city to you..."
                aria-label="Closest city to you"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setCity("");
                  setCityError("");
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowDropdown(false);
                }}
                className="w-full bg-white/10 border border-white/30 text-white placeholder-white/50 px-5 py-4 outline-none focus:border-white transition-colors text-sm"
              />
              {showDropdown && filteredGroups.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 max-h-48 overflow-y-auto bg-[#0b35a8] border border-white/30 border-t-0">
                  {filteredGroups.map((group) => (
                    <div key={group.group}>
                      <div className="px-4 py-1 text-xs text-white/40 uppercase tracking-widest select-none">
                        {group.group}
                      </div>
                      {group.cities.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCityInput(c);
                            setCity(c);
                            setShowDropdown(false);
                            setCityError("");
                          }}
                          className="w-full text-left px-5 py-2.5 text-white text-sm hover:bg-white/10 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {cityError && (
                <p className="text-red-300 text-xs mt-1 text-left">{cityError}</p>
              )}
            </div>

            {status === "error" && (
              <p className="text-white/80 text-sm bg-white/10 px-4 py-3 text-left">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-white text-[#0D41CB] hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm px-8 py-4 transition-colors"
            >
              {status === "loading" ? "Saving..." : buttonLabel}
            </button>
          </form>
        )}

        <p className="text-white/40 text-xs mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
