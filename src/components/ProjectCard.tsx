import Image from "next/image";
import Link from "next/link";

import { urlFor } from "@/sanity/lib/image";
import type { Project } from "@/sanity/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
        {project.mainImage ? (
          <Image
            src={urlFor(project.mainImage).width(800).height(600).url()}
            alt={project.mainImage.alt ?? project.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No photo yet
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-zinc-900">
          {project.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{project.title}</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {[project.location, project.completedYear].filter(Boolean).join(" · ")}
        </p>
        {project.summary && (
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {project.summary}
          </p>
        )}
      </div>
    </Link>
  );
}
