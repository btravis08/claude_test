import type { QueryParams } from "next-sanity";

import { client } from "@/sanity/lib/client";

/**
 * Fetch from Sanity, returning `fallback` if the request fails, so the site
 * still renders (with empty states) when the API is unreachable or the
 * dataset is empty.
 */
export async function sanityFetch<T>(
  query: string,
  params: QueryParams,
  fallback: T,
): Promise<T> {
  try {
    return await client.fetch<T>(query, params, {
      next: { revalidate: 60 },
    });
  } catch (error) {
    console.error("Sanity fetch failed:", error);
    return fallback;
  }
}
