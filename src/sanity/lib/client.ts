import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, readToken } from "@/sanity/env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

/* Draft-mode client for the Studio's Presentation tool: reads draft
   documents (Viewer token), skips the CDN, and stega-encodes strings
   so the visual-editing overlays can map content back to fields.
   Only ever used while Next draft mode is enabled — the published
   site never touches it. */
export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: readToken,
  perspective: "drafts",
  stega: { studioUrl: "/studio" },
});
