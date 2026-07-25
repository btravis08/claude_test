"use client";

import { m } from "motion/react";
import { useEffect, useState } from "react";

import { NavTextLink } from "@/components/NavTextLink";
import {
  HERO_READY_EVENT,
  type FieldEntry,
  takeFieldEntry,
} from "@/components/journal/field-transition";
import { EASE_OUT } from "@/lib/motion";

/*
  Article opening — two entries:

  Normal (direct load, link from the accordion landing): breadcrumbed
  header above a full-bleed 16/9 hero, per the Figma article layout.

  Field entry (a tile clicked on /journal/alt): the clicked image
  itself becomes a fullscreen hero — the grid's FLIP overlay expands
  the tile to the viewport, this component mounts the same pixels
  underneath and announces itself, the overlay fades away, and the
  title rises over the image's lower edge.
*/

function Slash() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className="text-ink"
    >
      <path d="M2.9 9.2 7.1.8" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function ArticleTop({
  slug,
  title,
  categoryTitle,
  heroSrc,
}: {
  slug: string;
  title: string;
  categoryTitle: string;
  heroSrc: string;
}) {
  const [field, setField] = useState<FieldEntry | null>(null);
  const [ready, setReady] = useState(false);

  /* claim a pending field transition after hydration (SSR always
     renders the normal layout, so there's nothing to mismatch) */
  useEffect(() => {
    const entry = takeFieldEntry(slug);
    if (entry) setField(entry);
  }, [slug]);

  /* tell the grid's overlay the fullscreen pixels are underneath it,
     then bring the copy up once the fade has begun */
  useEffect(() => {
    if (!field) return;
    window.dispatchEvent(new CustomEvent(HERO_READY_EVENT));
    const t = window.setTimeout(() => setReady(true), 300);
    return () => window.clearTimeout(t);
  }, [field]);

  if (field) {
    return (
      <div
        data-mode="dark"
        className="relative -mt-[3.75rem] h-svh w-full overflow-hidden bg-[#0b0b0b]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={field.src}
          alt={title}
          fetchPriority="high"
          className="size-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent px-6 pb-10 pt-28 md:px-10 md:pb-14">
          <m.p
            initial={false}
            animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 18 }}
            transition={{ duration: 0.55, ease: [...EASE_OUT] }}
            className="label text-white/80"
          >
            HONORS JOURNAL / {categoryTitle.toUpperCase()}
          </m.p>
          <m.h1
            initial={false}
            animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 26 }}
            transition={{ duration: 0.65, ease: [...EASE_OUT], delay: 0.09 }}
            className="mt-3 font-display text-display-xl text-white"
          >
            {title}
          </m.h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-col items-center justify-end gap-6 px-6 pb-8 pt-[10rem] md:pt-[12.5rem]">
        <nav aria-label="Breadcrumb" className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <NavTextLink href="/journal" label="HONORS JOURNAL" />
            <Slash />
          </span>
          <NavTextLink href="/journal" label={categoryTitle.toUpperCase()} />
        </nav>
        <h1 className="text-center font-display text-headline-md text-ink">
          {title}
        </h1>
      </header>
      <div className="w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt={title}
          fetchPriority="high"
          decoding="async"
          className="aspect-[2/3] w-full bg-surface-2 object-cover sm:aspect-[16/9]"
        />
      </div>
    </>
  );
}
