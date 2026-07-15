import Link from "next/link";

import type { SiteSettings } from "@/sanity/types";

const columnHeading = "label font-medium opacity-70";
const columnLink = "label block font-medium text-ink hover:opacity-70";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const companyName = settings.companyName ?? "Prefab Co.";
  return (
    <footer className="mt-auto bg-surface">
      <div className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center sm:py-32">
        <p className="font-display text-headline-lg text-ink sm:text-display-xl">
          {companyName}
        </p>
        {settings.tagline && (
          <p className="label font-medium text-ink-2">{settings.tagline}</p>
        )}
      </div>

      <div className="grid grid-cols-1 border-t-[1.5px] border-line sm:grid-cols-3">
        <div className="flex flex-col gap-[18px] border-b border-line px-6 pb-16 pt-6 sm:border-l">
          <p className={columnHeading}>Contact</p>
          <div className="flex flex-col gap-[9px]">
            {settings.phone && <p className="label font-medium">{settings.phone}</p>}
            {settings.email && <p className="label font-medium">{settings.email}</p>}
            {settings.address && (
              <p className="label whitespace-pre-line font-medium">
                {settings.address}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-[18px] border-b border-l border-line px-6 pb-16 pt-6">
          <p className={columnHeading}>Explore</p>
          <div className="flex flex-col gap-[9px]">
            <Link href="/projects?category=residential" className={columnLink}>
              Residential builds
            </Link>
            <Link href="/projects?category=commercial" className={columnLink}>
              Commercial builds
            </Link>
            <Link href="/projects" className={columnLink}>
              All projects
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-[18px] border-b border-l border-line px-6 pb-16 pt-6">
          <p className={columnHeading}>Company</p>
          <div className="flex flex-col gap-[9px]">
            <Link href="/about" className={columnLink}>
              About
            </Link>
            <Link href="/contact" className={columnLink}>
              Contact us
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-8 px-6 py-8">
        <p className="label font-medium">
          © {new Date().getFullYear()} {companyName}
        </p>
        <a href="#top" className="label font-medium text-ink hover:opacity-70">
          Back to top
        </a>
      </div>
    </footer>
  );
}
