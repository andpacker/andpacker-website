"use client";

import { useState } from "react";
import type { Show } from "@/lib/tour";
import { waitlistCity } from "@/lib/waitlist";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Waitlist sign-up for one sold-out show: first name + email. The server files
 * the person in Kit under the show's city and series tags (app/api/waitlist).
 */
export default function WaitlistForm({ show }: { show: Show }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // "Toronto, ON" -> "Toronto"; a suburb show reads as its market ("Boston").
  const cityName = waitlistCity(show.city).split(",")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email,
          date: show.date,
          slug: show.slug,
          time: show.time ?? "",
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Something went wrong. Try again.");
        setStatus("error");
      } else {
        setStatus("success");
        window.fbq?.("trackCustom", "JoinWaitlist", {
          content_name: show.venue,
          city: show.city,
          show_date: show.date,
        });
      }
    } catch {
      setErrorMsg("Connection error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-4 border border-[#222] p-5" role="status">
        <p className="text-white font-[family-name:var(--font-display)] font-bold text-xl uppercase tracking-wide">
          You&apos;re on the list.
        </p>
        <p className="text-[#888] text-sm mt-1">
          If I add another show in {cityName}, you&apos;ll hear first.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border border-[#222] p-5">
      <p className="text-[#888] text-sm mb-4">
        This one sold out. Leave your name and email and you&apos;ll be the first to know if I
        add another show in {cityName}.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="First name"
          aria-label="First name"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="flex-1 min-w-0 bg-[#111] border border-[#333] text-white placeholder-[#555] px-4 py-3 outline-none focus:border-white transition-colors text-sm"
        />
        <input
          type="email"
          placeholder="Email"
          aria-label="Email address"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-[1.5] min-w-0 bg-[#111] border border-[#333] text-white placeholder-[#555] px-4 py-3 outline-none focus:border-white transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex-shrink-0 bg-white text-black hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-xs px-6 py-3 transition-colors"
        >
          {status === "loading" ? "Saving..." : "Join Waitlist"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-red-300 text-sm mt-3">{errorMsg}</p>
      )}
      {/* New tab, so a half-filled form survives a look at the policy. */}
      <p className="text-[#555] text-xs mt-3">
        No spam. Unsubscribe anytime.{" "}
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
  );
}
