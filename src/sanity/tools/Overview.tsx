import { icons } from "@sanity/icons";
import type { Tool } from "sanity";

import backupStatus from "@/design/backup.status.json";
import driftStatus from "@/design/design-drift.json";
import libraryStatus from "@/design/library.status.json";
import linksStatus from "@/design/links.status.json";
import perfHistory from "@/design/perf.history.json";

import { ACCENT, Bars, CARD_INK, DotRow, Gauge, GlassChip, Meter, Shell, StatCard } from "./dash";

/*
  Overview — the Studio's landing readout: is everything okay?
  Pulls the JSON the nightly jobs commit (Lighthouse history, section
  audit, link check, dataset backup, design drift) into one pane.
  Data ships with the bundle, so "as of" times matter. Presentation
  comes from the shared dashboard skin (./dash).
*/

/* timed sections animate through their screenshots — their layout
   scores are structurally low and are verified by motion specs
   instead (see AGENTS.md) */
import designops from "../../../designops.config.json";

const TIMED = new Set<string>(designops.audit.timedSections);

type Snap = {
  t?: string;
  perf?: number;
  mobile?: { perf?: number; lcp?: number; tbt?: number };
  desktop?: { perf?: number };
};

const mobileOf = (snap: Snap | undefined) =>
  snap ? (snap.mobile ?? snap) : undefined;

