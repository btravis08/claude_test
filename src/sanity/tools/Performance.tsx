"use client";

import { icons } from "@sanity/icons";
import { Badge, Box, Card, Flex, Stack, Text } from "@sanity/ui";
import type { Tool } from "sanity";

import history from "@/design/perf.history.json";

/*
  "Performance" — the site's pages as a stock ticker. Each row is one
  production page: its current mobile Lighthouse performance score,
  an up/down arrow against the previous run, a line graph of the
  score's history colored by trend (green improving, red declining),
  the other category grades, and the metrics behind the number.

  Data comes from the lighthouse-history workflow (nightly, 08:30
  UTC, against sundayred.vercel.app) via src/design/perf.history.json.
  The ticker colors are deliberately the only chroma in the Studio —
  they're semantic, not decorative.
*/

interface Scores {
  perf: number;
  a11y: number;
  bp: number;
  seo: number;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
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

const GREEN = "#16a34a";
const RED = "#dc2626";
const FLAT = "#8a8a88";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const trendColor = (delta: number) =>
  delta > 0 ? GREEN : delta < 0 ? RED : FLAT;

function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 36) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

/* the line graph: score history normalized into a small polyline */
function Sparkline({
  snaps,
  color,
  pick,
}: {
  snaps: Snap[];
  color: string;
  pick: (s: Snap) => number | null;
}) {
  const W = 160;
  const H = 40;
  const scores = snaps.map(pick).filter((n): n is number => n !== null);
  if (scores.length < 2) {
    return (
      <Text size={0} muted>
        one run — trend appears tomorrow
      </Text>
    );
  }
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
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* closing price dot */}
      <circle
        cx={W - 2}
        cy={H - 4 - ((scores[scores.length - 1] - min) / (max - min || 1)) * (H - 8)}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

function GradeChip({ label, value }: { label: string; value: number }) {
  return (
    <Badge tone="default" fontSize={0} title={`${label}: ${value}/100`}>
      {label} {value}
    </Badge>
  );
}

function Ticker({
  label,
  snaps,
  pick,
}: {
  label: string;
  snaps: Snap[];
  pick: (s: Snap) => Scores | null;
}) {
  const series = snaps.map((s) => pick(s)?.perf ?? null);
  const present = series.filter((n): n is number => n !== null);
  if (!present.length)
    return (
      <Stack space={2} style={{ width: 250 }}>
        <Text size={0} muted>
          {label}
        </Text>
        <Text size={0} muted>
          first run tonight
        </Text>
      </Stack>
    );
  const latest = present[present.length - 1];
  const prev = present.length > 1 ? present[present.length - 2] : null;
  const delta = prev !== null ? latest - prev : 0;
  const color = trendColor(delta);
  return (
    <Flex align="center" gap={3} style={{ width: 300, flex: "none" }}>
      <Stack space={2} style={{ width: 56 }}>
        <Text size={0} muted>
          {label}
        </Text>
        <Text size={4} weight="semibold" style={{ fontFamily: MONO, color }}>
          {latest}
        </Text>
      </Stack>
      <Text size={1} weight="semibold" style={{ color, width: 40 }}>
        {delta > 0 ? "▲" : delta < 0 ? "▼" : "▬"} {delta === 0 ? "" : Math.abs(delta)}
      </Text>
      <Sparkline snaps={snaps} color={color} pick={(s) => pick(s)?.perf ?? null} />
    </Flex>
  );
}

