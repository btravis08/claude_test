import Link from "next/link";

import { GROUPS, SECTIONS } from "@/library/registry";
import { Thumb } from "@/library/Thumb";

/*
  The section library index — every composable section at a glance,
  each rendered live. Click through for the full-size preview with
  mode and viewport switching.
*/
export default function LibraryIndex() {
  return (
    <div data-mode="light" className="min-h-screen w-full bg-surface text-ink">
      <header className="border-b border-line px-6 py-8">
        <p className="label font-medium text-ink-3">SUN DAY RED</p>
        <h1 className="mt-2 font-display text-headline-md">Section library</h1>
        <p className="mt-3 max-w-[43.75rem] text-body-sm text-ink-2">
          Every section the site builds pages from, rendered live from the same
          components production uses. Open one to preview it at any breakpoint
          and color mode — press Alt+T inside a preview for the token readout.
        </p>
      </header>

      {GROUPS.map((group) => {
        const items = SECTIONS.filter((s) => s.group === group);
        if (!items.length) return null;
        return (
          <section key={group} className="px-6 py-10">
            <div className="mb-6 flex items-baseline gap-3">
              <h2 className="label font-medium">{group.toUpperCase()}</h2>
              <span className="text-body-sm text-ink-3">{items.length}</span>
            </div>

            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={`/library/${entry.slug}`}
                    className="group block overflow-hidden rounded-xs border border-line bg-surface transition-colors hover:border-ink"
                  >
                    <Thumb slug={entry.slug} height={entry.tall ? 900 : 620} />
                    <div className="flex flex-col gap-2 border-t border-line p-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-title-sm">{entry.title}</h3>
                        <span className="label rounded-xs bg-wash px-2 py-1 font-medium text-ink-3">
                          {entry.schemaType ? "CMS" : "FIXED"}
                        </span>
                        {entry.comp && (
                          <span
                            className="label rounded-xs border border-line px-2 py-1 font-medium text-ink-3"
                            title="A Figma comp is available to diff against"
                          >
                            COMP
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-ink-2">{entry.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
