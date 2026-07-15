import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

/*
  Root layout: fonts + tokens only. The SDR site chrome (navigation,
  footer) lives in the (site) route group so /studio stays bare.

  Brand fonts in the Figma library are Feature Deck (display serif) and
  Maison Neue / Maison Neue Mono — both commercially licensed. These are
  the closest Google Fonts stand-ins; swap to next/font/local when
  licensed files are available. The CSS variable names stay the same.
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
    default: "Sun Day Red",
    template: "%s | Sun Day Red",
  },
  description: "SDR design library implementation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${featureDeck.variable} ${maison.variable} ${maisonMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
