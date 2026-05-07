export default function EmailSignup() {
  return (
    <section id="email" className="py-24 px-6 bg-[#0D41CB]">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-tight text-white mb-4">
          Stay in the Loop
        </h2>
        <p className="text-white/70 text-lg mb-10">
          Be the first to know about new tour dates, specials, and everything else.
        </p>

        {/*
          REPLACE THIS BLOCK with your EmailOctopus embed code.
          Get it from: EmailOctopus Dashboard → Forms → Create form → Embed
          Style override below keeps it matching the site.
        */}
        <div className="emailoctopus-form-wrapper">
          <form
            action="REPLACE_WITH_EMAILOCTOPUS_ACTION_URL"
            method="POST"
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              name="field_0"
              placeholder="Your email address"
              required
              className="flex-1 bg-white/10 border border-white/30 text-white placeholder-white/50 px-5 py-4 outline-none focus:border-white transition-colors text-sm"
            />
            <button
              type="submit"
              className="bg-white text-[#0D41CB] hover:bg-white/90 font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm px-8 py-4 transition-colors flex-shrink-0"
            >
              Subscribe
            </button>
          </form>
          <p className="text-white/40 text-xs mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}
