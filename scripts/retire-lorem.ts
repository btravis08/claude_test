/**
 * Retires the 120 lorem seed products (product-seed-*) to Draft so
 * only the real imported SDR catalog renders on the site — carousels,
 * collections, and the PLP all filter to status == "active".
 *
 * Nothing is deleted; flip any back to Active in the Studio if needed.
 *
 * Run locally (needs your Sanity login):
 *   npx sanity exec scripts/retire-lorem.ts --with-user-token
 */
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-07-01" });

async function run() {
  const ids = await client.fetch<string[]>(
    `*[_type == "product" && _id match "product-seed-*" && status == "active"]._id`,
  );
  if (!ids.length) {
    console.log("No active lorem products found — nothing to do.");
    return;
  }
  let tx = client.transaction();
  for (const id of ids) tx = tx.patch(id, (p) => p.set({ status: "draft" }));
  await tx.commit();
  console.log(`Retired ${ids.length} lorem products to Draft.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
