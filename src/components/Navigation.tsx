"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MEDIA_EASE } from "@/components/home/AnimatedMedia";
import { ArrowLink, ArrowSwap } from "@/components/home/ArrowHover";
import { Logo } from "@/components/Logo";
import { NavTextLink } from "@/components/NavTextLink";
import { ArrowUpRight, Close, Menu, SearchMd } from "@/components/icons";

/*
  Site navigation. Content comes from the Sanity "navigation" singleton
  (menu items → dropdown layouts → links, Shopify-style); the constants
  below are the fallback when the document doesn't exist yet.

  Desktop / tablet (md+):
  - fixed; transparent over the hero, otherwise light-gray tiles with
    1px white gaps (the product grid scheme)
  - slides away on scroll down, back in on scroll up
  - hovering fills the nav; hovering a menu link slides the meganav
    down. Three dropdown layouts: link columns + image card, a product
    grid, and image cards.

  Mobile (< md):
  - the control bar (SEARCH / ACCOUNT / BAG / menu) is fixed to the
    bottom at all times, blurred over content, inverting over dark
    sections
  - the menu button opens a full-screen sheet with accordion sections
*/

export interface NavLink {
  label: string;
  url: string;
}

export interface MenuColumn {
  title: string;
  links: NavLink[];
}

export interface NavCard {
  title: string;
  image?: string;
  url: string;
}

export interface NavProduct {
  title: string;
  image?: string;
}

export interface MenuItem {
  title: string;
  layout: "columns" | "products" | "cards" | "none";
  columns?: MenuColumn[];
  products?: NavProduct[];
  cards?: NavCard[];
  image?: string;
  imageTitle?: string;
}

export interface NavData {
  items: MenuItem[];
  company: NavLink[];
}

/* ---------- fallback content (mirrors the seeded navigation) ---------- */

const L = (labels: string[]): NavLink[] => labels.map((label) => ({ label, url: "#" }));

const FEATURED: MenuColumn = {
  title: "Featured",
  links: L([
    "New Arrivals",
    "The Coral Standard",
    "Training Gear",
    "First Light Collection",
    "Footwear",
    "Final Few",
  ]),
};

const DEFAULT_NAV: NavData = {
  items: [
    {
      title: "Men",
      layout: "columns",
      image: "/figma/products/presidio-white.png",
      imageTitle: "Men’s Apparel",
      columns: [
        FEATURED,
        { title: "Tops", links: L(["Polos", "T-Shirts", "Sweaters", "Hoodies & Pullovers", "Outerwear"]) },
        { title: "Bottoms", links: L(["Shorts", "Pants", "Joggers"]) },
        { title: "Accessories", links: L(["Headwear", "Gloves", "Bags", "Socks", "Outerwear"]) },
      ],
    },
    {
      title: "Women",
      layout: "columns",
      image: "/figma/media-portrait.png",
      imageTitle: "Women’s Apparel",
      columns: [
        FEATURED,
        { title: "Tops", links: L(["Polos", "T-Shirts", "Sweaters", "Hoodies & Pullovers"]) },
        { title: "Bottoms", links: L(["Shorts", "Skirts", "Pants", "Joggers"]) },
        { title: "Accessories", links: L(["Headwear", "Gloves", "Bags", "Socks"]) },
      ],
    },
    {
      title: "Footwear",
      layout: "products",
      columns: [
        { title: "Footwear", links: L(["Men’s Footwear", "Women’s Footwear"]) },
      ],
      products: [
        { title: "Pioneer Willow", image: "/figma/products/presidio-white-hover.png" },
        { title: "Pioneer Cypress", image: "/figma/products/presidio-black-hover.png" },
        { title: "Pioneer Magnolia", image: "/figma/products/presidio-blue-hover.png" },
        { title: "Presidio", image: "/figma/products/presidio-navy-hover.png" },
        { title: "Osprey", image: "/figma/products/presidio-red-hover.png" },
        { title: "Jupiter", image: "/figma/products/presidio-white-hover.png" },
      ],
    },
    {
      title: "Gear",
      layout: "columns",
      image: "/figma/campaign.png",
      imageTitle: "Gear",
      columns: [
        { title: "Featured", links: L(["New Arrivals", "Sun Day Red x Vessel", "Tiger’s Favorites"]) },
        { title: "Bags & Headcovers", links: L(["Golf Bags", "Headcovers", "Shoe Bags", "Totes"]) },
        { title: "Wearables", links: L(["Headwear", "Gloves", "Socks"]) },
        { title: "On Course", links: L(["Tees", "Ball Markers"]) },
      ],
    },
    {
      title: "Explore",
      layout: "cards",
      cards: [
        { title: "The Legacy", image: "/figma/legacy-video.jpg", url: "#" },
        { title: "Honors Journal", image: "/figma/campaign.png", url: "#" },
        { title: "Team Sunday Red", image: "/figma/media-portrait.png", url: "#" },
      ],
    },
  ],
  company: L(["The Legacy", "Honors Journal", "Team Sun Day Red", "Careers"]),
};

