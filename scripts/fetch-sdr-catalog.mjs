#!/usr/bin/env node
/*
  Crawls sundayred.com's sitemap and captures the live product catalog
  into the repo so the sandbox can reference it:
    design/sdr-catalog/products.json   name / description / price / etc.
    public/sdr/<sku>/<n>.jpg           product imagery (1200px wide)

  Needs open access to www.sundayred.com — run via the
  fetch-sdr-catalog GitHub workflow (Actions runners) or locally:
    node scripts/fetch-sdr-catalog.mjs

  Product URLs come from four sources, because the site's sitemaps
  are stale (the product sitemap listed 34 while the site sells
  more): the product sitemap, a walk of every category PLP from the
  category sitemap, every nav/footer link off the live homepage, and
  an a-z/0-9 sweep of the site search index — all paged via SFCC's
  start/sz params, harvesting the grid tiles' links. Data comes from
  each product page's JSON-LD (schema.org Product), which Salesforce
  Commerce emits with name, description, sku, price, and image set.
  Images are normalized through the Demandware image service at
  sw=1200, q=85.
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

/* strip query/hash so the same PDP linked with ?color= or ?lang=
   variants dedupes to one capture */
function canonical(url) {
  try {
    const u = new URL(url.replace(/&amp;/g, "&"), BASE);
    if (u.hostname !== new URL(BASE).hostname) return null;
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

/* Walk a category (PLP) page through SFCC's start/sz paging and pull
   every .html link out of the grid. Nav/footer links repeat on every
   page, so a page that adds nothing new means we're past the end. */
/* PDP URLs end in an UPPERCASE product-id .html (/slug/DW-LA032.html);
   lowercase .html links (mens-gear.html) may be category landings —
   case-sensitive on purpose */
const PDP_LIKE = /\/[A-Z0-9]{2,}-[A-Z0-9-]+\.html$/;
const BROWSE_SKIP =
  /\/(cart|checkout|login|account|wishlist|order|stores|customer|privacy|terms|on\/demandware)/i;

/* Sitemap-independent seed source: every internal link in the
   homepage markup (nav, meganav, footer) that isn't a PDP or a
   utility page is a potential listing page worth walking. */
async function discoverBrowsePages() {
  const pages = new Set();
  try {
    const html = await get(`${BASE}/`);
    for (const m of html.matchAll(/href=["']([^"']+)["']/g)) {
      const c = canonical(m[1]);
      if (!c || c === `${BASE}/`) continue;
      if (/\.(jpg|jpeg|png|svg|css|js|xml|ico|webp|avif|pdf|mp4)$/i.test(c)) continue;
      if (PDP_LIKE.test(c) || BROWSE_SKIP.test(c)) continue;
      pages.add(c);
    }
  } catch (e) {
    console.log(`homepage fetch failed: ${e.message}`);
  }
  return [...pages].slice(0, 80);
}

async function collectCategoryLinks(catUrl) {
  const found = new Set();
  for (let start = 0; start < 480; start += 60) {
    let html;
    try {
      const u = new URL(catUrl, BASE);
      u.searchParams.set("sz", "60");
      u.searchParams.set("start", String(start));
      html = await get(u.toString());
    } catch {
      break;
    }
    const before = found.size;
    for (const m of html.matchAll(/href=["']([^"']+\.html(?:\?[^"']*)?)["']/g)) {
      const c = canonical(m[1]);
      if (c) found.add(c);
    }
    if (found.size === before) break;
    await sleep(150);
  }
  return found;
}

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
      for (const loc of found) urls.add(canonical(loc) ?? loc);
      console.log(`  ${sm} → ${found.length} urls (${urls.size} total)`);
    } catch (e) {
      debug.samples.push({ sitemap: sm, error: e.message });
      console.log(`  skipping ${sm}: ${e.message}`);
    }
  }

  /* The product sitemap undercounts the live range (34 urls vs the
     full site), so also walk every category PLP from the category
     sitemap and harvest the product links off the grid tiles. The
     JSON-LD Product gate below discards anything that isn't a PDP. */
  const categoryMaps = sitemaps.filter((u) => /category/i.test(u));
  const categories = new Set();
  for (const sm of categoryMaps) {
    try {
      const xml = await get(sm);
      for (const loc of locs(xml).filter((u) => !u.endsWith(".xml"))) {
        const c = canonical(loc);
        if (c) categories.add(c);
      }
    } catch (e) {
      console.log(`  skipping ${sm}: ${e.message}`);
    }
  }
  /* walk a batch of listing-ish URLs, folding their grid links into
     the candidate set; non-listing pages terminate after one fetch */
  async function walkListings(label, list) {
    console.log(`\nwalking ${list.length} ${label} pages…`);
    const crawled = [];
    let cursor = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (cursor < list.length) {
          const page = list[cursor++];
          const links = await collectCategoryLinks(page);
          let added = 0;
          for (const link of links) {
            if (categories.has(link) || urls.has(link)) continue;
            urls.add(link);
            added += 1;
          }
          crawled.push({ page, links: links.size, newCandidates: added });
          console.log(`  ${page} → ${links.size} links, ${added} new (${urls.size} total)`);
        }
      }),
    );
    return crawled;
  }

  debug.categories = {
    count: categories.size,
    crawled: await walkListings("category", [...categories]),
  };

  /* the sitemaps may be stale, so add two sitemap-independent
     sources: (1) every nav/footer link off the live homepage… */
  const browse = (await discoverBrowsePages()).filter((b) => !categories.has(b));
  debug.navBrowse = { count: browse.length, crawled: await walkListings("nav", browse) };

  /* …and (2) the site search index, swept one character at a time —
     search covers every purchasable product regardless of sitemaps */
  const searchPages = [..."abcdefghijklmnopqrstuvwxyz0123456789"].map(
    (ch) => `${BASE}/search?q=${ch}`,
  );
  debug.searchSweep = { crawled: await walkListings("search", searchPages) };

  await mkdir(join(ROOT, "design/sdr-catalog"), { recursive: true });
  await writeFile(
    join(ROOT, "design/sdr-catalog/crawl-debug.json"),
    JSON.stringify(debug, null, 2),
  );
  /* bound the crawl; non-product pages fall out at the JSON-LD gate */
  return [...urls].slice(0, 800);
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
  const sku = (product?.sku ?? url.match(/\/([A-Za-z0-9][A-Za-z0-9-]{3,})\.html/)?.[1] ?? name)
    .toString()
    .replace(/[^A-Za-z0-9_-]/g, "_");

  /* some PDPs omit offers from their JSON-LD — fall back to the
     page's price markup */
  const priceFallback =
    html.match(/property=["']product:price:amount["'][^>]+content=["']([\d.]+)["']/i)?.[1] ??
    html.match(/itemprop=["']price["'][^>]*content=["']([\d.]+)["']/i)?.[1] ??
    html.match(/"price"\s*:\s*\{\s*"sales"\s*:\s*\{\s*"value"\s*:\s*([\d.]+)/)?.[1] ??
    null;

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
    price: offers?.price ?? priceFallback,
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
