"use client";

import { icons } from "@sanity/icons";
import type { Tool } from "sanity";

import { Shell } from "./dash";

/*
  "Sections" — the section library embedded in the Studio. The Studio
  and the site share an origin, so the tool is a thin frame over
  /library: one implementation, seen from either side. The frame sits
  inside the dashboard shell so the tool chrome matches the rest of
  the Studio's panes.
*/
function SectionLibraryPanel() {
  return (
    <Shell active="sections" wide>
      <div
        style={{
          marginTop: 24,
          background: "#edebe6",
          borderRadius: 18,
          overflow: "hidden",
          height: "calc(100vh - 140px)",
        }}
      >
        <iframe
          src="/library"
          title="Section library"
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      </div>
    </Shell>
  );
}

export const sectionLibraryTool: Tool = {
  name: "sections",
  title: "Sections",
  icon: icons["th-large"],
  component: SectionLibraryPanel,
};
