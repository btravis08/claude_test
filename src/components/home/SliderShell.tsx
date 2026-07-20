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
export function SliderShell({
  title,
  titleClassName = "font-display text-title-sm text-ink",
  items,
  variable = false,
  bordered = true,
  cols = "auto-cols-[85%] sm:auto-cols-[45%] lg:auto-cols-[31%] xl:auto-cols-[23.75%]",
  progress: showProgress = true,
  headerClassName = "p-4 md:p-6",
  trackClassName = "",
}: {
  title?: string;
  /* override for label-style headers (e.g. PAIRS WELL WITH) */
  titleClassName?: string;
  items: SliderItem[];
  /* variable: slides size themselves (gallery — natural aspect ratios)
     instead of the uniform card-width grid */
  variable?: boolean;
  /* the hairline above the header (off when the parent draws its own) */
  bordered?: boolean;
  /* responsive auto-cols widths for the track (e.g. wider cards for
     the half-width pairs-well-with rail) */
  cols?: string;
  /* the eased progress line under the track */
  progress?: boolean;
  /* header padding override (flush rails inside padded sections) */
  headerClassName?: string;
  /* extra classes on the track (e.g. the comp's 1.5px top rule) */
  trackClassName?: string;
}) {
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
  // a track whose items all fit shows no progress line at all
  const [scrollable, setScrollable] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    setProgress(el.scrollWidth > 0 ? (el.scrollLeft + el.clientWidth) / el.scrollWidth : 1);
    setScrollable(el.scrollWidth > el.clientWidth + 4);
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

  /* One step = distance between consecutive card starts (card width
     plus the 1px gap), so arrows and snap stay exact */
  const stepWidth = (el: HTMLDivElement) => {
    const slides = el.querySelectorAll<HTMLElement>("[data-slide]");
    if (slides.length >= 2) return slides[1].offsetLeft - slides[0].offsetLeft;
    return slides[0]?.offsetWidth ?? el.clientWidth;
  };

  /* Arrows scroll to exact clamped card positions (never relative
     nudges). iOS Safari's snap engine fights smooth programmatic
     scrolls and can strand the track (even parked in overscroll), so
     snapping is suspended for the flight and re-armed after a hard
     settle on the exact target. */
  const snapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /* the in-flight destination — rapid taps step from it, not from the
     mid-animation scroll position, so each tap advances a full card */
  const pending = useRef<number | null>(null);
  const slide = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = stepWidth(el);
    if (step <= 0) return;
    const max = el.scrollWidth - el.clientWidth;
    const base = pending.current ?? el.scrollLeft;
    /* few-px tolerance so a settled position counts as its own index */
    const idx =
      dir > 0 ? Math.floor((base + 4) / step) : Math.ceil((base - 4) / step);
    const target = Math.min(Math.max((idx + dir) * step, 0), max);
    pending.current = target;
    el.style.scrollSnapType = "none";
    el.scrollTo({ left: target, behavior: "smooth" });
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      el.scrollTo({ left: target, behavior: "instant" });
      el.style.scrollSnapType = "";
      pending.current = null;
      updateArrows();
    }, 650);
  };

  /* a touch mid-flight cancels the pending settle (it would yank the
     track out from under the finger) and re-arms snap for the swipe */
  const onTouchStart = () => {
    const el = trackRef.current;
    clearTimeout(snapTimer.current);
    pending.current = null;
    if (el) el.style.scrollSnapType = "";
  };

  const applyFilter = (next: string | null) => {
    setGender(next === gender ? null : next);
    setGeneration((g) => g + 1);
  };

  /* Cursor drag: mouse-drag the track (touch already swipes natively).
     Snap is suspended while dragging and the track snaps to the nearest
     card on release; a drag suppresses the click it would end on. */
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved) {
      if (Math.abs(dx) < 5) return;
      drag.current.moved = true;
      setDragging(true);
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = drag.current.startScroll - dx;
  };

  const endDrag = () => {
    const el = trackRef.current;
    if (!el || !drag.current.active) return;
    drag.current.active = false;
    if (drag.current.moved) {
      setDragging(false);
      const cardW = stepWidth(el);
      el.scrollTo({ left: Math.round(el.scrollLeft / cardW) * cardW, behavior: "smooth" });
    }
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
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
      <div
        className={`flex w-full items-center justify-between gap-4 bg-surface ${headerClassName} ${
          bordered ? "border-t border-line" : ""
        }`}
      >
        {/* no title (undefined, null, or empty) → the gender toggles
            take the left side and the arrows stay right */}
        {Boolean(title) && (
          <p className={`min-w-0 flex-1 ${titleClassName}`}>{title}</p>
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
        <div className={`flex items-start pl-3 ${title ? "" : "ml-auto"}`}>
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onTouchStart={onTouchStart}
        onDragStart={(e) => e.preventDefault()}
        className={`no-scrollbar w-full gap-px overflow-x-auto ${trackClassName} ${
          variable ? "flex" : `grid grid-flow-col ${cols}`
        } ${
          /* proximity, not mandatory: iOS honors a mandatory
             snap-start even beyond max scroll, which parks the last
             card at the left with blank space trailing it — proximity
             still snaps nearby cards but lets the track legally rest
             flush at either end */
          dragging
            ? "cursor-grabbing select-none"
            : "cursor-grab snap-x snap-proximity"
        }`}
      >
        <AnimatePresence initial={false} onExitComplete={updateArrows}>
          {visible.map((item) => (
            <motion.div
              key={item.key}
              data-slide
              className={`flex snap-start ${variable ? "shrink-0" : "min-w-0"}`}
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
      {showProgress && scrollable && (
        <div className="relative z-10 -mt-0.5 h-0.5 w-full">
          <motion.div
            className="h-full bg-ink"
            initial={false}
            animate={{ width: `${Math.min(progress, 1) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}
    </div>
  );
}
