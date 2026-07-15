import type { Metadata } from "next";
import Link from "next/link";

import { ProjectCard } from "@/components/ProjectCard";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  allProjectsQuery,
  projectsByCategoryQuery,
} from "@/sanity/lib/queries";
import type { Project } from "@/sanity/types";

export const metadata: Metadata = {
  title: "Projects",
  description: "Our residential and commercial prefab builds.",
};

const filters = [
  { value: undefined, label: "All" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
] as const;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory =
    category === "residential" || category === "commercial"
      ? category
      : undefined;

  const projects = activeCategory
    ? await sanityFetch<Project[]>(
        projectsByCategoryQuery,
        { category: activeCategory },
        [],
      )
    : await sanityFetch<Project[]>(allProjectsQuery, {}, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        A look at our residential and commercial prefab builds.
      </p>

      <div className="mt-8 flex gap-2">
        {filters.map((filter) => {
          const isActive = filter.value === activeCategory;
          return (
            <Link
              key={filter.label}
              href={
                filter.value
                  ? `/projects?category=${filter.value}`
                  : "/projects"
              }
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {projects.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-lg border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
          <p>
            No {activeCategory ?? ""} projects yet. Add some in{" "}
            <Link href="/studio" className="font-medium underline">
              the Studio
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
