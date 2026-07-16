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
import { createReadStream, existsSync } from "node:fs";
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
/* Sample color set for variant swatches */
const PALETTE = [
  { name: "White", hex: "#f4f4f2" },
  { name: "Black", hex: "#161716" },
  { name: "Navy", hex: "#232c3b" },
  { name: "Sky", hex: "#c9d7e4" },
  { name: "Gray", hex: "#9d9e9b" },
  { name: "Sand", hex: "#d6cec2" },
  { name: "Red", hex: "#7a1f1f" },
];
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

async function uploadIfExists(filename: string): Promise<string | null> {
  const filePath = path.join(process.cwd(), "public/figma", filename);
  if (!existsSync(filePath)) {
    console.warn(`⚠ missing ${filename} — using placeholder for this variant`);
    return null;
  }
  return uploadImage(filename);
}

/* The example Presidio product: real colorway imagery dropped into
   public/figma/products/. Each colorway carries its own full-bleed
   hover image (shown while the card is hovered — clicking a swatch
   mid-hover crossfades this hover image, not just the product shot) */
const PRESIDIO_VARIANTS = [
  { file: "products/presidio-white.png", hoverFile: "products/presidio-white-hover.png", name: "White / White", color: "#f4f4f2" },
  { file: "products/presidio-red.png", hoverFile: "products/presidio-red-hover.png", name: "White / Red", color: "#b01f24" },
  { file: "products/presidio-black.png", hoverFile: "products/presidio-black-hover.png", name: "Black / White", color: "#161716" },
  { file: "products/presidio-sky.png", hoverFile: "products/presidio-sky-hover.png", name: "White / Sky", color: "#7ea8d4" },
  { file: "products/presidio-gray.png", hoverFile: "products/presidio-gray-hover.png", name: "Gray / Navy", color: "#9aa0a8" },
];

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
    // 2–5 variants with distinct swatch colors from the sample palette
    const variantCount = 2 + Math.floor(rng() * 4);
    const shuffled = [...PALETTE].sort(() => rng() - 0.5);
    const variants = shuffled.slice(0, variantCount).map((color, idx) => {
      const accent = pick(PALETTE.filter((p) => p.name !== color.name));
      return {
        _type: "productVariant",
        _key: key(),
        name: `${color.name} / ${accent.name}`,
        color: color.hex,
        // cycle the pool so adjacent variants always swap to a
        // visibly different image — and offset the hover image so a
        // swatch click also visibly changes the hover state
        image: imageRef(pool[idx % pool.length]),
        hoverImage: imageRef(pool[(idx + 1) % pool.length]),
      };
    });
    const extraImages = Array.from(
      { length: Math.floor(rng() * 4) }, // up to 6 total with thumb + hover
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
      // images[0] = card thumbnail, images[1] = full-bleed hover image
      images: [imageRef(placeholder), imageRef(campaign), ...extraImages],
    });
    console.log(`✓ ${id} (${title}) [${tags.join(", ")}]`);
  }

  /* 2b — the example Presidio with real colorway imagery */
  const presidioImages: (string | null)[] = [];
  const presidioHovers: (string | null)[] = [];
  for (const variant of PRESIDIO_VARIANTS) {
    presidioImages.push(await uploadIfExists(variant.file));
    presidioHovers.push(await uploadIfExists(variant.hoverFile));
  }
  await client.createOrReplace({
    _id: "product-presidio",
    _type: "product",
    title: "Presidio",
    slug: { _type: "slug", current: "presidio" },
    gender: "mens",
    tags: ["footwear"],
    // newest post date so it leads every footwear/all slider
    postedAt: new Date(BASE_DATE + 86400000).toISOString(),
    price: "$198.00",
    variants: PRESIDIO_VARIANTS.map((variant, i) => ({
      _type: "productVariant",
      _key: key(),
      name: variant.name,
      color: variant.color,
      image: imageRef(presidioImages[i] ?? placeholder),
      hoverImage: imageRef(presidioHovers[i] ?? campaign),
    })),
    images: [
      imageRef(presidioImages[0] ?? placeholder),
      imageRef(presidioHovers[0] ?? campaign),
    ],
  });
  console.log("✓ product-presidio (5 colorways)");

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
        items: ["Pioneer", "Presidio", "Osprey", "Cardinal", "Jupiter"].map(
          (title, i) => ({
            _type: "carouselItem",
            _key: key(),
            title,
            description: `${title} — Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget convallis lorem faucibus tortor in. Cursus feugiat a quam vestibulum dignissim sem ullamcorper.`,
            image: image(i % 2 === 0 ? portrait : campaign),
          }),
        ),
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
