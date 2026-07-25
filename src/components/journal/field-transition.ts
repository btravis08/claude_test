/*
  Handoff between the journal field (/journal/alt) and an article:
  the grid stores which image was clicked just before navigating, and
  the article's top claims it on mount to open in fullscreen "field
  entry" mode (the expanded tile becomes the hero, title fading up
  over it). Module state on purpose — it must survive the route
  change but die with the tab.
*/

export interface FieldEntry {
  slug: string;
  src: string;
}

let pending: FieldEntry | null = null;

export function setFieldEntry(entry: FieldEntry) {
  pending = entry;
}

export function takeFieldEntry(slug: string): FieldEntry | null {
  if (pending?.slug !== slug) return null;
  const entry = pending;
  pending = null;
  return entry;
}

/* the article hero announces it has painted the fullscreen image so
   the grid's expansion overlay can fade out over identical pixels */
export const HERO_READY_EVENT = "sdr:article-hero-ready";