function median(values: number[]): number | undefined {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function ago(iso: string | null | undefined): string {
  if (!iso) return "never";
  const hours = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (hours < 1.5) return "just now";
  if (hours < 36) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function hoursSince(iso: string | null | undefined): number {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

interface PerfRow {
  path: string;
  score?: number;
  prevMedian?: number;
  desktop?: number;
  t?: string;
  history: number[];
}

function collect() {
  const pages = (perfHistory as { pages?: Record<string, Snap[]> }).pages ?? {};
  const perf: PerfRow[] = Object.entries(pages).map(([path, snaps]) => {
    const last = snaps.at(-1);
    const prev = snaps
      .slice(-6, -1)
      .map((snap) => mobileOf(snap)?.perf)
      .filter((value): value is number => typeof value === "number");
    return {
      path,
      score: mobileOf(last)?.perf,
      prevMedian: median(prev),
      desktop: last?.desktop?.perf,
      t: last?.t,
      history: snaps
        .slice(-14)
        .map((snap) => mobileOf(snap)?.perf)
        .filter((value): value is number => typeof value === "number"),
    };
  });

  const sections = Object.entries(
    (libraryStatus as {
      generatedAt?: string;
      sections?: Record<string, { comps?: Record<string, { layout?: number }> }>;
    }).sections ?? {},
  )
    .filter(([slug]) => !TIMED.has(slug))
    .map(([slug, entry]) => {
      const layouts = Object.values(entry.comps ?? {})
        .map((bp) => bp.layout)
        .filter((value): value is number => typeof value === "number");
      return { slug, worst: layouts.length ? Math.min(...layouts) : undefined };
    })
    .filter((row) => row.worst != null)
    .sort((a, b) => (a.worst ?? 0) - (b.worst ?? 0));

  const links = linksStatus as {
    generatedAt: string | null;
    checked: number;
    broken: { url: string; code: number }[];
  };
  const backup = backupStatus as {
    generatedAt: string | null;
    docs: number;
    bytes: number;
  };
  const drift = driftStatus as { generatedAt: string | null };

  const alerts: string[] = [];
  if (links.broken?.length) alerts.push(`${links.broken.length} broken link(s)`);
  if (hoursSince(backup.generatedAt) > designops.alerts.backupStaleHours) alerts.push("dataset backup is stale");
  for (const row of perf) {
    if (row.score != null && row.prevMedian != null && row.prevMedian - row.score >= designops.alerts.perfDrop)
      alerts.push(`${row.path} perf dropped (${row.prevMedian}→${row.score})`);
  }

  return { perf, sections, links, backup, drift, alerts };
}

export function OverviewPane() {
  const { perf, sections, links, backup, drift, alerts } = collect();
  const base = designops.site.baseUrl;
  const lastRun = perf[0]?.t;
  const backupFresh = hoursSince(backup.generatedAt) <= designops.alerts.backupStaleHours;
  /* backup freshness as gauge: full = just ran, empty = at threshold */
  const backupGauge = backup.generatedAt
    ? Math.max(0, 100 - (hoursSince(backup.generatedAt) / designops.alerts.backupStaleHours) * 100)
    : 0;

  return (
    <Shell
      active="overview"
      title="Site Overview"
      sub={`${base.replace(/^https?:\/\//, "")} · monitors as of ${ago(lastRun)}`}
      chip={
        <GlassChip
          label="Alerts"
          value={alerts.length}
          note={alerts.length ? "needs attention" : "all monitors green"}
          warn={alerts.length > 0}
        />
      }
    >
      <div className="ovw-grid">
        {perf.map((row, i) => (
          <StatCard
            key={row.path}
            title={`${row.path} · mobile`}
            href={`${base}${row.path}`}
            size={i === 0 ? "wide" : undefined}
          >
            <div className="ovw-big">
              {row.score ?? "—"}
              {row.desktop != null ? <small>desktop {row.desktop}</small> : null}
            </div>
            {row.score != null ? <Meter value={row.score} /> : null}
            {row.prevMedian != null && row.score != null && row.score !== row.prevMedian ? (
              <DotRow
                label="vs median of last 5"
                value={`${row.score > row.prevMedian ? "+" : ""}${row.score - row.prevMedian}`}
                tone={row.score < row.prevMedian ? "accent" : undefined}
              />
            ) : null}
            {i === 0 ? <Bars series={row.history} /> : null}
          </StatCard>
        ))}

        <StatCard title="Design fidelity · worst breakpoint" href="/studio/sections" size="wide">
          {sections.slice(0, 6).map((row) => (
            <DotRow
              key={row.slug}
              label={row.slug}
              value={row.worst!.toFixed(1)}
              tone={row.worst! >= designops.audit.bands.match ? undefined : "accent"}
            />
          ))}
          <div className="ovw-gauge-label">timed sections verify via motion specs instead</div>
        </StatCard>

        <StatCard title="Alerts">
          <div className="ovw-big" style={{ color: alerts.length ? ACCENT : CARD_INK }}>
            {alerts.length}
          </div>
          {alerts.length ? (
            <ul className="ovw-alert-list">
              {alerts.slice(0, 4).map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          ) : (
            <div className="ovw-gauge-label" style={{ textAlign: "left", marginTop: 0 }}>
              every monitor is green
            </div>
          )}
        </StatCard>

        <StatCard title="Links checked">
          <Gauge
            value={links.checked ? ((links.checked - links.broken.length) / links.checked) * 100 : 0}
            warn={links.broken.length > 0}
          />
          <div className="ovw-gauge-label">
            {links.generatedAt == null
              ? "no run recorded yet"
              : links.broken.length === 0
                ? `${links.checked} URLs · none broken · ${ago(links.generatedAt)}`
                : `${links.broken.length} of ${links.checked} broken · ${ago(links.generatedAt)}`}
          </div>
        </StatCard>

        <StatCard title="Dataset backup">
          <Gauge value={backupGauge} warn={!backupFresh} />
          <div className="ovw-gauge-label">
            {backup.generatedAt == null
              ? "no backup recorded yet"
              : `${backup.docs} docs · ${(backup.bytes / 1024).toFixed(0)}KB · ${ago(backup.generatedAt)}`}
          </div>
        </StatCard>
      </div>

      <div className="ovw-foot">
        Design drift: {drift.generatedAt ? `last checked ${ago(drift.generatedAt)}` : "dormant (FIGMA_TOKEN not set)"} ·
        data updates with each deploy after the nightly jobs commit their results.
      </div>
    </Shell>
  );
}

export const overviewTool: Tool = {
  name: "overview",
  title: "Overview",
  icon: icons["activity"],
  component: OverviewPane,
};
