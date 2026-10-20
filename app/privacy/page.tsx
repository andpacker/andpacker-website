import type { Metadata } from "next";
import Link from "next/link";

const PAGE_URL = "https://andpacker.com/privacy";
const TITLE = "Privacy | Andrew Packer";
const DESCRIPTION =
  "What I collect when you buy a ticket, sign up for show updates or visit andpacker.com, how I use it, and your choices.";
const EMAIL = "info@andpacker.com";

// Every openGraph field is set because a page's openGraph REPLACES the root
// layout's wholesale. With none, this page would inherit og:url = the
// homepage, which Meta's ad review reads as a deceptive link.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "Andrew Packer",
    type: "website",
  },
};

function EmailLink() {
  return (
    <a
      href={`mailto:${EMAIL}`}
      className="underline underline-offset-2 decoration-[#555] hover:decoration-white transition-colors"
    >
      {EMAIL}
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm text-[#888]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-3 list-disc pl-5 space-y-3 leading-relaxed marker:text-[#555]">
      {children}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-24">
        <Link
          href="/"
          className="text-[#555] text-sm tracking-widest uppercase hover:text-white transition-colors"
        >
          ← Andrew Packer
        </Link>
        <h1 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-tight mt-6">
          Privacy
        </h1>
        <p className="mt-3 text-sm text-[#888]">Last updated: October 20, 2026</p>

        <p className="mt-8 leading-relaxed">
          This site and my shows are run by Andrew Packer Productions in Toronto, Canada.
          Here&apos;s what I collect and what I do with it.
        </p>

        <Section title="What I collect">
          <Bullets>
            <li>
              When you buy a ticket through Eventbrite or another ticketing site: your name,
              email and order details, which the ticketing site shares with me as the
              show&apos;s organizer.
            </li>
            <li>
              When you sign up for show updates or a show&apos;s waitlist: your email, your
              city and, on some forms, your name.
            </li>
            <li>
              When you visit this site: standard browsing information collected by the Meta
              Pixel, such as pages viewed, ticket-button clicks, and device and browser
              details.
            </li>
          </Bullets>
        </Section>

        <Section title="How I use it">
          <Bullets>
            <li>
              To run the show: confirmations, changes, and anything you need to know about
              your ticket.
            </li>
            <li>
              To send show updates to people who&apos;ve bought tickets or signed up. Every
              email has an unsubscribe link.
            </li>
            <li>
              To advertise my shows. I may share a scrambled (hashed) version of your email
              and name with advertising platforms such as Meta (Facebook and Instagram). That
              lets them show you ads for shows near you, skip ads for a show you&apos;ve
              already bought tickets to, or find other people with similar interests. The
              platform matches the scrambled data to existing accounts without receiving
              your email address in readable form.
            </li>
            <li>To measure how well my ads and this site work.</li>
          </Bullets>
        </Section>

        <Section title="What I don't do">
          <Bullets>
            <li>I don&apos;t sell your information.</li>
            <li>
              I only share it with the services that help me run my shows (ticketing, email
              and advertising providers), and only for the purposes above.
            </li>
          </Bullets>
        </Section>

        <Section title="Your choices">
          <Bullets>
            <li>Unsubscribe from emails anytime.</li>
            <li>
              To keep your information out of ad matching, or to see, correct or delete what
              I have, email <EmailLink />{" "}and I&apos;ll take care of it.
            </li>
            <li>
              You can also control how Meta uses your activity for ads in your Facebook or
              Instagram ad settings.
            </li>
          </Bullets>
        </Section>

        <Section title="How long I keep it">
          <p className="mt-3 leading-relaxed">
            As long as it&apos;s useful for my shows, or until you ask me to delete it.
          </p>
        </Section>

        <Section title="Contact">
          <p className="mt-3 leading-relaxed">
            The person responsible for privacy here is Andrew Packer: <EmailLink />
          </p>
        </Section>
      </div>
    </main>
  );
}
