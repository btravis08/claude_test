import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { sanityFetch } from "@/sanity/lib/fetch";
import { siteSettingsQuery } from "@/sanity/lib/queries";
import type { SiteSettings } from "@/sanity/types";

/*
  Brand fonts in the Figma library are Feature Deck (display serif) and
  Maison Neue / Maison Neue Mono — both commercially licensed. These are the
  closest Google Fonts stand-ins; swap to next/font/local when licensed
  files are available. The CSS variable names stay the same either way.
*/
const featureDeck = Instrument_Serif({
  variable: "--font-feature-deck",
  weight: "400",
  subsets: ["latin"],
});

const maison = Inter({
  variable: "--font-maison",
  subsets: ["latin"],
});

const maisonMono = IBM_Plex_Mono({
  variable: "--font-maison-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Prefab Co. — Modern Prefab Construction",
    template: "%s | Prefab Co.",
  },
  description:
    "Residential and commercial prefab builds, designed and delivered.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await sanityFetch<SiteSettings>(
    siteSettingsQuery,
    {},
    {},
  );

  return (
    <html
      lang="en"
      className={`${featureDeck.variable} ${maison.variable} ${maisonMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader companyName={settings.companyName ?? "Prefab Co."} />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
