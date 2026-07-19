"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { ArrowLeft, ArrowRight, Close, Minus, Plus } from "@/components/icons";

/* a screen rect captured on the page at open time */
export interface SourceBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const FLY = { duration: 0.6, ease: [0.85, 0, 0.15, 1] as const };

/* FLIP: start the element at a captured on-page rect (offset +
   scale from its natural layout position) and settle it into place.
   Imperative motion values — mount animations are suppressed under
   the page transition's presence context. */
function useFlyFrom(box: SourceBox | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!box || !el) return;
    const to = el.getBoundingClientRect();
    if (!to.width) return;
    x.jump(box.left + box.width / 2 - (to.left + to.width / 2));
    y.jump(box.top + box.height / 2 - (to.top + to.height / 2));
    scaleX.jump(box.width / to.width);
    scaleY.jump(box.height / to.height);
    animate(x, 0, FLY);
    animate(y, 0, FLY);
    animate(scaleX, 1, FLY);
    animate(scaleY, 1, FLY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ref, style: { x, y, scaleX, scaleY } };
}

/*
  Full-screen product image viewer (opened by tapping a hero slide):
  numbered counter top-left (mono, like the size/stat numerals), close
  top-right, a swipeable full-bleed track with the hero's eased
  progress line along the very bottom, arrow chips at the bottom
  corners, and a centered zoom pill stepping 100 / 150 / 200%. While
  zoomed the track is replaced by a natively pannable canvas of the
  current image; the arrows still page between images.
*/

const ZOOMS = [100, 150, 200];

export function ImageViewer({
  images,
  title,
  initialIndex = 0,
  from,
  onClose,
}: {
  images: string[];
  title?: string;
  initialIndex?: number;
  /* on-page rects the controls fly in from (mobile: the hero arrows
     and the bottom bar shrinking into the zoom pill) */
  from?: { left?: SourceBox; right?: SourceBox; bar?: SourceBox };
  onClose: () => void;
}) {
  const n = images.length;
  const [index, setIndex] = useState(Math.min(initialIndex, n - 1));
  const [zoom, setZoom] = useState(100);
  const [progress, setProgress] = useState(n > 1 ? index / (n - 1) : 1);
  const trackRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<HTMLDivElement>(null);

  const flyLeft = useFlyFrom(from?.left);
  const flyRight = useFlyFrom(from?.right);
  const flyPill = useFlyFrom(from?.bar);
  /* the pill's content resolves after the bar has mostly shrunk in */
  const pillContent = useMotionValue(from?.bar ? 0 : 1);
  useEffect(() => {
    if (from?.bar) animate(pillContent, 1, { duration: 0.3, delay: 0.3 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* lock the page scroll behind the overlay */
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") page(-1);
      if (e.key === "ArrowRight") page(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* track mode: open on (or return to) the current image */
  useLayoutEffect(() => {
    if (zoom !== 100) return;
    const el = trackRef.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  /* zoomed: start the pannable canvas centered */
  useLayoutEffect(() => {
    if (zoom === 100) return;
    const el = panRef.current;
    if (el)
      el.scrollTo({
        left: (el.scrollWidth - el.clientWidth) / 2,
        top: (el.scrollHeight - el.clientHeight) / 2,
        behavior: "instant",
      });
  }, [zoom, index]);

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max > 0) setProgress(el.scrollLeft / max);
    setIndex(
      Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / el.clientWidth))),
    );
  };

  const page = (dir: number) => {
    if (zoom === 100) {
      const el = trackRef.current;
      if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
    } else {
      const next = Math.max(0, Math.min(n - 1, index + dir));
      setIndex(next);
      setProgress(n > 1 ? next / (n - 1) : 1);
    }
  };

  const stepZoom = (dir: number) => {
    const i = ZOOMS.indexOf(zoom) + dir;
    if (i >= 0 && i < ZOOMS.length) setZoom(ZOOMS[i]);
  };

  const pad = (v: number) => String(v).padStart(2, "0");

  return (
    <div
      data-mode="light"
      className="fixed inset-0 z-[80] flex flex-col bg-surface text-ink"
      role="dialog"
      aria-modal="true"
      aria-label={`${title ?? "Product"} images`}
    >
      {/* counter + close */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 md:p-6">
        <p className="font-mono text-[0.875rem] leading-none text-ink">
          {pad(index + 1)} / {pad(n)}
        </p>
        <button
          type="button"
          aria-label="Close viewer"
          onClick={onClose}
          className="pointer-events-auto text-ink"
        >
          <Close />
        </button>
      </div>

      {/* imagery */}
      <div className="relative min-h-0 flex-1">
        {zoom === 100 ? (
          <div
            ref={trackRef}
            onScroll={onTrackScroll}
            className="no-scrollbar grid h-full w-full snap-x snap-mandatory auto-cols-[100%] grid-flow-col overflow-x-auto"
          >
            {images.map((src, i) => (
              <div key={i} className="relative h-full snap-start">
                <div
                  role="img"
                  aria-label={`${title ?? "Product"} — image ${i + 1}`}
                  className="absolute inset-x-[8%] inset-y-[16%] bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${src})` }}
                />
              </div>
            ))}
          </div>
        ) : (
          /* zoomed: the image canvas grows past the viewport and pans
             with native (momentum) scrolling */
          <div ref={panRef} className="no-scrollbar h-full w-full overflow-auto">
            <div
              role="img"
              aria-label={`${title ?? "Product"} — image ${index + 1}, ${zoom}%`}
              className="bg-contain bg-center bg-no-repeat"
              style={{
                width: `${zoom}%`,
                height: `${zoom}%`,
                backgroundImage: `url(${images[index]})`,
              }}
            />
          </div>
        )}
      </div>

      {/* bottom controls: arrows at the corners, zoom pill centered.
          On open they fly in from their on-page rects — the hero
          arrows slide down into the corners, the bottom bar shrinks
          into the zoom pill */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:p-6">
        <motion.div ref={flyLeft.ref} style={flyLeft.style}>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => page(-1)}
            className="pointer-events-auto flex size-[2.875rem] items-center justify-center rounded-xs bg-wash text-ink backdrop-blur-md"
          >
            <ArrowLeft />
          </button>
        </motion.div>
        <motion.div
          ref={flyPill.ref}
          style={flyPill.style}
          className="pointer-events-auto flex h-[2.875rem] items-center gap-1 rounded-xs bg-surface-2 px-2"
        >
          <motion.div style={{ opacity: pillContent }} className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Zoom out"
              disabled={zoom === ZOOMS[0]}
              onClick={() => stepZoom(-1)}
              className="flex size-9 items-center justify-center text-ink disabled:opacity-30"
            >
              <Minus />
            </button>
            <p className="w-14 text-center font-mono text-[0.875rem] leading-none text-ink">
              {zoom}%
            </p>
            <button
              type="button"
              aria-label="Zoom in"
              disabled={zoom === ZOOMS[ZOOMS.length - 1]}
              onClick={() => stepZoom(1)}
              className="flex size-9 items-center justify-center text-ink disabled:opacity-30"
            >
              <Plus />
            </button>
          </motion.div>
        </motion.div>
        <motion.div ref={flyRight.ref} style={flyRight.style}>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => page(1)}
            className="pointer-events-auto flex size-[2.875rem] items-center justify-center rounded-xs bg-wash text-ink backdrop-blur-md"
          >
            <ArrowRight />
          </button>
        </motion.div>
      </div>

      {/* the hero's eased slide indicator along the very bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-0.5">
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
