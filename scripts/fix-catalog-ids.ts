/**
 * Repairs the imported catalog's visibility on the site.
 *
 * The importer originally gave products ids like "sdr.pioneer-cypress".
 * Ids containing a dot are namespaced/path ids in Sanity — excluded
 * from the `published` perspective the website queries with — so the
 * imported products were invisible to the site (scripts and the API's
 * raw perspective still saw them, which is why the import looked
 * successful). This migrates every "sdr.<slug>" product to
 * "sdr-<slug>", after printing a diagnosis of what each perspective
 * can see.
 *
 * Run locally (needs your Sanity login):
 *   npx sanity exec scripts/fix-catalog-ids.ts --with-user-token
 *
 * Then re-run the nav/collection wiring (updated to the new ids):
 *   npx sanity exec scripts/wire-nav-collections.ts --with-user-token
 */
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-07-01" });
const published = client.withConfig({ perspective: "published", useCdn: false });

async function run() {
  /* ---------- diagnosis ---------- */
  const rawActive = await client.fetch<number>(
    `count(*[_type == "product" && status == "active"])`,
  );
  const pubActive = await published.fetch<number>(
    `count(*[_type == "product" && status == "active"])`,
  );
  const dotted = await client.fetch<{ _id: string }[]>(
    `*[_type == "product" && _id in path("sdr.*")]{ _id }`,
  );
  console.log(`active products — raw perspective: ${rawActive}, published (what the site sees): ${pubActive}`);
  console.log(`dot-id products to migrate: ${dotted.length}\n`);
  if (!dotted.length) {
    console.log("Nothing to migrate. If the site still looks empty, send me these counts.");
    return;
  }

  /* ---------- migrate sdr.<slug> → sdr-<slug> ---------- */
  let moved = 0;
  for (const { _id } of dotted) {
    const doc = await client.getDocument(_id);
    if (!doc) continue;
    const newId = _id.replace(/^sdr\./, "sdr-");
    await client.createOrReplace({ ...doc, _id: newId });
    await client.delete(_id);
    moved += 1;
    if (moved % 20 === 0) console.log(`  ${moved}/${dotted.length}…`);
  }
  console.log(`\n✓ migrated ${moved} products to visible ids`);

  const pubAfter = await published.fetch<number>(
    `count(*[_type == "product" && status == "active"])`,
  );
  console.log(`published-perspective active products now: ${pubAfter}`);
  console.log("\nNow re-run: npx sanity exec scripts/wire-nav-collections.ts --with-user-token");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
