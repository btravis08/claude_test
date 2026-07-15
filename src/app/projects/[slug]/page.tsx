import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";

import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { projectBySlugQuery } from "@/sanity/lib/queries";
import type { Project } from "@/sanity/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await sanityFetch<Project | null>(
    projectBySlugQuery,
    { slug },
    null,
  );
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.summary };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await sanityFetch<Project | null>(
    projectBySlugQuery,
    { slug },
    null,
  );

  if (!project) notFound();

  const stats = [
    { label: "Location", value: project.location },
    { label: "Category", value: project.category },
    {
      label: "Size",
      value: project.squareFeet
        ? `${project.squareFeet.toLocaleString()} sq ft`
        : undefined,
    },
    { label: "Bedrooms", value: project.bedrooms },
    { label: "Bathrooms", value: project.bathrooms },
    { label: "Completed", value: project.completedYear },
  ].filter((stat) => stat.value !== undefined && stat.value !== null);

  return (
    <article className="mx-auto max-w-4xl px-6 py-16">
      <Link
        href="/projects"
        className="text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
      >
        ← All projects
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        {project.title}
      </h1>
      {project.summary && (
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          {project.summary}
        </p>
      )}

      {project.mainImage && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg">
          <Image
            src={urlFor(project.mainImage).width(1600).height(900).url()}
            alt={project.mainImage.alt ?? project.title}
            fill
            sizes="(min-width: 1024px) 896px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      {stats.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-4 rounded-lg bg-zinc-50 p-6 sm:grid-cols-3 dark:bg-zinc-900">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {stat.label}
              </dt>
              <dd className="mt-1 font-semibold capitalize">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {project.body && (
        <div className="prose prose-zinc mt-10 max-w-none dark:prose-invert">
          <PortableText value={project.body} />
        </div>
      )}

      {project.gallery && project.gallery.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">Gallery</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {project.gallery.map((image) => (
              <div
                key={image._key}
                className="relative aspect-[4/3] overflow-hidden rounded-lg"
              >
                <Image
                  src={urlFor(image).width(800).height(600).url()}
                  alt={image.alt ?? project.title}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
