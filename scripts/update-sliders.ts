/**
 * Fills every product slider on the "home" page with the full product
 * catalog (up to 24), leaving all other sections and edits untouched.
 *
 * Run locally (needs your Sanity login):
 *   npx sanity exec scripts/update-sliders.ts --with-user-token
 */
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-07-01" });

let keyCounter = 0;
const key = () => `ref${Date.now().toString(36)}${(keyCounter++).toString(36)}`;

type Section = { _type: string; _key: string; [k: string]: unknown };

async function run() {
  const ids = await client.fetch<string[]>(
    `*[_type == "product"] | order(_createdAt asc)[0...24]._id`,
  );
  if (!ids.length) {
    console.error("No products found — run scripts/seed.ts first.");
    process.exit(1);
  }

  const page = await client.fetch<{ _id: string; sections?: Section[] } | null>(
    `*[_type == "page" && slug.current == "home"][0]{ _id, sections }`,
  );
  if (!page?.sections?.length) {
    console.error("No home page with sections found — run scripts/seed.ts first.");
    process.exit(1);
  }

  const refs = () =>
    ids.map((id) => ({ _type: "reference" as const, _key: key(), _ref: id }));

  let updated = 0;
  const sections = page.sections.map((section) => {
    if (section._type !== "sectionProductSlider") return section;
    updated++;
    return { ...section, products: refs() };
  });

  await client.patch(page._id).set({ sections }).commit();
  console.log(`✓ filled ${updated} product slider(s) with ${ids.length} products each`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
