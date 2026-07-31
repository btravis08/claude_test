/**
 * Section audit — turns the library from a catalogue into a dashboard.
 *
 * For every registered section it:
 *   1. screenshots the live render at each breakpoint that has a comp
 *   2. diffs that against the Figma comp, producing two numbers:
 *        layout — composition match, measured on 64px thumbnails so
 *                 antialiasing and photographic detail can't drown the
 *                 signal. THIS is the number that tracks design drift.
 *        pixel  — full-resolution match. Always lower (the comp's
 *                 photography is not the site's photography); useful
 *                 only as a relative trend for one section over time.
 *   3. sweeps every visible element through the token matcher and
 *      counts values that match no token
 *
 * Results land in src/design/library.status.json, which the library
 * grid badges from and /library/manifest.json serves.
 *
 * Needs a built server on :3000 (npm run build && npm start).
 * Run: npm run audit
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire("/home/user/site-framework/package.json");
const { chromium } = require("playwright-core");
const sharp = createRequire(import.meta.url)("sharp");

const ROOT = process.cwd();
const ORIGIN = process.env.AUDIT_ORIGIN ?? "http://localhost:3000";
const OUT = path.join(ROOT, "src/design/library.status.json");

const WIDTHS = { desktop: 1440, tablet: 1024, mobile: 428 };

/* the registry is TSX — read the fields the audit needs without
   compiling it (slug, modes, comps) */
function readRegistry() {
  const src = readFileSync(path.join(ROOT, "src/library/registry.tsx"), "utf8");
  /* slice the file at each entry's slug so a section without comps
     can't inherit the next section's block */
  const marks = [...src.matchAll(/^    slug: "([^"]+)",$/gm)];
  return marks.map((mark, i) => {
    const body = src.slice(mark.index, marks[i + 1]?.index ?? src.length);
    const modes = (body.match(/modes: \[([^\]]*)\]/)?.[1] ?? "")
      .split(",")
      .map((s) => s.trim().replace(/"/g, ""))
      .filter(Boolean);
    const comps = {};
    for (const c of body.matchAll(
      /(desktop|tablet|mobile): \{ width: (\d+), height: (\d+) \}/g,
    )) {
      comps[c[1]] = { width: Number(c[2]), height: Number(c[3]) };
    }
    return { slug: mark[1], modes, comps };
  });
}

const compPath = (slug, bp) =>
  path.join(ROOT, "public/figma/comps", `${slug}${bp === "desktop" ? "" : `-${bp}`}.jpg`);

/* mean absolute difference of two same-size grayscale buffers, as a
   0–100 "match" score */
function matchScore(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return +(100 - (sum / a.length / 255) * 100).toFixed(1);
}

async function diff(shotBuf, compFile) {
  const comp = sharp(compFile);
  const { width, height } = await comp.metadata();

  /* full-res: both normalized to the comp's size and grayscaled */
  const [aFull, bFull] = await Promise.all([
    sharp(shotBuf).resize(width, height, { fit: "fill" }).greyscale().raw().toBuffer(),
    comp.clone().greyscale().raw().toBuffer(),
  ]);

  /* composition: 64px thumbnails, normalized so overall exposure
     differences between a flat comp and a photographic render don't
     count as layout drift */
  const thumb = (input) =>
    sharp(input).resize(64, 64, { fit: "fill" }).greyscale().normalise().raw().toBuffer();
  const [aThumb, bThumb] = await Promise.all([thumb(shotBuf), thumb(compFile)]);

  return { pixel: matchScore(aFull, bFull), layout: matchScore(aThumb, bThumb) };
}

async function run() {
  const entries = readRegistry();
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const status = {};

  for (const entry of entries) {
    const record = { comps: {}, tokens: null };

    for (const bp of Object.keys(entry.comps)) {
      const page = await browser.newPage({
        viewport: { width: WIDTHS[bp], height: entry.comps[bp].height },
      });
      await page.goto(`${ORIGIN}/library/${entry.slug}?frame=1&mode=${entry.modes[0]}`, {
        waitUntil: "domcontentloaded",
      });
      /* the locked hero sequence and the reveal passes need to settle
         before the frame represents the section's resting state */
      await page.waitForTimeout(entry.slug === "legacy-hero" ? 7000 : 3000);
      const shot = await page.screenshot({ type: "png" });
      record.comps[bp] = await diff(shot, compPath(entry.slug, bp));
      await page.close();
    }

    /* token sweep, once, at desktop in the section's default mode */
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(
      `${ORIGIN}/library/${entry.slug}?frame=1&audit=1&mode=${entry.modes[0]}`,
      { waitUntil: "domcontentloaded" },
    );
    await page.waitForTimeout(entry.slug === "legacy-hero" ? 7000 : 3000);
    await page.waitForFunction(() => typeof window.__sdrAudit === "function", null, {
      timeout: 15000,
    });
    const audit = await page.evaluate(() => window.__sdrAudit());
    await page.close();

    /* group findings so the dashboard can say WHAT drifted, not just
       how many times */
    const byKind = {};
    for (const f of audit.findings) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
    record.tokens = {
      elements: audit.elements,
      offToken: audit.findings.length,
      byKind,
      /* a handful of examples is enough to start fixing */
      examples: audit.findings.slice(0, 8),
    };

    status[entry.slug] = record;
    const worst = Object.values(record.comps).map((c) => c.layout);
    console.log(
      `${entry.slug.padEnd(22)} layout ${worst.length ? `${Math.min(...worst)}%` : "—".padEnd(4)}` +
        `  off-token ${record.tokens.offToken}`,
    );
  }

  await browser.close();
  writeFileSync(
    OUT,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), sections: status }, null, 2)}\n`,
  );
  console.log(`\n✓ ${path.relative(ROOT, OUT)}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
