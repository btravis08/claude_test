import Link from "next/link";

import { ProjectCard } from "@/components/ProjectCard";
import { isSanityConfigured } from "@/sanity/env";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  featuredProjectsQuery,
  siteSettingsQuery,
} from "@/sanity/lib/queries";
import type { Project, SiteSettings } from "@/sanity/types";

export default async function Home() {
  const [settings, featured] = await Promise.all([
    sanityFetch<SiteSettings>(siteSettingsQuery, {}, {}),
    sanityFetch<Project[]>(featuredProjectsQuery, {}, []),
  ]);

  return (
    <div>
      <section className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            {settings.tagline ?? "Modern prefab builds, from factory to foundation."}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-300">
            We design and deliver high-quality prefabricated homes and
            commercial buildings — faster, more sustainable, and built to last.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/projects?category=residential"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Residential builds
            </Link>
            <Link
              href="/projects?category=commercial"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              Commercial builds
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Featured projects
          </h2>
          <Link
            href="/projects"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            View all →
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
            {isSanityConfigured ? (
              <p>
                No featured projects yet. Open{" "}
                <Link href="/studio" className="font-medium underline">
                  the Studio
                </Link>{" "}
                to add a project and mark it as featured.
              </p>
            ) : (
              <p>
                Sanity isn&apos;t connected yet. Copy{" "}
                <code>.env.local.example</code> to <code>.env.local</code> and
                add your project ID — see the README for setup steps.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
