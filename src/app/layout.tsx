import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/*
  Root layout: fonts + tokens only. The SDR site chrome (navigation,
  footer) lives in the (site) route group so /studio stays bare.

  Licensed brand fonts, self-hosted from src/fonts:
  - Feature Deck — the display serif for all titles
  - Maison Neue Book (400) + Medium (500) — Medium carries the label
    style everywhere the mono cut used to
  - Maison Neue Mono — kept as the alternative via the font-mono
    utility
*/
const featureDeck = localFont({
  src: "../fonts/FeatureDeck-Regular-Trial.woff",
  weight: "400",
  variable: "--font-feature-deck",
  display: "swap",
});

const maison = localFont({
  src: [
    { path: "../fonts/MaisonNeue-Book.woff", weight: "400" },
    { path: "../fonts/MaisonNeue-Medium.woff", weight: "500" },
  ],
  variable: "--font-maison",
  display: "swap",
});

const maisonMono = localFont({
  src: "../fonts/MaisonNeue-Mono.woff",
  weight: "400",
  variable: "--font-maison-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sun Day Red",
    template: "%s | Sun Day Red",
  },
  description: "SDR design library implementation.",
};

/* viewport-fit=cover exposes env(safe-area-inset-*) on iOS, so
   bottom-fixed chrome can hold an exact 16px above the home
   indicator instead of measuring from the physical screen edge */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
