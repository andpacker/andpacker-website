import { tourDates } from "@/lib/tour";
import {
  findSubscriber,
  getOrCreateTagId,
  tagSubscriber,
  WEBSITE_SIGNUP_TAG_ID,
} from "@/lib/kit";
import { findWaitlistShow, presaleTag, seriesTag, waitlistCity } from "@/lib/waitlist";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL = 254;
const MAX_NAME = 100;
const SAVE_ERROR = "Could not save. Try again.";

// Waitlist for a sold-out show, or the presale list for a show announced before
// tickets go on sale. The client names the show; every tag is derived here from
// tour-dates.json, so this public endpoint can only ever apply tags that belong
// to a real sold-out or coming-soon show.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim().slice(0, MAX_NAME) : "";
  if (email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const show = findWaitlistShow(tourDates, body.date, body.slug, body.time);
  if (!show) {
    return Response.json({ error: "This show has no waitlist." }, { status: 400 });
  }

  const apiSecret = process.env.KIT_API_SECRET;
  if (!apiSecret) {
    return Response.json({ error: "Form not configured." }, { status: 500 });
  }

  const presale = show.status === "coming_soon";
  const city = waitlistCity(show.city);
  const tagNames = [
    city,
    seriesTag(show.showType),
    presale ? presaleTag(show) : null,
  ].filter((t): t is string => Boolean(t));

  const existing = await findSubscriber(apiSecret, email);
  if (existing === undefined) {
    return Response.json({ error: SAVE_ERROR }, { status: 500 });
  }

  // A new person signs up exactly like a website signup, with source "waitlist"
  // (or "presale").
  // Someone already on the list only gains the tags: their home city, name and
  // source are never overwritten (an Oshawa subscriber joining a Toronto
  // waitlist stays in Oshawa). Blanks are filled in, nothing else.
  let fill: Record<string, unknown> = {};
  if (existing === null) {
    const payload: Record<string, unknown> = {
      email,
      fields: { city, source: presale ? "presale" : "waitlist" },
    };
    if (firstName) payload.first_name = firstName;
    if (!(await tagSubscriber(apiSecret, WEBSITE_SIGNUP_TAG_ID, payload))) {
      return Response.json({ error: SAVE_ERROR }, { status: 500 });
    }
  } else {
    if (firstName && !existing.first_name) fill.first_name = firstName;
    if (!existing.fields?.city) fill.fields = { city };
  }

  // Unlike the signup route's city tag, nothing re-sweeps a missed series tag, so
  // any tag failure is an error and the person retries. Re-tagging is a no-op.
  for (const name of tagNames) {
    const tagId = await getOrCreateTagId(apiSecret, name);
    if (!tagId || !(await tagSubscriber(apiSecret, tagId, { email, ...fill }))) {
      return Response.json({ error: SAVE_ERROR }, { status: 500 });
    }
    fill = {};
  }

  return Response.json({ success: true });
}
