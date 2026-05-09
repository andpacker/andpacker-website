"use client";

import { useState, useRef, useEffect, useMemo } from "react";

const CITIES = [
  { group: "Canada", cities: ["Calgary", "Edmonton", "Halifax", "Hamilton", "Kelowna", "Kitchener-Waterloo", "London ON", "Montreal", "New Westminster", "Niagara Falls", "Oshawa", "Ottawa", "Regina", "Saint John NB", "Saskatoon", "Toronto", "Vancouver", "Victoria", "Windsor", "Winnipeg"] },
  { group: "United States", cities: ["Albany", "Albuquerque", "Atlanta", "Austin", "Baltimore", "Birmingham", "Bloomington IN", "Boston", "Bozeman", "Buffalo", "Burlington VT", "Burbank", "Charlotte", "Chattanooga", "Chicago", "Cincinnati", "Cleveland", "Colorado Springs", "Columbus", "Dallas", "Dayton", "Denver", "Des Moines", "Detroit", "El Paso", "Fargo", "Fort Lauderdale", "Fort Worth", "Grand Rapids", "Greenville SC", "Hartford", "Honolulu", "Houston", "Huntsville", "Indianapolis", "Jackson MS", "Jacksonville", "Kansas City", "Las Vegas", "Lexington", "Long Island", "Los Angeles", "Louisville", "Madison", "Miami", "Milwaukee", "Minneapolis", "Nashville", "New Brunswick NJ", "New Orleans", "New York", "Newport News", "Oklahoma City", "Omaha", "Orlando", "Peoria", "Philadelphia", "Phoenix", "Pittsburgh", "Portland ME", "Portland OR", "Providence", "Raleigh", "Reno", "Richmond", "Sacramento", "Salt Lake City", "San Antonio", "San Diego", "San Francisco", "San Jose", "Seattle", "Spokane", "St. Louis", "Syracuse", "Tacoma", "Tampa", "Toledo", "Tucson", "Tulsa", "Virginia Beach", "Washington DC"] },
  { group: "United Kingdom", cities: ["Birmingham", "Bristol", "Edinburgh", "Glasgow", "Leeds", "Liverpool", "London", "Manchester"] },
  { group: "Australia", cities: ["Adelaide", "Brisbane", "Gold Coast", "Hobart", "Melbourne", "Perth", "Sydney"] },
  { group: "Europe", cities: ["Amsterdam", "Antwerp", "Barcelona", "Berlin", "Brussels", "Budapest", "Cologne", "Copenhagen", "Dublin", "Frankfurt", "Gothenburg", "Hamburg", "Helsinki", "Krakow", "Lisbon", "Madrid", "Munich", "Oslo", "Paris", "Prague", "Rome", "Rotterdam", "Stockholm", "Tallinn", "Vienna", "Warsaw", "Zurich"] },
  { group: "South Africa", cities: ["Cape Town", "Durban", "Johannesburg"] },
];

const VALID_CITIES = new Set(CITIES.flatMap((g) => g.cities));

export default function EmailSignup() {
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

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, city }),
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
    <section id="email" className="py-24 px-6 bg-[#0D41CB]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-tight text-white mb-4">
          Stay in the Loop
        </h2>
        <p className="text-white/70 text-lg mb-10">
          Get notified when Andrew is performing near you.
        </p>

        {status === "success" ? (
          <div className="py-8">
            <p className="text-white font-[family-name:var(--font-display)] font-bold text-2xl uppercase tracking-wide">
              You&apos;re in!
            </p>
            <p className="text-white/70 mt-2">
              We&apos;ll let you know when Andrew is near {city}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md mx-auto">
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
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/30 text-white placeholder-white/50 px-5 py-4 outline-none focus:border-white transition-colors text-sm"
            />
            <div ref={comboboxRef} className="relative">
              <input
                type="text"
                placeholder="Closest city to you..."
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
              {status === "loading" ? "Saving..." : "Notify Me"}
            </button>
          </form>
        )}

        <p className="text-white/40 text-xs mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
