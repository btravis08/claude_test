/**
 * Restores the SDR singletons that the sample-pack seed overwrote on
 * 2026-08-04 (page-home, navigation) and removes the pack's
 * siteSettings, returning the published dataset to its pre-pack
 * state. Content comes from design/restore/singletons-pre-pack.json,
 * captured from the Sanity history API at 2026-08-04T20:00Z.
 *
 * Studio drafts (drafts.page-home, drafts.navigation) are left
 * untouched — direct published writes don't go through them.
 *
 * Run locally (needs your Sanity login):
 *   npx sanity exec scripts/restore-singletons.ts --with-user-token
 *
 * Idempotent: createOrReplace with fixed ids; safe to re-run.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-07-01" });

async function run() {
  const file = path.join(process.cwd(), "design/restore/singletons-pre-pack.json");
  const { documents } = JSON.parse(readFileSync(file, "utf8")) as {
    documents: Array<Record<string, unknown> & { _id: string }>;
  };

  for (const doc of documents) {
    const clean = Object.fromEntries(
      Object.entries(doc).filter(
        ([k]) => !["_rev", "_system", "_createdAt", "_updatedAt"].includes(k),
      ),
    ) as { _id: string; _type: string };
    await client.createOrReplace(clean);
    console.log(`✓ restored published ${clean._id}`);
  }

  /* the pack created siteSettings; it did not exist pre-pack. The
     site renders its fallbacks without it. */
  try {
    await client.delete("siteSettings");
    console.log("✂ removed pack siteSettings");
  } catch (err) {
    console.log("siteSettings already gone or undeletable:", err);
  }

  console.log("\nDone — sundayred.vercel.app picks it up within the ~10min ISR window.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
