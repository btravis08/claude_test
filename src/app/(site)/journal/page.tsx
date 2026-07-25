import type { Metadata } from "next";

import { JournalLanding } from "@/components/journal/JournalLanding";

export const metadata: Metadata = {
  title: "Honors Journal",
  description:
    "People, ideas, & culture — stories from the course and beyond the red.",
};

export default function JournalPage() {
  return <JournalLanding />;
}
