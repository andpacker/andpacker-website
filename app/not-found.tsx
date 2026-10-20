import Link from "next/link";

// Every unmatched URL renders this inside the root layout, so the Meta pixel
// runs here like on any other page, hence the Privacy link. Next sets the 404
// status and the noindex tag itself. The title and message are the ones
// Next's built-in 404 page used.
export default function NotFound() {
  return (
    <>
      <title>404: This page could not be found.</title>
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-24">
          <Link
            href="/"
            className="text-[#555] text-sm tracking-widest uppercase hover:text-white transition-colors"
          >
            ← Andrew Packer
          </Link>
          <h1 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-tight mt-6">
            404
          </h1>
          <p className="mt-3 text-[#888]">This page could not be found.</p>
          <p className="mt-12">
            <Link
              href="/privacy"
              className="text-[#555] text-sm tracking-widest uppercase hover:text-white transition-colors"
            >
              Privacy
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
