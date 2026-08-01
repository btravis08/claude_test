/**
 * Lighthouse history collector — the data source for the Studio's
 * Performance ticker. Runs mobile Lighthouse against every key page
 * of the production site, extracts the category scores and core
 * metrics, and appends a snapshot per page to
 * src/design/perf.history.json (capped so trends stay long but the
 * bundle stays small).
 *
 * Runs on the lighthouse-history workflow nightly (the sandbox can't
 * reach vercel.app). Locally: node scripts/collect-lighthouse.mjs
 *   PERF_ORIGIN — site origin (default https://sundayred.vercel.app)
 *   CHROME_PATH — chrome binary for Lighthouse
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ORIGIN = process.env.PERF_ORIGIN ?? "https://sundayred.vercel.app";
const OUT = path.join(ROOT, "src/design/perf.history.json");
const CAP = 120; // nightly ≈ four months of trend per page

/* every distinct page shape on the site */
const PAGES = [
  "/",
  "/legacy",
  "/collections/shop-all",
  "/products/presidio",
  "/journal",
];

function runLighthouse(url, formFactor) {
  const raw = execFileSync(
    "npx",
    [
      "--yes",
      "lighthouse@12",
      url,
      "--output=json",
      "--output-path=stdout",
      "--quiet",
      "--only-categories=performance,accessibility,best-practices,seo",
      /* mobile is Lighthouse's default emulation; desktop is the preset */
      ...(formFactor === "desktop" ? ["--preset=desktop"] : []),
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const report = JSON.parse(raw);
  const score = (id) => Math.round((report.categories[id]?.score ?? 0) * 100);
  const audit = (id) => report.audits[id]?.numericValue ?? null;

  /* diagnostics, so a bad score arrives pre-diagnosed: the element
     Lighthouse crowned LCP, and the top savings opportunities */
  const lcpNode =
    report.audits["largest-contentful-paint-element"]?.details?.items?.[0]
      ?.items?.[0]?.node ?? null;
  const opportunities = Object.values(report.audits)
    .filter(
      (a) =>
        a?.details?.type === "opportunity" &&
        (a.details.overallSavingsMs ?? 0) > 50,
    )
    .sort(
      (a, b) => (b.details.overallSavingsMs ?? 0) - (a.details.overallSavingsMs ?? 0),
    )
    .slice(0, 3)
    .map((a) => ({ id: a.id, savingsMs: Math.round(a.details.overallSavingsMs) }));

  return {
    perf: score("performance"),
    a11y: score("accessibility"),
    bp: score("best-practices"),
    seo: score("seo"),
    /* the metrics behind the perf score, for the detail line */
    lcp: audit("largest-contentful-paint"),
    cls: audit("cumulative-layout-shift"),
    tbt: audit("total-blocking-time"),
    lcpElement: lcpNode
      ? { selector: lcpNode.selector ?? null, snippet: (lcpNode.snippet ?? "").slice(0, 160) }
      : null,
    opportunities,
  };
}

const history = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, "utf8"))
  : { pages: {} };

for (const page of PAGES) {
  const url = `${ORIGIN}${page}`;
  try {
    /* both form factors per night; snapshots keyed {t, mobile, desktop}
       (early history entries were flat mobile-only — readers treat
       those as {mobile}) */
    const snap = {
      t: new Date().toISOString(),
      mobile: runLighthouse(url, "mobile"),
      desktop: runLighthouse(url, "desktop"),
    };
    history.pages[page] = [...(history.pages[page] ?? []), snap].slice(-CAP);
    console.log(
      `${page.padEnd(24)} mobile ${snap.mobile.perf}  desktop ${snap.desktop.perf}`,
    );
  } catch (err) {
    /* one failing page shouldn't lose the night's data for the rest */
    console.error(`${page} failed: ${String(err).slice(0, 200)}`);
  }
}

writeFileSync(OUT, `${JSON.stringify(history, null, 2)}\n`);
console.log(`\n✓ ${path.relative(ROOT, OUT)}`);
