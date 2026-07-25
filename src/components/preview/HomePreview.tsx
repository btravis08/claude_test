"use client";

import { FooterTagline } from "@/components/FooterTagline";
import { SectionList } from "@/components/preview/SectionList";
import type { ProductCardData } from "@/components/home/ProductCard";
import { previewClient } from "@/sanity/lib/client";
import { useLiveMode, useQuery } from "@/sanity/lib/preview-store";
import { pageBySlugQuery } from "@/sanity/lib/queries";
import type { Page } from "@/sanity/types";

/*
  Draft-mode homepage shell: renders the SAME section components as
  the server path, but from a live query subscription. Inside the
  Studio's Presentation tool, useLiveMode connects to the Studio over
  a message channel and streams edits into useQuery results BEFORE
  they save — the preview updates as the editor types.

  Only ever rendered when draft mode is on, so none of this (or the
  loader library) reaches ordinary visitors. In the browser this
  module's previewClient carries NO token (the env var is server-only
  and compiles to undefined) — data access flows through the Studio's
  own session.
*/

function LiveMode() {
  useLiveMode({ client: previewClient });
  return null;
}

export function HomePreview({
  initial,
  sliderCards,
}: {
  initial: Page;
  sliderCards: Record<string, ProductCardData[]>;
}) {
  const { data } = useQuery<Page | null>(
    pageBySlugQuery,
    { slug: "home" },
    { initial: { data: initial, sourceMap: undefined, perspective: "drafts" } },
  );
  const page = data ?? initial;

  return (
    <div data-mode="light" className="flex flex-col items-start bg-surface">
      {page?.showFooterTagline && <FooterTagline />}
      {page?.sections?.length ? (
        <SectionList sections={page.sections} sliderCards={sliderCards} />
      ) : null}
      <LiveMode />
    </div>
  );
}
