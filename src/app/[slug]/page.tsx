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
    <article className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {page.title}
      </h1>

      {page.heroImage && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg">
          <Image
            src={urlFor(page.heroImage).width(1600).height(900).url()}
            alt={page.heroImage.alt ?? page.title}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      {page.body && (
        <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
          <PortableText value={page.body} />
        </div>
      )}
    </article>
  );
}
