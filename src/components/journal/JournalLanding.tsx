"use client";

import { m, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { ArrowLink, ArrowSwap } from "@/components/home/ArrowHover";
import { ArrowUpRight } from "@/components/icons";
import { EASE_DRAMATIC, EASE_OUT } from "@/lib/motion";

/*
  Honors Journal landing (Figma "Blog Landing Page V2", node
  33996:98494). A stack of category titles between hairlines; hovering
  anywhere inside a section's borders opens it to an endless stream of
  editorial imagery drifting left → right. Hovering an image eases the
  drift to a stop and breathes a little extra spacing around it;
  leaving the section closes it back to just the word.
*/

type Ratio = "1 / 1" | "4 / 5" | "3 / 4";

interface StreamImage {
  src: string;
  ratio: Ratio;
}

/* the editorial pool from the design's stream (public/figma/journal);
   every card is 1:1, 4:5, or 3:4 per the design's media ratios */
const RATIOS: Ratio[] = [
  "1 / 1",
  "3 / 4",
  "4 / 5",
  "3 / 4",
  "1 / 1",
  "4 / 5",
  "3 / 4",
  "1 / 1",
  "4 / 5",
  "1 / 1",
  "3 / 4",
  "4 / 5",
  "1 / 1",
  "3 / 4",
  "4 / 5",
  "3 / 4",
];

const POOL: StreamImage[] = RATIOS.map((ratio, i) => ({
  src: `/figma/journal/stream-${String(i + 1).padStart(2, "0")}.jpg`,
  ratio,
}));

/* each section streams its own rotation of the pool */
const slice = (start: number, count = 8): StreamImage[] =>
  Array.from({ length: count }, (_, i) => POOL[(start + i) % POOL.length]);

const SECTIONS = [
  { title: "Ambassadors", label: "The players & partners", images: slice(0) },
  {
    title: "Stories from the Course",
    label: "People, ideas, & culture",
    images: slice(3),
  },
  {
    title: "On Craft and Culture",
    label: "Design, materials, & making",
    images: slice(6),
  },
  { title: "In the Press", label: "Coverage & conversation", images: slice(9) },
  { title: "From Tiger", label: "In his words", images: slice(12) },
  { title: "Beyond the Red", label: "Off the course", images: slice(14) },
];

/* stream drift in px/s (left → right) */
const BASE_SPEED = 70;
/* seconds for the drift to ease toward its target speed — the "slow
   easing" stop/restart when an image is hovered */
const SPEED_TAU = 0.7;

function Stream({ images, open }: { images: StreamImage[]; open: boolean }) {
  const copyRef = useRef<HTMLDivElement>(null);
  const copyW = useRef(0);
  const x = useMotionValue(0);
  const speed = useRef(0);
  const target = useRef(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const reduced = useReducedMotion();

  /* width of one copy (its own padding-right carries the seam gap);
     hover spacing changes it, so observe rather than measure once */
  useEffect(() => {
    const el = copyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      copyW.current = el.offsetWidth;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!open) {
      setHovered(null);
      return;
    }
    if (reduced) return;
    target.current = BASE_SPEED;
    speed.current = 0;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      speed.current +=
        (target.current - speed.current) * (1 - Math.exp(-dt / SPEED_TAU));
      /* the ease is asymptotic — settle to a true standstill */
      if (target.current === 0 && Math.abs(speed.current) < 1.5)
        speed.current = 0;
      let nx = x.get() + speed.current * dt;
      /* two copies back to back: keep x in [-W, 0) so the seam never
         shows while drifting rightward */
      const w = copyW.current;
      if (w > 0 && nx >= 0) nx -= w;
      x.set(nx);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, reduced, x]);

  const card = (image: StreamImage, i: number, copy: number) => {
    const key = copy * images.length + i;
    return (
      <div
        key={key}
        /* the "breathing room" on hover — a slow margin ease that
           nudges neighbours aside (CSS twin of EASE_OUT) */
        className="transition-[margin] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ marginInline: hovered === key ? "1.5rem" : "0rem" }}
      >
        <m.div
          initial={false}
          animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{
            duration: 0.55,
            ease: [...EASE_OUT],
            /* staggered fade-up sweeping left → right on open */
            delay: open ? 0.2 + i * 0.07 : 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onMouseEnter={() => {
              setHovered(key);
              target.current = 0;
            }}
            onMouseLeave={() => {
              setHovered((current) => (current === key ? null : current));
              target.current = BASE_SPEED;
            }}
            className="w-[14.3125rem] bg-surface-2 object-cover"
            style={{ aspectRatio: image.ratio }}
          />
        </m.div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-hidden">
      <m.div style={{ x }} className="flex w-max items-center">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            ref={copy === 0 ? copyRef : undefined}
            className="flex items-center gap-8 pr-8 md:gap-[4.5rem] md:pr-[4.5rem]"
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
  hoverCapable,
}: {
  title: string;
  label: string;
  images: StreamImage[];
  hoverCapable: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section
      onMouseEnter={hoverCapable ? () => setOpen(true) : undefined}
      onMouseLeave={hoverCapable ? () => setOpen(false) : undefined}
      className="w-full border-t border-line"
    >
      {/* the whole space between the hairlines is the hit area; the
          button keeps touch + keyboard working where hover can't */}
      <button
        type="button"
        aria-expanded={open}
        onClick={hoverCapable ? undefined : () => setOpen((v) => !v)}
        onFocus={hoverCapable ? () => setOpen(true) : undefined}
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
  /* hover opens sections only where hover is real — touch taps */
  const [hoverCapable, setHoverCapable] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverCapable(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
        {SECTIONS.map((section) => (
          <JournalSection
            key={section.title}
            hoverCapable={hoverCapable}
            {...section}
          />
        ))}
      </div>
    </div>
  );
}
