"use client";

import { m, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { ArrowLink, ArrowSwap } from "@/components/home/ArrowHover";
import { ArrowUpRight } from "@/components/icons";
import { SmartLink } from "@/components/SmartLink";
import { JOURNAL_CATEGORIES } from "@/components/journal/articles";
import { EASE_DRAMATIC, EASE_OUT } from "@/lib/motion";

/*
  Honors Journal landing (Figma "Blog Landing Page V2", node
  33996:98494). A stack of category titles between hairlines behaving
  as an always-one-open accordion: Ambassadors starts open, hovering
  another section hands the open state over (the closing and opening
  panels animate together so the stack's height never jumps), and the
  last activated section simply stays open.

  Each open section is an endless stream of top-aligned editorial
  imagery drifting left → right. Hovering an image eases the drift to
  a standstill; the wheel (or a touch drag) scrubs the stream by hand,
  and once the input goes quiet the drift resumes its original speed
  gracefully. Cards link to their articles.
*/

interface StreamImage {
  src: string;
  ratio: string;
  href: string;
}

/* each category streams its articles' imagery (1:1, 4:5, 3:4 cards);
   clicking a card opens that article */
const SECTIONS = JOURNAL_CATEGORIES.map((category) => ({
  title: category.title,
  label: category.label,
  images: category.articles.flatMap((article): StreamImage[] =>
    article.stream.map((image) => ({
      ...image,
      href: `/journal/${article.slug}`,
    })),
  ),
}));

/* stream drift in px/s (left → right) */
const BASE_SPEED = 70;
/* seconds for the drift to ease toward its target speed — the "slow
   easing" stop on image hover and the graceful resume after scrubbing */
const SPEED_TAU = 0.7;
/* quiet time after wheel scrubbing before the drift resumes */
const RESUME_DELAY_MS = 600;
/* fastest flick momentum carried out of a touch swipe (px/s) */
const MAX_FLICK = 3500;

function Stream({ images, open }: { images: StreamImage[]; open: boolean }) {
  const copyRef = useRef<HTMLDivElement>(null);
  const copyW = useRef(0);
  const x = useMotionValue(0);
  const speed = useRef(0);
  const target = useRef(0);
  /* timestamp of the last manual scrub — drift stays parked until
     the input has been quiet for RESUME_DELAY_MS */
  const lastScrub = useRef(0);
  const imageHovered = useRef(false);
  const reduced = useReducedMotion();

  /* width of one copy (its own padding-right carries the seam gap) */
  useEffect(() => {
    const el = copyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      copyW.current = el.offsetWidth;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* keep x in [-W, 0) — two copies back to back, seam never shows
     whichever way the stream travels */
  const wrap = (value: number) => {
    const w = copyW.current;
    if (w <= 0) return value;
    let nx = value;
    while (nx >= 0) nx -= w;
    while (nx < -w) nx += w;
    return nx;
  };

  useEffect(() => {
    if (!open || reduced) return;
    target.current = BASE_SPEED;
    speed.current = 0;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      /* while a finger owns the stream, the loop just idles — x is
         driven directly by pointermove */
      if (dragging.current) {
        raf = requestAnimationFrame(tick);
        return;
      }
      /* over a hovered image (or briefly after a wheel scrub) the
         drift aims for 0; otherwise it aims for cruise — which is
         also what carries flick momentum back down: a released swipe
         seeds speed with the finger's velocity and this same ease
         decays it gradually to the constant loop speed */
      const parked =
        imageHovered.current || now - lastScrub.current < RESUME_DELAY_MS;
      target.current = parked ? 0 : BASE_SPEED;
      speed.current +=
        (target.current - speed.current) * (1 - Math.exp(-dt / SPEED_TAU));
      /* the ease is asymptotic — settle to a true standstill */
      if (target.current === 0 && Math.abs(speed.current) < 1.5)
        speed.current = 0;
      x.set(wrap(x.get() + speed.current * dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, reduced, x]);

  /* manual horizontal scrub: trackpad/shift-wheel moves the stream
     directly (parked, then resuming after quiet); a touch swipe rides
     the finger 1:1 and releases with native-feeling momentum. */
  const railRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragX = useRef(0);
  const dragged = useRef(0);
  /* smoothed finger velocity (px/s) — the momentum seed on release */
  const flickVel = useRef(0);
  const lastMoveTs = useRef(0);
  useEffect(() => {
    const el = railRef.current;
    if (!el || !open) return;
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
      if (dx === 0) return;
      e.preventDefault();
      lastScrub.current = performance.now();
      speed.current = 0;
      x.set(wrap(x.get() - dx));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, x]);

  const card = (image: StreamImage, i: number, copy: number) => (
    <m.div
      key={copy * images.length + i}
      initial={false}
      animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{
        duration: 0.55,
        ease: [...EASE_OUT],
        /* staggered fade-up sweeping left → right on open */
        delay: open ? 0.2 + i * 0.07 : 0,
      }}
    >
      <SmartLink
        href={image.href}
        className="block"
        draggable={false}
        onMouseEnter={() => {
          imageHovered.current = true;
        }}
        onMouseLeave={() => {
          imageHovered.current = false;
        }}
        onClick={(e) => {
          /* a drag that travelled isn't a click */
          if (dragged.current > 6) e.preventDefault();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="w-[10rem] bg-surface-2 object-cover md:w-[14.3125rem]"
          style={{ aspectRatio: image.ratio }}
        />
      </SmartLink>
    </m.div>
  );

  return (
    <div
      ref={railRef}
      className="w-full touch-pan-y overflow-hidden"
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        dragging.current = true;
        dragX.current = e.clientX;
        dragged.current = 0;
        flickVel.current = 0;
        lastMoveTs.current = e.timeStamp;
        speed.current = 0;
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const dx = e.clientX - dragX.current;
        dragX.current = e.clientX;
        dragged.current += Math.abs(dx);
        /* smoothed instantaneous velocity, so the release carries the
           flick rather than the last jittery sample */
        const dt = (e.timeStamp - lastMoveTs.current) / 1000;
        lastMoveTs.current = e.timeStamp;
        if (dt > 0)
          flickVel.current = flickVel.current * 0.7 + (dx / dt) * 0.3;
        x.set(wrap(x.get() + dx));
      }}
      onPointerUp={(e) => {
        if (!dragging.current) return;
        dragging.current = false;
        /* a fast swipe leaves fast, then the loop's ease gradually
           brings it back to cruise speed — a stale flick sample dies
           if the finger paused before lifting */
        const stale = e.timeStamp - lastMoveTs.current > 120;
        speed.current = stale
          ? 0
          : Math.max(-MAX_FLICK, Math.min(MAX_FLICK, flickVel.current));
      }}
      onPointerCancel={() => {
        dragging.current = false;
        speed.current = 0;
      }}
    >
      {/* top-aligned rows — mixed ratios hang from a common top edge */}
      <m.div style={{ x }} className="flex w-max items-start">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            ref={copy === 0 ? copyRef : undefined}
            className="flex items-start gap-8 pr-8 md:gap-[4.5rem] md:pr-[4.5rem]"
          >
            {images.map((image, i) => card(image, i, copy))}
          </div>
        ))}
      </m.div>
    </div>
  );
}

function JournalSection({
  title,
  label,
  images,
  open,
  onActivate,
}: {
  title: string;
  label: string;
  images: StreamImage[];
  open: boolean;
  onActivate: () => void;
}) {
  return (
    <section
      onMouseEnter={onActivate}
      className="w-full border-t border-line"
    >
      {/* the whole space between the hairlines is the hit area; the
          button keeps touch + keyboard working where hover can't */}
      <button
        type="button"
        aria-expanded={open}
        onClick={onActivate}
        onFocus={onActivate}
        className="grid w-full cursor-default grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-12 text-left max-md:cursor-pointer"
      >
        <m.p
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [...EASE_OUT] }}
          className="label text-ink max-md:hidden"
        >
          {label}
        </m.p>
        <h2 className="text-center font-display text-headline-lg text-ink">
          {title}
        </h2>
        <m.span
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [...EASE_OUT] }}
          className={`flex items-center justify-end max-md:hidden ${
            open ? "" : "pointer-events-none"
          }`}
        >
          <ArrowLink
            href="#"
            className="label group relative flex items-center gap-1.5 text-ink"
          >
            <span className="relative">
              VIEW ALL ARTICLES
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-ink transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
            </span>
            <ArrowSwap dx={1} dy={-1}>
              <ArrowUpRight />
            </ArrowSwap>
          </ArrowLink>
        </m.span>
      </button>

      {/* open/close share one duration + ease, so the section handing
          its height to the next keeps the stack's total constant */}
      <m.div
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={{ duration: 0.65, ease: [...EASE_DRAMATIC] }}
        className="overflow-hidden"
      >
        {/* mobile stacks the eyebrow under the title (no view-all) */}
        <p className="label pb-2 text-center text-ink md:hidden">{label}</p>
        <div className="py-16 md:py-[11.25rem]">
          <Stream images={images} open={open} />
        </div>
      </m.div>
    </section>
  );
}

export function JournalLanding() {
  /* always-one-open accordion: Ambassadors by default, and the last
     activated section stays open — nothing ever closes to zero */
  const [active, setActive] = useState(0);

  return (
    <div data-mode="light" className="bg-surface text-ink">
      {/* masthead: HJ script monogram + mission line */}
      <header className="flex flex-col items-center justify-end gap-12 px-6 pb-8 pt-[8.75rem] md:pt-[12.5rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/figma/journal/hj-monogram.svg"
          alt="Honors Journal"
          width={171}
          height={104}
          fetchPriority="high"
          className="h-[5.25rem] w-auto md:h-[6.5rem]"
        />
        <p className="label max-w-[22.875rem] text-center">
          The Honors Journal is a tempor faucibus est amet et. Ipsum faucibus
          adipiscing ultricies et commodo morbi adipiscing tristique. Lectus
          amet eget neque pellentesque.
        </p>
      </header>

      <div className="flex flex-col pb-32 pt-[4.5rem]">
        {SECTIONS.map((section, i) => (
          <JournalSection
            key={section.title}
            open={active === i}
            onActivate={() => setActive(i)}
            {...section}
          />
        ))}
      </div>
    </div>
  );
}
