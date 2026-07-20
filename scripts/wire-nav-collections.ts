/**
 * Wires the navigation and collections to the imported SDR catalog:
 *
 *   1. New collections for the real range:
 *      - New Arrivals (smart, whole catalog, newest first)
 *      - Accessories (smart, tag == accessories, under Shop All)
 *      - Sun Day Red x Vessel / Headcovers / Gloves / Bags /
 *        On Course (manual, membership derived from the captured
 *        catalog's product names)
 *   2. Refreshes "Summer Picks" (the Gear dropdown's image card) with
 *      real products — it referenced the retired lorem set.
 *   3. Rewires the navigation menu in place: every category label
 *      gets a collection reference (so it routes to its PLP), and the
 *      Footwear dropdown's product grid becomes the real shoe line.
 *      Labels with no matching collection (e.g. "Final Few") are left
 *      untouched for manual curation; nav images/keys are preserved.
 *
 * Women's category links point at the GLOBAL category collections:
 * the captured catalog is almost entirely unisex/mens-flagged, so the
 * gendered womens-* collections would render near-empty PLPs.
 *
 * Run locally (needs your Sanity login), after import-sdr-catalog:
 *   npx sanity exec scripts/wire-nav-collections.ts --with-user-token
 *
 * Idempotent: fixed collection ids + an in-place nav transform that
 * only sets references, so re-runs converge to the same state.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-07-01" });

let keyCounter = 0;
const key = () => `wire${(keyCounter++).toString().padStart(3, "0")}`;
const refk = (id: string) => ({ _type: "reference" as const, _key: key(), _ref: id });

/* must mirror scripts/import-sdr-catalog.ts so ids line up */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

