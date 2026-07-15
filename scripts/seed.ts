/**
 * One-shot seed for the SDR dataset:
 *   1. uploads the placeholder + campaign imagery as Sanity assets
 *   2. creates 120 products (24 per tag: footwear/pants/polos/headwear/
 *      tshirts, half mens half womens) with lorem names, prices, color
 *      variants, post dates spread over recent months, and up to 6
 *      images each — the placeholder image is always the thumbnail
 *   3. creates/replaces the "home" page; its product sliders pull
 *      products automatically by tag (footwear / polos / all)
 *
 * Run locally (needs your Sanity login):
 *   npx sanity exec scripts/seed.ts --with-user-token
 *
 * Idempotent: fixed document ids and a seeded RNG, so re-running
 * resets everything to the same state.
 */
import { createReadStream } from "node:fs";
import path from "node:path";

import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-07-01" });

/* Deterministic RNG so re-runs produce identical documents */
let rngState = 20260715;
function rng() {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];

let keyCounter = 0;
const key = () => `seed${(keyCounter++).toString().padStart(3, "0")}`;

const WORDS = [
  "Lorem", "Ipsum", "Dolor", "Amet", "Cursus", "Vestibulum",
  "Feugiat", "Sodales", "Aliquam", "Tempor", "Magna", "Ornare",
];
const COLORS = ["Lorem", "Ipsum", "Dolor", "Sit", "Amet", "Elit", "Magna", "Quam"];
const TAGS = ["footwear", "pants", "polos", "headwear", "tshirts"];
const PRODUCT_COUNT = 120; // 24 per tag
/* Post dates walk back from a fixed base so re-runs stay identical */
const BASE_DATE = Date.UTC(2026, 6, 15);

const imageRef = (id: string) => ({
  _type: "image" as const,
  _key: key(),
  asset: { _type: "reference" as const, _ref: id },
});

async function uploadImage(filename: string, uploadAs = filename) {
  const filePath = path.join(process.cwd(), "public/figma", filename);
  const asset = await client.assets.upload("image", createReadStream(filePath), {
    filename: uploadAs,
  });
  console.log(`↑ ${uploadAs} → ${asset._id}`);
  return asset._id;
}

async function run() {
  /* 1 — assets */
  const placeholder = await uploadImage("placeholder.png", "sdr-placeholder.png");
  const campaign = await uploadImage("campaign.png");
  const portrait = await uploadImage("media-portrait.png");
  const shoe = await uploadImage("card-shoe.png");
  const pool = [campaign, portrait, shoe];

  /* 2 — products: primary tag round-robins so each tag gets 24, with a
     ~30% chance of a second tag on top */
  for (let i = 1; i <= PRODUCT_COUNT; i++) {
    const id = `product-seed-${String(i).padStart(3, "0")}`;
    const title = `${pick(WORDS)} ${pick(WORDS)}`;
    const primaryTag = TAGS[(i - 1) % TAGS.length];
    const tags = [primaryTag];
    if (rng() < 0.3) {
      const extra = pick(TAGS.filter((t) => t !== primaryTag));
      tags.push(extra);
    }
    const variantCount = 2 + Math.floor(rng() * 4); // 2–5 variants
    const variants = Array.from(
      { length: variantCount },
      () => `${pick(COLORS)} / ${pick(COLORS)}`,
    );
    const extraImages = Array.from(
      { length: Math.floor(rng() * 6) }, // 0–5 extra → up to 6 total
      () => imageRef(pick(pool)),
    );
    await client.createOrReplace({
      _id: id,
      _type: "product",
      title,
      slug: { _type: "slug", current: `${title.toLowerCase().replace(/\s+/g, "-")}-${i}` },
      gender: i % 2 === 1 ? "mens" : "womens",
      tags,
      postedAt: new Date(BASE_DATE - Math.floor(rng() * 180) * 86400000).toISOString(),
      price: `$${58 + Math.floor(rng() * 19) * 10}.00`,
      variants,
      images: [imageRef(placeholder), ...extraImages],
    });
    console.log(`✓ ${id} (${title}) [${tags.join(", ")}]`);
  }

  /* 3 — home page */
  const image = (id: string) => ({
    _type: "image" as const,
    asset: { _type: "reference" as const, _ref: id },
  });

  await client.createOrReplace({
    _id: "page-home",
    _type: "page",
    title: "Homepage",
    slug: { _type: "slug", current: "home" },
    sections: [
      {
        _type: "sectionHero",
        _key: key(),
        colorMode: "dark",
        eyebrow: "JUST ARRIVED",
        headline: "Spring Traditions",
        align: "left",
        primaryCta: "SHOP SPRING TRADITIONS",
        secondaryCta: "Secondary Button",
        image: image(campaign),
      },
      {
        _type: "sectionInfoSlider",
        _key: key(),
        colorMode: "light",
        title: "Explore Sun Day Red",
        cards: ["Footwear", "Polos", "Headwear", "T-Shirts"].map((title) => ({
          _type: "infoCard",
          _key: key(),
          title,
          image: image(portrait),
        })),
      },
      {
        _type: "sectionFullWidth",
        _key: key(),
        colorMode: "dark",
        eyebrow: "JUST ARRIVED",
        headline: "Spring Traditions",
        align: "center",
        primaryCta: "SHOP SPRING TRADITIONS",
        secondaryCta: "Secondary Button",
        image: image(campaign),
      },
      {
        _type: "sectionCarousel",
        _key: key(),
        colorMode: "light",
        eyebrow: "Shop Footwear",
        items: ["Pioneer→", "Presidio", "Osprey", "Cardinal", "Jupiter"],
        description:
          "Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget convallis lorem faucibus tortor in. Cursus feugiat feugiat a quam vestibulum dignissim sem ullamcorper.",
        image: image(portrait),
      },
      {
        _type: "sectionFiftyFifty",
        _key: key(),
        colorMode: "dark",
        panels: ["Women’s Apparel", "Men’s Apparel"].map((title) => ({
          _type: "panel",
          _key: key(),
          title,
          image: image(campaign),
        })),
      },
      {
        _type: "sectionProductSlider",
        _key: key(),
        colorMode: "light",
        title: "Best Sellers",
        source: "auto",
        tag: "footwear",
      },
      {
        _type: "sectionProductSlider",
        _key: key(),
        colorMode: "light",
        title: "Best Sellers",
        source: "auto",
        tag: "polos",
      },
      {
        _type: "sectionFullWidth",
        _key: key(),
        colorMode: "dark",
        eyebrow: "JUST ARRIVED",
        headline: "TW Performance",
        align: "left",
        primaryCta: "shop tw performance",
        image: image(campaign),
      },
      {
        _type: "sectionProductSlider",
        _key: key(),
        colorMode: "light",
        source: "auto",
        tag: "all",
      },
    ],
  });

  /* 4 — remove stale seed products from earlier runs (safe now that the
     home page no longer references them) */
  const stale = await client.fetch<string[]>(
    `*[_type == "product" && _id match "product-seed-*"]._id`,
  );
  const current = new Set(
    Array.from({ length: PRODUCT_COUNT }, (_, i) =>
      `product-seed-${String(i + 1).padStart(3, "0")}`,
    ),
  );
  const toDelete = stale.filter((id) => !current.has(id));
  for (const id of toDelete) await client.delete(id);
  if (toDelete.length) console.log(`✂ removed ${toDelete.length} stale seed products`);

  console.log(
    `✓ seeded page-home with 9 sections and ${PRODUCT_COUNT} tagged products`,
  );
  console.log("Open /studio → Page → Homepage, or Product, to edit.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
