export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-[#0A0A0A] border-t border-[#141414] py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="font-[family-name:var(--font-display)] font-extrabold text-white uppercase text-2xl tracking-widest mb-2">
              Andrew Packer
            </div>
            <p className="text-[#555] text-sm">Stand-Up Comedian</p>
          </div>

          <div className="text-sm text-[#555]">
            <p className="uppercase tracking-widest text-xs text-[#444] mb-1">Booking</p>
            <a
              href="mailto:info@andpacker.com"
              className="text-[#888] hover:text-white transition-colors"
            >
              info@andpacker.com
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#141414] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#444] text-xs">
            © {year} Andrew Packer. All rights reserved.
          </p>
          <p className="text-[#333] text-xs">
            andpacker.com
          </p>
        </div>
      </div>
    </footer>
  );
}
