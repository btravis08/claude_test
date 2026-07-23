import { PortableText } from "next-sanity";

import {
  Carousel,
  FiftyFifty,
  FullWidth,
  Gallery,
  Hero,
  InfoSlider,
  ProductSlider,
  Reviews,
  TechSpecs,
  ThreeDViewer,
} from "@/components/home/sections";
import type { LookProductData } from "@/components/home/MediaBlock";
import type { ProductCardData } from "@/components/home/ProductCard";
import {
  basePrice,
  buildRulesFilter,
  COLLECTION_ORDER,
  formatPrice,
  resolveDisplayPrice,
} from "@/sanity/lib/commerce";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  automaticDiscountsQuery,
  collectionProductsQuery,
  productsByTagQuery,
  smartCollectionProductsQuery,
  storeSettingsQuery,
} from "@/sanity/lib/queries";
import type {
  Discount,
  PageSection,
  SectionProductSlider,
  SliderProduct,
  StoreSettings,
} from "@/sanity/types";
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
   swatches. Products without variants yield a single card. Prices run
   through the store settings + active automatic discounts. */
export function toCards(
  product: SliderProduct,
  discounts: Discount[] = [],
  settings?: StoreSettings | null,
): ProductCardData[] {
  const displayed = resolveDisplayPrice(
    basePrice(product),
    product.pricing?.compareAtPrice,
    product,
    discounts,
    settings,
  );
  const variants = (product.variants ?? [])
    .filter((variant) => variant && (variant.name || variant.color))
    .map((variant) => {
      const own =
        typeof variant.price === "number"
          ? resolveDisplayPrice(
              variant.price,
              variant.compareAtPrice,
              product,
              discounts,
              settings,
            )
          : undefined;
      return {
        name: variant.name,
        color: variant.color,
        image: img(variant.image, 800),
        hoverImage: img(variant.hoverImage, 1200),
        price: own?.price,
        compareAtPrice: own?.compareAt,
      };
    });
  const base: ProductCardData = {
    title: product.title,
    href: product.slug ? `/products/${product.slug}` : undefined,
    price: displayed.price ?? formatPrice(product.price, settings),
    compareAtPrice: displayed.compareAt,
    gender: product.gender,
    colorway: variants[0]?.name,
    image: img(product.thumb, 800),
    imageLqip: product.thumbLqip,
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

export const activeOnly = (products: Array<SliderProduct | null>) =>
  products.filter(
    (product): product is SliderProduct =>
      Boolean(product?._id) && (!product?.status || product.status === "active"),
  );

/* Manual collections honor their sort order in JS (the reference
   array itself is the manual order) */
function sortProducts(products: SliderProduct[], sort?: string): SliderProduct[] {
  const num = (product: SliderProduct) =>
    typeof product.pricing?.price === "number" ? product.pricing.price : Infinity;
  switch (sort) {
    case "priceAsc":
      return [...products].sort((a, b) => num(a) - num(b));
    case "priceDesc":
      return [...products].sort((a, b) => num(b) - num(a));
    case "titleAsc":
      return [...products].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    case "newest":
      return [...products].sort(
        (a, b) => Date.parse(b.postedAt ?? "") - Date.parse(a.postedAt ?? ""),
      );
    default:
      return products;
  }
}

export async function productsForCollection(
  collection: { _id?: string; type?: string; match?: "all" | "any"; rules?: import("@/sanity/types").CollectionRule[]; sortOrder?: string } | null | undefined,
): Promise<SliderProduct[]> {
  if (!collection?._id) return [];
  if (collection.type === "smart") {
    const { filter, params } = buildRulesFilter(
      collection.rules ?? [],
      collection.match ?? "all",
    );
    const order =
      COLLECTION_ORDER[(collection.sortOrder ?? "newest") as keyof typeof COLLECTION_ORDER] ??
      COLLECTION_ORDER.newest;
    return sanityFetch<SliderProduct[]>(
      smartCollectionProductsQuery(filter, order),
      params,
      [],
    );
  }
  const referenced = await sanityFetch<Array<SliderProduct | null> | null>(
    collectionProductsQuery,
    { collectionId: collection._id },
    [],
  );
  const active = activeOnly(referenced ?? []);
  return collection.sortOrder && collection.sortOrder !== "manual"
    ? sortProducts(active, collection.sortOrder)
    : active;
}

/* Shop-the-look product references become the mini cards hovered up
   from the bag button */
function toLookCards(products?: Array<SliderProduct | null>): LookProductData[] {
  return (products ?? [])
    .filter((product): product is SliderProduct => Boolean(product?._id))
    .map((product) => ({
      _key: product._id,
      title: product.title,
      price: formatPrice(product.pricing?.price ?? product.price),
      colorway: product.variants?.[0]?.name,
      colorCount:
        product.variants && product.variants.length > 1
          ? `+${product.variants.length - 1} colors`
          : undefined,
      thumb: img(product.variants?.[0]?.image ?? product.thumb, 200),
    }));
}

/* Sliders source products manually, from a collection, or by tag
   (newest post date first) */
async function ProductSliderSection({ section }: { section: SectionProductSlider }) {
  const [settings, discounts] = await Promise.all([
    sanityFetch<StoreSettings | null>(storeSettingsQuery, {}, null),
    sanityFetch<Discount[]>(automaticDiscountsQuery, {}, []),
  ]);
  let products: SliderProduct[] = [];
  if (section.source === "manual") {
    products = activeOnly(section.products ?? []);
  } else if (section.source === "collection") {
    products = await productsForCollection(section.collection);
  }
  if (products.length === 0 && section.source !== "collection") {
    products = await sanityFetch<SliderProduct[]>(
      productsByTagQuery,
      { productTag: section.tag ?? "all" },
      [],
    );
  }
  const cards = products
    .flatMap((product) => toCards(product, discounts, settings))
    .slice(0, 24);
  return (
    <ProductSlider
      mode={section.colorMode}
      title={section.title}
      products={cards.length ? cards : undefined}
    />
  );
}

/* CMS padding sizes -> fluid tokens (S 16→32, M 24→64, L 48→96
   across the 428→1440 frames) */
const PAD_TOP = {
  s: "pt-section-s",
  m: "pt-section-m",
  l: "pt-section-l",
} as const;
const PAD_BOTTOM = {
  s: "pb-section-s",
  m: "pb-section-m",
  l: "pb-section-l",
} as const;

export function SectionRenderer({ sections }: { sections: PageSection[] }) {
  return (
    <>
      {sections.map((section, sectionIndex) => {
        const node = (() => {
        switch (section._type) {
          case "sectionHero":
            return (
              <Hero
                key={section._key}
                mode={section.colorMode}
                eyebrow={section.eyebrow}
                headline={section.headline}
                primaryCta={section.primaryCta}
                image={img(section.image) ?? "/figma/campaign.jpg"}
                lqip={section.imageLqip}
                kind={section.mediaKind === "videoAutoplay" ? "videoAutoplay" : "image"}
                videoUrl={section.videoUrl}
              />
            );
          case "sectionFullWidth":
            return (
              <FullWidth
                key={section._key}
                mode={section.colorMode}
                eyebrow={section.eyebrow}
                headline={section.headline}
                primaryCta={section.primaryCta}
                image={img(section.image) ?? "/figma/campaign.jpg"}
                lqip={section.imageLqip}
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
                  body: card.body,
                  image: img(card.image, 800),
                  kind: card.mediaKind,
                  videoUrl: card.videoUrl,
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
                  url: panel.url,
                  eyebrow: panel.eyebrow,
                  body: panel.body,
                  showEyebrow: panel.showEyebrow,
                  showButton: panel.showButton,
                  ctaLabel: panel.ctaLabel,
                  image: img(panel.image, 1400),
                  kind: panel.mediaKind,
                  videoUrl: panel.videoUrl,
                  lookProducts: toLookCards(panel.lookProducts),
                }))}
              />
            );
          case "sectionTechSpecs":
            return (
              <TechSpecs
                key={section._key}
                mode={section.colorMode}
                title={section.title}
                rows={section.rows}
                description={section.description}
                stats={section.stats}
              />
            );
          case "sectionGallery":
            return (
              <Gallery
                key={section._key}
                mode={section.colorMode}
                title={section.title}
                slides={section.slides?.map((slide) => ({
                  _key: slide._key,
                  image: img(slide.image, 1600),
                  aspect: slide.aspect,
                  kind: slide.mediaKind,
                  videoUrl: slide.videoUrl,
                  lookProducts: toLookCards(slide.lookProducts),
                }))}
              />
            );
          case "sectionReviews":
            return (
              <Reviews key={section._key} mode={section.colorMode} title={section.title} />
            );
          case "sectionThreeD":
            return (
              <ThreeDViewer
                key={section._key}
                mode={section.colorMode}
                title={section.title}
                image={img(section.image, 1600)}
              />
            );
          case "sectionRichText":
            return (
              <section
                key={section._key}
                data-mode={section.colorMode ?? "light"}
                className="w-full bg-surface text-ink"
              >
                <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
                  <div className="prose prose-neutral max-w-none dark:prose-invert">
                    {section.body && <PortableText value={section.body} />}
                  </div>
                </div>
              </section>
            );
          default:
            return null;
        }
        })();
        /* optional vertical padding shell; it carries the section's
           color mode so the padded strip matches its surface */
        const pt = section.paddingTop && section.paddingTop !== "none" ? PAD_TOP[section.paddingTop] : "";
        const pb = section.paddingBottom && section.paddingBottom !== "none" ? PAD_BOTTOM[section.paddingBottom] : "";
        /* below-fold sections defer layout/paint until they approach
           the viewport; the first section renders eagerly (LCP) */
        const cv = sectionIndex > 0 ? "cv-auto" : "";
        const wrapped = node;
        if (!pt && !pb)
          return cv ? (
            <div key={section._key} className={`w-full ${cv}`}>
              {wrapped}
            </div>
          ) : (
            wrapped
          );
        const shellMode =
          section.colorMode ??
          (section._type === "sectionFullWidth" ||
          section._type === "sectionFiftyFifty" ||
          section._type === "sectionHero"
            ? "dark"
            : "light");
        return (
          <div
            key={section._key}
            data-mode={shellMode}
            className={`w-full bg-surface ${pt} ${pb} ${cv}`}
          >
            {wrapped}
          </div>
        );
      })}
    </>
  );
}
