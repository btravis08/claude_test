import { toCards } from "@/sanity/lib/cards";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  automaticDiscountsQuery,
  collectionSearchQuery,
  productSearchQuery,
  storeSettingsQuery,
} from "@/sanity/lib/queries";
import type { Discount, SliderProduct, StoreSettings } from "@/sanity/types";
import type { ProductCardData } from "@/components/home/ProductCard";

/*
  Catalog search, shared by the flyout's API route and the /search
  page. Products map through the same card pipeline the sliders use,
  so search results carry the full card behavior — hover imagery,
  colorway swatches, and automatic discounts applied to displayed
  prices.
*/

export interface SearchResults {
  query: string;
  cards: ProductCardData[];
  collections: { _id: string; title: string; slug: string }[];
}

export async function searchCatalog(raw: string): Promise<SearchResults> {
  const term = raw.trim().slice(0, 64);
  if (term.length < 2) return { query: term, cards: [], collections: [] };

  const params = { q: `${term}*`, plain: term.toLowerCase() };
  const [products, collections, discounts, settings] = await Promise.all([
    sanityFetch<SliderProduct[]>(productSearchQuery, params, []),
    sanityFetch<SearchResults["collections"]>(
      collectionSearchQuery,
      { q: params.q },
      [],
    ),
    sanityFetch<Discount[]>(automaticDiscountsQuery, {}, []),
    sanityFetch<StoreSettings | null>(storeSettingsQuery, {}, null),
  ]);

  return {
    query: term,
    /* first colorway card per product, like the sliders */
    cards: products.map((p) => toCards(p, discounts, settings)[0]).filter(Boolean),
    collections,
  };
}
