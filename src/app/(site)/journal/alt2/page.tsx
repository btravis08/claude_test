import type { Metadata, Viewport } from "next";

import { JournalGridLight } from "@/components/journal/JournalGridLight";

export const metadata: Metadata = {
  title: "Honors Journal — Light Field",
  description:
    "A quiet field of stories from Sun Day Red — scroll to wander, the light follows you.",
};

/* cream surface — keep iOS bar chrome matched from first paint */
export const viewport: Viewport = { themeColor: "#f7f8f4" };

/* design experiment #2: photoyoshi-style ghosted lattice with a
   cursor spotlight (static /journal/alt2 wins over the [slug] route) */
export default function JournalAlt2Page() {
  return <JournalGridLight />;
}
