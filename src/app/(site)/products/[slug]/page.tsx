import type { Metadata } from "next";

import { FooterTagline } from "@/components/FooterTagline";
import { RegisterCartRecommendations } from "@/components/cart/CartContext";
import { CardAddButton, DetailLinks } from "@/components/product/DetailLinks";
import { DescriptionReveal } from "@/components/product/DescriptionReveal";
import { ProductHero } from "@/components/product/ProductHero";
import { SmartLink } from "@/components/SmartLink";
import { VariantPanel } from "@/components/product/VariantPanel";
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
  pageBySlugQuery,
  productBySlugQuery,
  productsByTagQuery,
  storeSettingsQuery,
} from "@/sanity/lib/queries";
import type {
  Discount,
  Page,
  ProductFull,
  SectionHero,
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

/* flatten portable text to plain paragraphs for the fill reveal */
const portableTextParagraphs = (blocks: unknown): string[] =>
  (Array.isArray(blocks) ? blocks : [])
    .filter(
      (b): b is { children?: Array<{ text?: string }> } =>
        typeof b === "object" &&
        b !== null &&
        (b as { _type?: string })._type === "block",
    )
    .map((b) => (b.children ?? []).map((c) => c.text ?? "").join(""))
    .filter((t) => t.trim().length > 0);

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
  sizes: ["7", "8", "9", "10", "11", "12"],
};

