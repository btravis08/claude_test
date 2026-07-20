#!/usr/bin/env node
/*
  Crawls sundayred.com's sitemap and captures the live product catalog
  into the repo so the sandbox can reference it:
    design/sdr-catalog/products.json   name / description / price / etc.
    public/sdr/<sku>/<n>.jpg           product imagery (1200px wide)

  Needs open access to www.sundayred.com — run via the
  fetch-sdr-catalog GitHub workflow (Actions runners) or locally:
    node scripts/fetch-sdr-catalog.mjs

  Data comes from each product page's JSON-LD (schema.org Product),
  which Salesforce Commerce emits with name, description, sku, price,
  and image set. Images are normalized through the Demandware image
  service at sw=1200, q=85.
*/
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.sundayred.com";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
const MAX_IMAGES_PER_PRODUCT = 6;
const CONCURRENCY = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, type = "text") {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept:
            type === "text"
              ? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
              : "image/avif,image/webp,image/jpeg,*/*",
          "accept-language": "en-US,en;q=0.9",
        },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return type === "text" ? await res.text() : Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === 2) throw err;
      await sleep(700 * (attempt + 1));
    }
  }
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

async function discoverProductUrls() {
  /* SFCC serves a sitemap index; product URLs live in child sitemaps */
  const candidates = [`${BASE}/sitemap_index.xml`, `${BASE}/sitemap.xml`];
  let index = null;
  for (const url of candidates) {
    try {
      index = await get(url);
      console.log(`sitemap: ${url}`);
      break;
    } catch (e) {
      console.log(`no sitemap at ${url} (${e.message})`);
    }
  }
  if (!index) throw new Error("no sitemap reachable — likely blocked");

  const children = locs(index).filter((u) => u.endsWith(".xml"));
  const sitemaps = children.length ? children : [candidates[0]];
  /* prefer sitemaps that declare themselves product sitemaps; if none
     do, crawl every page and let the JSON-LD Product check decide */
  const productMaps = sitemaps.filter((u) => /product/i.test(u));
  const usable = productMaps.length ? productMaps : sitemaps;
  const urls = new Set();
  const debug = { index: candidates.find(Boolean), sitemaps, productMaps, samples: [] };
  for (const sm of usable) {
    try {
      const xml = await get(sm);
      const found = locs(xml).filter((u) => !u.endsWith(".xml"));
      debug.samples.push({ sitemap: sm, count: found.length, first: found.slice(0, 10) });
      for (const loc of found) urls.add(loc);
      console.log(`  ${sm} → ${found.length} urls (${urls.size} total)`);
    } catch (e) {
      debug.samples.push({ sitemap: sm, error: e.message });
      console.log(`  skipping ${sm}: ${e.message}`);
    }
  }
  await mkdir(join(ROOT, "design/sdr-catalog"), { recursive: true });
  await writeFile(
    join(ROOT, "design/sdr-catalog/crawl-debug.json"),
    JSON.stringify(debug, null, 2),
  );
  /* bound the crawl; non-product pages fall out at the JSON-LD gate */
  return [...urls].slice(0, 600);
}

function extractJsonLd(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];
      out.push(...(Array.isArray(nodes) ? nodes : [nodes]));
    } catch {
      /* tolerate malformed blocks */
    }
  }
  return out;
}

const meta = (html, prop) => {
  const m = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
  );
  return m?.[1];
};

/* normalize a Demandware image URL to our capture size */
function normalizeImage(url) {
  try {
    const u = new URL(url, BASE);
    if (u.pathname.includes("/dw/image/")) {
      u.search = "";
      u.searchParams.set("sw", "1200");
      u.searchParams.set("q", "85");
      u.searchParams.set("fmt", "jpg");
    }
    return u.toString();
  } catch {
    return null;
  }
}

async function captureProduct(url) {
  const html = await get(url);
  const nodes = extractJsonLd(html);
  const product = nodes.find((n) => {
    const t = n?.["@type"];
    return t === "Product" || (Array.isArray(t) && t.includes("Product"));
  });

  /* only pages with real Product structured data count — with the
     broadened crawl, everything else falls out here */
  if (!product) return null;
  const name = product.name ?? meta(html, "og:title");
  if (!name) return null;
  const offers = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
  const rawImages = [
    ...new Set(
      [
        ...(Array.isArray(product?.image) ? product.image : product?.image ? [product.image] : []),
        meta(html, "og:image"),
      ].filter(Boolean),
    ),
  ];
  const sku = (product?.sku ?? url.match(/\/([A-Za-z]?\d{4,}[A-Za-z0-9-]*)\.html/)?.[1] ?? name)
    .toString()
    .replace(/[^A-Za-z0-9_-]/g, "_");

  const images = [];
  let i = 0;
  for (const raw of rawImages.slice(0, MAX_IMAGES_PER_PRODUCT)) {
    const src = normalizeImage(raw);
    if (!src) continue;
    try {
      const buf = await get(src, "buffer");
      const rel = `public/sdr/${sku}/${i}.jpg`;
      await mkdir(join(ROOT, dirname(rel)), { recursive: true });
      await writeFile(join(ROOT, rel), buf);
      images.push(rel.replace(/^public/, ""));
      i += 1;
    } catch (e) {
      console.log(`    image failed (${e.message}): ${src.slice(0, 100)}`);
    }
  }

  return {
    url,
    sku,
    name,
    description: product?.description ?? meta(html, "og:description") ?? null,
    brand: product?.brand?.name ?? product?.brand ?? null,
    color: product?.color ?? null,
    price: offers?.price ?? null,
    currency: offers?.priceCurrency ?? null,
    availability: offers?.availability ?? null,
    images,
    /* remote originals, kept for re-fetching/diagnosis */
    imagesRemote: rawImages,
  };
}

const urls = await discoverProductUrls();
console.log(`\ncapturing ${urls.length} products…`);
const products = [];
let cursor = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        const p = await captureProduct(url);
        if (p) {
          products.push(p);
          console.log(`✓ ${p.name} (${p.images.length} images)`);
        } else {
          console.log(`- no product data: ${url}`);
        }
      } catch (e) {
        console.log(`✗ ${url}: ${e.message}`);
      }
      await sleep(150);
    }
  }),
);

products.sort((a, b) => a.sku.localeCompare(b.sku));
await mkdir(join(ROOT, "design/sdr-catalog"), { recursive: true });
await writeFile(
  join(ROOT, "design/sdr-catalog/products.json"),
  JSON.stringify({ capturedAt: new Date().toISOString(), source: BASE, products }, null, 2),
);
console.log(`\nwrote design/sdr-catalog/products.json (${products.length} products)`);
if (products.length === 0) process.exit(1);
