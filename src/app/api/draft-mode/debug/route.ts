import { NextResponse } from "next/server";

import { readToken } from "@/sanity/env";
import { client } from "@/sanity/lib/client";

/* TEMPORARY diagnostic for the Presentation 500 — remove once fixed.
   Reproduces exactly what the enable route does (read a preview-secret
   document with the Viewer token) and reports the outcome, so we can
   tell a missing token from an unreadable one without leaking the
   secret value. */
export async function GET() {
  const hasToken = Boolean(readToken);
  let secretRead: string;
  try {
    const doc = await client
      .withConfig({ token: readToken, useCdn: false })
      .fetch('*[_type == "sanity.previewUrlSecret"][0]{ _id }');
    secretRead = doc ? "ok: secret found" : "ok: no secret doc yet";
  } catch (error) {
    secretRead = `THREW: ${error instanceof Error ? error.message : String(error)}`;
  }
  return NextResponse.json({ hasToken, secretRead });
}
