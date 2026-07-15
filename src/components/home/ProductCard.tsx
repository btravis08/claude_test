"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { useState } from "react";

import { MEDIA_EASE } from "@/components/home/AnimatedMedia";

/* Swatches stagger-fade up, right to left, when the card is hovered */
const swatchVariants: Variants = {
  rest: { opacity: 0, y: 8, transition: { duration: 0.15 } },
  hover: (order: number) => ({
    opacity: 1,
    y: 0,
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
}

export interface ProductCardData {
  _key?: string;
  title?: string;
  price?: string;
  gender?: string;
  colorway?: string;
  colorCount?: string;
  image?: string;
  hoverImage?: string;
  variants?: ProductVariantData[];
}

/*
  Product Card V1 with the standard image behaviors:
  - the padded product shot enters with the fade/settle animation
  - hovering the card reveals a full-bleed image over the well,
    settling from 1.05x to 1x
  - on hover, "+N colors" swaps for clickable swatches; picking one
    switches the product image and the variant name on the card
*/
export function ProductCard({ product }: { product: ProductCardData }) {
  const variants = product.variants ?? [];
  const [selected, setSelected] = useState(0);
  const active = variants[selected];
  const wellImage = active?.image ?? product.image ?? "/figma/card-shoe.png";
  const extra = variants.length > 0 ? variants.length - 1 : undefined;
  const colorLabel = active?.name ?? product.colorway;
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
      whileHover="hover"
      animate="rest"
      className="group flex w-full flex-col justify-center gap-[1.125rem] border-r border-line bg-surface px-6 pb-16 pt-6"
    >
      <motion.div
        className="relative flex aspect-[236/301] w-full flex-col justify-end overflow-hidden rounded-xs bg-surface-2 p-6"
        initial={{ opacity: 0, scale: 1.05 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: [...MEDIA_EASE] }}
      >
        {/* padded product shot; crossfades when the variant changes */}
        <motion.div
          key={selected}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          role="img"
          aria-label={product.title}
          className="absolute inset-x-[17.77%] top-1/2 aspect-square -translate-y-1/2 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${wellImage})` }}
        />
        {/* full-bleed hover image, settles 1.05x → 1x */}
        {product.hoverImage && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-100 group-hover:opacity-100"
            style={{ backgroundImage: `url(${product.hoverImage})` }}
          />
        )}
      </motion.div>
      <div className="flex w-full flex-col gap-1.5">
        <div className="label flex w-full items-center justify-between font-medium text-ink">
          <p>{product.title}</p>
          <p>{product.price}</p>
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
              <span className="pointer-events-none absolute right-0 flex items-center gap-1.5 group-hover:pointer-events-auto">
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
