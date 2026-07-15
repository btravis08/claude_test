"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ArrowButton, ArrowSwap } from "@/components/home/ArrowHover";
import { ArrowLeft, ArrowRight } from "@/components/icons";

export interface SliderItem {
  key: string;
  gender?: string;
  card: React.ReactNode;
}

const FADE_S = 0.22;
const STAGGER_S = 0.26;

/* Deterministic pseudo-random in [0,1) — stable during render */
function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/*
  Slider chrome from the Figma SDR library, made functional:
  - arrows scroll the track by exactly one card width; each arrow is
    disabled when its end of the track is reached
  - when items carry genders, MENS/WOMENS buttons filter the set; the
    outgoing cards fade in random staggered order, then the incoming
    set fades in (Motion AnimatePresence)
  - the track stays natively swipeable on touch
*/
export function SliderShell({ title, items }: { title?: string; items: SliderItem[] }) {
  const genders = useMemo(
    () => Array.from(new Set(items.map((i) => i.gender).filter(Boolean))) as string[],
    [items],
  );
  const filterable = genders.length > 1;

  const [gender, setGender] = useState<string | null>(null);
  // Bumped per filter click so the stagger order reshuffles each time
  const [generation, setGeneration] = useState(0);
  const visible = useMemo(
    () => (gender ? items.filter((i) => !i.gender || i.gender === gender) : items),
    [items, gender],
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  // Fraction of the track scrolled past + in view: clientWidth/scrollWidth
  // at the start, 1 at the end
  const [progress, setProgress] = useState(0);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    setProgress(el.scrollWidth > 0 ? (el.scrollLeft + el.clientWidth) / el.scrollWidth : 1);
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

  const slide = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-slide]");
    el.scrollBy({ left: dir * (first?.offsetWidth ?? el.clientWidth), behavior: "smooth" });
  };

  const applyFilter = (next: string | null) => {
    setGender(next === gender ? null : next);
    setGeneration((g) => g + 1);
  };

  // On filter change: reset the track, and re-settle once the card
  // transition is done (scroll snapping can nudge scrollLeft mid-swap)
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
    updateArrows();
    const t = setTimeout(
      () => {
        trackRef.current?.scrollTo({ left: 0 });
        updateArrows();
      },
      (FADE_S + 2 * STAGGER_S) * 1000 + 150,
    );
    return () => clearTimeout(t);
  }, [gender, updateArrows]);

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full items-center justify-between gap-4 border-t border-line bg-surface p-6">
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
                className={`label flex h-10 min-w-[7.5rem] items-center justify-center rounded-xs px-3.5 font-medium transition-colors hover:opacity-80 ${
                  gender === g ? "bg-btn text-btn-fg" : "bg-wash text-ink"
                }`}
              >
                {g === "mens" ? "MENS" : g === "womens" ? "WOMENS" : g.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        <div className={`flex items-start pl-3 ${title === undefined ? "ml-auto" : ""}`}>
          <ArrowButton
            type="button"
            aria-label="Previous"
            disabled={!canPrev}
            onClick={() => slide(-1)}
            className="flex size-10 items-center justify-center rounded-xs bg-wash text-ink transition-all disabled:bg-transparent disabled:opacity-30"
          >
            <ArrowSwap dx={-1}>
              <ArrowLeft />
            </ArrowSwap>
          </ArrowButton>
          <ArrowButton
            type="button"
            aria-label="Next"
            disabled={!canNext}
            onClick={() => slide(1)}
            className="flex size-10 items-center justify-center rounded-xs bg-wash text-ink transition-all disabled:bg-transparent disabled:opacity-30"
          >
            <ArrowSwap dx={1}>
              <ArrowRight />
            </ArrowSwap>
          </ArrowButton>
        </div>
      </div>
      <div
        ref={trackRef}
        className="no-scrollbar grid w-full snap-x snap-mandatory auto-cols-[85%] grid-flow-col overflow-x-auto border-y border-line sm:auto-cols-[45%] lg:auto-cols-[25%]"
      >
        <AnimatePresence initial={false} onExitComplete={updateArrows}>
          {visible.map((item) => (
            <motion.div
              key={item.key}
              data-slide
              className="flex min-w-0 snap-start"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                // incoming cards wait for the outgoing stagger to clear
                transition: {
                  duration: FADE_S,
                  delay: FADE_S + STAGGER_S + hash01(item.key + generation) * STAGGER_S,
                },
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: FADE_S,
                  delay: hash01(item.key + generation) * STAGGER_S,
                },
              }}
            >
              {item.card}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Custom scroll progress: eased fill, full width at the end.
          Sits on top of the cards' bottom hairline (-mt) with no track
          background of its own. */}
      <div className="relative z-10 -mt-0.5 h-0.5 w-full">
        <motion.div
          className="h-full bg-ink"
          initial={false}
          animate={{ width: `${Math.min(progress, 1) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
