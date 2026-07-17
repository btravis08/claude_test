import { ArrowLink, ArrowSwap } from "@/components/home/ArrowHover";
import { ProductCard } from "@/components/home/ProductCard";
import type { ProductCardData } from "@/components/home/ProductCard";
import { activeOnly, productsForCollection, toCards } from "@/components/SectionRenderer";
import { ArrowRight } from "@/components/icons";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  automaticDiscountsQuery,
  collectionBySlugQuery,
  collectionsListQuery,
  productsByTagQuery,
  storeSettingsQuery,
} from "@/sanity/lib/queries";
import type {
  CollectionDoc,
  Discount,
  SliderProduct,
  StoreSettings,
  StoryCard,
} from "@/sanity/types";
import type { SanityImageSource } from "@sanity/image-url";

/*
  Collection page (PLP) from the Figma frames: centered breadcrumb +
  serif title, collection chips, FILTER & SORT row, and the borderless
  1px-gap product grid with editorial story cards spanning two columns.
  A story card is sticky — it holds under the nav while the neighboring
  product column scrolls — until its row ends.
*/

interface StoryData {
  title?: string;
  body?: string;
  ctaLabel?: string;
  url?: string;
  image?: string;
  align?: "left" | "right";
}

function img(source: SanityImageSource | undefined, width = 1600) {
  if (!source) return undefined;
  try {
    return urlFor(source).width(width).url();
  } catch {
    return undefined;
  }
}

/* Fallback content so the template renders before the first seed */
const FALLBACK_STORIES: StoryData[] = [
  {
    title: "Lorem Ipsum Dolor",
    body: "Cras erat viverra quam adipiscing eget, a ut sed molestie sollicitudin. Ac condimentum nunc lorem, at ullamcorper congue sed morbi odio in blandit adipiscing.",
    ctaLabel: "Explore the Collection",
    url: "#",
    image: "/figma/products/presidio-white-hover.png",
  },
  {
    title: "Lorem Ipsum Dolor",
    body: "Cras erat viverra quam adipiscing eget, a ut sed molestie sollicitudin. Ac condimentum nunc lorem, at ullamcorper congue sed morbi odio in blandit adipiscing.",
    ctaLabel: "Explore the Collection",
    url: "#",
    image: "/figma/products/presidio-black-hover.png",
  },
];

const FALLBACK_DESCRIPTION =
  "Facilisis non aliquet morbi ultrices neque ac tempus, enim et vitae scelerisque risus integer ipsum sed sequat duis lectus. Rhoncus ut mauris id hendrerit mauris magna, nulla sagittis pulvinar risus elementum diam duis lectus, tuin turpis odio, facilisis ut proin vitae aliquam ac viverra.";

function Chip({ label, href, active }: { label: string; href: string; active?: boolean }) {
  return (
    <a
      href={href}
      className={`label flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xs px-3.5 font-medium transition-colors hover:opacity-80 ${
        active ? "bg-btn text-btn-fg" : "bg-wash text-ink"
      }`}
    >
      {label.toUpperCase()}
    </a>
  );
}

function CtaPill({ label, href, down = false }: { label: string; href: string; down?: boolean }) {
  return (
    <ArrowLink
      href={href}
      className="label flex h-10 w-fit shrink-0 items-center gap-3 whitespace-nowrap rounded-xs bg-btn px-3.5 font-medium text-btn-fg"
    >
      {label.toUpperCase()}
      <ArrowSwap dx={down ? 0 : 1} dy={down ? 1 : 0}>
        <ArrowRight className={down ? "rotate-90" : undefined} />
      </ArrowSwap>
    </ArrowLink>
  );
}

/* Editorial tile spanning 2 columns × 2 rows; the inner block is
   sticky while the neighboring products scroll past */
function StoryTile({ story, align }: { story: StoryData; align: "left" | "right" }) {
  return (
    <div
      className={`col-span-2 lg:row-span-2 ${align === "right" ? "lg:col-start-3" : ""}`}
    >
      <div className="sticky top-[4.75rem] flex flex-col bg-surface">
        <a href={story.url ?? "#"} className="group block overflow-hidden">
          <div
            aria-hidden
            className="aspect-[4/3] w-full bg-surface-2 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            style={story.image ? { backgroundImage: `url(${story.image})` } : undefined}
          />
        </a>
        <div className="flex flex-col justify-between gap-6 px-4 py-6 sm:px-6 md:flex-row md:items-end">
          <div className="flex max-w-md flex-col gap-3">
            <p className="font-display text-title-md text-ink">{story.title}</p>
            {story.body && <p className="label text-ink-2">{story.body}</p>}
          </div>
          <CtaPill label={story.ctaLabel ?? "Explore the Collection"} href={story.url ?? "#"} />
        </div>
      </div>
    </div>
  );
}

