import { ArrowLink, ArrowSwap } from "@/components/home/ArrowHover";
import { NavTextLink } from "@/components/NavTextLink";
import { ProductCard } from "@/components/home/ProductCard";
import type { ProductCardData } from "@/components/home/ProductCard";
import { activeOnly, productsForCollection, toCards } from "@/components/SectionRenderer";
import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  automaticDiscountsQuery,
  collectionBySlugQuery,
  productsByTagQuery,
  storeSettingsQuery,
  storiesForCollectionQuery,
} from "@/sanity/lib/queries";
import type {
  CollectionDoc,
  Discount,
  SliderProduct,
  StoreSettings,
  StoryDoc,
} from "@/sanity/types";
import type { SanityImageSource } from "@sanity/image-url";

/*
  Collection page (PLP): centered breadcrumb + serif title, subcategory
  chips linking one level deeper (leaf pages show none), FILTER & SORT
  row, and the borderless 1px-gap product grid with story cards — CMS
  documents tagged to collections — spanning 2 columns × 3 rows and
  sticking to the top of the screen while the products beside them
  scroll past.
*/

interface StoryData {
  title?: string;
  body?: string;
  ctaLabel?: string;
  url?: string;
  image?: string;
  placement?: "auto" | "center";
}

/* Gender-scoped collections are titled uniquely ("Mens Polos") so the
   Studio list has no duplicates; on the page the parent prefix comes
   off — breadcrumb MENS / POLOS, title Polos, chips POLOS. */
function leaf(title: string, parentTitle?: string | null) {
  return parentTitle && title.toLowerCase().startsWith(`${parentTitle.toLowerCase()} `)
    ? title.slice(parentTitle.length + 1)
    : title;
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
    body: "Cras erat viverra quam adipiscing eget. A ut sed molestie sollicitudin ac condimentum nunc lorem. At ullamcorper congue sed morbi odio in blandit adipiscing.",
    ctaLabel: "Explore the Collection",
    url: "#",
    image: "/figma/products/presidio-white-hover.png",
  },
  {
    title: "Lorem Ipsum Dolor",
    body: "Cras erat viverra quam adipiscing eget. A ut sed molestie sollicitudin ac condimentum nunc lorem. At ullamcorper congue sed morbi odio in blandit adipiscing.",
    ctaLabel: "Explore the Collection",
    url: "#",
    image: "/figma/products/presidio-black-hover.png",
    placement: "center",
  },
];

const FALLBACK_CHIPS = [
  "Polos",
  "T-Shirts",
  "Sweaters",
  "Hoodies & Pullovers",
  "Outerwear",
  "Pants",
  "Shorts",
];

const FALLBACK_DESCRIPTION =
  "Facilisis non aliquet morbi ultrices neque ac tempus, enim et vitae scelerisque risus integer ipsum sed sequat duis lectus. Rhoncus ut mauris id hendrerit mauris magna, nulla sagittis pulvinar risus elementum diam duis lectus, tuin turpis odio, facilisis ut proin vitae aliquam ac viverra.";

function Chip({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="label flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xs bg-wash px-3.5 font-medium text-ink transition-colors hover:opacity-80"
    >
      {label.toUpperCase()}
    </a>
  );
}

/* Primary (dark) pill for load-more; the story cards use the secondary
   wash style with the up-right arrow */
function CtaPill({
  label,
  href,
  variant = "primary",
  down = false,
}: {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
  down?: boolean;
}) {
  return (
    <ArrowLink
      href={href}
      className={`label flex h-10 w-fit shrink-0 items-center gap-3 whitespace-nowrap rounded-xs px-3.5 font-medium ${
        variant === "secondary" ? "bg-wash text-ink" : "bg-btn text-btn-fg"
      }`}
    >
      {label.toUpperCase()}
      {variant === "secondary" ? (
        <ArrowSwap dx={1} dy={-1}>
          <ArrowUpRight />
        </ArrowSwap>
      ) : (
        <ArrowSwap dx={down ? 0 : 1} dy={down ? 1 : 0}>
          <ArrowRight className={down ? "rotate-90" : undefined} />
        </ArrowSwap>
      )}
    </ArrowLink>
  );
}

/* Editorial tile spanning 2 columns × 3 rows; the inner block sticks
   to the top of the screen while the products beside it scroll. Sides
   alternate programmatically; "center" takes the middle two columns
   with products flowing down both outer columns. */
