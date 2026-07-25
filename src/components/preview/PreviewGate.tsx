"use client";

import dynamic from "next/dynamic";

import type { ProductCardData } from "@/components/home/ProductCard";
import type { Page } from "@/sanity/types";

/*
  Tiny client gate between the page and the draft-mode preview shell.
  Next preloads every statically-analyzable client reference of a page
  — even conditionally rendered ones — so importing HomePreview from
  the server page shipped the loader library to every visitor
  (verified by fingerprinting the non-draft waterfall). An ssr:false
  dynamic inside a client component is the one form that is NOT
  preloaded: the shell's chunks download only when this gate actually
  renders, which only happens in draft mode. Same pattern as
  LazyCartFlyout.
*/
const HomePreview = dynamic(
  () => import("@/components/preview/HomePreview").then((m) => m.HomePreview),
  { ssr: false },
);

export function PreviewGate(props: {
  initial: Page;
  sliderCards: Record<string, ProductCardData[]>;
}) {
  return <HomePreview {...props} />;
}
