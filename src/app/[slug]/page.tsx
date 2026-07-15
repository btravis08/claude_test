import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";

import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { pageBySlugQuery } from "@/sanity/lib/queries";
import type { Page } from "@/sanity/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await sanityFetch<Page | null>(pageBySlugQuery, { slug }, null);
  if (!page) return { title: "Page not found" };
  return { title: page.title };
}

export default async function CmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await sanityFetch<Page | null>(pageBySlugQuery, { slug }, null);

  if (!page) notFound();

  return (
    <article>
      <div className="flex flex-col gap-6 px-6 pb-12 pt-16 sm:pt-24">
        <h1 className="max-w-4xl font-display text-headline-lg text-ink sm:text-display-xl">
          {page.title}
        </h1>
      </div>

      {page.heroImage && (
        <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
          <Image
            src={urlFor(page.heroImage).width(2000).height(1125).url()}
            alt={page.heroImage.alt ?? page.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      {page.body && (
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="prose prose-neutral max-w-none dark:prose-invert">
            <PortableText value={page.body} />
          </div>
        </div>
      )}
    </article>
  );
}