function PageRow({ page, snaps }: { page: string; snaps: Snap[] }) {
  const latest = snaps[snaps.length - 1];
  const m = mobileOf(latest);
  const lcp = m.lcp !== null ? `${(m.lcp / 1000).toFixed(1)}s` : "—";
  const tbt = m.tbt !== null ? `${Math.round(m.tbt)}ms` : "—";
  const cls = m.cls !== null ? m.cls.toFixed(3) : "—";

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Flex align="center" gap={5} wrap="wrap">
        {/* the ticker: symbol, price, movement */}
        <Box style={{ width: 190, flex: "none" }}>
          <Stack space={3}>
            <Text size={1} weight="semibold" style={{ fontFamily: MONO }}>
              {page}
            </Text>
            <Text size={0} muted>
              tested {ago(latest.t)}
            </Text>
          </Stack>
        </Box>

        <Ticker label="MOBILE" snaps={snaps} pick={(s) => mobileOf(s)} />
        <Ticker label="DESKTOP" snaps={snaps} pick={desktopOf} />

        <Flex gap={2} wrap="wrap" style={{ flex: 1, minWidth: 200 }}>
          <GradeChip label="A11Y" value={m.a11y} />
          <GradeChip label="BP" value={m.bp} />
          <GradeChip label="SEO" value={m.seo} />
          <Text size={0} muted style={{ width: "100%", fontFamily: MONO }}>
            mobile LCP {lcp} · TBT {tbt} · CLS {cls}
          </Text>
        </Flex>

        <Text size={1}>
          <a
            href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(
              `https://sundayred.vercel.app${page}`,
            )}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit" }}
          >
            PSI ↗
          </a>
        </Text>
      </Flex>
    </Card>
  );
}

function PerformancePanel() {
  const pages = Object.entries(DATA).filter(([, snaps]) => snaps.length > 0);
  const latestRun = pages
    .map(([, snaps]) => snaps[snaps.length - 1].t)
    .sort()
    .pop();

  /* the site as one number: average of the latest MOBILE perf scores
     (the stricter form factor — the one the perf ground rules target) */
  const avg = pages.length
    ? Math.round(
        pages.reduce((sum, [, s]) => sum + mobileOf(s[s.length - 1]).perf, 0) /
          pages.length,
      )
    : null;
  const prevAvg =
    pages.length && pages.every(([, s]) => s.length > 1)
      ? Math.round(
          pages.reduce((sum, [, s]) => sum + mobileOf(s[s.length - 2]).perf, 0) /
            pages.length,
        )
      : null;
  const avgDelta = avg !== null && prevAvg !== null ? avg - prevAvg : 0;

  return (
    <Box padding={4} style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Stack space={4}>
        <Flex align="flex-end" gap={4} wrap="wrap">
          <Stack space={3} flex={1}>
            <Text size={3} weight="semibold">
              Performance
            </Text>
            <Text size={1} muted>
              Lighthouse against production, nightly (08:30 UTC), mobile and
              desktop. Green is improving, red is declining — scores are the
              performance grade out of 100; the SITE number tracks mobile,
              the stricter form factor.
            </Text>
          </Stack>
          {avg !== null && (
            <Flex align="center" gap={3}>
              <Text size={1} muted>
                SITE
              </Text>
              <Text
                size={4}
                weight="semibold"
                style={{ fontFamily: MONO, color: trendColor(avgDelta) }}
              >
                {avg}
              </Text>
              <Text size={1} weight="semibold" style={{ color: trendColor(avgDelta) }}>
                {avgDelta > 0 ? "▲" : avgDelta < 0 ? "▼" : "▬"}
              </Text>
            </Flex>
          )}
        </Flex>

        {latestRun && (
          <Card padding={3} radius={2} tone="transparent">
            <Text size={0} muted>
              LAST TEST {new Date(latestRun).toLocaleString()} · next runs
              nightly · sundayred.vercel.app
            </Text>
          </Card>
        )}

        {pages.length === 0 ? (
          <Card padding={5} radius={2} tone="transparent" border>
            <Stack space={3}>
              <Text size={1} weight="medium">
                No scores yet
              </Text>
              <Text size={1} muted>
                Dispatch the <code>lighthouse-history</code> workflow on GitHub
                (or wait for tonight&apos;s run) — results appear here after the
                next deploy.
              </Text>
            </Stack>
          </Card>
        ) : (
          <Stack space={3}>
            {pages.map(([page, snaps]) => (
              <PageRow key={page} page={page} snaps={snaps} />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

export const performanceTool: Tool = {
  name: "performance",
  title: "Performance",
  icon: icons["dashboard"],
  component: PerformancePanel,
};
