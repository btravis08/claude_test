"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { MEDIA_EASE } from "@/components/home/AnimatedMedia";
import { useCart } from "@/components/cart/CartContext";
import { ArrowLeft, ArrowRight, Menu } from "@/components/icons";

/*
  PDP hero: required on every product page. Matches the comp:
  - full-viewport carousel on the shared gray canvas (surface-2); the
    images sit large and centered, scroll/drag to browse (arrow
    buttons come later), eased progress line at the very bottom
  - the purchase controls float OVER the images along the bottom, each
    in its own chip with padding around the container: name + price,
    COLOR: <name>, image-thumbnail swatches, black SELECT SIZE button
  - once the hero is completely out of view, the same module docks
    fixed to the bottom of the screen until the bottom shopping module
    ([data-shop-module]) scrolls into view
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
  const heroRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  /* dock: hero fully gone AND the bottom shopping module not yet
     reached — once the module (or anything below it) is on screen the
     dock stays away */
  const [heroGone, setHeroGone] = useState(false);
  const [shopReached, setShopReached] = useState(false);
  /* color mode of the section under the fixed dock — the quaternary
     chips/button flip with it (dark section → light controls) */
  const [barMode, setBarMode] = useState<"light" | "dark">("light");
  /* mobile: the fixed bar collapses to the menu chip while the
     description section's variant panel is on screen */
  const [panelInView, setPanelInView] = useState(false);
  /* mobile carousel arrows ride a sticky hold line 16px above the
     fixed purchase bar (its measured height + gap), then anchor 16px
     from the hero's bottom edge once scrolling carries it up — same
     handoff as the homepage hero CTA */
  const mobileDockRef = useRef<HTMLDivElement>(null);
  const [arrowHold, setArrowHold] = useState(140);
  useEffect(() => {
    const el = mobileDockRef.current;
    if (!el) return;
    const measure = () => setArrowHold(el.offsetHeight + 16);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const variants = product.variants ?? [];
  const active = variants[selected];
  const sizes = product.sizes ?? [];
  const { openQuickAdd } = useCart();
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

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    if (heroRef.current) {
      const obs = new IntersectionObserver(
        ([entry]) => setHeroGone(!entry.isIntersecting),
        { threshold: 0 },
      );
      obs.observe(heroRef.current);
      observers.push(obs);
    }
    const shop = document.querySelector("[data-shop-module]");
    if (shop) {
      /* "reached" rather than "visible": below the module (footer),
         it leaves the viewport upward — the dock must not return */
      const obs = new IntersectionObserver(
        ([entry]) =>
          setShopReached(
            entry.isIntersecting ||
              entry.boundingClientRect.top < window.innerHeight,
          ),
        { threshold: 0 },
      );
      obs.observe(shop);
      observers.push(obs);
    }
    const panel = document.querySelector("[data-variant-panel]");
    if (panel) {
      const obs = new IntersectionObserver(
        ([entry]) => setPanelInView(entry.isIntersecting),
        { threshold: 0.2 },
      );
      obs.observe(panel);
      observers.push(obs);
    }
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  /* sample the section under the dock on scroll — like the mobile nav
     bar, only true dark inverts (the mid modes keep light treatment) */
  useEffect(() => {
    const modeUnderDock = (): "light" | "dark" => {
      const stack = document.elementsFromPoint(
        window.innerWidth / 2,
        window.innerHeight - 52,
      );
      for (const el of stack) {
        if (el.closest("[data-purchase-dock]") || el.closest("[data-navbar]")) continue;
        const section = el.closest<HTMLElement>("[data-mode]");
        if (section) return section.dataset.mode === "dark" ? "dark" : "light";
      }
      return "light";
    };
    const onScroll = () => setBarMode(modeUnderDock());
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* arrows step one slide (consecutive slide offsets include any
     gap) and loop: left from the first slide lands on the last,
     right from the last returns to the first */
  const step = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (dir > 0 && el.scrollLeft >= max - 2) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (dir < 0 && el.scrollLeft <= 2) {
      el.scrollTo({ left: max, behavior: "smooth" });
      return;
    }
    const slideEls = el.querySelectorAll<HTMLElement>("[data-slide]");
    const width =
      slideEls.length > 1
        ? slideEls[1].offsetLeft - slideEls[0].offsetLeft
        : el.clientWidth;
    el.scrollBy({ left: dir * width, behavior: "smooth" });
  };

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

  /* the purchase module, shared by the in-hero overlay and the fixed
     dock. Per the comp (Product Details 33298:29150): a 16px-padded
     inner container inside a 16px-padded wrapper; name/price and the
     color dropdown split the flexible space, the button is a fixed
     350px column (flexible below xl). SELECT SIZE opens the quick-add
     flyout (size selection there). Mobile is name/price
     + button + a 40px menu button. Chips and swatch tiles are the
     library's Quaternary button (bg alpha-black-10, fg primary) with
     a 12px backdrop blur; bg-wash/text-ink alias those tokens and
     invert with the data-mode the dock samples from the section
     below it. The fixed container carries bg-primary at 8px padding
     with the comp's soft drop shadow on md+ (transparent on mobile
     and in the hero) */
  const chip = "bg-wash backdrop-blur-md";
  const controls = (docked: boolean) => (
    <div
      className={`flex w-full items-center gap-3 transition-colors duration-300 ${
        docked
          ? "p-0 md:bg-surface md:p-2 md:shadow-[0_20px_10px_rgba(16,24,40,0.02),0_8px_4px_rgba(16,24,40,0.02)]"
          : "p-0 md:p-4"
      }`}
    >
      <div
        className={`label flex h-[2.875rem] min-w-0 flex-1 items-center justify-between gap-6 rounded-xs px-3 font-medium text-ink md:h-10 ${chip}`}
      >
        <span className="truncate">{(product.title ?? "").toUpperCase()}</span>
        <span className="flex items-baseline gap-1.5">
          {product.compareAtPrice && (
            <s className="text-ink-3 line-through">{product.compareAtPrice}</s>
          )}
          {product.price}
        </span>
      </div>
      {/* color dropdown: the chip fills what the swatch tiles leave */}
      <div className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex">
        <div
          className={`label flex h-[2.875rem] min-w-0 flex-1 items-center rounded-xs px-3 font-medium text-ink md:h-10 ${chip}`}
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
                className={`flex size-[2.875rem] items-end justify-center overflow-hidden border-b-2 bg-wash md:size-10 ${
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
      <button
        type="button"
        onClick={() =>
          openQuickAdd({
            title: product.title ?? "",
            price: product.price,
            image: slides[0],
            variants,
            sizes,
          })
        }
        className="label flex h-[2.875rem] min-w-[9.375rem] flex-1 items-center justify-center rounded-xs bg-btn px-3.5 font-medium text-btn-fg md:h-10 xl:w-[21.875rem] xl:flex-none"
      >
        SELECT SIZE
      </button>
    </div>
  );

  return (
    /* dvh (not svh): the hero's bottom tracks the live viewport
       through iOS toolbar transitions, so the arrows' 16px hold above
       the purchase bar stays exact in every toolbar state */
    <div ref={heroRef} className="relative h-dvh w-full bg-surface-2">
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

      {/* purchase controls floating over the images (16px wrapper
          padding per the comp; the inner container adds its own 16px).
          Mobile uses the always-fixed bar below instead */}
      <div className="absolute inset-x-0 bottom-0 hidden p-4 md:block">
        {controls(false)}
      </div>

      {/* mobile carousel arrows: left/right edges of the hero, held
          16px above the fixed purchase bar until the hero's bottom
          edge catches them (sticky handoff, like the homepage hero
          CTA), then they ride away with the hero */}
      <div className="pointer-events-none absolute inset-0 z-10 md:hidden">
        <div className="flex h-full flex-col justify-end px-4 pb-4">
          <div
            className="sticky flex w-full items-center justify-between"
            style={{ bottom: arrowHold }}
          >
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => step(-1)}
              className="pointer-events-auto flex size-[2.875rem] items-center justify-center rounded-xs bg-wash text-ink backdrop-blur-md"
            >
              <ArrowLeft />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => step(1)}
              className="pointer-events-auto flex size-[2.875rem] items-center justify-center rounded-xs bg-wash text-ink backdrop-blur-md"
            >
              <ArrowRight />
            </button>
          </div>
        </div>
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

      {/* fixed dock: the same module pinned to the screen bottom once
          the hero has fully scrolled away, gone again as soon as the
          bottom shopping module comes into view (sits above the mobile
          control bar on small screens) */}
      <AnimatePresence>
        {heroGone && !shopReached && (
          <motion.div
            key="purchase-dock"
            data-purchase-dock
            data-mode={barMode}
            initial={{ y: "120%" }}
            animate={{ y: "0%" }}
            exit={{ y: "120%" }}
            transition={{ duration: 0.45, ease: [...MEDIA_EASE] }}
            className="fixed inset-x-0 bottom-0 z-40 hidden p-4 text-ink transition-colors duration-300 md:block"
          >
            {controls(true)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile: the purchase bar IS the bottom nav, fixed from load
          (bottom of the svh hero). While the description's variant
          panel is on screen it minimizes to just the menu chip on
          the right, then returns once the panel passes */}
      <div
        ref={mobileDockRef}
        data-purchase-dock
        data-mode={barMode}
        className="fixed inset-x-0 bottom-0 z-40 p-4 text-ink md:hidden"
      >
        <div className="flex w-full items-center justify-end gap-3">
          <AnimatePresence initial={false}>
            {!panelInView && (
              <motion.div
                key="mobile-controls"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.4, ease: [...MEDIA_EASE] }}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div
                  className={`label flex h-[2.875rem] min-w-0 flex-1 items-center justify-between gap-4 rounded-xs px-3 font-medium text-ink ${chip}`}
                >
                  <span className="truncate">
                    {(product.title ?? "").toUpperCase()}
                  </span>
                  <span>{product.price}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openQuickAdd({
                      title: product.title ?? "",
                      price: product.price,
                      image: slides[0],
                      variants,
                      sizes,
                    })
                  }
                  className="label flex h-[2.875rem] min-w-[9.375rem] flex-1 items-center justify-center rounded-xs bg-btn px-3.5 font-medium text-btn-fg"
                >
                  SELECT SIZE
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => window.dispatchEvent(new CustomEvent("sdr:open-menu"))}
            className="flex size-[2.875rem] shrink-0 items-center justify-center rounded-xs bg-wash backdrop-blur-md"
          >
            <Menu size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
