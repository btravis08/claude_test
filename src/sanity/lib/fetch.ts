import type { QueryParams } from "next-sanity";
import { cacheLife, cacheTag } from "next/cache";

import { client } from "@/sanity/lib/client";

/* Cache Components layer: the cached region carries the "sanity" tag —
   a Sanity publish webhook hits /api/revalidate and busts everything
   instantly; the 10-minute revalidate is only the safety net if the
   webhook is missing/misconfigured. Stale-while-revalidate up to a
   week keeps the site serving if the Sanity API has an outage. */
async function cachedFetch<T>(query: string, params: QueryParams): Promise<T | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 604800 });
  cacheTag("sanity");
  try {
    return await client.fetch<T | null>(query, params);
  } catch (error) {
    /* the catch must live INSIDE the cached scope: a throw here would
       count as uncached data and fail the whole prerender (and any
       Sanity blip would take the build down). Cache the miss briefly
       so it retries soon instead of pinning a fallback for a week. */
    console.error("Sanity fetch failed:", error);
    cacheLife({ stale: 30, revalidate: 60, expire: 300 });
    return null;
  }
}

/**
 * Fetch from Sanity, returning `fallback` if the request fails or matches no
 * documents (GROQ returns null), so the site still renders with empty states
 * when the API is unreachable or the dataset is empty.
 */
export async function sanityFetch<T>(
  query: string,
  params: QueryParams,
  fallback: T,
): Promise<T> {
  const result = await cachedFetch<T>(query, params);
  return result ?? fallback;
}
