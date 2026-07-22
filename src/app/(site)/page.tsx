import { FooterTagline } from "@/components/FooterTagline";
import { SectionRenderer } from "@/components/SectionRenderer";
import {
  Carousel,
  FiftyFifty,
  FullWidth,
  Hero,
  InfoSlider,
  ProductSlider,
} from "@/components/home/sections";
import { preload } from "react-dom";

import { sanityFetch } from "@/sanity/lib/fetch";
import { sanitySrcSet, urlFor } from "@/sanity/lib/image";
import { pageBySlugQuery } from "@/sanity/lib/queries";
import type { Page } from "@/sanity/types";

/*
  The homepage is built from the Sanity "home" page's sections. Until
  that document exists, it renders the Figma "Homepage — V1 Grid"
  composition (node 33581:41491) as the default.
*/
export default async function Home() {
  const page = await sanityFetch<Page | null>(
    pageBySlugQuery,
    { slug: "home" },
    null,
  );

  /* the first section's image is the LCP — preload it with the same
     URL SectionRenderer will generate (urlFor + width 2000) */
  const first = page?.sections?.[0];
  const firstImage = first && "image" in first ? first.image : undefined;
  if (firstImage) {
    try {
      const url = urlFor(firstImage).width(2000).url();
      /* srcset mirrors the hero <img> so the browser preloads exactly
         the candidate it will render — no double download */
      preload(url, {
        as: "image",
        fetchPriority: "high",
        imageSrcSet: sanitySrcSet(url),
        imageSizes: "100vw",
      });
    } catch {
      /* malformed image reference — nothing to preload */
    }
  }

  return (
    <div data-mode="light" className="flex flex-col items-start bg-surface">
      {page?.showFooterTagline && <FooterTagline />}
      {page?.sections?.length ? (
        <SectionRenderer sections={page.sections} />
      ) : (
        <>
          <Hero />
          <InfoSlider />
          <FullWidth />
          <Carousel />
          <FiftyFifty />
          <ProductSlider title="Best Sellers" />
          <ProductSlider title="Best Sellers" />
          <FullWidth headline="TW Performance" />
          <ProductSlider />
        </>
      )}
    </div>
  );
}
