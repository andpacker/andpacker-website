#!/usr/bin/env node
/**
 * Posts a failed tour-date sync to Discord #bot-errors (Andrew has no Slack).
 * Called by .github/workflows/update-tour-dates.yml on the final failed attempt.
 *
 * Env:
 *   DISCORD_ALERT_WEBHOOK_URL  the #bot-errors webhook (repo secret). Unset = skip.
 *   FAILURE_FILE               reason written by scrape-tour-dates.js (optional)
 *   RUN_URL                    link to the failed Actions run
 *   GITHUB_RUN_ATTEMPT         set by Actions
 *   DRY_RUN=1                  print the payload instead of posting
 */
const fs = require("fs");

function buildPayload() {
  let reason = "The run failed before the scraper reported a reason (setup or install step).";
  try {
    const text = fs.readFileSync(process.env.FAILURE_FILE || "", "utf8").trim();
    if (text) reason = text.length > 1400 ? `${text.slice(0, 1400)}\n[truncated]` : text;
  } catch {
    // no failure file: keep the generic reason
  }
  const fence = "```";
  const content = [
    `andpacker.com tour-date sync FAILED (attempt ${process.env.GITHUB_RUN_ATTEMPT || "?"} of 3). The site keeps the last good list.`,
    fence,
    reason,
    fence,
    process.env.RUN_URL || "",
  ].join("\n");
  // Never ping anyone from an automated alert.
  return { content, allowed_mentions: { parse: [] } };
}

async function main() {
  const payload = buildPayload();
  if (process.env.DRY_RUN === "1") {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  const url = process.env.DISCORD_ALERT_WEBHOOK_URL;
  if (!url) {
    console.log("::notice::DISCORD_ALERT_WEBHOOK_URL is not set; skipping the Discord alert.");
    return;
  }
  // ?wait=true makes Discord confirm delivery. A custom User-Agent, because
  // Discord's edge rejects some default ones.
  const res = await fetch(`${url}?wait=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "andpacker-tour-sync (github-actions, 1.0)",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(`Discord webhook returned HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }
  console.log("Alert posted to Discord #bot-errors.");
}

main().catch((err) => {
  console.error("Discord alert failed:", err.message);
  process.exit(1);
});
