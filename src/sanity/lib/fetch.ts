import type { QueryParams } from "next-sanity";

import { client } from "@/sanity/lib/client";

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
  try {
    const result = await client.fetch<T | null>(query, params, {
      /* tag-based: a Sanity publish webhook hits /api/revalidate and
         busts everything instantly; the 10-minute revalidate is only
         the safety net if the webhook is missing/misconfigured */
      next: { revalidate: 600, tags: ["sanity"] },
    });
    return result ?? fallback;
  } catch (error) {
    console.error("Sanity fetch failed:", error);
    return fallback;
  }
}
