/**
 * Regenerates the sample-pack placeholder imagery. All of it is
 * program-drawn (SVG → mozjpeg via sharp), so the packs ship imagery
 * we own outright — no stock licensing, no brand content.
 *
 *   node packages/create-sdr-site/packs/generate-imagery.mjs
 *
 * Deterministic: a seeded RNG per image, so re-runs are byte-stable
 * apart from jpeg encoder drift.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(path.resolve("package.json"));
const sharp = require("sharp");

const HERE = path.dirname(new URL(import.meta.url).pathname);

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const seedFrom = (name) =>
  [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

async function render(dir, name, w, h, svgBody) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svgBody}</svg>`;
  const out = path.join(dir, `${name}.jpg`);
  await sharp(Buffer.from(svg)).jpeg({ quality: 72, mozjpeg: true }).toFile(out);
  console.log(`✓ ${path.relative(process.cwd(), out)}`);
}

/* ---------- architecture: facade abstractions ---------- */

const ARCH = {
  paper: "#edeae3",
  paper2: "#e2ded4",
  ink: "#232420",
  mid: "#5c5b54",
  soft: "#a8a49a",
  accent: "#a9573c",
  night: "#1b1c1a",
  nightMid: "#33342f",
};

function windowGrid(rng, x, y, w, h, tone, opacity) {
  const cols = 2 + Math.floor(rng() * 4);
  const rows = 3 + Math.floor(rng() * 6);
  const gx = w / cols;
  const gy = h / rows;
  const pad = Math.min(gx, gy) * 0.28;
  let out = "";
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++)
      out += `<rect x="${x + c * gx + pad}" y="${y + r * gy + pad}" width="${gx - pad * 2}" height="${gy - pad * 2}" fill="${tone}" opacity="${opacity}"/>`;
  return out;
}

