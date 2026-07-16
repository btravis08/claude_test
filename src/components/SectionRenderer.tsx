import { PortableText } from "next-sanity";

import {
  Carousel,
  FiftyFifty,
  FullWidth,
  Hero,
  InfoSlider,
  ProductSlider,
} from "@/components/home/sections";
import type { LookProductData } from "@/components/home/MediaBlock";
import type { ProductCardData } from "@/components/home/ProductCard";
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

/* Each color variant renders as its own card: the card defaults to
   that colorway but keeps every sibling variant switchable via the
   swatches. Products without variants yield a single card. */
function toCards(product: SliderProduct): ProductCardData[] {
  const variants = (product.variants ?? [])
    .filter((variant) => variant && (variant.name || variant.color))
    .map((variant) => ({
      name: variant.name,
      color: variant.color,
      image: img(variant.image, 800),
      hoverImage: img(variant.hoverImage, 1200),
    }));
  const base: ProductCardData = {
    title: product.title,
    price: product.price,
    gender: product.gender,
    colorway: variants[0]?.name,
    image: img(product.thumb, 800),
    hoverImage: img(product.hoverImage, 1200),
    variants,
  };
  if (variants.length === 0) return [{ ...base, _key: product._id }];
  return variants.map((_, i) => ({
    ...base,
    _key: `${product._id}-${i}`,
    defaultVariant: i,
  }));
}

/* Shop-the-look product references become the mini cards hovered up
   from the bag button */
function toLookCards(products?: Array<SliderProduct | null>): LookProductData[] {
  return (products ?? [])
    .filter((product): product is SliderProduct => Boolean(product?._id))
    .map((product) => ({
      _key: product._id,
      title: product.title,
      price: product.price,
      colorway: product.variants?.[0]?.name,
      colorCount:
        product.variants && product.variants.length > 1
          ? `+${product.variants.length - 1} colors`
          : undefined,
      thumb: img(product.variants?.[0]?.image ?? product.thumb, 200),
    }));
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
  const cards = products.flatMap(toCards).slice(0, 24);
  return (
    <ProductSlider
      mode={section.colorMode}
      title={section.title}
      products={cards.length ? cards : undefined}
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
                kind={section.mediaKind}
                videoUrl={section.videoUrl}
                lookProducts={toLookCards(section.lookProducts)}
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
          case "sectionCarousel": {
            const items = (section.items ?? []).map((item) =>
              typeof item === "string"
                ? {
                    title: item,
                    description: section.description,
                    image: img(section.image, 1400),
                  }
                : {
                    _key: item._key,
                    title: item.title,
                    description: item.description ?? section.description,
                    image: img(item.image, 1400) ?? img(section.image, 1400),
                  },
            );
            return (
              <Carousel
                key={section._key}
                mode={section.colorMode}
                eyebrow={section.eyebrow}
                items={items.length ? items : undefined}
              />
            );
          }
          case "sectionFiftyFifty":
            return (
              <FiftyFifty
                key={section._key}
                mode={section.colorMode}
                ratio={section.ratio}
                panels={section.panels?.map((panel) => ({
                  _key: panel._key,
                  title: panel.title,
                  image: img(panel.image, 1400),
                  kind: panel.mediaKind,
                  videoUrl: panel.videoUrl,
                  lookProducts: toLookCards(panel.lookProducts),
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
