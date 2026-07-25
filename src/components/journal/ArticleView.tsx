import { preload } from "react-dom";

import { NavTextLink } from "@/components/NavTextLink";
import { Carousel, FiftyFifty, ProductSlider } from "@/components/home/sections";
import type { ProductCardData } from "@/components/home/ProductCard";
import {
  ARTICLE_BODY,
  ARTICLE_LEAD,
  type JournalArticle,
  type JournalCategory,
} from "@/components/journal/articles";

/*
  Honors Journal article (Figma "Blog Category Page", node 33598:52325):
  breadcrumbed header, full-bleed hero, then text blocks interleaved
  with the site's existing 50/50, carousel, and product slider
  sections.
*/

function Slash() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className="text-ink"
    >
      <path d="M2.9 9.2 7.1.8" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function BlogHeader({
  category,
  title,
}: {
  category: JournalCategory;
  title: string;
}) {
  return (
    <header className="flex flex-col items-center justify-end gap-6 px-6 pb-8 pt-[10rem] md:pt-[12.5rem]">
      <nav aria-label="Breadcrumb" className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <NavTextLink href="/journal" label="HONORS JOURNAL" />
          <Slash />
        </span>
        <NavTextLink href="/journal" label={category.title.toUpperCase()} />
      </nav>
      <h1 className="text-center font-display text-headline-md text-ink">
        {title}
      </h1>
    </header>
  );
}

/* full-bleed hero — the page's LCP: eager, preloaded, never faded */
function ArticleHero({ src, title }: { src: string; title: string }) {
  preload(src, { as: "image", fetchPriority: "high" });
  return (
    <div className="w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        fetchPriority="high"
        decoding="async"
        className="aspect-[2/3] w-full bg-surface-2 object-cover sm:aspect-[16/9]"
      />
    </div>
  );
}

/* centered 800px reading column: serif lead + body copy */
function TextBlock({ lead, body }: { lead?: string; body: string[] }) {
  return (
    <div className="flex w-full items-center justify-center px-6 py-20 md:py-32">
      <div className="flex w-full max-w-[50rem] flex-col gap-10 md:gap-[3.75rem]">
        {lead && (
          <p className="font-display text-title-lg text-ink">{lead}</p>
        )}
        <div className="flex flex-col gap-4 text-body-md text-ink">
          {body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ArticleView({
  article,
  category,
  sliderProducts,
}: {
  article: JournalArticle;
  category: JournalCategory;
  sliderProducts?: ProductCardData[];
}) {
  return (
    <div data-mode="light" className="bg-surface text-ink">
      <BlogHeader category={category} title={article.title} />
      <ArticleHero src={article.hero} title={article.title} />
      <TextBlock lead={ARTICLE_LEAD} body={[ARTICLE_BODY[0]]} />
      <FiftyFifty
        mode="light"
        ratio="5:4"
        panels={article.pair.map((image) => ({ image }))}
      />
      <TextBlock lead={ARTICLE_LEAD} body={[ARTICLE_BODY[1]]} />
      <Carousel
        mode="light"
        eyebrow="Shop the Story"
        items={article.carousel.map((item) => ({
          ...item,
          description: ARTICLE_BODY[1].slice(0, 170),
        }))}
      />
      <TextBlock lead={ARTICLE_LEAD} body={ARTICLE_BODY} />
      <ProductSlider mode="light" title="New Arrivals" products={sliderProducts} />
    </div>
  );
}
