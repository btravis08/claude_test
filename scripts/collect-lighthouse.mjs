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
/* pages + base URL come from designops.config.json — the single
   place a new project edits */
const DESIGNOPS = JSON.parse(
  readFileSync(path.join(ROOT, "designops.config.json"), "utf8"),
);
const ORIGIN = process.env.PERF_ORIGIN ?? DESIGNOPS.site.baseUrl;
const OUT = path.join(ROOT, "src/design/perf.history.json");
const CAP = 120; // nightly ≈ four months of trend per page
const PAGES = DESIGNOPS.site.perfPages;

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

  /* TBT attribution: which scripts burned the main thread (bootup-
     time, top 3 by total ms) and how much long-task time there was —
     so a blocking-bound score names its culprit instead of needing a
     manual profile */
  const bootup = (report.audits["bootup-time"]?.details?.items ?? [])
    .slice(0, 3)
    .map((s) => ({
      url: String(s.url ?? "").split("/").pop().slice(0, 60),
      totalMs: Math.round(s.total ?? 0),
    }));
  const longTaskItems = report.audits["long-tasks"]?.details?.items ?? [];
  const longTasks = {
    count: longTaskItems.length,
    totalMs: Math.round(longTaskItems.reduce((sum, t) => sum + (t.duration ?? 0), 0)),
  };

  return {
    /* runner health: Lighthouse's own CPU benchmark for this run —
       a low value (<1500) means the VM was slow and the absolute
       scores that night deserve skepticism */
    benchmarkIndex: Math.round(report.environment?.benchmarkIndex ?? 0),
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
    bootup,
    longTasks,
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
