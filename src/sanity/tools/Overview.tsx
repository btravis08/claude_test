import { icons } from "@sanity/icons";
import type { Tool } from "sanity";

import backupStatus from "@/design/backup.status.json";
import driftStatus from "@/design/design-drift.json";
import libraryStatus from "@/design/library.status.json";
import linksStatus from "@/design/links.status.json";
import perfHistory from "@/design/perf.history.json";

/*
  Overview — the Studio's landing readout: is everything okay?
  Pulls the JSON the nightly jobs commit (Lighthouse history, section
  audit, link check, dataset backup, design drift) into one pane.
  Data ships with the bundle, so "as of" times matter.

  Presentation is a self-contained dark dashboard (styled after the
  approved reference, 2026-08-03): dark shell + hero title, a glass
  status chip, then light stat cards — thin oversized numbers,
  hairline meters, dot legends, mini bar charts and gauge arcs, with
  the accent in SDR orange. All styling lives in the <style> block
  below; the Studio theme doesn't reach inside this pane.
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

/* ---------- presentation primitives ---------- */

const ACCENT = "#f2622e";
const CARD_INK = "#1c1c1a";
const CARD_MUTED = "#8b8a85";

/* hairline meter, 0..max, orange fill (like the reference's
   Production / Consumption scales) */
function Meter({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="ovw-meter">
      <div className="ovw-meter-fill" style={{ width: `${pct}%`, background: value >= 90 ? CARD_INK : ACCENT }} />
      <div className="ovw-meter-scale">
        <span>0</span>
        <span>{Math.round(max / 2)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/* quarter-gauge arc (like the reference's Co2 / Mi cards) */
function Gauge({ value, max = 100, warn }: { value: number; max?: number; warn?: boolean }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const R = 52;
  const C = Math.PI * R; /* semicircle length */
  return (
    <div className="ovw-gauge">
      <svg viewBox="0 0 128 72" width="128" height="72" aria-hidden>
        <path d={`M 12 66 A ${R} ${R} 0 0 1 116 66`} fill="none" stroke="#dcdad4" strokeWidth="6" strokeLinecap="round" />
        <path
          d={`M 12 66 A ${R} ${R} 0 0 1 116 66`}
          fill="none"
          stroke={warn ? ACCENT : CARD_INK}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${C * pct} ${C}`}
        />
      </svg>
      <div className="ovw-gauge-value">{Math.round(value)}</div>
    </div>
  );
}

/* mini bar chart of a score series (like Current Power's bars) */
function Bars({ series }: { series: number[] }) {
  if (!series.length) return null;
  return (
    <div className="ovw-bars" aria-hidden>
      {series.map((value, i) => (
        <div
          key={i}
          className="ovw-bar"
          style={{
            height: `${Math.max(12, value * 0.56)}px`,
            background: value >= 90 ? CARD_INK : ACCENT,
          }}
        />
      ))}
    </div>
  );
}

function DotRow({ label, value, tone }: { label: string; value: string; tone?: "accent" | "muted" }) {
  return (
    <div className="ovw-dotrow">
      <span className="ovw-dot" style={{ background: tone === "accent" ? ACCENT : tone === "muted" ? "#c4c2bc" : CARD_INK }} />
      <span className="ovw-dotrow-label">{label}</span>
      <span className="ovw-dotrow-value">{value}</span>
    </div>
  );
}

function StatCard({
  title,
  href,
  wide,
  children,
}: {
  title: string;
  href?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`ovw-card${wide ? " ovw-card-wide" : ""}`}>
      <header className="ovw-card-head">
        <h3>{title}</h3>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${title}`}>
            ↗
          </a>
        ) : null}
      </header>
      {children}
    </section>
  );
}

