import { SOCIALS, SocialIcon } from "@/lib/socials";

// Full-width band of every social + podcast link, directly under the home hero.
export default function SocialStrip() {
  return (
    <nav aria-label="Social media" className="bg-[#0D41CB] px-4 py-4 md:py-5">
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 min-[400px]:gap-x-5 md:gap-x-10">
        {SOCIALS.map((s) => (
          <li key={s.label}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.ariaLabel}
              title={s.label}
              className="block text-white opacity-80 hover:opacity-100 hover:-translate-y-0.5 transition"
            >
              <SocialIcon path={s.path} className="w-6 h-6 md:w-7 md:h-7" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
