import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { sanityFetch } from "@/sanity/lib/fetch";
import { siteSettingsQuery } from "@/sanity/lib/queries";
import type { SiteSettings } from "@/sanity/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader companyName={settings.companyName ?? "Prefab Co."} />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
