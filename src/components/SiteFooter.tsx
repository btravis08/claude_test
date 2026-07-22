"use client";

import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

import { useFooterTagline } from "@/components/FooterTagline";
import { Logo } from "@/components/Logo";
import { NavTextLink } from "@/components/NavTextLink";
import { Plus } from "@/components/icons";

const columns: { heading: string; links: string[] }[] = [
  {
    heading: "Support",
    links: ["Help & FAQs", "Returns & Exchanges", "Warranty", "Contact Us"],
  },
  {
    heading: "Company",
    links: ["The Legacy", "TEAM SUN DAY RED", "Honors Journal", "Careers"],
  },
  {
    heading: "More",
    links: ["Gift Cards", "ID.me"],
  },
];

const social = ["FB", "TT", "IG", "X", "TW"];

/* mobile link groups collapse into accordions; the + rotates into an
   x while the panel's height eases open */
function FooterAccordion({ heading, links }: { heading: string; links: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[4.625rem] w-full items-center justify-between px-4 text-left"
      >
        <span className="text-body-md font-medium uppercase text-ink">{heading}</span>
        <Plus
          size={16}
          className={`text-ink transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="flex flex-col items-start gap-3 px-4 pb-6">
          {links.map((link) => (
            <NavTextLink key={link} label={link.toUpperCase()} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/*
  Fixed-reveal footer. The page scrolls inside a raised (z-10) wrapper
  whose bottom margin is --footer-h; the footer sits fixed at the
  viewport bottom underneath it, so scrolling past the legacy band
  "reveals" it. The reveal gap is a margin, not an element — margins
  aren't hit targets, so the footer stays clickable once uncovered.
*/

/* Last scrolling element of the page — the reveal's curtain edge.
   Rendered inside the page wrapper, above the fixed footer. */
export function LegacyBand() {
  return (
    <div data-mode="dark" className="relative h-[26.75rem] w-full overflow-hidden bg-black">
      {/* a real lazy <img>: as a CSS background this downloaded on
          every page load despite being the last thing on the page */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/legacy-video.jpg"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 size-full bg-surface-2 object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}

export function SiteFooter() {
  const ref = useRef<HTMLElement>(null);
  /* "Earned Never Given" art — per-page CMS toggle, off by default */
  const showTagline = useFooterTagline();
  /* painted only when the scroll position is within reveal range —
     SSR renders it invisible, so it can never flash on load, during
     streaming, or mid route-transition while document height shifts */
  const [inRange, setInRange] = useState(false);

  /* publish the footer's height as --footer-h; the page wrapper uses
     it as margin-bottom so exactly one footer-height gets revealed */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty("--footer-h", `${el.offsetHeight}px`);
    publish();
    const check = () => {
      const remaining =
        document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      /* flip 100px before the reveal zone could possibly show */
      setInRange(remaining < el.offsetHeight + 100);
    };
    check();
    const observer = new ResizeObserver(() => {
      publish();
      check();
    });
    observer.observe(el);
    observer.observe(document.body);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      document.documentElement.style.removeProperty("--footer-h");
    };
  }, []);

  return (
    <footer
      ref={ref}
      data-mode="light"
      className={`fixed inset-x-0 bottom-0 bg-surface text-ink pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0 ${
        inRange ? "" : "invisible"
      }`}
    >
      {/* Earned Never Given wordmark art */}
      {showTagline && (
        <div className="flex h-[32.875rem] w-full items-center justify-center overflow-hidden p-2.5">
        <div className="relative h-[9.4375rem] w-[30.375rem] shrink-0 scale-75 sm:scale-100">
          <p className="absolute left-[8.25rem] top-0 whitespace-nowrap font-display text-display-xl">
            Earned
          </p>
          <p className="absolute left-0 top-[3.40625rem] whitespace-nowrap font-display text-display-xl">
            Never
          </p>
          <p className="absolute left-[18.75rem] top-[3.59375rem] whitespace-nowrap font-display text-display-xl">
            Given
          </p>
          <span
            aria-hidden
            className="absolute left-[12.125rem] top-[5.71875rem] inline-block h-[1.29375rem] w-[3.91875rem] bg-current"
            style={{
              maskImage: "url(/figma/union-swoosh.svg)",
              maskSize: "100% 100%",
              maskRepeat: "no-repeat",
              WebkitMaskImage: "url(/figma/union-swoosh.svg)",
              WebkitMaskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
            }}
          />
          <p className="label absolute left-0 top-[8.46875rem] font-medium">SUN DAY</p>
          <p className="label absolute left-[8.9375rem] top-[8.46875rem] font-medium">EST</p>
          <p className="label absolute left-[17.9375rem] top-[8.46875rem] font-medium">2024</p>
          <p className="label absolute right-0 top-[8.46875rem] font-medium">RED</p>
          </div>
        </div>
      )}

      {/* mobile: logo + blurb over accordion link groups (per the
          mobile footer comp); sm+ keeps the column grid below */}
      <div className="sm:hidden">
        <div className="flex flex-col items-start gap-6 px-4 pb-8 pt-8">
          <Logo />
          <p className="text-[0.75rem] uppercase leading-[1.5]">
            Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget
            convallis lorem faucibus tortor in.
          </p>
        </div>
        <div className="flex flex-col border-t border-line">
          {columns.map((col) => (
            <FooterAccordion key={col.heading} heading={col.heading} links={col.links} />
          ))}
        </div>
      </div>

      {/* link columns */}
      <div className="hidden w-full grid-cols-1 border-t border-line sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div
            key={col.heading}
            className="flex flex-col gap-[1.125rem] border-b border-l border-line px-4 pb-16 pt-4 md:px-6 md:pt-6"
          >
            <p className="label font-medium opacity-70">{col.heading}</p>
            <div className="flex flex-col items-start gap-[0.5625rem]">
              {col.links.map((link) => (
                <NavTextLink key={link} label={link.toUpperCase()} />
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-[1.125rem] border-b border-l border-line px-4 pb-16 pt-4 md:px-6 md:pt-6">
          <Logo />
          <p className="text-[0.75rem] uppercase leading-none">
            Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget
            convallis lorem faucibus tortor in.
          </p>
        </div>
      </div>

      {/* newsletter */}
      <form className="flex w-full flex-col items-stretch gap-3 p-4 pt-10 sm:flex-row sm:gap-0 sm:pt-4 md:p-6">
        {/* flex-1 only in the sm+ row layout — in the stacked mobile
            column it would become the vertical basis and squash the
            46px heights */}
        <label className="flex h-[2.875rem] items-center rounded-xs bg-wash pl-4 pr-3 backdrop-blur-[12px] sm:flex-1 md:h-10">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            className="label w-full bg-transparent font-medium text-ink outline-none placeholder:text-ink-3"
          />
        </label>
        <button
          type="submit"
          className="label flex h-[2.875rem] items-center justify-center rounded-xs bg-btn px-3.5 font-medium text-btn-fg transition-opacity hover:opacity-80 sm:min-w-[9.375rem] sm:flex-1 md:h-10"
        >
          Submit
        </button>
      </form>

      {/* bottom bar — mobile: socials and copyright share one line */}
      <div className="flex w-full items-center justify-between px-4 pb-2 pt-6 sm:hidden">
        {social.map((s) => (
          <NavTextLink key={s} label={s} />
        ))}
        <p className="label font-medium">©2026 SUN DAY RED</p>
      </div>
      <div className="hidden w-full gap-8 px-4 py-8 sm:flex sm:h-[4.5rem] sm:items-start md:px-6">
        <div className="flex flex-1 items-center">
          <p className="label font-medium">©2026 SUN DAY RED</p>
        </div>
        <div className="flex flex-1 items-center justify-between gap-4">
          {social.map((s) => (
            <NavTextLink key={s} label={s} />
          ))}
          <NavTextLink href="#top" label="BACK TO TOP" />
        </div>
      </div>
    </footer>
  );
}
