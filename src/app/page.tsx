import Link from "next/link";

import { ProjectCard } from "@/components/ProjectCard";
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
      {/* Hero is image-dark in both color modes, per the design */}
      <section className="relative flex min-h-[85vh] flex-col justify-end bg-black text-white">
        <div className="flex flex-col items-center gap-6 px-6 pb-12 pt-6 text-center">
          <p className="label font-medium">Modern prefab construction</p>
          <h1 className="max-w-3xl font-display text-headline-lg sm:text-display-xl">
            {settings.tagline ??
              "Modern prefab builds, from factory to foundation."}
          </h1>
          <div className="mt-2 flex flex-col items-center gap-4">
            <Link
              href="/projects?category=residential"
              className="label flex h-10 min-w-[150px] items-center justify-center bg-white px-3.5 font-medium text-black transition-opacity hover:opacity-80"
            >
              Residential builds
            </Link>
            <Link
              href="/projects?category=commercial"
              className="group relative font-mono text-label-md uppercase text-white"
            >
              Commercial builds
              <span className="absolute inset-x-0 -bottom-1 h-px origin-right bg-white transition-transform duration-300 group-hover:scale-x-0" />
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="flex h-[88px] items-center justify-between border-b-[1.5px] border-line px-6">
          <h2 className="label font-medium text-ink">Featured projects</h2>
          <Link
            href="/projects"
            className="label flex h-10 items-center justify-center bg-btn px-3.5 font-medium text-btn-fg transition-opacity hover:opacity-80"
          >
            View all
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid gap-px border-b border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="label border-b border-line p-12 text-center text-ink-2">
            <p>
              No featured projects yet. Open{" "}
              <Link href="/studio" className="text-ink underline">
                the Studio
              </Link>{" "}
              to add a project and mark it as featured.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
