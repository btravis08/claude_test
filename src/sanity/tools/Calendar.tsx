"use client";

import { useEffect, useMemo, useState } from "react";
import { icons } from "@sanity/icons";
import type { Tool } from "sanity";
import { useClient } from "sanity";

import { ACCENT, CARD_INK, CARD_MUTED, GlassChip, MONO, Shell, StatCard } from "./dash";

/*
  "Calendar" — the editorial month at a glance on the dashboard skin.
  Every post lands on its publish date: ink chips are published,
  accent-outlined chips are drafts (scheduled ahead or still being
  written), and accent-filled rows are content releases on their
  intended publish date. Chips deep-link to the document; releases
  open the Releases tool. Undated drafts surface in their own card so
  nothing is invisible. Data reads live from the dataset each time
  the month changes.
*/

interface CalPost {
  id: string;
  title: string;
  publishedAt?: string;
  draft: boolean;
}

interface CalRelease {
  id: string;
  title: string;
  at?: string;
}

const CSS = `
.cal-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.cal-head h2{font-size:15px;font-weight:500;margin:0;color:${CARD_INK};min-width:12ch}
.cal-nav{display:flex;gap:4px;margin-left:auto}
.cal-nav button{border:1px solid #d0cec8;background:none;border-radius:8px;color:${CARD_INK};font-size:12px;padding:5px 12px;cursor:pointer;font-family:inherit}
.cal-nav button:hover{background:#e2e0da}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cal-dow{font-size:10.5px;letter-spacing:.08em;color:${CARD_MUTED};padding:0 8px 6px;font-family:${MONO}}
.cal-day{min-height:96px;background:#f4f2ed;border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:4px;min-width:0}
.cal-day.is-out{background:none;border:1px dashed #dedcd6}
.cal-day.is-today{box-shadow:inset 0 0 0 1.5px ${CARD_INK}}
.cal-num{font-size:11px;color:${CARD_MUTED};font-family:${MONO}}
.cal-day.is-today .cal-num{color:${CARD_INK};font-weight:600}
.cal-chip{display:block;font-size:11.5px;line-height:1.25;border-radius:6px;padding:4px 7px;background:${CARD_INK};color:#f4f2ed;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cal-chip.is-draft{background:none;color:${CARD_INK};box-shadow:inset 0 0 0 1px ${ACCENT}}
.cal-chip.is-release{background:${ACCENT};color:#fff}
.cal-chip:hover{opacity:.82}
.cal-empty{font-size:12.5px;color:${CARD_MUTED};padding:8px 0}
@media(max-width:900px){.cal-day{min-height:64px}}
`;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOWS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const editUrl = (id: string) => `/studio/intent/edit/id=${id};type=post/`;

