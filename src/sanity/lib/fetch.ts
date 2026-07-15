import type { QueryParams } from "next-sanity";

import { isSanityConfigured } from "@/sanity/env";
import { client } from "@/sanity/lib/client";

/**
 * Fetch from Sanity, returning `fallback` when the project isn't configured
 * yet (no NEXT_PUBLIC_SANITY_PROJECT_ID) or the request fails. This lets the
 * site build and render before any content exists.
 */
export async function sanityFetch<T>(
  query: string,
  params: QueryParams,
  fallback: T,
): Promise<T> {
  if (!isSanityConfigured) return fallback;
  try {
    return await client.fetch<T>(query, params, {
      next: { revalidate: 60 },
    });
  } catch (error) {
    console.error("Sanity fetch failed:", error);
    return fallback;
  }
}