async function run() {
  const catalog = JSON.parse(
    readFileSync(path.join(process.cwd(), "design/sdr-catalog/products.json"), "utf8"),
  ) as { products: { name: string }[] };
  /* unique product names in capture order → imported document ids */
  const names = [...new Set(catalog.products.map((p) => p.name))];
  const idsMatching = (re: RegExp, limit = 100) =>
    names
      .filter((n) => re.test(n))
      .slice(0, limit)
      .map((n) => `sdr-${slugify(n)}`);

  /* borrow a member product's first image so collection cards render */
  const imageOf = async (productId: string | undefined) => {
    if (!productId) return undefined;
    const image = await client.fetch(`*[_id == $id][0].images[0]`, { id: productId });
    return image ? { ...image, _key: undefined } : undefined;
  };

  /* ---------- 1. collections for the real range ---------- */
  const manualCol = async (id: string, title: string, slug: string, productIds: string[]) => {
    if (!productIds.length) {
      console.log(`- skipping ${title}: no matching products`);
      return false;
    }
    await client.createOrReplace({
      _id: id,
      _type: "collection",
      title,
      slug: { _type: "slug", current: slug },
      description: `The real ${title} range from the captured catalog.`,
      image: await imageOf(productIds[0]),
      type: "manual",
      products: productIds.map(refk),
      sortOrder: "manual",
    });
    console.log(`✓ ${title} (${productIds.length} products)`);
    return true;
  };

  await client.createOrReplace({
    _id: "collection-new-arrivals",
    _type: "collection",
    title: "New Arrivals",
    slug: { _type: "slug", current: "new-arrivals" },
    description: "The latest from Sun Day Red.",
    image: await imageOf(idsMatching(/rain jacket/i)[0]),
    type: "smart",
    match: "all",
    rules: [],
    sortOrder: "newest",
  });
  console.log("✓ New Arrivals (smart, newest first)");

  await client.createOrReplace({
    _id: "collection-accessories",
    _type: "collection",
    title: "Accessories",
    slug: { _type: "slug", current: "accessories" },
    description: "Gloves, headcovers, bags and on-course gear.",
    image: await imageOf(idsMatching(/headcover/i)[0]),
    type: "smart",
    match: "all",
    rules: [
      { _type: "collectionRule", _key: key(), field: "tag", operator: "eq", value: "accessories" },
    ],
    sortOrder: "newest",
    parent: { _type: "reference", _ref: "collection-shop-all" },
  });
  console.log("✓ Accessories (smart, tag == accessories)");

  /* Shop All (smart, no rules) already contains the whole active
     catalog — but its category chips only covered the apparel tags.
     Extend them to the full real range. */
  const CHIPS = [
    "polos",
    "tshirts",
    "sweaters",
    "hoodies",
    "outerwear",
    "pants",
    "shorts",
    "footwear",
    "headwear",
    "accessories",
  ];
  await client
    .patch("collection-shop-all")
    .set({ subcategories: CHIPS.map((t) => refk(`collection-${t}`)) })
    .commit()
    .then(() => console.log(`✓ Shop All chips → ${CHIPS.length} categories`))
    .catch(() => console.log("- Shop All collection not found, skipped"));

  await manualCol(
    "collection-vessel",
    "Sun Day Red x Vessel",
    "sun-day-red-x-vessel",
    idsMatching(/vessel/i),
  );
  await manualCol(
    "collection-headcovers",
    "Headcovers",
    "headcovers",
    idsMatching(/headcover|blade cover/i),
  );
  await manualCol("collection-gloves", "Gloves", "gloves", idsMatching(/glove/i));
  await manualCol(
    "collection-bags",
    "Bags",
    "bags",
    idsMatching(/\bbag\b|luggage|organizer/i),
  );
  await manualCol(
    "collection-on-course",
    "On Course",
    "on-course",
    idsMatching(/\btees\b|marker|divot/i),
  );

  /* ---------- 2. Summer Picks → real products ---------- */
  const picks = [
    ...idsMatching(/3l rain jacket$/i, 1),
    ...idsMatching(/^pioneer cypress$/i, 1),
    ...idsMatching(/icon chain stitch hoodie/i, 1),
    ...idsMatching(/^icon polo ii$/i, 1),
    ...idsMatching(/^osprey/i, 1),
    ...idsMatching(/pacific luxe hoodie/i, 1),
  ];
  await client
    .patch("collection-summer-picks")
    .set({ products: picks.map(refk) })
    .commit()
    .then(() => console.log(`✓ Summer Picks → ${picks.length} real products`))
    .catch(() => console.log("- Summer Picks collection not found, skipped"));

  /* ---------- 3. rewire the navigation menu ---------- */
  const nav = await client.getDocument("navigation");
  if (!nav) {
    console.log("✗ navigation document not found — run scripts/seed.ts first");
    return;
  }

  /* label → collection id; "g:" prefix resolves per dropdown gender */
  const LINKS: Record<string, string> = {
    "new arrivals": "collection-new-arrivals",
    footwear: "collection-footwear",
    polos: "g:polos",
    "t-shirts": "g:tshirts",
    sweaters: "g:sweaters",
    "hoodies & pullovers": "g:hoodies",
    outerwear: "g:outerwear",
    shorts: "g:shorts",
    pants: "g:pants",
    joggers: "g:pants",
    headwear: "g:headwear",
    gloves: "collection-gloves",
    bags: "collection-bags",
    "golf bags": "collection-bags",
    "shoe bags": "collection-bags",
    totes: "collection-bags",
    headcovers: "collection-headcovers",
    tees: "collection-on-course",
    "ball markers": "collection-on-course",
    "sun day red x vessel": "collection-vessel",
    "mens footwear": "collection-mens-footwear",
    "womens footwear": "collection-womens-footwear",
  };
  const norm = (label: string) =>
    label.toLowerCase().replace(/['’]/g, "").replace(/\s+/g, " ").trim();

  type Doc = Record<string, any>;
  const resolveLink = (link: Doc, itemTitle: string) => {
    const target = LINKS[norm(link.label ?? "")];
    if (!target) return link;
    /* gendered categories: Men keeps mens-*; Women uses the global
       collection (the real catalog would leave womens-* nearly empty);
       other dropdowns (Gear) use the global category too */
    const id = target.startsWith("g:")
      ? itemTitle === "Men"
        ? `collection-mens-${target.slice(2)}`
        : `collection-${target.slice(2)}`
      : target;
    return { ...link, collection: { _type: "reference", _ref: id } };
  };

  const footwearGrid = [
    ...idsMatching(/^pioneer willow$/i, 1),
    ...idsMatching(/^pioneer cypress$/i, 1),
    ...idsMatching(/^pioneer magnolia$/i, 1),
    ...idsMatching(/^presidio$/i, 1),
    ...idsMatching(/^osprey$/i, 1),
    ...idsMatching(/jupiter slide/i, 1),
    /* top up in case a name above isn't in the capture */
    ...idsMatching(/cypress|willow|magnolia|presidio|osprey|slide/i),
  ]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 6);

  const items = (nav.items ?? []).map((item: Doc) => ({
    ...item,
    columns: item.columns?.map((column: Doc) => ({
      ...column,
      links: column.links?.map((link: Doc) => resolveLink(link, item.title)),
    })),
    ...(item.layout === "products"
      ? { products: footwearGrid.map(refk) }
      : {}),
  }));
  const companyLinks = (nav.companyLinks ?? []).map((link: Doc) =>
    resolveLink(link, ""),
  );
  await client.createOrReplace({ ...nav, items, companyLinks });
  console.log(`✓ navigation rewired (footwear grid: ${footwearGrid.length} shoes)`);

  console.log("\nDone. Dropdown links now route to real collection pages.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
