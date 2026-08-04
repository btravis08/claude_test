"use client";

import { useEffect, useState } from "react";
import { useClient } from "sanity";

import { ACCENT, CARD_INK, CARD_MUTED, MONO, StatCard } from "./dash";

/*
  Experiments card (Overview pane): live A/B results. Counters come
  from abResult docs (flat views_<variantKey> / converts_<variantKey>,
  written by /api/ab); variant labels and hypotheses come from the
  experiment sections still present on pages. The best conversion
  rate renders in ink, the rest muted — accent marks a variant beating
  the control once both have views.
*/

interface ResultDoc {
  experiment?: string;
  counters?: Record<string, number>;
  _updatedAt?: string;
}

interface ExperimentConfig {
  key?: string;
  note?: string;
  variants?: { _key: string; label?: string }[];
}

interface Row {
  experiment: string;
  note?: string;
  live: boolean;
  variants: { label: string; views: number; converts: number; rate: number }[];
}

export function ExperimentsCard() {
  const client = useClient({ apiVersion: "2026-07-01" });
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [results, pages] = await Promise.all([
          client.fetch<ResultDoc[]>(
            `*[_type == "abResult"]{ experiment, counters, _updatedAt }`,
          ),
          client.fetch<{ ex?: ExperimentConfig[] }[]>(
            `*[_type == "page" && count(sections[_type == "sectionExperiment"]) > 0]{
              "ex": sections[_type == "sectionExperiment"]{ key, note, variants[]{ _key, label } }
            }`,
          ),
        ]);
        if (cancelled) return;
        const configs = new Map<string, ExperimentConfig>();
        for (const page of pages)
          for (const ex of page.ex ?? [])
            if (ex.key) configs.set(ex.key, ex);

        const keys = new Set<string>([
          ...results.map((r) => r.experiment ?? "").filter(Boolean),
          ...configs.keys(),
        ]);
        const built: Row[] = [...keys].map((key) => {
          const config = configs.get(key);
          const counters = results.find((r) => r.experiment === key)?.counters ?? {};
          /* variant keys: configured ones first, then any orphaned
             counter keys (variant deleted mid-experiment) */
          const known = config?.variants ?? [];
          const counted = new Set(
            Object.keys(counters)
              .map((k) => k.replace(/^(views|converts)_/, ""))
              .filter(Boolean),
          );
          for (const variant of known) counted.delete(variant._key);
          const variants = [
            ...known.map((v, i) => ({ vKey: v._key, label: v.label ?? `Variant ${i + 1}` })),
            ...[...counted].map((vKey) => ({ vKey, label: `(removed ${vKey.slice(0, 6)})` })),
          ].map(({ vKey, label }) => {
            const views = counters[`views_${vKey}`] ?? 0;
            const converts = counters[`converts_${vKey}`] ?? 0;
            return { label, views, converts, rate: views > 0 ? converts / views : 0 };
          });
          return { experiment: key, note: config?.note, live: Boolean(config), variants };
        });
        setRows(built.sort((a, b) => Number(b.live) - Number(a.live)));
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <StatCard title="Experiments" size="wide">
      {!rows || rows.length === 0 ? (
        <p style={{ fontSize: 12.5, color: CARD_MUTED, margin: 0 }}>
          {rows === null
            ? "Loading…"
            : "No experiments yet — add an A/B Experiment section to a page."}
        </p>
      ) : (
        rows.map((row) => {
          const best = Math.max(...row.variants.map((v) => v.rate));
          const control = row.variants[0];
          return (
            <div key={row.experiment} style={{ padding: "8px 0", borderBottom: "1px solid #dedcd6" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: CARD_INK }}>
                  {row.experiment}
                </span>
                {!row.live && (
                  <span style={{ fontSize: 10.5, color: CARD_MUTED }}>ended</span>
                )}
                {row.note && (
                  <span style={{ fontSize: 11.5, color: CARD_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.note}
                  </span>
                )}
              </div>
              {row.variants.map((variant, i) => {
                const beatsControl =
                  i > 0 &&
                  variant.views > 0 &&
                  (control?.views ?? 0) > 0 &&
                  variant.rate > (control?.rate ?? 0);
                return (
                  <div
                    key={`${row.experiment}-${variant.label}-${i}`}
                    style={{
                      display: "flex",
                      gap: 10,
                      fontSize: 12,
                      fontFamily: MONO,
                      color: variant.rate === best && variant.views > 0 ? CARD_INK : CARD_MUTED,
                      padding: "2px 0",
                    }}
                  >
                    <span style={{ width: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {variant.label}
                      {i === 0 ? " (control)" : ""}
                    </span>
                    <span style={{ width: 90 }}>{variant.views} views</span>
                    <span style={{ width: 60 }}>{variant.converts} conv</span>
                    <span style={{ color: beatsControl ? ACCENT : undefined }}>
                      {variant.views > 0 ? `${(variant.rate * 100).toFixed(1)}%` : "—"}
                      {beatsControl ? " ▲" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </StatCard>
  );
}
