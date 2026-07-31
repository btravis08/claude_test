import status from "@/design/library.status.json";
import { SECTIONS, type SectionEntry } from "@/library/registry";

/*
  Joins the registry with the audit results (src/design/library.status
  .json, written by `npm run audit`) — the shape both the grid and
  /library/manifest.json read from.
*/

export interface SectionStatus {
  comps: Record<string, { pixel: number; layout: number }>;
  tokens: {
    elements: number;
    offToken: number;
    byKind: Record<string, number>;
    examples: { selector: string; kind: string; value: string }[];
  } | null;
}

const sections = (status as { sections: Record<string, SectionStatus> }).sections ?? {};

export const auditedAt = (status as { generatedAt?: string }).generatedAt ?? null;

export const statusFor = (slug: string): SectionStatus | null => sections[slug] ?? null;

/* the worst layout match across a section's breakpoints — one number
   for the card, since a section is only as aligned as its weakest
   breakpoint */
export function worstLayout(slug: string): number | null {
  const s = sections[slug];
  const scores = Object.values(s?.comps ?? {}).map((c) => c.layout);
  return scores.length ? Math.min(...scores) : null;
}

export function summarize(entry: SectionEntry) {
  const s = statusFor(entry.slug);
  return {
    slug: entry.slug,
    title: entry.title,
    group: entry.group,
    description: entry.description,
    schemaType: entry.schemaType,
    tall: entry.tall,
    timed: entry.timed,
    breakpoints: Object.keys(entry.comps ?? {}),
    layout: worstLayout(entry.slug),
    offToken: s?.tokens?.offToken ?? 0,
  };
}

export const summaries = () => SECTIONS.map(summarize);
