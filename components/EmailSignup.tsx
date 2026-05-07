export default function EmailSignup() {
  return (
    <section id="email" className="py-24 px-6 bg-[#0D41CB]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-[family-name:var(--font-display)] font-extrabold uppercase text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-tight text-white mb-4">
          Stay in the Loop
        </h2>
        <p className="text-white/70 text-lg mb-10">
          Get notified when Andrew is performing near you.
        </p>

        {/*
          EmailOctopus embed — replace action URL with your list's form action.
          Get it from: EmailOctopus Dashboard → Lists → your list → Forms → Embed.
          field_0 = email, field_1 = city (custom field — add it in EmailOctopus first).
        */}
        <form
          action="REPLACE_WITH_EMAILOCTOPUS_ACTION_URL"
          method="POST"
          className="flex flex-col gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            name="field_0"
            placeholder="Your email address"
            required
            className="w-full bg-white/10 border border-white/30 text-white placeholder-white/50 px-5 py-4 outline-none focus:border-white transition-colors text-sm"
          />
          <select
            name="field_1"
            required
            className="w-full bg-white/10 border border-white/30 text-white px-5 py-4 outline-none focus:border-white transition-colors text-sm appearance-none"
            defaultValue=""
          >
            <option value="" disabled className="text-black">Closest city to you...</option>
            <optgroup label="Canada" className="text-black">
              <option value="Toronto" className="text-black">Toronto, ON</option>
              <option value="Ottawa" className="text-black">Ottawa, ON</option>
              <option value="Montreal" className="text-black">Montreal, QC</option>
              <option value="Vancouver" className="text-black">Vancouver, BC</option>
              <option value="Calgary" className="text-black">Calgary, AB</option>
              <option value="Edmonton" className="text-black">Edmonton, AB</option>
              <option value="Winnipeg" className="text-black">Winnipeg, MB</option>
              <option value="Halifax" className="text-black">Halifax, NS</option>
            </optgroup>
            <optgroup label="United States" className="text-black">
              <option value="New York" className="text-black">New York, NY</option>
              <option value="Los Angeles" className="text-black">Los Angeles, CA</option>
              <option value="Chicago" className="text-black">Chicago, IL</option>
              <option value="Miami" className="text-black">Miami, FL</option>
              <option value="Austin" className="text-black">Austin, TX</option>
              <option value="Seattle" className="text-black">Seattle, WA</option>
              <option value="Boston" className="text-black">Boston, MA</option>
              <option value="Denver" className="text-black">Denver, CO</option>
            </optgroup>
            <option value="Other" className="text-black">Somewhere else</option>
          </select>
          <button
            type="submit"
            className="w-full bg-white text-[#0D41CB] hover:bg-white/90 font-[family-name:var(--font-display)] font-bold uppercase tracking-widest text-sm px-8 py-4 transition-colors"
          >
            Notify Me
          </button>
        </form>
        <p className="text-white/40 text-xs mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
