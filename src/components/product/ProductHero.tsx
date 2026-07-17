"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { MEDIA_EASE } from "@/components/home/AnimatedMedia";

/*
  PDP hero: required on every product page. Matches the comp:
  - full-viewport carousel on the shared gray canvas (surface-2); the
    images sit large and centered, scroll/drag to browse (arrow
    buttons come later), eased progress line at the very bottom
  - the purchase controls float OVER the images along the bottom, each
    in its own chip with padding around the container: name + price,
    COLOR: <name>, image-thumbnail swatches, black SELECT SIZE button
  - the nav floats transparently over this hero, like the homepage
*/

export interface HeroVariantData {
  name?: string;
  color?: string;
  image?: string;
}

export interface ProductHeroData {
  title?: string;
  price?: string;
  compareAtPrice?: string;
  images: string[];
  variants?: HeroVariantData[];
  sizes?: string[];
}

export function ProductHero({ product }: { product: ProductHeroData }) {
  const [selected, setSelected] = useState(0);
  const variants = product.variants ?? [];
  const active = variants[selected];
  /* the selected colorway leads the carousel; the product's remaining
     shots follow */
  const slides = [
    ...(active?.image ? [active.image] : []),
    ...product.images.filter((src) => src !== active?.image),
  ];

  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const updateProgress = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setProgress(el.scrollWidth > 0 ? (el.scrollLeft + el.clientWidth) / el.scrollWidth : 1);
  }, []);

  useEffect(() => {
    updateProgress();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      el.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [updateProgress]);

  /* mouse drag for the track (touch swipes natively) */
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
    if (!drag.current.active) return;
    drag.current.active = false;
    drag.current.moved = false;
    setDragging(false);
  };

  return (
    <div className="relative h-svh w-full bg-surface-2">
      {/* image carousel: slides share the canvas, no gaps */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        className={`no-scrollbar grid h-full w-full auto-cols-[100%] grid-flow-col overflow-x-auto sm:auto-cols-[45%] ${
          dragging ? "cursor-grabbing select-none" : "cursor-grab snap-x snap-mandatory"
        }`}
      >
        {slides.map((src, i) => (
          <div key={`${selected}-${i}`} data-slide className="relative h-full snap-start">
            <motion.div
              role="img"
              aria-label={`${product.title} — image ${i + 1}`}
              className="absolute inset-x-[8%] inset-y-[22%] bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${src})` }}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [...MEDIA_EASE] }}
            />
          </div>
        ))}
      </div>

      {/* purchase controls floating over the images */}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-stretch gap-2 p-6">
        <div className="label flex h-10 min-w-[16rem] flex-1 items-center justify-between gap-6 rounded-xs bg-wash px-4 font-medium text-ink sm:max-w-md">
          <span>{(product.title ?? "").toUpperCase()}</span>
          <span className="flex items-baseline gap-1.5">
            {product.compareAtPrice && (
              <s className="text-ink-3 line-through">{product.compareAtPrice}</s>
            )}
            {product.price}
          </span>
        </div>
        <div className="label flex h-10 min-w-[13rem] items-center rounded-xs bg-wash px-4 font-medium text-ink">
          COLOR: {(active?.name ?? "").toUpperCase()}
        </div>
        {variants.length > 1 && (
          <div className="flex items-stretch gap-2">
            {variants.map((variant, i) => (
              <button
                key={i}
                type="button"
                aria-label={variant.name ?? `Colorway ${i + 1}`}
                onClick={() => setSelected(i)}
                className={`flex size-10 items-center justify-center rounded-xs border bg-surface ${
                  i === selected ? "border-ink" : "border-transparent"
                }`}
              >
                {variant.image ? (
                  <span
                    aria-hidden
                    className="block size-7 bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${variant.image})` }}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="block size-4 rounded-xs"
                    style={{ backgroundColor: variant.color ?? "#c8c8c4" }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="label flex h-10 min-w-[16rem] flex-1 items-center justify-center rounded-xs bg-btn px-4 font-medium text-btn-fg transition-opacity hover:opacity-80"
        >
          SELECT SIZE
        </button>
      </div>

      {/* eased scroll progress along the very bottom */}
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
