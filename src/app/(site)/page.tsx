import { SectionRenderer } from "@/components/SectionRenderer";
import {
  Carousel,
  FiftyFifty,
  FullWidth,
  Hero,
  InfoSlider,
  ProductSlider,
} from "@/components/home/sections";
import { sanityFetch } from "@/sanity/lib/fetch";
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

  return (
    <div data-mode="light" className="flex flex-col items-start bg-surface">
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
