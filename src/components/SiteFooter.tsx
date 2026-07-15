import Link from "next/link";

import type { SiteSettings } from "@/sanity/types";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const companyName = settings.companyName ?? "Prefab Co.";
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <p className="font-semibold">{companyName}</p>
          {settings.tagline && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {settings.tagline}
            </p>
          )}
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <p className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
            Contact
          </p>
          {settings.phone && <p>{settings.phone}</p>}
          {settings.email && <p>{settings.email}</p>}
          {settings.address && (
            <p className="whitespace-pre-line">{settings.address}</p>
          )}
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <p className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
            Explore
          </p>
          <p>
            <Link href="/projects?category=residential" className="hover:underline">
              Residential builds
            </Link>
          </p>
          <p>
            <Link href="/projects?category=commercial" className="hover:underline">
              Commercial builds
            </Link>
          </p>
        </div>
      </div>
      <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
        © {new Date().getFullYear()} {companyName}. All rights reserved.
      </div>
    </footer>
  );
}
