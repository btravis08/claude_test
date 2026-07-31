"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Thumb } from "@/library/Thumb";

/*
  The grid, with status. Each card carries what the audit found — how
  closely the build matches its comp and how many values match no
  token — so the library reads as triage rather than a catalogue.
*/

export interface GridEntry {
  slug: string;
  title: string;
  group: string;
  description: string;
  schemaType?: string;
  tall?: boolean;
  timed?: boolean;
  breakpoints: string[];
  /* worst layout match across the section's breakpoints */
  layout: number | null;
  offToken: number;
}

/* Thresholds, chosen so the flag means something. Below LAYOUT_OK the
   composition genuinely differs from the comp; above it the delta is
   photography and antialiasing, not layout. A handful of off-token
   values is usually one shared utility repeated down a list, so only
   a real cluster is worth triage — every card still shows its exact
   count, nothing is hidden by the threshold. */
const LAYOUT_OK = 85;
const OFF_TOKEN_CLUSTER = 10;

function needsAttention(e: GridEntry) {
  if (e.offToken >= OFF_TOKEN_CLUSTER) return true;
  if (e.layout !== null && !e.timed && e.layout < LAYOUT_OK) return true;
  return false;
}

function Badge({
  children,
  strong,
  title,
}: {
  children: React.ReactNode;
  strong?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`label rounded-xs px-2 py-1 font-medium ${
        strong ? "bg-btn text-btn-fg" : "bg-wash text-ink-3"
      }`}
    >
      {children}
    </span>
  );
}

export function LibraryGrid({
  entries,
  groups,
  generatedAt,
}: {
  entries: GridEntry[];
  groups: string[];
  generatedAt: string | null;
}) {
  const [onlyAttention, setOnlyAttention] = useState(false);

  const flagged = useMemo(() => entries.filter(needsAttention).length, [entries]);
  const shown = onlyAttention ? entries.filter(needsAttention) : entries;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4">
        <button
          type="button"
          onClick={() => setOnlyAttention((v) => !v)}
          className={`label rounded-xs px-3 py-2 font-medium transition-colors ${
            onlyAttention ? "bg-btn text-btn-fg" : "bg-wash text-ink-3 hover:text-ink"
          }`}
        >
          NEEDS ATTENTION · {flagged}
        </button>
        <p className="text-body-sm text-ink-2">
          {generatedAt
            ? `Audited ${new Date(generatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })} — layout match is measured against the Figma comp; off-token counts every value that matches no design token.`
            : "Not audited yet — run npm run audit."}
        </p>
      </div>

      {groups.map((group) => {
        const items = shown.filter((s) => s.group === group);
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
                    <div className="flex flex-col gap-3 border-t border-line p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="mr-1 font-display text-title-sm">{entry.title}</h3>
                        <Badge>{entry.schemaType ? "CMS" : "FIXED"}</Badge>
                        {entry.breakpoints.length > 0 && (
                          <Badge title={`Comps: ${entry.breakpoints.join(", ")}`}>
                            COMP ×{entry.breakpoints.length}
                          </Badge>
                        )}
                      </div>

                      {/* the status line */}
                      <div className="flex flex-wrap items-center gap-2">
                        {entry.layout !== null ? (
                          <Badge
                            strong={!entry.timed && entry.layout < LAYOUT_OK}
                            title={
                              entry.timed
                                ? "This section animates — a still frame catches a different moment than the comp, so treat the score as indicative"
                                : "Worst layout match across this section's comps"
                            }
                          >
                            {entry.layout}% MATCH{entry.timed ? " · TIMED" : ""}
                          </Badge>
                        ) : (
                          <Badge title="No comp exported, so nothing to diff against">
                            NO COMP
                          </Badge>
                        )}
                        <Badge
                          strong={entry.offToken >= OFF_TOKEN_CLUSTER}
                          title="Values matching no design token"
                        >
                          {entry.offToken === 0
                            ? "ON TOKEN"
                            : `${entry.offToken} OFF-TOKEN`}
                        </Badge>
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
    </>
  );
}
