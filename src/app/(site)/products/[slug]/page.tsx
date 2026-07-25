import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { preload } from "react-dom";

import {
  buildProductView,
  ProductPageView,
} from "@/components/product/ProductPageView";
import { activeOnly, buildSliderCardMap, SectionRenderer } from "@/components/SectionRenderer";
import { cardImg } from "@/sanity/lib/cards";
import { sanityFetch } from "@/sanity/lib/fetch";
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

/*
  Product page (PDP): the view and its assembly live in
  ProductPageView (shared with the draft-mode preview shell) — this
  route fetches the ingredients, builds the model, and renders it.
*/

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

  /* pairs/shop rails: products sharing the first tag */
  const tag = product?.tags?.[0] ?? "all";
  const relatedPromise = sanityFetch<SliderProduct[]>(
    productsByTagQuery,
    { productTag: tag },
    [],
  );

  /* CONTENT OVERRIDE — the Presidio's second carousel slide mirrors
     whatever image the homepage hero currently uses, fetched live
     from the CMS at render time. To make it a real product image
     instead: add it to the Presidio's images in the Studio and
     delete this block. */
  let homeHeroImage: string | undefined;
  if (slug === "the-presidio" || !product) {
    const home = await sanityFetch<Page | null>(pageBySlugQuery, { slug: "home" }, null);
    const homeHero = home?.sections?.find(
      (section): section is SectionHero => section._type === "sectionHero",
    );
    homeHeroImage = cardImg(homeHero?.image) ?? "/figma/campaign.jpg";
  }

  const related = activeOnly(await relatedPromise);
  const model = buildProductView(slug, product, {
    settings,
    discounts,
    related,
    homeHeroImage,
  });

  /* the first hero slide is the LCP image — start it with the HTML
     instead of waiting for hydration to reveal a CSS background */
  if (model.heroImages[0]) {
    preload(model.heroImages[0], { as: "image", fetchPriority: "high" });
  }

  /* Presentation preview: live client shell, edits stream pre-save */
  const { isEnabled: isDraft } = await draftMode();
  if (isDraft) {
    const { PreviewGate } = await import("@/components/preview/PreviewGate");
    const sliderCards = await buildSliderCardMap(product?.sections ?? []);
    return (
      <PreviewGate
        kind="product"
        slug={slug}
        initial={product}
        settings={settings}
        discounts={discounts}
        related={related}
        homeHeroImage={homeHeroImage}
        sliderCards={sliderCards}
      />
    );
  }

  return (
    <ProductPageView
      model={model}
      sections={
        product?.sections?.length ? (
          <SectionRenderer sections={product.sections} />
        ) : undefined
      }
    />
  );
}
