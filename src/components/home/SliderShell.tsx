"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ArrowLeft, ArrowRight } from "@/components/icons";

export interface SliderItem {
  key: string;
  gender?: string;
  card: React.ReactNode;
}

const FADE_MS = 220;
const MAX_STAGGER_MS = 260;

/*
  Slider chrome from the Figma SDR library, made functional:
  - arrows scroll the track by exactly one card width; each arrow is
    disabled when its end of the track is reached
  - when items carry genders, MENS/WOMENS buttons filter the set with a
    randomly staggered fade-out, then fade the new set in
  - the track stays natively swipeable on touch
*/
export function SliderShell({ title, items }: { title?: string; items: SliderItem[] }) {
  const genders = useMemo(
    () => Array.from(new Set(items.map((i) => i.gender).filter(Boolean))) as string[],
    [items],
  );
  const filterable = genders.length > 1;

  const [gender, setGender] = useState<string | null>(null);
  const [visible, setVisible] = useState(items);
  // "in" = shown, "out" = fading away, "pre" = new set mounted at opacity 0
  const [phase, setPhase] = useState<"in" | "out" | "pre">("in");
  const [delays, setDelays] = useState<Record<string, number>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fresh server data resets the slider (state-adjustment during render)
  const [prevItems, setPrevItems] = useState(items);
  if (prevItems !== items) {
    setPrevItems(items);
    setVisible(items);
    setGender(null);
    setPhase("in");
  }

  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, visible.length]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const slide = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-slide]");
    el.scrollBy({ left: dir * (first?.offsetWidth ?? el.clientWidth), behavior: "smooth" });
  };

  const stagger = (list: SliderItem[]) =>
    Object.fromEntries(list.map((i) => [i.key, Math.random() * MAX_STAGGER_MS]));

  const applyFilter = (next: string | null) => {
    const target = next === gender ? null : next;
    setGender(target);
    setDelays(stagger(visible));
    setPhase("out");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const list = target ? items.filter((i) => !i.gender || i.gender === target) : items;
      setDelays(stagger(list));
      setVisible(list);
      trackRef.current?.scrollTo({ left: 0 });
      setPhase("pre");
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase("in")));
    }, FADE_MS + MAX_STAGGER_MS);
  };

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full items-center justify-between gap-4 border-y border-line bg-surface p-6">
        {title !== undefined && (
          <p className="min-w-0 flex-1 font-display text-title-sm text-ink">{title}</p>
        )}
        {filterable && (
          <div className="hidden items-center gap-3 sm:flex">
            {genders.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => applyFilter(g)}
                className={`label flex h-10 min-w-[120px] items-center justify-center px-3.5 font-medium transition-colors hover:opacity-80 ${
                  gender === g ? "bg-btn text-btn-fg" : "bg-wash text-ink"
                }`}
              >
                {g === "mens" ? "MENS" : g === "womens" ? "WOMENS" : g.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        <div className={`flex items-start pl-3 ${title === undefined ? "ml-auto" : ""}`}>
          <button
            type="button"
            aria-label="Previous"
            disabled={!canPrev}
            onClick={() => slide(-1)}
            className="flex size-10 items-center justify-center text-ink transition-opacity disabled:opacity-30"
          >
            <ArrowLeft />
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={!canNext}
            onClick={() => slide(1)}
            className="flex size-10 items-center justify-center bg-wash text-ink transition-opacity disabled:opacity-30"
          >
            <ArrowRight />
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="grid w-full snap-x snap-mandatory auto-cols-[85%] grid-flow-col overflow-x-auto sm:auto-cols-[45%] lg:auto-cols-[25%]"
      >
        {visible.map((item) => (
          <div
            key={item.key}
            data-slide
            className="flex min-w-0 snap-start"
            style={{
              opacity: phase === "in" ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease`,
              transitionDelay: phase === "pre" ? "0ms" : `${delays[item.key] ?? 0}ms`,
            }}
          >
            {item.card}
          </div>
        ))}
      </div>
    </div>
  );
}
