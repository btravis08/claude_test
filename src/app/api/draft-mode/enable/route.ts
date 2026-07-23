import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { readToken } from "@/sanity/env";
import { client } from "@/sanity/lib/client";

/* The Studio's Presentation tool opens the site through this route:
   next-sanity validates the request came from a Studio with access to
   the project (using the Viewer token), turns Next draft mode on, and
   redirects into the page being previewed. */
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: readToken }),
});
