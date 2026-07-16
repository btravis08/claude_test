"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { MEDIA_EASE } from "@/components/home/AnimatedMedia";

/* Swatches stagger-fade in from the right, right to left, when the
   pointer is over the card but outside the image well */
const swatchVariants: Variants = {
  rest: { opacity: 0, x: 8, transition: { duration: 0.15 } },
  hover: (order: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [...MEDIA_EASE], delay: order * 0.06 },
  }),
};

const extraLabelVariants: Variants = {
  rest: { opacity: 1, transition: { duration: 0.2, delay: 0.15 } },
  hover: { opacity: 0, transition: { duration: 0.15 } },
};

export interface ProductVariantData {
  name?: string;
  color?: string;
  image?: string;
  hoverImage?: string;
  /* formatted price override for this variant */
  price?: string;
  compareAtPrice?: string;
}

export interface ProductCardData {
  _key?: string;
  title?: string;
  price?: string;
  /* formatted original price to strike through (sale) */
  compareAtPrice?: string;
  gender?: string;
  colorway?: string;
  colorCount?: string;
  image?: string;
  hoverImage?: string;
  variants?: ProductVariantData[];
  /* which variant this card shows by default (variant-per-card model) */
  defaultVariant?: number;
}

/*
  Product Card V1 with the standard image behaviors:
  - the padded product shot enters with the fade/settle animation
  - hovering the IMAGE WELL reveals its full-bleed hover image,
    settling from 1.05x to 1x
  - hovering the card anywhere OUTSIDE the well swaps "+N colors" for
    clickable swatches; picking one switches the visible product shot,
    the hover image, and the variant name — the two hover zones never
    overlap, so the swap is always visible
*/
export function ProductCard({ product }: { product: ProductCardData }) {
  const variants = product.variants ?? [];
  const [selected, setSelected] = useState(product.defaultVariant ?? 0);
  const [cardHover, setCardHover] = useState(false);
  const [wellHover, setWellHover] = useState(false);
  const showSwatches = cardHover && !wellHover;
  const active = variants[selected];

  /* Warm the browser cache for every colorway's images on first hover
     so a swatch click swaps instantly instead of flashing while the
     new image loads */
  const preloaded = useRef(false);
  useEffect(() => {
    if (!cardHover || preloaded.current) return;
    preloaded.current = true;
    for (const variant of variants) {
      for (const src of [variant.image, variant.hoverImage]) {
        if (src) new window.Image().src = src;
      }
    }
  }, [cardHover, variants]);
  const wellImage = active?.image ?? product.image ?? "/figma/card-shoe.png";
  const hoverImage = active?.hoverImage ?? product.hoverImage;
  const extra = variants.length > 0 ? variants.length - 1 : undefined;
  const colorLabel = active?.name ?? product.colorway;
  /* variant price override wins; sale shows the struck original */
  const priceLabel = active?.price ?? product.price;
  const compareAtLabel = active?.price ? active?.compareAtPrice : product.compareAtPrice;
  const extraLabel =
    extra !== undefined
      ? extra > 0
        ? `+${extra} colors`
        : undefined
      : product.colorCount;

  return (
    <motion.a
      href="#"
      initial="rest"
      animate={showSwatches ? "hover" : "rest"}
      onMouseEnter={() => setCardHover(true)}
      onMouseLeave={() => setCardHover(false)}
      className="flex w-full flex-col justify-center gap-[1.125rem] bg-surface pb-16"
    >
      <motion.div
        onMouseEnter={() => setWellHover(true)}
        onMouseLeave={() => setWellHover(false)}
        className="group/well relative flex aspect-[236/301] w-full flex-col justify-end overflow-hidden rounded-xs bg-surface-2 p-6"
        initial={{ opacity: 0, scale: 1.05 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: [...MEDIA_EASE] }}
      >
        {/* padded product shot; the outgoing colorway stays visible
            while the new one fades in, so the swap never goes blank */}
        <AnimatePresence initial={false}>
          <motion.div
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="img"
            aria-label={product.title}
            className="absolute inset-x-[17.77%] top-1/2 aspect-square -translate-y-1/2 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${wellImage})` }}
          />
        </AnimatePresence>
        {/* full-bleed hover image, settles 1.05x → 1x, shown only while
            the pointer is over the well itself; the keyed layers
            crossfade when a swatch picks another colorway */}
        {hoverImage && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 scale-105 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/well:scale-100 group-hover/well:opacity-100"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={selected}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${hoverImage})` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </AnimatePresence>
          </div>
        )}
      </motion.div>
      <div className="flex w-full flex-col gap-1.5 px-4 sm:px-6">
        <div className="label flex w-full items-center justify-between font-medium text-ink">
          <p>{product.title}</p>
          <p className="flex items-baseline gap-1.5">
            {compareAtLabel && (
              <s className="text-ink-3 line-through">{compareAtLabel}</s>
            )}
            <span>{priceLabel}</span>
          </p>
        </div>
        <div className="flex h-4 w-full items-center justify-between font-mono text-[0.75rem] uppercase leading-none text-ink-2">
          <p>{colorLabel}</p>
          <span className="relative flex items-center justify-end">
            {extraLabel && (
              <motion.p variants={variants.length > 1 ? extraLabelVariants : undefined}>
                {extraLabel}
              </motion.p>
            )}
            {variants.length > 1 && (
              <span
                className={`absolute right-0 flex items-center gap-1.5 ${
                  showSwatches ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                {variants.map((variant, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    aria-label={variant.name ?? `Variant ${i + 1}`}
                    custom={variants.length - 1 - i}
                    variants={swatchVariants}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelected(i);
                    }}
                    className={`size-4 rounded-xs border ${
                      i === selected ? "border-ink" : "border-line"
                    }`}
                    style={{ backgroundColor: variant.color ?? "#c8c8c4" }}
                  />
                ))}
              </span>
            )}
          </span>
        </div>
      </div>
    </motion.a>
  );
}