function archComposition(name, w, h, { dark = false } = {}) {
  const rng = makeRng(seedFrom(name));
  const bg = dark ? ARCH.night : ARCH.paper;
  const tones = dark
    ? [ARCH.nightMid, ARCH.mid, ARCH.soft]
    : [ARCH.ink, ARCH.mid, ARCH.soft];
  let out = `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  /* sky band */
  out += `<rect width="${w}" height="${h * 0.16}" fill="${dark ? ARCH.nightMid : ARCH.paper2}" opacity="0.6"/>`;
  /* sun / moon disk */
  const sx = w * (0.15 + rng() * 0.7);
  out += `<circle cx="${sx}" cy="${h * 0.14}" r="${Math.min(w, h) * 0.05}" fill="${dark ? ARCH.soft : ARCH.accent}" opacity="${dark ? 0.5 : 0.85}"/>`;
  /* building masses back-to-front */
  const masses = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < masses; i++) {
    const mw = w * (0.18 + rng() * 0.3);
    const mh = h * (0.35 + rng() * 0.5);
    const mx = (w - mw) * rng();
    const my = h - mh;
    const tone = tones[i % tones.length];
    const opacity = 0.55 + (i / masses) * 0.45;
    out += `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="${tone}" opacity="${opacity}"/>`;
    if (rng() < 0.5) {
      /* mono-pitch roof */
      const rise = mh * (0.1 + rng() * 0.15);
      const dir = rng() < 0.5;
      out += `<polygon points="${mx},${my} ${mx + mw},${my} ${dir ? mx + mw : mx},${my - rise}" fill="${tone}" opacity="${opacity}"/>`;
    }
    if (rng() < 0.8)
      out += windowGrid(rng, mx + mw * 0.12, my + mh * 0.12, mw * 0.76, mh * 0.6, bg, 0.5 + rng() * 0.3);
  }
  /* accent slab + ground line */
  const aw = w * (0.04 + rng() * 0.05);
  out += `<rect x="${w * rng() * 0.9}" y="${h * 0.55}" width="${aw}" height="${h * 0.45}" fill="${ARCH.accent}" opacity="0.9"/>`;
  out += `<rect y="${h - 6}" width="${w}" height="6" fill="${tones[0]}"/>`;
  return out;
}

/* ---------- apparel: fabric color fields ---------- */

function fieldComposition(name, hex, w, h) {
  const rng = makeRng(seedFrom(name));
  const id = name.replace(/[^a-z0-9]/gi, "");
  let out = `<defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${hex}" stop-opacity="0.72"/>
      <stop offset="1" stop-color="${hex}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#efece6"/>
  <rect width="${w}" height="${h}" fill="url(#g${id})"/>`;
  /* flowing fold curves in a darker shade */
  for (let i = 0; i < 4; i++) {
    const y0 = h * (0.25 + rng() * 0.6);
    const amp = h * (0.05 + rng() * 0.12);
    out += `<path d="M0 ${y0} C ${w * 0.3} ${y0 - amp}, ${w * 0.6} ${y0 + amp}, ${w} ${y0 - amp * (rng() - 0.5) * 2}" stroke="#000" stroke-opacity="${0.07 + rng() * 0.08}" stroke-width="${h * (0.02 + rng() * 0.05)}" fill="none" stroke-linecap="round"/>`;
  }
  /* soft highlight */
  out += `<ellipse cx="${w * (0.3 + rng() * 0.4)}" cy="${h * 0.3}" rx="${w * 0.5}" ry="${h * 0.28}" fill="#fff" opacity="0.10"/>`;
  return out;
}

function campaignComposition(name, palette, w, h) {
  const rng = makeRng(seedFrom(name));
  const bands = 3 + Math.floor(rng() * 2);
  const shuffled = [...palette].sort(() => rng() - 0.5).slice(0, bands);
  let out = `<rect width="${w}" height="${h}" fill="${shuffled[0]}"/>`;
  let x = 0;
  shuffled.forEach((hex, i) => {
    const bw = (w - x) / (bands - i);
    const skew = w * 0.06 * (rng() - 0.5);
    out += `<polygon points="${x},0 ${x + bw + skew},0 ${x + bw - skew},${h} ${x},${h}" fill="${hex}"/>`;
    x += bw;
  });
  for (let i = 0; i < 3; i++) {
    const y0 = h * (0.2 + rng() * 0.6);
    out += `<path d="M0 ${y0} C ${w * 0.35} ${y0 - h * 0.1}, ${w * 0.65} ${y0 + h * 0.1}, ${w} ${y0}" stroke="#000" stroke-opacity="0.08" stroke-width="${h * 0.04}" fill="none"/>`;
  }
  out += `<ellipse cx="${w * 0.5}" cy="${h * 0.25}" rx="${w * 0.6}" ry="${h * 0.3}" fill="#fff" opacity="0.08"/>`;
  return out;
}

/* ---------- manifests ---------- */

const APPAREL_COLORS = {
  ecru: "#e8e2d6",
  ink: "#26272b",
  moss: "#5a6650",
  clay: "#b0603f",
  harbor: "#3f5668",
  oat: "#cfc4ae",
  cherry: "#7d2a2e",
  slate: "#8a8f94",
};

async function run() {
  const archDir = path.join(HERE, "architecture/images");
  const appDir = path.join(HERE, "apparel/images");
  mkdirSync(archDir, { recursive: true });
  mkdirSync(appDir, { recursive: true });

  await render(archDir, "hero", 1920, 1200, archComposition("hero", 1920, 1200, { dark: true }));
  await render(archDir, "craft", 1920, 1200, archComposition("craft", 1920, 1200));
  await render(archDir, "studio", 1440, 1800, archComposition("studio", 1440, 1800));
  for (let i = 1; i <= 8; i++) {
    const name = `project-${String(i).padStart(2, "0")}`;
    await render(archDir, name, 1440, 1800, archComposition(name, 1440, 1800, { dark: i % 3 === 0 }));
  }
  for (let i = 1; i <= 3; i++) {
    const name = `post-${String(i).padStart(2, "0")}`;
    await render(archDir, name, 1600, 900, archComposition(name, 1600, 900, { dark: i === 2 }));
  }

  const palette = Object.values(APPAREL_COLORS);
  for (const [color, hex] of Object.entries(APPAREL_COLORS))
    await render(appDir, `color-${color}`, 1200, 1500, fieldComposition(`color-${color}`, hex, 1200, 1500));
  await render(appDir, "campaign-hero", 1920, 1200, campaignComposition("campaign-hero", palette, 1920, 1200));
  await render(appDir, "campaign-full", 1920, 1200, campaignComposition("campaign-full", palette, 1920, 1200));
  await render(appDir, "lookbook", 1440, 1800, fieldComposition("lookbook", APPAREL_COLORS.harbor, 1440, 1800));
  for (let i = 1; i <= 2; i++)
    await render(appDir, `post-${String(i).padStart(2, "0")}`, 1600, 900, campaignComposition(`post-${i}`, palette, 1600, 900));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