function CalendarPanel() {
  const client = useClient({ apiVersion: "2026-07-01" });
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [posts, setPosts] = useState<CalPost[]>([]);
  const [releases, setReleases] = useState<CalRelease[]>([]);
  const [undated, setUndated] = useState<CalPost[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 1).toISOString();
    (async () => {
      try {
        /* raw perspective: published + draft versions side by side,
           merged here so a post shows once (draft edits win the
           display; "draft" marks posts with no published version) */
        const rows = await client
          .withConfig({ perspective: "raw" })
          .fetch<{ _id: string; title?: string; publishedAt?: string }[]>(
            `*[_type == "post"]{ _id, title, publishedAt }`,
          );
        if (cancelled) return;
        const publishedDocs = new Map<string, (typeof rows)[number]>();
        const draftDocs = new Map<string, (typeof rows)[number]>();
        for (const row of rows) {
          if (row._id.startsWith("drafts.")) draftDocs.set(row._id.slice(7), row);
          else publishedDocs.set(row._id, row);
        }
        const merged: CalPost[] = [
          ...new Set([...publishedDocs.keys(), ...draftDocs.keys()]),
        ].map((id) => {
          const doc = draftDocs.get(id) ?? publishedDocs.get(id)!;
          return {
            id,
            title: doc.title ?? "Untitled",
            publishedAt: doc.publishedAt ?? publishedDocs.get(id)?.publishedAt,
            draft: !publishedDocs.has(id),
          };
        });
        setUndated(merged.filter((p) => !p.publishedAt));
        setPosts(
          merged.filter(
            (p) => p.publishedAt && p.publishedAt >= from && p.publishedAt < to,
          ),
        );
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
      try {
        const rel = await client.fetch<
          { _id: string; metadata?: { title?: string; intendedPublishAt?: string } }[]
        >(`releases::all(){ _id, metadata }`);
        if (cancelled) return;
        setReleases(
          rel.map((r) => ({
            id: r._id,
            title: r.metadata?.title ?? "Release",
            at: r.metadata?.intendedPublishAt,
          })),
        );
      } catch {
        /* releases API unavailable — the grid still works */
        if (!cancelled) setReleases([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, year, month]);

  /* Monday-first week grid covering the whole month */
  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    const cells: Date[] = [];
    const d = new Date(start);
    while (d < new Date(year, month + 1, 1) || cells.length % 7 !== 0) {
      cells.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return cells;
  }, [year, month]);

  const byDay = useMemo(() => {
    const map = new Map<string, { posts: CalPost[]; releases: CalRelease[] }>();
    const bucket = (key: string) => {
      const hit = map.get(key) ?? { posts: [], releases: [] };
      map.set(key, hit);
      return hit;
    };
    for (const post of posts)
      bucket(dayKey(new Date(post.publishedAt!))).posts.push(post);
    for (const release of releases)
      if (release.at) bucket(dayKey(new Date(release.at))).releases.push(release);
    return map;
  }, [posts, releases]);

  const drafts = posts.filter((p) => p.draft).length;
  const monthReleases = releases.filter((r) => {
    if (!r.at) return false;
    const d = new Date(r.at);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
  const todayKey = dayKey(today);

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <Shell
      active="calendar"
      title="Content calendar"
      sub="Posts on their publish dates, drafts outlined, releases in accent — the editorial month at a glance."
      chip={
        <GlassChip
          label={`${MONTHS[month]} ${year}`}
          value={posts.length}
          note={`${posts.length === 1 ? "post" : "posts"} · ${drafts} draft${drafts === 1 ? "" : "s"} · ${monthReleases} release${monthReleases === 1 ? "" : "s"}`}
        />
      }
      wide
    >
      <style>{CSS}</style>
      <div className="ovw-grid">
        <StatCard
          size="full"
          title={
            <span className="cal-head">
              <h2>
                {MONTHS[month]} {year}
              </h2>
              <span className="cal-nav">
                <button type="button" onClick={() => shift(-1)} aria-label="Previous month">
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYear(today.getFullYear());
                    setMonth(today.getMonth());
                  }}
                >
                  TODAY
                </button>
                <button type="button" onClick={() => shift(1)} aria-label="Next month">
                  ›
                </button>
              </span>
            </span>
          }
        >
          {error && (
            <p className="cal-empty">
              Dataset unreachable — the calendar fills in when the Studio can
              reach Sanity.
            </p>
          )}
          <div className="cal-grid">
            {DOWS.map((dow) => (
              <div key={dow} className="cal-dow">
                {dow}
              </div>
            ))}
            {days.map((d) => {
              const key = dayKey(d);
              const inMonth = d.getMonth() === month;
              const hit = byDay.get(key);
              return (
                <div
                  key={key}
                  className={`cal-day${inMonth ? "" : " is-out"}${key === todayKey ? " is-today" : ""}`}
                >
                  <span className="cal-num">{d.getDate()}</span>
                  {inMonth &&
                    hit?.releases.map((release) => (
                      <a
                        key={release.id}
                        className="cal-chip is-release"
                        href="/studio/releases"
                        title={`${release.title} — release`}
                      >
                        ⏱ {release.title}
                      </a>
                    ))}
                  {inMonth &&
                    hit?.posts.map((post) => (
                      <a
                        key={post.id}
                        className={`cal-chip${post.draft ? " is-draft" : ""}`}
                        href={editUrl(post.id)}
                        title={`${post.title}${post.draft ? " — draft" : ""}`}
                      >
                        {post.title}
                      </a>
                    ))}
                </div>
              );
            })}
          </div>
        </StatCard>

        <StatCard title="UNDATED DRAFTS" size="wide">
          {undated.length === 0 ? (
            <p className="cal-empty">Every draft has a publish date.</p>
          ) : (
            undated.map((post) => (
              <a
                key={post.id}
                className="ovw-table-row"
                href={editUrl(post.id)}
                style={{ color: CARD_INK, textDecoration: "none" }}
              >
                <span className="ovw-cell">{post.title}</span>
                <span className="ovw-muted" style={{ flex: "none" }}>
                  no date
                </span>
              </a>
            ))
          )}
        </StatCard>

        <StatCard title="HOW TO SCHEDULE" size="wide">
          <p className="cal-empty" style={{ margin: 0 }}>
            Set a future <span className="ovw-mono">Published at</span> on a
            draft to slot it into the month — it stays outlined until the day
            it goes live. Grouped launches belong in a content release with an
            intended publish date; they appear here in accent.
          </p>
        </StatCard>
      </div>
    </Shell>
  );
}

export const calendarTool: Tool = {
  name: "calendar",
  title: "Calendar",
  icon: icons["calendar"],
  component: CalendarPanel,
};
