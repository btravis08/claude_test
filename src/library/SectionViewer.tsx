"use client";

import Link from "next/link";
import { useState } from "react";

import type { Mode } from "@/library/registry";

/* the serializable half of a registry entry — the viewer iframes the
   section rather than rendering it, so the render fn stays server-side
   (functions can't cross into a client component) */
export interface ViewerEntry {
  slug: string;
  title: string;
  schemaType?: string;
  description: string;
  modes: Mode[];
}

/*
  The single-section viewer: a toolbar over an iframe of the same
  section's bare render. The iframe is the point — resizing it gives
  the section's real responsive behavior (media queries, the vh-based
  canvases, touch layouts) instead of a simulated scale.
*/
const VIEWPORTS = [
  { id: "desktop", label: "Desktop", width: 1440 },
  { id: "tablet", label: "Tablet", width: 1024 },
  { id: "mobile", label: "Mobile", width: 428 },
] as const;

export function SectionViewer({ entry }: { entry: ViewerEntry }) {
  const [mode, setMode] = useState<Mode>(entry.modes[0]);
  const [vp, setVp] = useState<(typeof VIEWPORTS)[number]["id"]>("desktop");
  const width = VIEWPORTS.find((v) => v.id === vp)!.width;
  const src = `/library/${entry.slug}?frame=1&mode=${mode}`;

  return (
    <div data-mode="light" className="flex h-screen w-full flex-col bg-surface text-ink">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-6 py-4">
        <Link href="/library" className="label font-medium text-ink-3 hover:text-ink">
          ← LIBRARY
        </Link>
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-title-sm">{entry.title}</h1>
          {entry.schemaType && (
            <code className="label text-ink-3">{entry.schemaType}</code>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-6">
          {entry.modes.length > 1 && (
            <div className="flex items-center gap-1">
              {entry.modes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`label rounded-xs px-3 py-2 font-medium transition-colors ${
                    mode === m ? "bg-btn text-btn-fg" : "bg-wash text-ink-3 hover:text-ink"
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1">
            {VIEWPORTS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVp(v.id)}
                className={`label rounded-xs px-3 py-2 font-medium transition-colors ${
                  vp === v.id ? "bg-btn text-btn-fg" : "bg-wash text-ink-3 hover:text-ink"
                }`}
              >
                {v.label.toUpperCase()}
              </button>
            ))}
          </div>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="label font-medium text-ink-3 hover:text-ink"
          >
            OPEN ↗
          </a>
        </div>
      </header>

      <p className="border-b border-line px-6 py-3 text-body-sm text-ink-2">
        {entry.description}
      </p>

      <div className="flex-1 overflow-auto bg-surface-2 p-6">
        <iframe
          /* remount on mode/viewport change so scroll-driven sections
             re-measure from a clean state */
          key={`${mode}-${vp}`}
          src={src}
          title={entry.title}
          className="mx-auto block h-full border border-line bg-surface"
          style={{ width, maxWidth: "100%" }}
        />
      </div>
    </div>
  );
}
