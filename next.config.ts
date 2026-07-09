import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      // /shows has no index page (only /shows/[slug] venue pages exist).
      // It's a hardcoded call-to-action across published videos/captions/ads,
      // so send it to the homepage tour section instead of 404ing.
      // Unknown or expired /shows/:slug values fall back to /#tour inside
      // app/shows/[slug]/page.tsx (a redirect there, not here, so real venue
      // pages keep rendering — config redirects run before the filesystem).
      {
        source: "/shows",
        destination: "/#tour",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
