import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media Kit | Andrew Packer",
  description:
    "Brand partnership information — 5M+ followers, 89% male, 25–44. Short-form campaigns, comedy special integrations, and wellness podcast sponsorships.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MediaKitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
