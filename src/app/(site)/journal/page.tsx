import type { Metadata, Viewport } from "next";

import { JournalLanding } from "@/components/journal/JournalLanding";

export const metadata: Metadata = {
  title: "Honors Journal",
  description:
    "People, ideas, & culture — stories from the course and beyond the red.",
};

/* pin iOS bar chrome to the light surface (matches the page ground) */
export const viewport: Viewport = { themeColor: "#f7f8f4" };

export default function JournalPage() {
  return <JournalLanding />;
}