const NAV_H = "3.75rem";

const NavButton = NavTextLink;

/* Content fade shared by the panel tiles when the active item swaps */
const contentFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, ease: [...MEDIA_EASE], delay: 0.08 },
} as const;

/* ---------- desktop dropdown: link columns + image card ---------- */

function ColumnsPanel({ item }: { item: MenuItem }) {
  return (
    <div className="flex w-full items-stretch gap-px border-b border-line bg-line">
      <div className="grid flex-1 grid-cols-2 gap-px lg:grid-cols-4">
        {(item.columns ?? []).map((column, i) => (
          <div key={i} className="bg-surface p-6 pb-16">
            <motion.div
              key={`${item.title}-${column.title}`}
              {...contentFade}
              className="flex flex-col items-start gap-8"
            >
              <p className="label text-ink-2">{column.title.toUpperCase()}</p>
              <div className="flex flex-col items-start gap-6">
                {column.links.map((link) => (
                  <NavButton key={link.label} label={link.label.toUpperCase()} href={link.url} />
                ))}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
      {item.image && (
        <div className="relative hidden aspect-[5/6] w-1/3 shrink-0 overflow-hidden bg-surface lg:block">
          {/* image card, hover-identical to a 50/50 panel: image
              scales, the arrow swaps */}
          <motion.div key={item.title} {...contentFade} className="absolute inset-0">
            <ArrowLink
              href="#"
              aria-label={item.imageTitle}
              className="group absolute inset-0 block overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="media-overlay" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                <p className="font-display text-title-md text-white">{item.imageTitle}</p>
                <span className="flex size-10 items-center justify-center rounded-xs bg-white text-[#161716]">
                  <ArrowSwap dx={1} dy={-1}>
                    <ArrowUpRight />
                  </ArrowSwap>
                </span>
              </div>
            </ArrowLink>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ---------- desktop dropdown: link column + product grid ---------- */

function ProductsPanel({ item }: { item: MenuItem }) {
  const column = item.columns?.[0];
  return (
    <motion.div
      key={item.title}
      {...contentFade}
      className="flex w-full items-stretch gap-px border-b border-line bg-line"
    >
      {column && (
        <div className="w-1/4 shrink-0 bg-surface p-6 pb-16">
          <div className="flex flex-col items-start gap-8">
            <p className="label text-ink-2">{column.title.toUpperCase()}</p>
            <div className="flex flex-col items-start gap-6">
              {column.links.map((link) => (
                <NavButton key={link.label} label={link.label.toUpperCase()} href={link.url} />
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="grid flex-1 grid-cols-2 gap-px lg:grid-cols-3">
        {(item.products ?? []).map((product, i) => (
          <div key={i} className="flex flex-col bg-surface pb-10">
            <a href="#" className="group block w-full overflow-hidden">
              <div
                aria-hidden
                className="aspect-[16/10] w-full bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}
              />
            </a>
            <div className="label flex items-center justify-between gap-4 px-6 py-5 text-ink">
              <p>{product.title.toUpperCase()}</p>
              <span className="flex items-center gap-4">
                <a href="#" className="underline decoration-1 underline-offset-4">
                  MEN’S
                </a>
                <a href="#" className="underline decoration-1 underline-offset-4">
                  WOMEN’S
                </a>
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ---------- desktop dropdown: image cards ---------- */

function CardsPanel({ item }: { item: MenuItem }) {
  return (
    <motion.div
      key={item.title}
      {...contentFade}
      className="grid w-full grid-cols-3 gap-px border-b border-line bg-line"
    >
      {(item.cards ?? []).map((card, i) => (
        <a key={i} href={card.url} className="group block bg-surface pb-16">
          <div className="w-full overflow-hidden">
            <div
              aria-hidden
              className="aspect-[8/7] w-full bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              style={card.image ? { backgroundImage: `url(${card.image})` } : undefined}
            />
          </div>
          <p className="px-6 pt-6 font-display text-title-md text-ink">{card.title}</p>
        </a>
      ))}
    </motion.div>
  );
}

function MegaPanel({ item }: { item: MenuItem }) {
  if (item.layout === "cards") return <CardsPanel item={item} />;
  if (item.layout === "products") return <ProductsPanel item={item} />;
  return <ColumnsPanel item={item} />;
}

/* ---------- mobile accordion sheet ---------- */

function MobileSection({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const [featuredOpen, setFeaturedOpen] = useState(false);

  /* cards → their titles; one column → its links; several columns →
     the first as a nested group, the rest as flat category links */
  const columns = item.columns ?? [];
  const featured = columns.length > 1 ? columns[0] : undefined;
  const flat: NavLink[] =
    item.layout === "cards"
      ? (item.cards ?? []).map((card) => ({ label: card.title, url: card.url }))
      : columns.length === 1
        ? columns[0].links
        : [{ label: "All", url: "#" }, ...columns.slice(1).map((c) => ({ label: c.title, url: "#" }))];
  const expandable = featured !== undefined || flat.length > 0;

  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-6 py-5"
      >
        <span className="font-display text-title-md text-ink">{item.title}</span>
        {expandable && <span className="label text-ink-2">{open ? "[ - ]" : "[ + ]"}</span>}
      </button>
      <AnimatePresence initial={false}>
        {open && expandable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [...MEDIA_EASE] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col items-stretch gap-1 px-6 pb-6">
              {featured && (
                <>
                  <button
                    type="button"
                    onClick={() => setFeaturedOpen((v) => !v)}
                    aria-expanded={featuredOpen}
                    className="label flex items-center justify-between py-2 text-ink"
                  >
                    {featured.title.toUpperCase()}
                    <span className="text-ink-2">{featuredOpen ? "[ - ]" : "[ + ]"}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {featuredOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [...MEDIA_EASE] }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-3 py-2 pl-4">
                          {featured.links.map((link) => (
                            <a key={link.label} href={link.url} className="label text-ink-2">
                              {link.label.toUpperCase()}
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
              {flat.map((link) => (
                <a key={link.label} href={link.url} className="label py-2 text-ink">
                  {link.label.toUpperCase()}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- navigation ---------- */

export function Navigation({ data }: { data?: NavData | null }) {
  const nav = data ?? DEFAULT_NAV;
  const pathname = usePathname();
  const isHome = pathname === "/";
  /* pages with a full-viewport hero the nav floats transparently over:
     the homepage (dark imagery) and product pages (light gray canvas) */
  const hasFullHero = isHome || pathname.startsWith("/products/");

  const [hidden, setHidden] = useState(false);
  const [overHero, setOverHero] = useState(hasFullHero);
  /* non-home pages: transparent (light mode) until scrolling starts */
  const [atTop, setAtTop] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  /* keeps the light presentation while the meganav exit-animates */
  const [panelVisible, setPanelVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  /* color mode of the section under the mobile bottom bar */
  const [barMode, setBarMode] = useState<"light" | "dark">("light");
  const lastY = useRef(0);

  useEffect(() => {
    const modeUnderBar = (): "light" | "dark" => {
      // the bar sits bottom-4 with h-12 → its center is 40px up
      const stack = document.elementsFromPoint(
        window.innerWidth / 2,
        window.innerHeight - 40,
      );
      for (const el of stack) {
        if (el.closest("[data-navbar]") || el.closest("header")) continue;
        const section = el.closest<HTMLElement>("[data-mode]");
        /* only true dark inverts the bar — the mid modes carry
           light-mode content treatment per the Figma variables */
        if (section) return section.dataset.mode === "dark" ? "dark" : "light";
      }
      return "light";
    };
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < 80) setHidden(false);
      else if (delta > 2) {
        setHidden(true);
        setActive(null);
      } else if (delta < -2) setHidden(false);
      lastY.current = y;
      // the hero fills the viewport; past it the nav needs its surface
      setOverHero(hasFullHero && y < window.innerHeight - 60);
      setAtTop(y < 10);
      setBarMode(modeUnderBar());
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [hasFullHero]);

  // lock page scroll behind the mobile sheet
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* the transparent flip waits for the meganav's exit animation, so
     the bar fades white → transparent instead of snapping dark.
     Home: transparent (dark mode) over the hero. Elsewhere:
     transparent (light mode) until the page starts scrolling. */
  const overlayZone = hasFullHero ? overHero : atTop;
  const transparent = overlayZone && !hovered && active === null && !panelVisible;
  const activeItem = active !== null ? nav.items[active] : null;
  const hasDropdown = (item: MenuItem) => item.layout !== "none";

  useEffect(() => {
    if (activeItem && hasDropdown(activeItem)) setPanelVisible(true);
  }, [activeItem]);

  return (
    <>
      <motion.header
        data-mode={transparent && isHome ? "dark" : "light"}
        initial={false}
        animate={{ y: hidden && !mobileOpen ? "-100%" : "0%" }}
        transition={{ duration: 0.45, ease: [...MEDIA_EASE] }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setActive(null);
        }}
        className="fixed top-0 z-50 flex w-full flex-col text-ink"
      >
        {/* bar: transparent over the hero / at top, bg-primary once
            scrolled back in or engaged (hover / open dropdown); the
            hairline is border-primary in every state per the comp */}
        <div
          className={`flex h-[3.75rem] items-center border-b border-line px-6 py-3 transition-colors duration-300 ${
            transparent ? "bg-transparent" : "bg-surface"
          }`}
        >
          <div className="hidden flex-1 items-center gap-8 md:flex">
            {nav.items.map((item, i) => (
              <span
                key={item.title}
                onMouseEnter={() => setActive(hasDropdown(item) ? i : null)}
                onFocus={() => setActive(hasDropdown(item) ? i : null)}
              >
                <NavButton label={item.title.toUpperCase()} active={active === i} />
              </span>
            ))}
          </div>
          <div className="flex-1 md:hidden" />
          <div className="flex flex-1 items-center justify-center">
            <Link href="/" aria-label="Home">
              <Logo />
            </Link>
          </div>
          <div className="hidden flex-1 items-center justify-end gap-8 md:flex">
            <a href="#" aria-label="Search" className="text-ink">
              <SearchMd />
            </a>
            <NavButton label="ACCOUNT" />
            <NavButton label="BAG [1]" />
          </div>
          <div className="flex-1 md:hidden" />
        </div>

        {/* meganav: slides open under the bar, Moncler-style */}
        <AnimatePresence onExitComplete={() => setPanelVisible(false)}>
          {activeItem && hasDropdown(activeItem) && (
            <motion.div
              key="meganav"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.55, ease: [...MEDIA_EASE] }}
              className="hidden max-h-[calc(100vh-3.75rem)] overflow-hidden md:block"
            >
              <MegaPanel item={activeItem} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* 30% scrim over the page while the meganav is open — fades in
          place rather than sliding with the panel */}
      <AnimatePresence>
        {activeItem && hasDropdown(activeItem) && (
          <motion.div
            key="meganav-scrim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [...MEDIA_EASE] }}
            className="pointer-events-none fixed inset-0 z-40 hidden bg-black/30 md:block"
          />
        )}
      </AnimatePresence>

      {/* content offset on pages without a full-bleed hero */}
      {!hasFullHero && <div style={{ height: NAV_H }} />}

      {/* mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            data-mode="light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [...MEDIA_EASE] }}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-surface text-ink md:hidden"
          >
            <div className="p-6">
              <Link href="/" aria-label="Home" onClick={() => setMobileOpen(false)}>
                <Logo />
              </Link>
            </div>
            <div className="mt-4 flex flex-col">
              {nav.items
                .filter((item) => hasDropdown(item))
                .map((item) => (
                  <MobileSection key={item.title} item={item} />
                ))}
            </div>
            <div className="mt-auto flex flex-col gap-3 px-6 pb-32 pt-16">
              <p className="label text-ink-3">COMPANY</p>
              {nav.company.map((link) => (
                <a key={link.label} href={link.url} className="label text-ink">
                  {link.label.toUpperCase()}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile control bar: fixed to the bottom, always present.
          Blurred light surface normally; inverts over dark sections.
          Always light while the menu sheet is open. */}
      <div
        data-navbar
        data-mode={mobileOpen ? "light" : barMode}
        className="fixed inset-x-4 bottom-4 z-[70] md:hidden"
      >
        <div
          className={`label flex h-12 items-center justify-between rounded-xs px-6 text-ink transition-colors duration-300 ${
            mobileOpen ? "bg-surface" : "bg-surface/85 backdrop-blur-md"
          }`}
        >
          <a href="#">SEARCH</a>
          <a href="#">ACCOUNT</a>
          <a href="#">BAG [1]</a>
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex size-8 items-center justify-center"
          >
            {mobileOpen ? <Close /> : <Menu />}
          </button>
        </div>
      </div>
    </>
  );
}