function StoryTile({
  story,
  position,
}: {
  story: StoryData;
  position: "left" | "right" | "center";
}) {
  const columnStart =
    position === "right" ? "lg:col-start-3" : position === "center" ? "lg:col-start-2" : "";
  return (
    <div className={`col-span-2 lg:row-span-3 ${columnStart}`}>
      <div className="sticky top-0 flex flex-col bg-surface">
        <a href={story.url ?? "#"} className="group block overflow-hidden">
          <div
            aria-hidden
            className="aspect-[4/3] w-full bg-surface-2 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            style={story.image ? { backgroundImage: `url(${story.image})` } : undefined}
          />
        </a>
        {/* button top-aligned with the title */}
        <div className="flex flex-col justify-between gap-6 px-4 py-6 sm:px-6 md:flex-row md:items-start">
          <div className="flex max-w-md flex-col gap-3">
            <p className="font-display text-title-md text-ink">{story.title}</p>
            {story.body && <p className="text-body-sm text-ink-2">{story.body}</p>}
          </div>
          <CtaPill
            label={story.ctaLabel ?? "Explore the Collection"}
            href={story.url ?? "#"}
            variant="secondary"
          />
        </div>
      </div>
    </div>
  );
}

/* Grid pattern: one row of four products, then a story row (story
   spans 2 cols × 3 rows with six products in the 2×3 beside it — only
   when six remain, so it always has a full column to stick against),
   then at least two full product rows before the next story. */
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
  let side = 0; // alternation counter for auto-placed stories
  const pushProducts = (count: number) => {
    for (const card of cards.slice(p, p + count)) {
      cells.push(<ProductCard key={card._key} product={card} />);
    }
    p += count;
  };
  pushProducts(4); // opening row
  while (s < stories.length && cards.length - p >= 6) {
    const story = stories[s];
    const position =
      story.placement === "center"
        ? "center"
        : ((side++ % 2 === 1 ? "right" : "left") as "left" | "right");
    cells.push(<StoryTile key={`story-${s}`} story={story} position={position} />);
    pushProducts(6); // the 2×3 beside (or around) the story
    s += 1;
    if (s < stories.length) pushProducts(8); // ≥2 rows between stories
  }
  pushProducts(cards.length - p); // remainder
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
  const collection = await sanityFetch<CollectionDoc | null>(
    collectionBySlugQuery,
    { slug },
    null,
  );
  /* a subcategory slug like mens-pants matches stories tagged either
     "mens" or "pants" */
  const storyKeys = Array.from(new Set([slug, ...slug.split("-")]));
  const [storyDocs, settings, discounts] = await Promise.all([
    sanityFetch<StoryDoc[]>(storiesForCollectionQuery, { keys: storyKeys }, []),
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

  const title = leaf(collection?.title ?? "Shop All", collection?.parent?.title);
  /* one card per product on the PLP (swatches still switch colorways) */
  const cards = products
    .map((product) => toCards(product, discounts, settings)[0])
    .filter((card): card is ProductCardData => Boolean(card));
  const fallbackCards: ProductCardData[] = Array.from({ length: 24 }, (_, i) => ({
    _key: `fallback-${i}`,
    title: "Presidio",
    price: "$198.00",
    colorway: "Gray / Navy",
    colorCount: "+4 colors",
    image: "/figma/products/presidio-white.png",
    hoverImage: "/figma/products/presidio-white-hover.png",
  }));
  const gridCards = collection ? cards : cards.length ? cards : fallbackCards;
  const stories: StoryData[] = storyDocs.length
    ? storyDocs.map((story) => ({
        title: story.title,
        body: story.body,
        ctaLabel: story.ctaLabel,
        url: story.url,
        image: img(story.image),
        placement: story.placement,
      }))
    : FALLBACK_STORIES;
  const chips = collection
    ? (collection.subcategories ?? []).filter((sub) => Boolean(sub?.slug))
    : FALLBACK_CHIPS.map((label) => ({ _id: label, title: label, slug: undefined }));

  return (
    <div data-mode="light" className="flex w-full flex-col bg-surface text-ink">
      {/* breadcrumb + centered serif title; crumbs use the nav link
          style, the current page keeps its underline drawn */}
      <div className="flex flex-col items-center gap-4 px-6 pb-10 pt-36">
        <div className="flex items-center gap-3">
          {collection?.parent?.slug ? (
            <NavTextLink
              href={`/collections/${collection.parent.slug}`}
              label={(collection.parent.title ?? "").toUpperCase()}
            />
          ) : (
            <NavTextLink href="/" label="SHOP" />
          )}
          <span className="label text-ink-2">/</span>
          <NavTextLink label={title.toUpperCase()} active />
        </div>
        <h1 className="font-display text-headline-lg">{title}</h1>
      </div>

      {/* subcategory chips — one level deeper; leaf pages show none */}
      {chips.length > 0 && (
        <div className="no-scrollbar flex w-full justify-start gap-2 overflow-x-auto px-6 pb-8 md:justify-center">
          {chips.map((sub) => (
            <Chip
              key={sub!._id}
              label={leaf(sub!.title ?? "", collection?.title)}
              href={sub!.slug ? `/collections/${sub!.slug}` : "#"}
            />
          ))}
        </div>
      )}

      {/* filter & count row */}
      <div className="label flex w-full items-center justify-between px-6 pb-4 pt-6 font-medium text-ink">
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
