"use client";

import { icons } from "@sanity/icons";
import type { Tool } from "sanity";

import history from "@/design/perf.history.json";

import { ACCENT, CARD_INK, CARD_MUTED, DotRow, GlassChip, MONO, Shell, StatCard } from "./dash";
import designops from "../../../designops.config.json";

/*
  "Performance" — the site's pages as tickers on the dashboard skin.
  Each card is one production page: its current mobile Lighthouse
  performance score, the desktop score, trend lines of both series,
  and the metrics behind the number (LCP / TBT / CLS plus the other
  category grades). Ink means passing/improving, accent means
  attention — the pane's only chroma, matching the reference.

  Data comes from the lighthouse-history workflow (nightly, 08:30
  UTC, against production) via src/design/perf.history.json.
*/

interface Scores {
  perf: number;
  a11y: number;
  bp: number;
  seo: number;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
  /* diagnostics (newer snapshots): what Lighthouse crowned LCP, and
     its top savings opportunities */
  lcpElement?: { selector: string | null; snippet: string } | null;
  opportunities?: { id: string; savingsMs: number }[];
}

/* nightly snapshot: both form factors. The first collection predates
   the desktop runs and stored flat mobile scores — normalize reads. */
interface Snap extends Partial<Scores> {
  t: string;
  mobile?: Scores;
  desktop?: Scores;
}

const mobileOf = (s: Snap): Scores => s.mobile ?? (s as unknown as Scores);
const desktopOf = (s: Snap): Scores | null => s.desktop ?? null;

const DATA = (history as { pages: Record<string, Snap[]> }).pages;

/* attention thresholds (Lighthouse bands / Core Web Vitals "good") */
const passScore = (v: number) => v >= 90;
const passLcp = (ms: number | null) => ms !== null && ms <= 2500;
const passTbt = (ms: number | null) => ms !== null && ms <= 200;
const passCls = (v: number | null) => v !== null && v <= 0.1;

function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 36) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

/* the trend line: score history as a small polyline — ink improving,
   accent declining, muted flat */
