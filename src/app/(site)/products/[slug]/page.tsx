import type { Metadata } from "next";
import { PortableText } from "next-sanity";

import { FooterTagline } from "@/components/FooterTagline";
import { ProductHero } from "@/components/product/ProductHero";
import type { ProductCardData } from "@/components/home/ProductCard";
import {
  FiftyFifty,
  Gallery,
  InfoSlider,
  ProductSlider,
  Reviews,
  TechSpecs,
  ThreeDViewer,
} from "@/components/home/sections";
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

const FALLBACK_PAIRS: ProductCardData[] = [1, 2, 3].map((n) => ({
  _key: `pair-${n}`,
  title: "Presidio",
  price: "$198.00",
  image: "/figma/products/presidio-white.png",
}));

/* Compact product card for the "pairs well with" rail */
function MiniProductCard({ card }: { card: ProductCardData }) {
  return (
    <a href={card.href ?? "#"} className="group flex w-full flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xs bg-surface-2">
        <div
          role="img"
          aria-label={card.title}
          className="absolute inset-[16%] bg-contain bg-center bg-no-repeat transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          style={card.image ? { backgroundImage: `url(${card.image})` } : undefined}
        />
      </div>
      <div className="label flex w-full items-center justify-between font-medium text-ink">
        <p>{card.title}</p>
        <p className="flex items-baseline gap-1.5">
          {card.compareAtPrice && <s className="text-ink-3 line-through">{card.compareAtPrice}</s>}
          <span>{card.price}</span>
        </p>
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

  /* pairs well with: explicit references, else products sharing the
     first tag (excluding this product) */
  let pairs: ProductCardData[] = activeOnly(product?.pairsWellWith ?? [])
    .map((item) => toCards(item, discounts, settings)[0])
    .filter((item): item is ProductCardData => Boolean(item));
  const tag = product?.tags?.[0] ?? "all";
  let related: SliderProduct[] = [];
  if (product || pairs.length < 3) {
    related = activeOnly(
      await sanityFetch<SliderProduct[]>(productsByTagQuery, { productTag: tag }, []),
    ).filter((item) => item._id !== product?._id);
  }
  if (pairs.length === 0) {
    pairs = related
      .slice(0, 3)
      .map((item) => toCards(item, discounts, settings)[0])
      .filter((item): item is ProductCardData => Boolean(item));
  }
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

      {/* required: description + pairs well with */}
      <section
        data-mode="light"
        className="grid w-full grid-cols-1 gap-10 bg-surface p-6 text-ink md:grid-cols-2 md:py-16"
      >
        <div className="max-w-xl text-body-md font-medium">
          {product?.description ? (
            <PortableText value={product.description} />
          ) : (
            <p>{FALLBACK_DESCRIPTION}</p>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <p className="label font-medium text-ink-2">PAIRS WELL WITH</p>
          <div className="grid grid-cols-3 gap-4">
            {pairs.slice(0, 3).map((item) => (
              <MiniProductCard key={item._key} card={item} />
            ))}
          </div>
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
            cards={[1, 2, 3, 4].map((n) => ({
              _key: `feature-${n}`,
              title: `Lorem Ipsum Dolor Sit ${n}`,
              body: "Cras erat viverra quam adipiscing eget. A ut sed molestie sollicitudin ac condimentum nunc lorem.",
              image: "/figma/products/presidio-white-hover.png",
            }))}
          />
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

      {/* required: the shopping module (untitled gender slider) */}
      <ProductSlider products={shopCards.length ? shopCards : undefined} />
    </div>
  );
}
