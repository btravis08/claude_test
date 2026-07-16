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
const TYPE_LABEL: Record<string, string> = {
  footwear: "Footwear",
  pants: "Pants",
  polos: "Polos",
  headwear: "Headwear",
  tshirts: "T-Shirts",
};
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
  { file: "products/presidio-blue.png", hoverFile: "products/presidio-blue-hover.png", name: "White / Blue", color: "#4b74ad" },
  { file: "products/presidio-navy.png", hoverFile: "products/presidio-navy-hover.png", name: "Gray / Navy", color: "#9aa0a8" },
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
    // Shopify-style commerce data: numeric pricing (some on sale),
    // cost per item, options, and per-variant SKU + tracked inventory
    const price = 58 + Math.floor(rng() * 19) * 10;
    const onSale = rng() < 0.25;
    const sizeValues =
      primaryTag === "footwear" ? ["8", "9", "10", "11", "12"] : ["S", "M", "L", "XL"];
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
        selectedOptions: [
          { _type: "selectedOption", _key: key(), option: "Color", value: color.name },
        ],
        sku: `SDR-${String(i).padStart(3, "0")}-${color.name.slice(0, 3).toUpperCase()}`,
        barcode: String(700000000000 + i * 7919 + idx * 101),
        // ~10% of variants sit at zero stock for the inventory views
        inventory: {
          track: true,
          quantity: rng() < 0.1 ? 0 : 1 + Math.floor(rng() * 120),
          continueSelling: false,
        },
      };
    });
    const extraImages = Array.from(
      { length: Math.floor(rng() * 4) }, // up to 6 total with thumb + hover
      () => imageRef(pick(pool)),
    );
    await client.createOrReplace({
      _id: id,
      _type: "product",
      // a few drafts to exercise the status views; they never render
      status: rng() < 0.05 ? "draft" : "active",
      title,
      slug: { _type: "slug", current: `${title.toLowerCase().replace(/\s+/g, "-")}-${i}` },
      vendor: "Sun Day Red",
      productType: TYPE_LABEL[primaryTag],
      gender: i % 2 === 1 ? "mens" : "womens",
      tags,
      postedAt: new Date(BASE_DATE - Math.floor(rng() * 180) * 86400000).toISOString(),
      pricing: {
        price,
        ...(onSale ? { compareAtPrice: price + 30 } : {}),
        costPerItem: Math.round(price * 0.45),
        chargeTax: true,
      },
      options: [
        {
          _type: "productOption",
          _key: key(),
          name: "Color",
          values: variants.map((variant) => variant.name.split(" / ")[0]),
        },
        { _type: "productOption", _key: key(), name: "Size", values: sizeValues },
      ],
      variants,
      shipping: { physical: true, weight: 200 + Math.floor(rng() * 600), weightUnit: "g" },
      seo: { title, description: `${title} — Sun Day Red.` },
      // images[0] = card thumbnail, images[1] = full-bleed hover image
      images: [imageRef(placeholder), imageRef(campaign), ...extraImages],
    });
    console.log(`✓ ${id} (${title}) [${tags.join(", ")}] $${price}${onSale ? " SALE" : ""}`);
  }

  /* 2b — the example Presidio with real colorway imagery */
  const presidioImages: (string | null)[] = [];
  const presidioHovers: (string | null)[] = [];
  for (const variant of PRESIDIO_VARIANTS) {
    presidioImages.push(await uploadIfExists(variant.file));
    presidioHovers.push(await uploadIfExists(variant.hoverFile));
  }
  const PRESIDIO_STOCK = [24, 12, 0, 36, 8];
  await client.createOrReplace({
    _id: "product-presidio",
    _type: "product",
    status: "active",
    title: "Presidio",
    slug: { _type: "slug", current: "presidio" },
    vendor: "Sun Day Red",
    productType: "Footwear",
    gender: "mens",
    tags: ["footwear"],
    // newest post date so it leads every footwear/all slider
    postedAt: new Date(BASE_DATE + 86400000).toISOString(),
    pricing: { price: 198, costPerItem: 86, chargeTax: true },
    options: [
      {
        _type: "productOption",
        _key: key(),
        name: "Color",
        values: PRESIDIO_VARIANTS.map((variant) => variant.name),
      },
      {
        _type: "productOption",
        _key: key(),
        name: "Size",
        values: ["8", "9", "10", "11", "12", "13"],
      },
    ],
    variants: PRESIDIO_VARIANTS.map((variant, i) => ({
      _type: "productVariant",
      _key: key(),
      name: variant.name,
      color: variant.color,
      image: imageRef(presidioImages[i] ?? placeholder),
      hoverImage: imageRef(presidioHovers[i] ?? campaign),
      selectedOptions: [
        { _type: "selectedOption", _key: key(), option: "Color", value: variant.name },
      ],
      // the red colorway demos a per-variant sale override
      ...(variant.name === "White / Red" ? { price: 178, compareAtPrice: 198 } : {}),
      sku: `PRES-${variant.name.split(" / ").map((part) => part.slice(0, 3).toUpperCase()).join("-")}`,
      barcode: String(701000000000 + i),
      inventory: { track: true, quantity: PRESIDIO_STOCK[i], continueSelling: false },
    })),
    shipping: { physical: true, weight: 380, weightUnit: "g" },
    seo: {
      title: "Presidio — Sun Day Red",
      description: "The Presidio spikeless golf shoe in five colorways.",
    },
    images: [
      imageRef(presidioImages[0] ?? placeholder),
      imageRef(presidioHovers[0] ?? campaign),
    ],
  });
  console.log("✓ product-presidio (5 colorways)");

  /* 2c — collections: smart (rule-driven) + a manual example */
  const image = (id: string) => ({
    _type: "image" as const,
    asset: { _type: "reference" as const, _ref: id },
  });
  const ruleKey = () => ({ _type: "collectionRule", _key: key() });
  const smartCollections = [
    { id: "collection-footwear", title: "Footwear", field: "tag", value: "footwear" },
    { id: "collection-polos", title: "Polos", field: "tag", value: "polos" },
    { id: "collection-mens", title: "Mens", field: "gender", value: "mens" },
    { id: "collection-womens", title: "Womens", field: "gender", value: "womens" },
  ];
  for (const { id, title, field, value } of smartCollections) {
    await client.createOrReplace({
      _id: id,
      _type: "collection",
      title,
      slug: { _type: "slug", current: title.toLowerCase() },
      description: `All ${title.toLowerCase()} — pulled in automatically.`,
      image: image(campaign),
      type: "smart",
      match: "all",
      rules: [{ ...ruleKey(), field, operator: "eq", value }],
      sortOrder: "newest",
    });
  }
  await client.createOrReplace({
    _id: "collection-summer-picks",
    _type: "collection",
    title: "Summer Picks",
    slug: { _type: "slug", current: "summer-picks" },
    description: "Hand-picked for the season, shown in this order.",
    image: image(campaign),
    type: "manual",
    products: [
      "product-presidio",
      "product-seed-003",
      "product-seed-001",
      "product-seed-004",
      "product-seed-005",
      "product-seed-002",
    ].map((ref) => ({ _type: "reference", _key: key(), _ref: ref })),
    sortOrder: "manual",
  });
  console.log("✓ 4 collections (3 smart, 1 manual)");

  /* 2d — discounts: one of each Shopify type */
  const discounts: Array<{ _id: string; _type: string } & Record<string, unknown>> = [
    {
      _id: "discount-summer-sale",
      _type: "discount",
      title: "Summer Sale",
      status: "active",
      method: "automatic",
      type: "percentage",
      value: 20,
      appliesTo: "collections",
      collections: [
        { _type: "reference", _key: key(), _ref: "collection-polos" },
      ],
      minimumRequirement: { type: "none" },
      combinesWith: { productDiscounts: false, shippingDiscounts: true },
      startsAt: new Date(BASE_DATE - 30 * 86400000).toISOString(),
    },
    {
      _id: "discount-welcome10",
      _type: "discount",
      title: "Welcome 10",
      status: "active",
      method: "code",
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      appliesTo: "all",
      minimumRequirement: { type: "amount", value: 100 },
      usageLimit: 500,
      oncePerCustomer: true,
      combinesWith: { productDiscounts: false, shippingDiscounts: true },
      startsAt: new Date(BASE_DATE - 30 * 86400000).toISOString(),
    },
    {
      _id: "discount-freeship50",
      _type: "discount",
      title: "Free shipping over $50",
      status: "active",
      method: "code",
      code: "FREESHIP50",
      type: "freeShipping",
      minimumRequirement: { type: "amount", value: 50 },
      oncePerCustomer: false,
      combinesWith: { productDiscounts: true, shippingDiscounts: false },
      startsAt: new Date(BASE_DATE - 30 * 86400000).toISOString(),
    },
    {
      _id: "discount-polo-b2g1",
      _type: "discount",
      title: "Buy 2 polos get 1 free",
      status: "draft",
      method: "automatic",
      type: "buyXGetY",
      buyXGetY: {
        buyQuantity: 2,
        getQuantity: 1,
        discountPercent: 100,
      },
      minimumRequirement: { type: "none" },
      combinesWith: { productDiscounts: false, shippingDiscounts: false },
      startsAt: new Date(BASE_DATE).toISOString(),
    },
  ];
  for (const doc of discounts) await client.createOrReplace(doc);
  console.log("✓ 4 discounts (20% polos auto, WELCOME10, FREESHIP50, B2G1 draft)");

  /* 2d½ — navigation singleton (Shopify-style menu). Layouts mirror
     the Figma dropdowns: columns+image card, product grid, image cards */
  const navLink = (label: string, collection?: string) => ({
    _type: "navLink",
    _key: key(),
    label,
    url: "#",
    ...(collection
      ? { collection: { _type: "reference", _ref: collection } }
      : {}),
  });
  const navColumn = (title: string, labels: string[]) => ({
    _type: "navColumn",
    _key: key(),
    title,
    links: labels.map((label) => navLink(label)),
  });
  const featuredColumn = () =>
    navColumn("Featured", [
      "New Arrivals",
      "The Coral Standard",
      "Training Gear",
      "First Light Collection",
      "Footwear",
      "Final Few",
    ]);
  await client.createOrReplace({
    _id: "navigation",
    _type: "navigation",
    items: [
      {
        _type: "navItem",
        _key: key(),
        title: "Men",
        layout: "columns",
        columns: [
          featuredColumn(),
          navColumn("Tops", ["Polos", "T-Shirts", "Sweaters", "Hoodies & Pullovers", "Outerwear"]),
          navColumn("Bottoms", ["Shorts", "Pants", "Joggers"]),
          navColumn("Accessories", ["Headwear", "Gloves", "Bags", "Socks", "Outerwear"]),
        ],
        imageCollection: { _type: "reference", _ref: "collection-mens" },
        imageTitle: "Men’s Apparel",
        image: image(campaign),
      },
      {
        _type: "navItem",
        _key: key(),
        title: "Women",
        layout: "columns",
        columns: [
          featuredColumn(),
          navColumn("Tops", ["Polos", "T-Shirts", "Sweaters", "Hoodies & Pullovers"]),
          navColumn("Bottoms", ["Shorts", "Skirts", "Pants", "Joggers"]),
          navColumn("Accessories", ["Headwear", "Gloves", "Bags", "Socks"]),
        ],
        imageCollection: { _type: "reference", _ref: "collection-womens" },
        imageTitle: "Women’s Apparel",
        image: image(portrait),
      },
      {
        _type: "navItem",
        _key: key(),
        title: "Footwear",
        layout: "products",
        columns: [navColumn("Footwear", ["Men’s Footwear", "Women’s Footwear"])],
        products: [
          "product-presidio",
          "product-seed-001",
          "product-seed-006",
          "product-seed-011",
          "product-seed-016",
          "product-seed-021",
        ].map((ref) => ({ _type: "reference", _key: key(), _ref: ref })),
      },
      {
        _type: "navItem",
        _key: key(),
        title: "Gear",
        layout: "columns",
        columns: [
          navColumn("Featured", ["New Arrivals", "Sun Day Red x Vessel", "Tiger’s Favorites"]),
          navColumn("Bags & Headcovers", ["Golf Bags", "Headcovers", "Shoe Bags", "Totes"]),
          navColumn("Wearables", ["Headwear", "Gloves", "Socks"]),
          navColumn("On Course", ["Tees", "Ball Markers"]),
        ],
        imageCollection: { _type: "reference", _ref: "collection-summer-picks" },
        imageTitle: "Gear",
        image: image(campaign),
      },
      {
        _type: "navItem",
        _key: key(),
        title: "Explore",
        layout: "cards",
        cards: [
          { _type: "navCard", _key: key(), title: "The Legacy", image: image(campaign), url: "#" },
          { _type: "navCard", _key: key(), title: "Honors Journal", image: image(portrait), url: "#" },
          { _type: "navCard", _key: key(), title: "Team Sunday Red", image: image(shoe), url: "#" },
        ],
      },
    ],
    companyLinks: ["The Legacy", "Honors Journal", "Team Sun Day Red", "Careers"].map(
      (label) => navLink(label),
    ),
  });
  console.log("✓ navigation (5 items: columns / products / cards layouts)");

  /* 2e — store settings singleton */
  await client.createOrReplace({
    _id: "storeSettings",
    _type: "storeSettings",
    currency: "USD",
    locale: "en-US",
    showCompareAt: true,
    applyAutomaticDiscounts: true,
  });
  console.log("✓ storeSettings (USD)");

  /* 3 — home page */
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
        eyebrow: "Now Arriving",
        headline: "Spring Traditions",
        primaryCta: "Shop Collection",
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
        eyebrow: "Now Arriving",
        headline: "Spring Traditions",
        primaryCta: "Shop Collection",
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
        ratio: "5:4",
        panels: ["Women’s Apparel", "Men’s Apparel"].map((title) => ({
          _type: "panel",
          _key: key(),
          title,
          mediaKind: "image",
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
        eyebrow: "Now Arriving",
        headline: "TW Performance",
        primaryCta: "Shop Collection",
        image: image(campaign),
        // shop-the-look example: bag button lists these over the image
        mediaKind: "look",
        lookProducts: [
          { _type: "reference", _key: key(), _ref: "product-presidio" },
          { _type: "reference", _key: key(), _ref: "product-seed-003" },
        ],
      },
      {
        // untitled slider sourcing the manual collection
        _type: "sectionProductSlider",
        _key: key(),
        colorMode: "light",
        source: "collection",
        collection: { _type: "reference", _ref: "collection-summer-picks" },
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
