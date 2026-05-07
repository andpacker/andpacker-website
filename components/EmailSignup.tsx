"use client";

import { useState } from "react";

const CITIES = [
  { group: "Canada", cities: ["Toronto", "Ottawa", "Montreal", "Vancouver", "Calgary", "Edmonton", "Winnipeg", "Halifax"] },
  { group: "United States", cities: ["New York", "Los Angeles", "Chicago", "Miami", "Austin", "Seattle", "Boston", "Denver"] },
];

export default function EmailSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, city }),
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
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/30 text-white placeholder-white/50 px-5 py-4 outline-none focus:border-white transition-colors text-sm"
            />
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/30 text-white placeholder-white/50 px-5 py-4 outline-none focus:border-white transition-colors text-sm"
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full bg-[#0b35a8] border border-white/30 text-white px-5 py-4 outline-none focus:border-white transition-colors text-sm"
            >
              <option value="" disabled>Closest city to you...</option>
              {CITIES.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              ))}
              <option value="Other">Somewhere else</option>
            </select>

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
