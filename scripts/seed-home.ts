/**
 * Seeds the Sanity dataset with the pre-built "home" page — the Figma
 * "Homepage — V1 Grid" composition as editable, reorderable sections —
 * uploading the imagery from public/figma/ as Sanity image assets.
 *
 * Run locally (needs your Sanity login):
 *   npx sanity exec scripts/seed-home.ts --with-user-token
 *
 * Idempotent: re-running replaces the same document (_id "page-home").
 */
import { createReadStream } from "node:fs";
import path from "node:path";

import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-07-01" });

let keyCounter = 0;
const key = () => `seed${(keyCounter++).toString().padStart(3, "0")}`;

async function uploadImage(filename: string) {
  const filePath = path.join(process.cwd(), "public/figma", filename);
  const asset = await client.assets.upload("image", createReadStream(filePath), {
    filename,
  });
  console.log(`↑ uploaded ${filename} → ${asset._id}`);
  return { _type: "image" as const, asset: { _type: "reference" as const, _ref: asset._id } };
}

async function run() {
  const campaign = await uploadImage("campaign.png");
  const portrait = await uploadImage("media-portrait.png");
  const shoe = await uploadImage("card-shoe.png");

  const product = () => ({
    _type: "productCard",
    _key: key(),
    title: "Presidio",
    price: "$198.00",
    colorway: "Gray / Navy",
    colorCount: "+4 colors",
    image: shoe,
  });

  const productSlider = (title?: string) => ({
    _type: "sectionProductSlider",
    _key: key(),
    colorMode: "light",
    ...(title ? { title } : {}),
    products: [product(), product(), product(), product()],
  });

  const doc = {
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
        image: campaign,
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
          image: portrait,
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
        image: campaign,
      },
      {
        _type: "sectionCarousel",
        _key: key(),
        colorMode: "light",
        eyebrow: "Shop Footwear",
        items: ["Pioneer→", "Presidio", "Osprey", "Cardinal", "Jupiter"],
        description:
          "Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget convallis lorem faucibus tortor in. Cursus feugiat feugiat a quam vestibulum dignissim sem ullamcorper.",
        image: portrait,
      },
      {
        _type: "sectionFiftyFifty",
        _key: key(),
        colorMode: "dark",
        panels: ["Women’s Apparel", "Men’s Apparel"].map((title) => ({
          _type: "panel",
          _key: key(),
          title,
          image: campaign,
        })),
      },
      productSlider("Best Sellers"),
      productSlider("Best Sellers"),
      {
        _type: "sectionFullWidth",
        _key: key(),
        colorMode: "dark",
        eyebrow: "JUST ARRIVED",
        headline: "TW Performance",
        align: "left",
        primaryCta: "shop tw performance",
        image: campaign,
      },
      productSlider(),
    ],
  };

  const result = await client.createOrReplace(doc);
  console.log(`✓ seeded ${result._id} with ${doc.sections.length} sections`);
  console.log("Open /studio → Page → Homepage to reorder and edit.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
