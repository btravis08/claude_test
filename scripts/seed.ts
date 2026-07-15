/**
 * One-shot seed for the SDR dataset:
 *   1. uploads the placeholder + campaign imagery as Sanity assets
 *   2. creates 24 products (12 mens / 12 womens) with lorem names,
 *      prices, color variants, and up to 6 images each — the
 *      placeholder image is always first, so it's the card thumbnail
 *   3. creates/replaces the "home" page built from sections whose
 *      product sliders reference the seeded products
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

  /* 2 — 24 products */
  const productIds: string[] = [];
  for (let i = 1; i <= 24; i++) {
    const id = `product-seed-${String(i).padStart(2, "0")}`;
    const title = `${pick(WORDS)} ${pick(WORDS)}`;
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
      price: `$${58 + Math.floor(rng() * 19) * 10}.00`,
      variants,
      images: [imageRef(placeholder), ...extraImages],
    });
    productIds.push(id);
    console.log(`✓ ${id} (${title})`);
  }

  /* 3 — home page */
  const productRefs = (ids: string[]) =>
    ids.map((id) => ({ _type: "reference" as const, _key: key(), _ref: id }));
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
        products: productRefs(productIds),
      },
      {
        _type: "sectionProductSlider",
        _key: key(),
        colorMode: "light",
        title: "Best Sellers",
        products: productRefs(productIds),
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
        products: productRefs(productIds),
      },
    ],
  });

  console.log("✓ seeded page-home with 9 sections and 24 products");
  console.log("Open /studio → Page → Homepage, or Product, to edit.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
