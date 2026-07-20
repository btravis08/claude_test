/**
 * Imports the captured sundayred.com catalog into Sanity:
 *   design/sdr-catalog/products.json  →  product documents
 *   public/sdr/<sku>/<n>.jpg          →  Sanity image assets
 *
 * The capture is one entry per COLORWAY (483 across 164 products —
 * e.g. "Icon Chain Stitch Hoodie" appears 18 times with distinct
 * SKUs). Entries are grouped by product name: one document per
 * product, one variant per colorway, each variant carrying its own
 * card image, hover image, SKU, price override, and a swatch color
 * sampled from its product shot.
 *
 * Run locally (needs your Sanity login):
 *   npx sanity exec scripts/import-sdr-catalog.ts --with-user-token
 *
 * Optional: also retire the 120 lorem seed products to Draft so only
 * real products render (does not delete them):
 *   npx sanity exec scripts/import-sdr-catalog.ts --with-user-token -- --retire-lorem
 *
 * Idempotent and Studio-safe:
 *   - product docs use fixed ids (sdr.<slug>) via createOrReplace, so
 *     re-runs refresh exactly these documents and nothing else — the
 *     home page, navigation, collections, and lorem products are
 *     never touched
 *   - image uploads are deduped by filename, so a re-run (or a run
 *     resumed after an interruption) skips everything already
 *     uploaded instead of duplicating assets
 */
import { createReadStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getCliClient } from "sanity/cli";
// sharp ships with Next — used to sample a swatch color per colorway
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require("sharp") as typeof import("sharp");

const client = getCliClient({ apiVersion: "2026-07-01" });
const RETIRE_LOREM = process.argv.includes("--retire-lorem");

type Captured = {
  url: string;
  sku: string;
  name: string;
  description: string | null;
  price: string | number | null;
  currency: string | null;
  availability: string | null;
  images: string[]; // "/sdr/<sku>/<n>.jpg" — files under public/
};

let keyCounter = 0;
const key = () => `sdr${(keyCounter++).toString().padStart(4, "0")}`;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

/* ---------- category inference (maps to the product tag list) ---------- */
const TAG_RULES: [string, RegExp][] = [
  [
    "footwear",
    /cypress|magnolia\b(?!.*(hoodie|quarter|crew))|osprey|presidio|willow|\bslide\b|shoe|spike/i,
  ],
  ["headwear", /\bhat\b|snapback|clipback|\bcap\b|visor|beanie|bucket|\bhood\b/i],
  ["hoodies", /hoodie|pullover|quarter[- ]zip|half[- ]zip|mock neck/i],
  ["sweaters", /sweater|crew\b|cardigan|ribbed/i],
  ["outerwear", /jacket|anorak|vest|rain|wind\b|twilight/i],
  ["polos", /polo/i],
  ["tshirts", /t-shirt|\btee\b|long sleeve icon/i],
  ["shorts", /shorts?\b|skort/i],
  ["pants", /pant\b|pants|jogger|trouser/i],
  [
    "accessories",
    /glove|headcover|blade cover|divot|marker|\btees\b|\bbag\b|organizer|luggage|leather tag|towel|belt|sock/i,
  ],
];
const TYPE_LABEL: Record<string, string> = {
  footwear: "Footwear",
  headwear: "Headwear",
  hoodies: "Hoodies & Pullovers",
  sweaters: "Sweaters",
  outerwear: "Outerwear",
  polos: "Polos",
  tshirts: "T-Shirts",
  shorts: "Shorts",
  pants: "Pants",
  accessories: "Accessories",
};
function inferTags(name: string): string[] {
  const tags = TAG_RULES.filter(([, re]) => re.test(name)).map(([t]) => t);
  return tags.length ? tags.slice(0, 2) : [];
}

/* sample a swatch hex from the colorway's product shot: average the
   pixels that differ from the (corner-sampled) background */
async function swatchFromImage(file: string): Promise<string> {
  try {
    const { data, info } = await sharp(file)
      .resize(32, 32, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const px = (x: number, y: number) => {
      const i = (y * info.width + x) * info.channels;
      return [data[i], data[i + 1], data[i + 2]];
    };
    const corners = [px(1, 1), px(30, 1), px(1, 30), px(30, 30)];
    const bg = corners
      .reduce((a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]], [0, 0, 0])
      .map((v) => v / 4);
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    for (let y = 4; y < 28; y++)
      for (let x = 4; x < 28; x++) {
        const p = px(x, y);
        const d = Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]);
        if (d > 60) {
          r += p[0];
          g += p[1];
          b += p[2];
          n += 1;
        }
      }
    if (n < 20) return "#9d9e9b"; // shot is basically all background
    const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return "#9d9e9b";
  }
}

