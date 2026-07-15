/**
 * Uploads the section-builder placeholder image to the Sanity dataset.
 * New sections added in the Studio pre-fill their image fields with
 * this asset (the schema initial values look it up by filename).
 *
 * Run locally (needs your Sanity login):
 *   npx sanity exec scripts/seed-placeholder.ts --with-user-token
 */
import { createReadStream } from "node:fs";
import path from "node:path";

import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-07-01" });

async function run() {
  const filePath = path.join(process.cwd(), "public/figma/placeholder.png");
  const asset = await client.assets.upload("image", createReadStream(filePath), {
    filename: "sdr-placeholder.png",
  });
  console.log(`✓ placeholder asset ready: ${asset._id}`);
  console.log("New sections in the Studio will now pre-fill with this image.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
