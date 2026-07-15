import { PortableText } from "next-sanity";

import {
  Carousel,
  FiftyFifty,
  FullWidth,
  Hero,
  InfoSlider,
  ProductSlider,
} from "@/components/home/sections";
import type { ProductCardData } from "@/components/home/sections";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { productsByTagQuery } from "@/sanity/lib/queries";
import type { PageSection, SectionProductSlider, SliderProduct } from "@/sanity/types";
import type { SanityImageSource } from "@sanity/image-url";

function img(source: SanityImageSource | undefined, width = 2000): string | undefined {
  if (!source) return undefined;
  try {
    return urlFor(source).width(width).url();
  } catch {
    return undefined;
  }
}

function toCard(product: SliderProduct): ProductCardData {
  const extra = (product.variants?.length ?? 0) - 1;
  return {
    _key: product._id,
    title: product.title,
    price: product.price,
    gender: product.gender,
    colorway: product.variants?.[0],
    colorCount: extra > 0 ? `+${extra} colors` : undefined,
    image: img(product.thumb, 800),
  };
}

/* Manual selections render as-is; automatic sliders pull products by
   tag, newest post date first */
async function ProductSliderSection({ section }: { section: SectionProductSlider }) {
  let products =
    section.source === "manual"
      ? (section.products ?? []).filter(
          (product): product is SliderProduct => Boolean(product?._id),
        )
      : [];
  if (section.source !== "manual" || products.length === 0) {
    products = await sanityFetch<SliderProduct[]>(
      productsByTagQuery,
      { productTag: section.tag ?? "all" },
      [],
    );
  }
  return (
    <ProductSlider
      mode={section.colorMode}
      title={section.title}
      products={products.length ? products.map(toCard) : undefined}
    />
  );
}

export function SectionRenderer({ sections }: { sections: PageSection[] }) {
  return (
    <>
      {sections.map((section) => {
        switch (section._type) {
          case "sectionHero":
            return (
              <Hero
                key={section._key}
                mode={section.colorMode}
                eyebrow={section.eyebrow}
                headline={section.headline}
                align={section.align}
                primaryCta={section.primaryCta}
                secondaryCta={section.secondaryCta}
                image={img(section.image) ?? "/figma/campaign.png"}
              />
            );
          case "sectionFullWidth":
            return (
              <FullWidth
                key={section._key}
                mode={section.colorMode}
                eyebrow={section.eyebrow}
                headline={section.headline}
                align={section.align}
                primaryCta={section.primaryCta}
                secondaryCta={section.secondaryCta}
                image={img(section.image) ?? "/figma/campaign.png"}
              />
            );
          case "sectionInfoSlider":
            return (
              <InfoSlider
                key={section._key}
                mode={section.colorMode}
                title={section.title}
                cards={section.cards?.map((card) => ({
                  _key: card._key,
                  title: card.title,
                  image: img(card.image, 800),
                }))}
              />
            );
          case "sectionProductSlider":
            return <ProductSliderSection key={section._key} section={section} />;
          case "sectionCarousel":
            return (
              <Carousel
                key={section._key}
                mode={section.colorMode}
                eyebrow={section.eyebrow}
                items={section.items}
                description={section.description}
                image={img(section.image, 1200)}
              />
            );
          case "sectionFiftyFifty":
            return (
              <FiftyFifty
                key={section._key}
                mode={section.colorMode}
                panels={section.panels?.map((panel) => ({
                  _key: panel._key,
                  title: panel.title,
                  image: img(panel.image, 1400),
                }))}
              />
            );
          case "sectionRichText":
            return (
              <section
                key={section._key}
                data-mode={section.colorMode ?? "light"}
                className="w-full bg-surface text-ink"
              >
                <div className="mx-auto max-w-3xl px-6 py-16">
                  <div className="prose prose-neutral max-w-none dark:prose-invert">
                    {section.body && <PortableText value={section.body} />}
                  </div>
                </div>
              </section>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
