import type { Metadata } from "next";
import { PortableText } from "next-sanity";

import { FooterTagline } from "@/components/FooterTagline";
import { ProductHero } from "@/components/product/ProductHero";
import type { ProductCardData } from "@/components/home/ProductCard";
import {
  Carousel,
  FiftyFifty,
  Gallery,
  InfoSlider,
  ProductSlider,
  Reviews,
  TechSpecs,
  ThreeDViewer,
} from "@/components/home/sections";
import { SliderShell } from "@/components/home/SliderShell";
import { SectionRenderer, activeOnly, toCards } from "@/components/SectionRenderer";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  automaticDiscountsQuery,
  productBySlugQuery,
  productsByTagQuery,
  storeSettingsQuery,
} from "@/sanity/lib/queries";
import type {
  Discount,
  ProductFull,
  SliderProduct,
  StoreSettings,
} from "@/sanity/types";
import type { SanityImageSource } from "@sanity/image-url";

/*
  Product page (PDP), built from components like the homepage. Three
  modules are required and fixed: the hero image carousel with the
  affixed purchase bar, the description with "pairs well with", and
  the shopping module at the bottom. The middle is the product's CMS
  sections[] (same page builder as pages).
*/

function img(source: SanityImageSource | undefined, width = 1600) {
  if (!source) return undefined;
  try {
    return urlFor(source).width(width).url();
  } catch {
    return undefined;
  }
}

/* Template fallback (CMS unreachable / unseeded): the Presidio */
const FALLBACK_DESCRIPTION =
  "The Presidio sets a new benchmark in spikeless performance, connecting you to the course like never before. The mesh-reinforced upper with strategic foam padding provides breathability and comfort for long days on the course.";

const FALLBACK_PRODUCT = {
  title: "Presidio",
  price: "$198.00",
  images: [
    "/figma/products/presidio-white.png",
    "/figma/products/presidio-white-hover.png",
    "/figma/products/presidio-black.png",
  ],
  variants: [
    { name: "White / White", color: "#f4f4f2", image: "/figma/products/presidio-white.png" },
    { name: "White / Red", color: "#b01f24", image: "/figma/products/presidio-red.png" },
    { name: "Black / White", color: "#161716", image: "/figma/products/presidio-black.png" },
    { name: "White / Blue", color: "#4b74ad", image: "/figma/products/presidio-blue.png" },
  ],
  sizes: undefined,
};

const FALLBACK_PAIRS: ProductCardData[] = [1, 2, 3, 4, 5].map((n) => ({
  _key: `pair-${n}`,
  title: "Presidio",
  price: "$198.00",
  colorway: "Gray / Navy",
  colorCount: "+4 colors",
  image: "/figma/products/presidio-white.png",
}));

/* Compact product card for the "pairs well with" rail: gray well with
   the small product shot, then the standard two info rows */
