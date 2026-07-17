"use client";

import { useLayoutEffect, useRef } from "react";

import { useFooterTagline } from "@/components/FooterTagline";
import { Logo } from "@/components/Logo";
import { NavTextLink } from "@/components/NavTextLink";

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
      <div
        aria-hidden
        className="absolute inset-0 bg-surface-2 bg-cover bg-center"
        style={{ backgroundImage: "url(/figma/legacy-video.jpg)" }}
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}

export function SiteFooter() {
  const ref = useRef<HTMLElement>(null);
  /* "Earned Never Given" art — per-page CMS toggle, off by default */
  const showTagline = useFooterTagline();

  /* publish the footer's height as --footer-h; the page wrapper uses
     it as margin-bottom so exactly one footer-height gets revealed */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty("--footer-h", `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--footer-h");
    };
  }, []);

  return (
    <footer
      ref={ref}
      data-mode="light"
      className="bg-surface text-ink md:fixed md:inset-x-0 md:bottom-0"
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

      {/* link columns */}
      <div className="grid w-full grid-cols-1 border-t border-line sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div
            key={col.heading}
            className="flex flex-col gap-[1.125rem] border-b border-l border-line px-6 pb-16 pt-6"
          >
            <p className="label font-medium opacity-70">{col.heading}</p>
            <div className="flex flex-col items-start gap-[0.5625rem]">
              {col.links.map((link) => (
                <NavTextLink key={link} label={link.toUpperCase()} />
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-[1.125rem] border-b border-l border-line px-6 pb-16 pt-6">
          <Logo />
          <p className="text-[0.75rem] uppercase leading-none">
            Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget
            convallis lorem faucibus tortor in.
          </p>
        </div>
      </div>

      {/* newsletter */}
      <form className="flex w-full flex-col items-stretch gap-3 p-6 sm:flex-row sm:gap-0">
        <label className="flex h-10 flex-1 items-center rounded-xs bg-wash pl-4 pr-3 backdrop-blur-[12px]">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            className="label w-full bg-transparent font-medium text-ink outline-none placeholder:text-ink-3"
          />
        </label>
        <button
          type="submit"
          className="label flex h-10 min-w-[9.375rem] flex-1 items-center justify-center rounded-xs bg-btn px-3.5 font-medium text-btn-fg transition-opacity hover:opacity-80"
        >
          Submit
        </button>
      </form>

      {/* bottom bar */}
      <div className="flex w-full flex-col gap-6 px-6 py-8 sm:h-[4.5rem] sm:flex-row sm:items-start sm:gap-8">
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
