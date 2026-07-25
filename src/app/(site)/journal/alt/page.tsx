import type { Metadata } from "next";

import { JournalGrid } from "@/components/journal/JournalGrid";

export const metadata: Metadata = {
  title: "Honors Journal — Field",
  description:
    "An infinite drag-anywhere field of stories from Sun Day Red.",
};

/* design experiment: the journal as an infinite draggable masonry
   field (static /journal/alt wins over the [slug] article route) */
export default function JournalAltPage() {
  return <JournalGrid />;
}