function MiniProductCard({ card }: { card: ProductCardData }) {
  const extra = card.variants?.length ? card.variants.length - 1 : undefined;
  const extraLabel =
    extra !== undefined ? (extra > 0 ? `+${extra} colors` : undefined) : card.colorCount;
  return (
    <a
      href={card.href ?? "#"}
      className="group flex w-full flex-col gap-4 border-y border-r border-line bg-surface p-6 pb-16"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs bg-surface-2">
        <div
          role="img"
          aria-label={card.title}
          className="absolute inset-x-[24%] top-1/2 aspect-square -translate-y-1/2 bg-contain bg-center bg-no-repeat transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          style={card.image ? { backgroundImage: `url(${card.image})` } : undefined}
        />
      </div>
      <div className="flex w-full flex-col gap-1.5">
        <div className="label flex w-full items-center justify-between font-medium text-ink">
          <p>{(card.title ?? "").toUpperCase()}</p>
          <p className="flex items-baseline gap-1.5">
            {card.compareAtPrice && (
              <s className="text-ink-3 line-through">{card.compareAtPrice}</s>
            )}
            <span>{card.price}</span>
          </p>
        </div>
        <div className="flex w-full items-center justify-between font-mono text-[0.6875rem] uppercase leading-none tracking-wide text-ink-2">
          <p>{card.colorway}</p>
          {extraLabel && <p>{extraLabel}</p>}
        </div>
      </div>
    </a>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await sanityFetch<ProductFull | null>(productBySlugQuery, { slug }, null);
  return { title: product?.title ?? "Presidio" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, settings, discounts] = await Promise.all([
    sanityFetch<ProductFull | null>(productBySlugQuery, { slug }, null),
    sanityFetch<StoreSettings | null>(storeSettingsQuery, {}, null),
    sanityFetch<Discount[]>(automaticDiscountsQuery, {}, []),
  ]);

  /* one card resolves the display price + variant urls for the hero */
  const card = product ? toCards(product, discounts, settings)[0] : undefined;

  const hero = product
    ? {
        title: product.title,
        price: card?.price,
        compareAtPrice: card?.compareAtPrice,
        images: (product.images ?? [])
          .map((image) => img(image))
          .filter((src): src is string => Boolean(src)),
        variants: card?.variants,
        sizes: product.options
          ?.find((option) => option.name?.toLowerCase() === "size")
          ?.values?.filter(Boolean),
      }
    : FALLBACK_PRODUCT;
  if (product && hero.images.length === 0) {
    hero.images = [card?.image, card?.hoverImage].filter(
      (src): src is string => Boolean(src),
    );
  }

  /* pairs well with: explicit references first, topped up to at least
     four cards with products sharing the first tag (excluding self) */
  const tag = product?.tags?.[0] ?? "all";
  const related: SliderProduct[] = activeOnly(
    await sanityFetch<SliderProduct[]>(productsByTagQuery, { productTag: tag }, []),
  ).filter((item) => item._id !== product?._id);
  const pairDocs = activeOnly(product?.pairsWellWith ?? []);
  if (pairDocs.length < 4) {
    const have = new Set(pairDocs.map((doc) => doc._id));
    pairDocs.push(
      ...related.filter((doc) => !have.has(doc._id)).slice(0, 6 - pairDocs.length),
    );
  }
  let pairs: ProductCardData[] = pairDocs
    .map((doc) => toCards(doc, discounts, settings)[0])
    .filter((item): item is ProductCardData => Boolean(item));
  if (pairs.length === 0) pairs = FALLBACK_PAIRS;

  /* bottom shopping module: gender-filterable slider of related
     products (falls back to the sample set) */
  const shopCards = related
    .flatMap((item) => toCards(item, discounts, settings))
    .slice(0, 24);

  return (
    <div data-mode="light" className="flex w-full flex-col bg-surface text-ink">
      {product?.showFooterTagline && <FooterTagline />}

      {/* required: hero carousel + affixed purchase bar */}
      <ProductHero product={hero} />

      {/* required: about + pairs well with (arrowed mini-card slider);
          the halves split the section and it runs tall per the comp */}
      <section
        data-mode="light"
        className="grid w-full grid-cols-1 bg-surface text-ink md:min-h-[80svh] md:grid-cols-2"
      >
        <div className="flex flex-col gap-9 p-6">
          <p className="label font-medium text-ink-2">
            ABOUT {(product?.title ?? "Presidio").toUpperCase()}
          </p>
          <div className="max-w-xl font-display text-title-md leading-snug">
            {product?.description ? (
              <PortableText value={product.description} />
            ) : (
              <p>{FALLBACK_DESCRIPTION}</p>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <SliderShell
            title="PAIRS WELL WITH"
            titleClassName="label font-medium text-ink-2"
            bordered={false}
            cols="auto-cols-[85%] sm:auto-cols-[45%]"
            items={pairs.map((item, i) => ({
              key: item._key ?? String(i),
              card: <MiniProductCard card={item} />,
            }))}
          />
        </div>
      </section>

      {/* adjustable middle: the product's CMS sections; the template
          defaults render until the document carries its own */}
      {product?.sections?.length ? (
        <SectionRenderer sections={product.sections} />
      ) : (
        <>
          <TechSpecs />
          <InfoSlider
            title="Features / Technology"
            cards={[1, 2, 3, 4, 5, 6].map((n) => ({
              _key: `feature-${n}`,
              title: "Lorem Ipsum Dolor Sit®",
              body: "Torsional Traction Plate for benefit lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod. Learn More",
              image: "/figma/products/presidio-white-hover.png",
            }))}
          />
          {/* Design Details — the homepage carousel component */}
          <Carousel eyebrow="DESIGN DETAILS" />
          <ThreeDViewer image="/figma/products/presidio-white.png" />
          <FiftyFifty
            mode="light"
            panels={[
              { _key: "media", image: "/figma/products/presidio-black-hover.png" },
              {
                _key: "text",
                kind: "text",
                eyebrow: "Sample Testimonial",
                body: "“I’m really excited for the Presidio. It has the stability and control to perform on the golf course; it satisfies everything a golfer wants in a spikeless shoe.”",
              },
            ]}
          />
          <Gallery />
          <Reviews />
        </>
      )}

      {/* required: the shopping module (untitled gender slider); the
          marker tells the hero's fixed purchase dock when to retire */}
      <div data-shop-module>
        <ProductSlider products={shopCards.length ? shopCards : undefined} />
      </div>
    </div>
  );
}