const CSS = `
.ovw-root{min-height:100%;background:#0e0e0d;color:#eceae5;font-family:inherit;padding:0 0 48px}
.ovw-shell{max-width:1240px;margin:0 auto;padding:28px 32px 0}
.ovw-top{display:flex;align-items:center;justify-content:space-between;gap:16px}
.ovw-mark{font-size:11px;letter-spacing:.22em;font-weight:600;color:#eceae5}
.ovw-mark span{color:#7c7b76;font-weight:400}
.ovw-seg{display:flex;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:4px}
.ovw-seg a{font-size:12.5px;padding:7px 18px;border-radius:9px;color:#b9b7b1;text-decoration:none}
.ovw-seg a.is-active{background:rgba(255,255,255,.12);color:#fff}
.ovw-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin:44px 0 36px}
.ovw-hero h1{font-size:clamp(34px,4.4vw,54px);font-weight:300;letter-spacing:-.01em;line-height:1.04;margin:0;color:#f4f2ed}
.ovw-hero .ovw-sub{margin-top:10px;font-size:12.5px;color:#8a8984}
.ovw-glass{min-width:220px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px 18px;backdrop-filter:blur(12px)}
.ovw-glass .ovw-glass-label{font-size:12px;color:#b9b7b1}
.ovw-glass .ovw-glass-value{font-size:30px;font-weight:300;margin-top:2px}
.ovw-glass .ovw-glass-note{font-size:11.5px;color:#8a8984;margin-top:8px}
.ovw-glass.is-warn .ovw-glass-value{color:${ACCENT}}
.ovw-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px;align-items:start}
.ovw-card{grid-column:span 3;background:#edebe6;border-radius:18px;padding:20px 20px 18px;color:${CARD_INK};min-width:0}
.ovw-card-wide{grid-column:span 6}
@media(max-width:1100px){.ovw-card{grid-column:span 6}.ovw-card-wide{grid-column:span 12}}
@media(max-width:640px){.ovw-card,.ovw-card-wide{grid-column:span 12}}
.ovw-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.ovw-card-head h3{font-size:12.5px;font-weight:500;color:${CARD_INK};margin:0}
.ovw-card-head a{color:${CARD_INK};text-decoration:none;font-size:14px}
.ovw-big{font-size:44px;font-weight:300;letter-spacing:-.01em;line-height:1;margin:6px 0 14px}
.ovw-big small{font-size:14px;color:${CARD_MUTED};font-weight:400;margin-left:6px}
.ovw-meter{position:relative;height:26px;margin-top:4px}
.ovw-meter:before{content:"";position:absolute;inset-inline:0;top:6px;height:2px;background:#d9d7d1}
.ovw-meter-fill{position:absolute;top:5px;height:4px;border-radius:2px}
.ovw-meter-scale{position:absolute;inset-inline:0;top:14px;display:flex;justify-content:space-between;font-size:10.5px;color:${CARD_MUTED}}
.ovw-dotrow{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #dedcd6;font-size:12.5px}
.ovw-dotrow:last-child{border-bottom:0}
.ovw-dot{width:6px;height:6px;border-radius:50%;flex:none}
.ovw-dotrow-label{color:${CARD_INK};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ovw-dotrow-value{margin-left:auto;color:${CARD_INK};font-variant-numeric:tabular-nums}
.ovw-bars{display:flex;align-items:flex-end;gap:5px;height:60px;margin-top:14px}
.ovw-bar{width:4px;border-radius:2px}
.ovw-gauge{position:relative;width:128px;margin:6px auto 0}
.ovw-gauge-value{position:absolute;inset-inline:0;bottom:0;text-align:center;font-size:26px;font-weight:300}
.ovw-gauge-label{text-align:center;font-size:11.5px;color:${CARD_MUTED};margin-top:6px}
.ovw-foot{margin-top:22px;font-size:11.5px;color:#7c7b76}
.ovw-alert-list{margin:0;padding:0;list-style:none;font-size:12.5px}
.ovw-alert-list li{padding:6px 0;border-bottom:1px solid #dedcd6}
.ovw-alert-list li:last-child{border-bottom:0}
`;

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
    <div className="ovw-root">
      <style>{CSS}</style>
      <div className="ovw-shell">
        <div className="ovw-top">
          <div className="ovw-mark">
            {designops.site.name.toUpperCase()} <span>/ DESIGN OPS</span>
          </div>
          <nav className="ovw-seg">
            <a className="is-active" href="/studio/overview">
              Overview
            </a>
            <a href="/studio/performance">Performance</a>
            <a href="/studio/sections">Sections</a>
            <a href="/studio/tokens">Tokens</a>
          </nav>
        </div>

        <div className="ovw-hero">
          <div>
            <h1>Site Overview</h1>
            <div className="ovw-sub">
              {base.replace(/^https?:\/\//, "")} · monitors as of {ago(lastRun)}
            </div>
          </div>
          <div className={`ovw-glass${alerts.length ? " is-warn" : ""}`}>
            <div className="ovw-glass-label">Alerts</div>
            <div className="ovw-glass-value">{alerts.length}</div>
            <div className="ovw-glass-note">
              {alerts.length ? "needs attention" : "all monitors green"}
            </div>
          </div>
        </div>

        <div className="ovw-grid">
          {perf.map((row, i) => (
            <StatCard
              key={row.path}
              title={`${row.path} · mobile`}
              href={`${base}${row.path}`}
              wide={i === 0}
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

          <StatCard title="Design fidelity · worst breakpoint" href="/studio/sections" wide>
            {sections.slice(0, 6).map((row) => (
              <DotRow
                key={row.slug}
                label={row.slug}
                value={row.worst!.toFixed(1)}
                tone={
                  row.worst! >= designops.audit.bands.match
                    ? undefined
                    : row.worst! >= designops.audit.bands.partial
                      ? "accent"
                      : "accent"
                }
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
      </div>
    </div>
  );
}

export const overviewTool: Tool = {
  name: "overview",
  title: "Overview",
  icon: icons["activity"],
  component: OverviewPane,
};