/* ---------- image upload with filename dedupe ---------- */
const assetCache = new Map<string, string>();
async function uploadImage(publicPath: string): Promise<string | null> {
  const filePath = path.join(process.cwd(), "public", publicPath);
  if (!existsSync(filePath)) return null;
  /* stable asset filename: sdr-<sku>-<n>.jpg */
  const filename = `sdr-${publicPath.replace(/^\/sdr\//, "").replace(/\//g, "-")}`;
  if (assetCache.has(filename)) return assetCache.get(filename)!;
  const existing = await client.fetch<string | null>(
    `*[_type == "sanity.imageAsset" && originalFilename == $fn][0]._id`,
    { fn: filename },
  );
  if (existing) {
    assetCache.set(filename, existing);
    return existing;
  }
  const asset = await client.assets.upload("image", createReadStream(filePath), { filename });
  assetCache.set(filename, asset._id);
  console.log(`  ↑ ${filename}`);
  return asset._id;
}

const imageRef = (id: string) => ({
  _type: "image" as const,
  _key: key(),
  asset: { _type: "reference" as const, _ref: id },
});

/* description text → blockContent paragraphs */
function toBlocks(text: string | null) {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      _type: "block" as const,
      _key: key(),
      style: "normal" as const,
      markDefs: [],
      children: [{ _type: "span" as const, _key: key(), text: line, marks: [] }],
    }));
}

async function run() {
  const raw = JSON.parse(
    readFileSync(path.join(process.cwd(), "design/sdr-catalog/products.json"), "utf8"),
  ) as { products: Captured[] };

  /* group colorways by product name, keeping capture order */
  const groups = new Map<string, Captured[]>();
  for (const p of raw.products) {
    if (!groups.has(p.name)) groups.set(p.name, []);
    groups.get(p.name)!.push(p);
  }
  console.log(`${raw.products.length} colorways → ${groups.size} products\n`);

  /* post dates walk back from a fixed base, deterministic per slug */
  const BASE_DATE = Date.UTC(2026, 6, 20);

  let done = 0;
  for (const [name, colorways] of groups) {
    const slug = slugify(name);
    /* dash, not dot: dot-namespaced ids are excluded from the
       published perspective the site queries with */
    const id = `sdr-${slug}`;
    const primary = colorways[0];
    const price = colorways.map((c) => c.price).find((v) => v != null);
    const gender = /women/i.test(name + primary.url) ? "womens" : "mens";
    const tags = inferTags(name);

    /* product-level media: the primary colorway's shots (max 6) */
    const productImages: ReturnType<typeof imageRef>[] = [];
    for (const img of primary.images.slice(0, 6)) {
      const assetId = await uploadImage(img);
      if (assetId) productImages.push(imageRef(assetId));
    }

    /* one variant per colorway */
    const variants = [];
    for (let i = 0; i < colorways.length; i++) {
      const c = colorways[i];
      const cardId = c.images[0] ? await uploadImage(c.images[0]) : null;
      const hoverId = c.images[1] ? await uploadImage(c.images[1]) : null;
      const swatch = c.images[0]
        ? await swatchFromImage(path.join(process.cwd(), "public", c.images[0]))
        : "#9d9e9b";
      variants.push({
        _type: "productVariant" as const,
        _key: key(),
        name: colorways.length > 1 ? `Colorway ${i + 1}` : "Default",
        color: swatch,
        ...(cardId ? { image: imageRef(cardId) } : {}),
        ...(hoverId ? { hoverImage: imageRef(hoverId) } : {}),
        sku: c.sku,
        ...(c.price != null && Number(c.price) !== Number(price)
          ? { price: Number(c.price) }
          : {}),
        inventory: {
          track: true,
          quantity: /InStock/i.test(c.availability ?? "") ? 25 : 0,
          continueSelling: false,
        },
      });
    }

    /* deterministic recent post date so "new arrivals" sorting varies */
    const hash = [...slug].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);
    const postedAt = new Date(BASE_DATE - hash * 8.64e6).toISOString(); // 0–110 days back

    await client.createOrReplace({
      _id: id,
      _type: "product",
      status: "active",
      title: name,
      slug: { _type: "slug", current: slug },
      description: toBlocks(primary.description),
      images: productImages,
      vendor: "Sun Day Red",
      productType: tags[0] ? TYPE_LABEL[tags[0]] : undefined,
      gender,
      tags,
      postedAt,
      pricing: {
        ...(price != null ? { price: Number(price) } : {}),
        chargeTax: true,
      },
      options: [
        {
          _type: "productOption",
          _key: key(),
          name: "Color",
          values: variants.map((v) => v.name),
        },
      ],
      variants,
      shipping: { physical: true, weightUnit: "g" },
      seo: {
        description: (primary.description ?? "").slice(0, 300),
      },
    });
    done += 1;
    console.log(
      `✓ ${done}/${groups.size} ${name} (${colorways.length} colorway${colorways.length > 1 ? "s" : ""})`,
    );
  }

  if (RETIRE_LOREM) {
    const loremIds = await client.fetch<string[]>(
      `*[_type == "product" && _id match "product-seed-*"]._id`,
    );
    for (const loremId of loremIds) {
      await client.patch(loremId).set({ status: "draft" }).commit();
    }
    console.log(`\nretired ${loremIds.length} lorem seed products to Draft`);
  }

  console.log("\nDone. Products are live wherever sliders/collections pull by tag.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
