"use client";

import { icons } from "@sanity/icons";
import type { Tool } from "sanity";

/*
  "Sections" — the section library embedded in the Studio. The Studio
  and the site share an origin, so the tool is a thin frame over
  /library: one implementation, seen from either side.
*/
function SectionLibraryPanel() {
  return (
    <iframe
      src="/library"
      title="Section library"
      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
    />
  );
}

export const sectionLibraryTool: Tool = {
  name: "sections",
  title: "Sections",
  icon: icons["th-large"],
  component: SectionLibraryPanel,
};