function Sparkline({ snaps, pick }: { snaps: Snap[]; pick: (s: Snap) => number | null }) {
  const W = 170;
  const H = 44;
  const scores = snaps.map(pick).filter((n): n is number => n !== null);
  if (scores.length < 2)
    return <div style={{ fontSize: 11, color: CARD_MUTED }}>one run — trend appears tomorrow</div>;
  const latest = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  const color = latest > prev ? CARD_INK : latest < prev ? ACCENT : "#b3b1ab";
  const min = Math.min(...scores, 50);
  const max = Math.max(...scores, 100);
  const pts = scores
    .map((s, i) => {
      const x = (i / (scores.length - 1)) * (W - 4) + 2;
      const y = H - 4 - ((s - min) / (max - min || 1)) * (H - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} aria-hidden style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={W - 2}
        cy={H - 4 - ((latest - min) / (max - min || 1)) * (H - 8)}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

function delta(snaps: Snap[], pick: (s: Snap) => number | null): number {
  const present = snaps.map(pick).filter((n): n is number => n !== null);
  return present.length > 1 ? present[present.length - 1] - present[present.length - 2] : 0;
}

function PageCard({ page, snaps }: { page: string; snaps: Snap[] }) {
  const latest = snaps[snaps.length - 1];
  const m = mobileOf(latest);
  const d = desktopOf(latest);
  const mDelta = delta(snaps, (s) => mobileOf(s)?.perf ?? null);

  return (
    <StatCard
      key={page}
      title={
        <span className="ovw-mono">
          {page} <span className="ovw-muted">· tested {ago(latest.t)}</span>
        </span>
      }
      href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(`${designops.site.baseUrl}${page}`)}`}
      size="wide"
    >
      <div style={{ display: "flex", gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "none", width: 150 }}>
          <div className="ovw-big" style={{ color: passScore(m.perf) ? CARD_INK : ACCENT }}>
            {m.perf}
            <small>
              {mDelta !== 0 ? (mDelta > 0 ? `▲${mDelta}` : `▼${Math.abs(mDelta)}`) : "▬"}
            </small>
          </div>
          <div style={{ fontSize: 11.5, color: CARD_MUTED }}>
            mobile{d ? ` · desktop ${d.perf}` : ""}
          </div>
        </div>
        <div style={{ flex: "none" }}>
          <div style={{ fontSize: 10.5, color: CARD_MUTED, marginBottom: 4 }}>MOBILE</div>
          <Sparkline snaps={snaps} pick={(s) => mobileOf(s)?.perf ?? null} />
        </div>
        <div style={{ flex: "none" }}>
          <div style={{ fontSize: 10.5, color: CARD_MUTED, marginBottom: 4 }}>DESKTOP</div>
          <Sparkline snaps={snaps} pick={(s) => desktopOf(s)?.perf ?? null} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <DotRow
            label="LCP"
            value={m.lcp !== null ? `${(m.lcp / 1000).toFixed(1)}s` : "—"}
            tone={passLcp(m.lcp) ? undefined : "accent"}
          />
          <DotRow
            label="TBT"
            value={m.tbt !== null ? `${Math.round(m.tbt)}ms` : "—"}
            tone={passTbt(m.tbt) ? undefined : "accent"}
          />
          <DotRow
            label="CLS"
            value={m.cls !== null ? m.cls.toFixed(3) : "—"}
            tone={passCls(m.cls) ? undefined : "accent"}
          />
          <DotRow
            label="A11Y / BP / SEO"
            value={`${m.a11y} · ${m.bp} · ${m.seo}`}
            tone={passScore(Math.min(m.a11y, m.bp, m.seo)) ? undefined : "accent"}
          />
        </div>
      </div>
      {(m.lcpElement?.selector || (m.opportunities?.length ?? 0) > 0) && (
        <div
          className="ovw-mono"
          style={{ fontSize: 11, color: CARD_MUTED, marginTop: 12 }}
          title={m.lcpElement?.snippet}
        >
          LCP el {m.lcpElement?.selector ?? "—"}
          {m.opportunities?.length
            ? ` · fix first: ${m.opportunities
                .map((o) => `${o.id} (~${(o.savingsMs / 1000).toFixed(1)}s)`)
                .join(", ")}`
            : ""}
        </div>
      )}
    </StatCard>
  );
}

function PerformancePanel() {
  const pages = Object.entries(DATA).filter(([, snaps]) => snaps.length > 0);
  const latestRun = pages
    .map(([, snaps]) => snaps[snaps.length - 1].t)
    .sort()
    .pop();

  /* the site as one number per form factor: the average of the
     latest scores (desktop averages only pages with a desktop run) */
  const average = (pick: (s: Snap) => Scores | null, back: number) => {
    const scores = pages
      .map(([, s]) => (s.length > back ? pick(s[s.length - 1 - back]) : null))
      .filter((v): v is Scores => v !== null)
      .map((v) => v.perf);
    return scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  };
  const mobileNow = average((s) => mobileOf(s), 0);
  const mobilePrev = average((s) => mobileOf(s), 1);
  const desktopNow = average(desktopOf, 0);
  const siteDelta = mobileNow !== null && mobilePrev !== null ? mobileNow - mobilePrev : 0;

  return (
    <Shell
      active="performance"
      title="Performance"
      sub={
        <>
          Lighthouse against production, nightly · mobile and desktop · scores are the performance
          grade out of 100{latestRun ? ` · last test ${new Date(latestRun).toLocaleString()}` : ""}
        </>
      }
      chip={
        mobileNow !== null ? (
          <GlassChip
            label="Site · mobile avg"
            value={
              <>
                {mobileNow}
                <span style={{ fontSize: 14, marginLeft: 8, color: "#b9b7b1" }}>
                  {siteDelta > 0 ? `▲${siteDelta}` : siteDelta < 0 ? `▼${Math.abs(siteDelta)}` : "▬"}
                </span>
              </>
            }
            note={desktopNow !== null ? `desktop avg ${desktopNow}` : undefined}
            warn={!passScore(mobileNow)}
          />
        ) : undefined
      }
    >
      {pages.length === 0 ? (
        <div className="ovw-grid">
          <StatCard title="No scores yet" size="full">
            <div style={{ fontSize: 12.5 }}>
              Dispatch the <code style={{ fontFamily: MONO }}>lighthouse-history</code> workflow on
              GitHub (or wait for tonight&apos;s run) — results appear here after the next deploy.
            </div>
          </StatCard>
        </div>
      ) : (
        <div className="ovw-grid">
          {pages.map(([page, snaps]) => (
            <PageCard key={page} page={page} snaps={snaps} />
          ))}
        </div>
      )}
    </Shell>
  );
}

export const performanceTool: Tool = {
  name: "performance",
  title: "Performance",
  icon: icons["dashboard"],
  component: PerformancePanel,
};