const FALLBACK_DETAIL_LINKS = [
  {
    label: "The Details",
    text: [
      "Engineered spikeless outsole with torsional traction plate. Mesh-reinforced upper with strategic foam padding for breathability and comfort across long days on the course.",
    ],
  },
  {
    label: "Fabric & Tech",
    text: [
      "Upper: 89% polyamide, 11% elastane. Dermacare breathability lining with moisture wicking throughout. 140 grams.",
    ],
  },
  {
    label: "Product Care",
    text: [
      "Spot clean with a soft brush and mild soap. Air dry away from direct heat. Do not machine wash.",
    ],
  },
];

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
function MiniProductCard({ card, first }: { card: ProductCardData; first?: boolean }) {
  const extra = card.variants?.length ? card.variants.length - 1 : undefined;
  const extraLabel =
    extra !== undefined ? (extra > 0 ? `+${extra} colors` : undefined) : card.colorCount;
  return (
    <SmartLink
      href={card.href ?? "#"}
      /* every card keeps its 16px (24px md+) padding; on mobile the
         rail's track starts at the SCREEN edge, so a snapped cell
         sits at x=0 and its padded image lands exactly on the 16px
         line. sm+ anchors the track at the gutter with the flush
         first card instead. */
      className={`group flex w-full flex-col gap-[1.125rem] border-b border-r border-line bg-surface p-4 pb-16 md:p-6 md:pb-16 ${
        first ? "sm:pl-0" : ""
      }`}
    >
      <div className="relative aspect-[236/301] w-full overflow-hidden rounded-xs bg-surface-2">
        <div
          role="img"
          aria-label={card.title}
          className="absolute inset-x-[17.77%] top-1/2 aspect-square -translate-y-1/2 bg-contain bg-center bg-no-repeat transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          style={card.image ? { backgroundImage: `url(${card.image})` } : undefined}
        />
        <CardAddButton
          title={card.title}
          price={card.price}
          image={card.image}
          color={card.colorway}
        />
      </div>
      <div className="flex w-full flex-col gap-1.5">
        <div className="label flex w-full items-center justify-between font-medium text-ink">
          <p>{(card.title ?? "").toUpperCase()}</p>
          <p className="flex items-baseline gap-3">
            {card.compareAtPrice && (
              <s className="text-ink-3 line-through">{card.compareAtPrice}</s>
            )}
            <span>{card.price}</span>
          </p>
        </div>
        <div className="flex w-full items-center justify-between font-mono text-label-sm uppercase leading-none text-ink-2">
          <p>{card.colorway}</p>
          {extraLabel && <p>{extraLabel}</p>}
        </div>
      </div>
    </SmartLink>
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

  /* CONTENT OVERRIDE — the Presidio's second carousel slide mirrors
     whatever image the homepage hero currently uses, fetched live
     from the CMS at render time (this sandbox can't write to the
     dataset). To make it a real product image instead: add it to the
     Presidio's images in the Studio and delete this block. */
  let heroImages = hero.images;
  if (slug === "the-presidio" || !product) {
    const home = await sanityFetch<Page | null>(pageBySlugQuery, { slug: "home" }, null);
    const homeHero = home?.sections?.find(
      (section): section is SectionHero => section._type === "sectionHero",
    );
    const homeHeroImage = img(homeHero?.image) ?? "/figma/campaign.png";
    heroImages = [heroImages[0], homeHeroImage, ...heroImages.slice(2)].filter(
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

  const pairsForCart = pairs.slice(0, 4).map((item) => ({
    title: item.title ?? "",
    price: item.price,
    image: item.image,
    color: item.colorway,
  }));

  return (
    <div data-mode="light" className="flex w-full flex-col bg-surface text-ink">
      {product?.showFooterTagline && <FooterTagline />}

      {/* required: hero carousel + affixed purchase bar */}
      <ProductHero product={{ ...hero, images: heroImages }} />
      <RegisterCartRecommendations
        items={pairsForCart}
      />

      {/* required: about + pairs well with (arrowed mini-card slider);
          the halves split the section and it runs tall per the comp */}
      {/* comp: pt-6xl/pb-8xl section frame on 32px gutters; the left
          column runs Title Large over a 96px inset from the divide */}
      <section
        data-mode="light"
        className="grid w-full grid-cols-1 gap-y-9 bg-surface px-4 pb-8xl pt-6xl text-ink md:min-h-[80svh] md:grid-cols-2 md:px-8"
      >
        <div className="flex flex-col gap-9 md:gap-16 md:pr-24 md:pt-[0.875rem]">
          <nav aria-label="Breadcrumb" className="label flex items-center gap-1.5 font-medium">
            {[product?.gender ?? "Men", product?.productType ?? "Footwear"].map(
              (crumb) => (
                <span key={crumb} className="flex items-center gap-1.5">
                  <a href="#" className="transition-opacity hover:opacity-70">
                    {crumb.toUpperCase()}
                  </a>
                  <span aria-hidden className="mr-1.5">
                    /
                  </span>
                </span>
              ),
            )}
            <span className="underline decoration-1 underline-offset-4">
              {(product?.title ?? "Presidio").toUpperCase()}
            </span>
          </nav>
          <DescriptionReveal
            className="font-display text-title-lg"
            name={product?.title ?? "Presidio"}
            paragraphs={
              product?.description
                ? portableTextParagraphs(product.description)
                : [FALLBACK_DESCRIPTION]
            }
          />
          <DetailLinks
            links={
              product?.detailLinks?.length ? product.detailLinks : FALLBACK_DETAIL_LINKS
            }
          />
          {/* tablet/mobile: variant selectors live here; the mobile
              purchase bar minimizes while this panel is on screen */}
          {/* mobile: 36px column gap + 28px = 64px above the selectors */}
          <VariantPanel
            className="max-md:mt-7 xl:hidden"
            title={hero.title ?? "Presidio"}
            price={hero.price}
            image={hero.images[0]}
            variants={hero.variants}
            sizes={hero.sizes}
          />
        </div>
        {/* the rail bleeds off the right page edge (comp); on mobile
            it also starts at the LEFT screen edge so snapped cards
            put their padded images on the 16px line — the header row
            restores the gutter for the title */}
        <div className="-mx-4 min-w-0 sm:ml-0 md:-mr-8">
          <SliderShell
            title="PAIRS WELL WITH"
            titleClassName="label font-medium"
            bordered={false}
            progress={false}
            headerClassName="pb-7 px-4 sm:pl-0 md:pr-8"
            trackClassName="border-t-[1.5px] border-line"
            /* mobile columns are uniform (every card is flush-left);
               at sm+ the flush FIRST card gives up its left padding
               (16px sm / 24px md+), so its column is that much
               narrower — keeps every media well (and thus card
               height) identical, per the comp's 260/284px rhythm */
            cols="auto-cols-[68%] sm:auto-cols-[41%] sm:[grid-template-columns:calc(41%-1rem)] md:[grid-template-columns:calc(41%-1.5rem)]"
            items={pairs.map((item, i) => ({
              key: item._key ?? String(i),
              card: <MiniProductCard card={item} first={i === 0} />,
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
            cards={[1, 2, 3, 4, 5, 6, 7].map((n) => ({
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
