"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MEDIA_EASE } from "@/components/home/AnimatedMedia";
import { ArrowSwap } from "@/components/home/ArrowHover";
import { Logo } from "@/components/Logo";
import { ArrowUpRight, Close, Menu, SearchMd } from "@/components/icons";

/*
  Site navigation.

  Desktop / tablet (md+):
  - fixed; transparent over the hero, otherwise light
  - slides up and away on scroll down, back in on scroll up
  - hovering the nav (or opening a dropdown) fills it with the light
    surface and flips the color mode
  - hovering a menu link slides the meganav down (columns of links +
    an image card), Moncler-style

  Mobile (< md):
  - the control bar (SEARCH / ACCOUNT / BAG / menu) is fixed to the
    bottom of the screen at all times
  - the menu button opens a full-screen sheet with accordion sections
*/

interface MenuColumn {
  title: string;
  links: string[];
}

interface MenuItem {
  title: string;
  columns?: MenuColumn[];
  image?: string;
  imageTitle?: string;
}

const FEATURED: MenuColumn = {
  title: "Featured",
  links: [
    "New Arrivals",
    "The Coral Standard",
    "Training Gear",
    "First Light Collection",
    "Footwear",
    "Final Few",
  ],
};

const MENU: MenuItem[] = [
  {
    title: "Men",
    image: "/figma/products/presidio-white.png",
    imageTitle: "Men’s Apparel",
    columns: [
      FEATURED,
      { title: "Tops", links: ["Polos", "T-Shirts", "Sweaters", "Hoodies & Pullovers", "Outerwear"] },
      { title: "Bottoms", links: ["Shorts", "Pants", "Joggers"] },
      { title: "Accessories", links: ["Headwear", "Gloves", "Bags", "Socks", "Outerwear"] },
    ],
  },
  {
    title: "Women",
    image: "/figma/media-portrait.png",
    imageTitle: "Women’s Apparel",
    columns: [
      FEATURED,
      { title: "Tops", links: ["Polos", "T-Shirts", "Sweaters", "Hoodies & Pullovers", "Outerwear"] },
      { title: "Bottoms", links: ["Shorts", "Pants", "Joggers"] },
      { title: "Accessories", links: ["Headwear", "Gloves", "Bags", "Socks", "Outerwear"] },
    ],
  },
  {
    title: "Footwear",
    image: "/figma/card-shoe.png",
    imageTitle: "Footwear",
    columns: [
      FEATURED,
      { title: "Styles", links: ["Spikeless", "Spiked", "Trainers", "Slides"] },
      { title: "Collections", links: ["Presidio", "Pioneer", "Osprey", "Cardinal"] },
      { title: "Accessories", links: ["Socks", "Laces", "Shoe Care"] },
    ],
  },
  {
    title: "Gear",
    image: "/figma/campaign.png",
    imageTitle: "Gear",
    columns: [
      FEATURED,
      { title: "On Course", links: ["Gloves", "Headcovers", "Towels", "Markers"] },
      { title: "Carry", links: ["Bags", "Duffels", "Backpacks"] },
      { title: "Accessories", links: ["Headwear", "Socks", "Outerwear"] },
    ],
  },
  { title: "Explore" },
];

const COMPANY = ["The Legacy", "Honors Journal", "Team Sun Day Red", "Careers"];

const NAV_H = "3.75rem";

function NavButton({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <a href="#" className="label group relative text-ink">
      {label}
      <span
        className={`absolute inset-x-0 -bottom-0.5 h-px origin-right bg-ink transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100 ${
          active ? "origin-left scale-x-100" : "scale-x-0"
        }`}
      />
    </a>
  );
}

/* ---------- desktop meganav panel ---------- */