/* Grid pattern: rows of four products, then a story row — the story
   spans 2 cols × 2 rows (so it can stick while products scroll past)
   and four products fill the 2×2 beside it — alternating sides until
   the stories run out. overflow-x-clip contains the cards' entrance
   scale (below-fold cards wait at 1.05x) without creating a scroll
   container, so the sticky tiles keep working. */
function CollectionGrid({
  cards,
  stories,
}: {
  cards: ProductCardData[];
  stories: StoryData[];
}) {
  const cells: React.ReactNode[] = [];
  let p = 0;
  let s = 0;
  while (p < cards.length) {
    for (const card of cards.slice(p, p + 4)) {
      cells.push(<ProductCard key={card._key} product={card} />);
    }
    p += 4;
    if (s < stories.length && p < cards.length) {
      const story = stories[s];
      const align = story.align ?? (s % 2 === 1 ? "right" : "left");
      cells.push(<StoryTile key={`story-${s}`} story={story} align={align} />);
      for (const card of cards.slice(p, p + 4)) {
        cells.push(<ProductCard key={card._key} product={card} />);
      }
      p += 4;
      s += 1;
    }
  }
  return (
    <div className="grid grid-cols-2 gap-px overflow-x-clip lg:grid-cols-4">{cells}</div>
  );
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [collection, collections, settings, discounts] = await Promise.all([
    sanityFetch<CollectionDoc | null>(collectionBySlugQuery, { slug }, null),
    sanityFetch<Array<{ _id: string; title?: string; slug?: string }>>(
      collectionsListQuery,
      {},
      [],
    ),
    sanityFetch<StoreSettings | null>(storeSettingsQuery, {}, null),
    sanityFetch<Discount[]>(automaticDiscountsQuery, {}, []),
  ]);

  let products: SliderProduct[] = collection
    ? await productsForCollection(collection)
    : [];
  if (!collection) {
    // CMS unreachable / unseeded: render the template with the catalog
    products = activeOnly(
      await sanityFetch<SliderProduct[]>(productsByTagQuery, { productTag: "all" }, []),
    );
  }

  const title = collection?.title ?? "Shop All";
  /* one card per product on the PLP (swatches still switch colorways) */
  const cards = products
    .map((product) => toCards(product, discounts, settings)[0])
    .filter((card): card is ProductCardData => Boolean(card));
  const fallbackCards: ProductCardData[] = Array.from({ length: 9 }, (_, i) => ({
    _key: `fallback-${i}`,
    title: "Presidio",
    price: "$198.00",
    colorway: "Gray / Navy",
    colorCount: "+4 colors",
    image: "/figma/products/presidio-white.png",
    hoverImage: "/figma/products/presidio-white-hover.png",
  }));
  const gridCards = cards.length ? cards : fallbackCards;
  const stories: StoryData[] = collection?.storyCards?.length
    ? collection.storyCards.map((story: StoryCard) => ({
        title: story.title,
        body: story.body,
        ctaLabel: story.ctaLabel,
        url: story.url,
        image: img(story.image),
        align: story.align,
      }))
    : FALLBACK_STORIES;

  return (
    <div data-mode="light" className="flex w-full flex-col bg-surface text-ink">
      {/* breadcrumb + centered serif title */}
      <div className="flex flex-col items-center gap-4 px-6 pb-10 pt-12">
        <p className="label text-ink-2">
          <a href="/" className="hover:opacity-70">
            SHOP
          </a>
          {" / "}
          {title.toUpperCase()}
        </p>
        <h1 className="font-display text-headline-lg">{title}</h1>
      </div>

      {/* collection chips */}
      <div className="no-scrollbar flex w-full gap-2 overflow-x-auto px-6 pb-8">
        {(collections.length
          ? collections
          : [{ _id: "all", title: "All", slug }]
        ).map((entry) => (
          <Chip
            key={entry._id}
            label={entry.title ?? ""}
            href={`/collections/${entry.slug}`}
            active={entry.slug === slug}
          />
        ))}
      </div>

      {/* filter & count row */}
      <div className="label flex w-full items-center justify-between px-6 pb-4 font-medium text-ink">
        <button type="button" className="flex items-center gap-2">
          FILTER &amp; SORT
          <span className="text-ink-2">▽</span>
        </button>
        <p className="text-ink-2">{gridCards.length} RESULTS</p>
      </div>

      <CollectionGrid cards={gridCards} stories={stories} />

      {/* load more */}
      <div className="flex w-full justify-center py-14">
        <CtaPill label="Load More Products" href="#" down />
      </div>

      {/* collection description */}
      <p className="label px-6 pb-16 text-ink-3">
        {collection?.description ?? FALLBACK_DESCRIPTION}
      </p>
    </div>
  );
}
