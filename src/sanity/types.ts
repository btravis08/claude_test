import type { PortableTextBlock } from "next-sanity";
import type { SanityImageSource } from "@sanity/image-url";

export type ProjectCategory = "residential" | "commercial";

export interface Project {
  _id: string;
  title: string;
  slug: string;
  category: ProjectCategory;
  featured?: boolean;
  summary?: string;
  mainImage?: SanityImageSource & { alt?: string };
  gallery?: Array<SanityImageSource & { _key: string; alt?: string }>;
  location?: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  completedYear?: number;
  body?: PortableTextBlock[];
}

export interface Page {
  _id: string;
  title: string;
  slug: string;
  heroImage?: SanityImageSource & { alt?: string };
  body?: PortableTextBlock[];
}

export interface SiteSettings {
  companyName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
}
