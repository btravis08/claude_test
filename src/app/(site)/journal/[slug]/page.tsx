import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { ArticleView } from "@/components/journal/ArticleView";
import { PostArticle } from "@/components/journal/PostArticle";
import type { PostDoc } from "@/components/journal/PostArticle";
import {
  ARTICLE_LEAD,
  JOURNAL_CATEGORIES,
  findArticle,
} from "@/components/journal/articles";
import { toCards } from "@/sanity/lib/cards";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  automaticDiscountsQuery,
  postBySlugQuery,
  productsByTagQuery,
  storeSettingsQuery,
} from "@/sanity/lib/queries";
import type { Discount, SliderProduct, StoreSettings } from "@/sanity/types";

/* dark article surfaces — keep iOS bar chrome dark from first paint */
export const viewport: Viewport = { themeColor: "#0b0b0b" };

export function generateStaticParams() {
  return JOURNAL_CATEGORIES.flatMap((category) =>
    category.articles.map((article) => ({ slug: article.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await sanityFetch<PostDoc | null>(postBySlugQuery, { slug }, null);
  if (post) {
    return {
      title: `${post.seoTitle ?? post.title} — Honors Journal`,
      description: post.excerpt,
    };
  }
  const hit = findArticle(slug);
  if (!hit) return { title: "Honors Journal" };
  return {
    title: `${hit.article.title} — Honors Journal`,
    description: ARTICLE_LEAD,
  };
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  /* CMS posts take the slug first; the built-in design articles
     remain the fallback set */
  const post = await sanityFetch<PostDoc | null>(postBySlugQuery, { slug }, null);
  if (post) return <PostArticle post={post} />;

  const hit = findArticle(slug);
  if (!hit) notFound();

  /* the closing "New Arrivals" slider — real catalog cards when the
     CMS is reachable, the component's Figma defaults otherwise */
  const [settings, discounts, products] = await Promise.all([
    sanityFetch<StoreSettings | null>(storeSettingsQuery, {}, null),
    sanityFetch<Discount[]>(automaticDiscountsQuery, {}, []),
    sanityFetch<SliderProduct[]>(productsByTagQuery, { productTag: "all" }, []),
  ]);
  const cards = products
    .flatMap((product) => toCards(product, discounts, settings))
    .slice(0, 12);

  return (
    <ArticleView
      article={hit.article}
      category={hit.category}
      sliderProducts={cards.length ? cards : undefined}
    />
  );
}