function MegaPanel({ item }: { item: MenuItem }) {
  return (
    <motion.div
      key={item.title}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [...MEDIA_EASE], delay: 0.08 }}
      className="flex w-full items-stretch"
    >
      <div className="grid flex-1 grid-cols-2 lg:grid-cols-4">
        {(item.columns ?? []).map((column, i) => (
          <div
            key={column.title}
            className={`flex flex-col items-start gap-5 px-6 pb-16 pt-8 ${
              i > 0 ? "border-l border-line" : ""
            }`}
          >
            <p className="label text-ink-2">{column.title.toUpperCase()}</p>
            <div className="flex flex-col items-start gap-4">
              {column.links.map((link) => (
                <NavButton key={link} label={link.toUpperCase()} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {item.image && (
        /* image card, styled like a 50/50 panel */
        <a
          href="#"
          aria-label={item.imageTitle}
          className="group relative hidden aspect-[5/6] w-1/3 shrink-0 overflow-hidden lg:block"
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
        </a>
      )}
    </motion.div>
  );
}

/* ---------- mobile accordion sheet ---------- */

function MobileSection({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const [featuredOpen, setFeaturedOpen] = useState(false);
  const featured = item.columns?.[0];
  const flat = ["All", ...(item.columns ?? []).slice(1).map((c) => c.title)];

  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-6 py-5"
      >
        <span className="font-display text-title-md text-ink">{item.title}</span>
        {item.columns && <span className="label text-ink-2">{open ? "[ - ]" : "[ + ]"}</span>}
      </button>
      <AnimatePresence initial={false}>
        {open && item.columns && (
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
                            <a key={link} href="#" className="label text-ink-2">
                              {link.toUpperCase()}
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
              {flat.map((link) => (
                <a key={link} href="#" className="label py-2 text-ink">
                  {link.toUpperCase()}
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

export function Navigation() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [hidden, setHidden] = useState(false);
  const [overHero, setOverHero] = useState(isHome);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
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
      setOverHero(isHome && y < window.innerHeight - 60);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // lock page scroll behind the mobile sheet
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const transparent = overHero && !hovered && active === null;
  const activeItem = active !== null ? MENU[active] : null;

  return (
    <>
      <motion.header
        data-mode={transparent ? "dark" : "light"}
        initial={false}
        animate={{ y: hidden && !mobileOpen ? "-100%" : "0%" }}
        transition={{ duration: 0.45, ease: [...MEDIA_EASE] }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setActive(null);
        }}
        className={`fixed top-0 z-50 w-full border-b-[1.5px] border-line-2 text-ink transition-colors duration-300 ${
          transparent ? "bg-transparent" : "bg-surface"
        }`}
      >
        <div className="flex h-[3.75rem] items-center px-6 py-3">
          <div className="hidden flex-1 items-center gap-8 md:flex">
            {MENU.map((item, i) => (
              <span
                key={item.title}
                onMouseEnter={() => setActive(item.columns ? i : null)}
                onFocus={() => setActive(item.columns ? i : null)}
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
        <AnimatePresence>
          {activeItem?.columns && (
            <motion.div
              key="meganav"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.55, ease: [...MEDIA_EASE] }}
              className="hidden max-h-[calc(100vh-3.75rem)] overflow-hidden bg-surface md:block"
            >
              <MegaPanel item={activeItem} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* content offset on pages without a full-bleed hero */}
      {!isHome && <div style={{ height: NAV_H }} />}

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
              {MENU.filter((item) => item.columns).map((item) => (
                <MobileSection key={item.title} item={item} />
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-3 px-6 pb-32 pt-16">
              <p className="label text-ink-3">COMPANY</p>
              {COMPANY.map((link) => (
                <a key={link} href="#" className="label text-ink">
                  {link.toUpperCase()}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile control bar: fixed to the bottom, always present */}
      <div
        data-mode="light"
        className="fixed inset-x-4 bottom-4 z-[70] md:hidden"
      >
        <div className="label flex h-12 items-center justify-between rounded-xs bg-wash px-6 text-ink">
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
