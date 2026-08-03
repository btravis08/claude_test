import { icons } from "@sanity/icons";
import { Badge, Box, Card, Flex, Grid, Stack, Text } from "@sanity/ui";
import type { Tool } from "sanity";

import backupStatus from "@/design/backup.status.json";
import driftStatus from "@/design/design-drift.json";
import libraryStatus from "@/design/library.status.json";
import linksStatus from "@/design/links.status.json";
import perfHistory from "@/design/perf.history.json";

/*
  Overview — the Studio's landing readout: is everything okay?
  Pulls the JSON the nightly jobs commit (Lighthouse history, section
  audit, link check, dataset backup, design drift) into one pane
  with a red banner when anything needs attention. Data ships with
  the bundle, so "as of" times matter — each panel shows its own.
*/

/* timed sections animate through their screenshots — their layout
   scores are structurally low and are verified by motion specs
   instead (see AGENTS.md) */
const TIMED = new Set(["legacy-hero", "floating-gallery", "full-bleed-carousel", "carousel"]);

type Snap = {
  t?: string;
  perf?: number;
  mobile?: { perf?: number; lcp?: number; tbt?: number };
  desktop?: { perf?: number };
};

const mobileOf = (snap: Snap | undefined) =>
  snap ? (snap.mobile ?? snap) : undefined;

function bandColor(score: number | undefined): string {
  if (score == null) return "#8a8a88";
  if (score >= 90) return "#16a34a";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

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
  if (hoursSince(backup.generatedAt) > 36) alerts.push("dataset backup is stale");
  for (const row of perf) {
    if (row.score != null && row.prevMedian != null && row.prevMedian - row.score >= 10)
      alerts.push(`${row.path} perf dropped (${row.prevMedian}→${row.score})`);
  }

  return { perf, sections, links, backup, drift, alerts };
}

function Panel({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <Card padding={4} radius={2} shadow={1} tone="default">
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            {title}
          </Text>
          {meta ? (
            <Text size={0} muted>
              {meta}
            </Text>
          ) : null}
        </Flex>
        {children}
      </Stack>
    </Card>
  );
}

function OverviewPane() {
  const { perf, sections, links, backup, drift, alerts } = collect();

  return (
    <Box padding={4} style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Stack space={4}>
        {alerts.length > 0 ? (
          <Card padding={4} radius={2} tone="critical">
            <Flex align="center" gap={3}>
              <Text size={1} weight="semibold">
                Needs attention:
              </Text>
              <Text size={1}>{alerts.join(" · ")}</Text>
            </Flex>
          </Card>
        ) : (
          <Card padding={4} radius={2} tone="positive">
            <Text size={1} weight="semibold">
              All clear — every monitor is green.
            </Text>
          </Card>
        )}

        <Grid columns={[1, 1, 2]} gap={4}>
          <Panel
            title="Performance (mobile · desktop)"
            meta={perf[0]?.t ? `as of ${ago(perf[0].t)}` : undefined}
          >
            <Stack space={3}>
              {perf.map((row) => {
                const delta =
                  row.score != null && row.prevMedian != null
                    ? row.score - row.prevMedian
                    : undefined;
                return (
                  <Flex key={row.path} align="center" justify="space-between">
                    <Text size={1}>{row.path}</Text>
                    <Flex align="center" gap={3}>
                      {delta != null && delta !== 0 ? (
                        <Text size={0} style={{ color: delta > 0 ? "#16a34a" : "#dc2626" }}>
                          {delta > 0 ? "▲" : "▼"}
                          {Math.abs(delta)}
                        </Text>
                      ) : null}
                      <Text size={1} weight="semibold" style={{ color: bandColor(row.score) }}>
                        {row.score ?? "—"}
                      </Text>
                      <Text size={0} muted style={{ color: bandColor(row.desktop) }}>
                        {row.desktop ?? "—"}
                      </Text>
                    </Flex>
                  </Flex>
                );
              })}
            </Stack>
          </Panel>

          <Panel
            title="Design fidelity (worst breakpoint)"
            meta={
              (libraryStatus as { generatedAt?: string }).generatedAt
                ? `as of ${ago((libraryStatus as { generatedAt?: string }).generatedAt)}`
                : undefined
            }
          >
            <Stack space={3}>
              {sections.slice(0, 8).map((row) => (
                <Flex key={row.slug} align="center" justify="space-between">
                  <Text size={1}>{row.slug}</Text>
                  <Text
                    size={1}
                    weight="semibold"
                    style={{
                      color:
                        (row.worst ?? 0) >= 85
                          ? "#16a34a"
                          : (row.worst ?? 0) >= 50
                            ? "#d97706"
                            : "#dc2626",
                    }}
                  >
                    {row.worst?.toFixed(1)}
                  </Text>
                </Flex>
              ))}
              <Text size={0} muted>
                Timed sections are verified by motion specs instead.
              </Text>
            </Stack>
          </Panel>

          <Panel title="Link check" meta={`as of ${ago(links.generatedAt)}`}>
            {links.generatedAt == null ? (
              <Text size={1} muted>
                No run recorded yet — results land after the first nightly crawl.
              </Text>
            ) : links.broken.length === 0 ? (
              <Flex align="center" gap={2}>
                <Badge tone="positive">OK</Badge>
                <Text size={1}>{links.checked} URLs checked, none broken</Text>
              </Flex>
            ) : (
              <Stack space={2}>
                {links.broken.slice(0, 6).map((item) => (
                  <Text key={item.url} size={1} style={{ color: "#dc2626" }}>
                    {item.code} · {item.url}
                  </Text>
                ))}
              </Stack>
            )}
          </Panel>

          <Panel title="Dataset backup" meta={`as of ${ago(backup.generatedAt)}`}>
            {backup.generatedAt == null ? (
              <Text size={1} muted>
                No backup recorded yet.
              </Text>
            ) : (
              <Flex align="center" gap={2}>
                <Badge tone={hoursSince(backup.generatedAt) > 36 ? "critical" : "positive"}>
                  {hoursSince(backup.generatedAt) > 36 ? "STALE" : "OK"}
                </Badge>
                <Text size={1}>
                  {backup.docs} documents · {(backup.bytes / 1024).toFixed(0)}KB · 90-day retention
                </Text>
              </Flex>
            )}
          </Panel>
        </Grid>

        <Text size={0} muted>
          Design drift: {drift.generatedAt ? `last checked ${ago(drift.generatedAt)}` : "dormant (FIGMA_TOKEN not set)"} ·
          Data updates with each deploy after the nightly jobs commit their results.
        </Text>
      </Stack>
    </Box>
  );
}

export const overviewTool: Tool = {
  name: "overview",
  title: "Overview",
  icon: icons["activity"],
  component: OverviewPane,
};
