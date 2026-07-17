"use client";

import { useState } from "react";

import { useCart } from "@/components/cart/CartContext";
import { ChevronDown, Ruler } from "@/components/icons";
import type { HeroVariantData } from "@/components/product/ProductHero";

/*
  Tablet/mobile variant selectors inside the description section (the
  comp's 33298:29696 tablet/mobile variants): color chip + swatch
  tiles, the SIZE dropdown chip, FIND MY SIZE, and the SELECT SIZE
  CTA. Size selection happens in the quick-add flyout; the marker
  attribute lets the mobile purchase bar minimize while this panel
  is on screen.
*/

export function VariantPanel({
  title,
  price,
  image,
  variants = [],
  sizes = [],
  className = "",
}: {
  title: string;
  price?: string;
  image?: string;
  variants?: HeroVariantData[];
  sizes?: string[];
  className?: string;
}) {
  const { openQuickAdd } = useCart();
  const [selected, setSelected] = useState(0);
  const active = variants[selected];
  const chip = "bg-wash backdrop-blur-md";
  const open = () => openQuickAdd({ title, price, image, variants, sizes });

  return (
    <div data-variant-panel className={`flex w-full flex-col gap-3 ${className}`}>
      {/* color chip + swatch tiles */}
      <div className="flex items-start gap-1.5">
        <div
          className={`label flex h-10 min-w-0 flex-1 items-center rounded-xs px-3 font-medium text-ink ${chip}`}
        >
          <span className="truncate">
            COLOR: {(active?.name ?? "").toUpperCase()}
          </span>
        </div>
        {variants.length > 1 && (
          <div className="flex items-center gap-[0.3125rem]">
            {variants.map((variant, i) => (
              <button
                key={i}
                type="button"
                aria-label={variant.name ?? `Colorway ${i + 1}`}
                onClick={() => setSelected(i)}
                className={`flex size-10 items-end justify-center overflow-hidden border-b-2 bg-wash ${
                  i === selected ? "border-ink" : "border-transparent"
                }`}
              >
                {variant.image ? (
                  <span
                    aria-hidden
                    className="block size-full bg-contain bg-center bg-no-repeat opacity-90"
                    style={{ backgroundImage: `url(${variant.image})` }}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="block size-full"
                    style={{ backgroundColor: variant.color ?? "#c8c8c4" }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SIZE dropdown chip — selection lives in the quick-add flyout */}
      {sizes.length > 0 && (
        <button
          type="button"
          onClick={open}
          className={`relative flex h-10 w-full items-center rounded-xs ${chip}`}
        >
          <span className="label flex flex-1 items-center gap-2 px-3 font-medium text-ink">
            SIZE:
          </span>
          <ChevronDown size={20} className="absolute right-3 text-ink" />
        </button>
      )}

      <div className="flex w-full items-center justify-center py-1.5">
        <a
          href="#"
          className="label flex items-center gap-1.5 font-medium text-ink transition-opacity hover:opacity-70"
        >
          Find my size
          <Ruler size={10} />
        </a>
      </div>

      <button
        type="button"
        onClick={open}
        className="label flex h-10 w-full items-center justify-center rounded-xs bg-btn font-medium text-btn-fg"
      >
        Select size
      </button>
    </div>
  );
}
