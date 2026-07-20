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

  /* ---------- migrate sdr.<slug> → sdr-<slug> ----------
     Three phases, because collections/navigation may already hold
     strong references to the dot ids (Sanity refuses to delete a
     referenced document):
       1. create the dash-id copies
       2. rewrite _refs in every referencing document
       3. delete the dot-id originals */
  const dottedIds = dotted.map((d) => d._id);

  let copied = 0;
  for (const _id of dottedIds) {
    const doc = await client.getDocument(_id);
    if (!doc) continue;
    const { _rev, _createdAt, _updatedAt, ...rest } = doc as Record<string, unknown>;
    void _rev;
    void _createdAt;
    void _updatedAt;
    await client.createOrReplace({
      ...(rest as { _type: string }),
      _id: _id.replace(/^sdr\./, "sdr-"),
    });
    copied += 1;
    if (copied % 20 === 0) console.log(`  copied ${copied}/${dottedIds.length}…`);
  }
  console.log(`✓ copied ${copied} products to dash ids`);

  /* rewrite refs anywhere they occur (collections, navigation, …) */
  const fixRefs = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(fixRefs);
    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] =
          k === "_ref" && typeof v === "string" && v.startsWith("sdr.")
            ? v.replace(/^sdr\./, "sdr-")
            : fixRefs(v);
      }
      return out;
    }
    return value;
  };
  const referencers = await client.fetch<{ _id: string }[]>(
    `*[references($ids)]{ _id }`,
    { ids: dottedIds },
  );
  for (const { _id } of referencers) {
    const doc = await client.getDocument(_id);
    if (!doc) continue;
    await client.createOrReplace(fixRefs(doc) as { _id: string; _type: string });
    console.log(`  ✓ rewrote references in ${_id}`);
  }

  let deleted = 0;
  for (const _id of dottedIds) {
    try {
      await client.delete(_id);
      deleted += 1;
    } catch (e) {
      console.log(`  ! could not delete ${_id}: ${(e as Error).message.slice(0, 120)}`);
    }
  }
  console.log(`\n✓ migrated ${copied} products (${deleted} old ids removed)`);

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
