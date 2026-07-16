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

export type ColorMode = "light" | "dark";

interface SectionBase {
  _key: string;
  colorMode?: ColorMode;
}

export interface SectionHero extends SectionBase {
  _type: "sectionHero";
  eyebrow?: string;
  headline?: string;
  align?: "left" | "center";
  primaryCta?: string;
  secondaryCta?: string;
  image?: SanityImageSource;
}

export type MediaKind = "image" | "look" | "videoPlayer" | "videoAutoplay";

/* Shared media-block fields: a media slot is an image or a video with
   a behavior (static / shop the look / click to play / autoplay) */
export interface MediaBlockFields {
  mediaKind?: MediaKind;
  videoUrl?: string;
  lookProducts?: Array<SliderProduct | null>;
}

export interface SectionFullWidth extends SectionBase, MediaBlockFields {
  _type: "sectionFullWidth";
  eyebrow?: string;
  headline?: string;
  align?: "left" | "center";
  primaryCta?: string;
  secondaryCta?: string;
  image?: SanityImageSource;
}

export interface SectionInfoSlider extends SectionBase {
  _type: "sectionInfoSlider";
  title?: string;
  cards?: Array<{ _key: string; title?: string; image?: SanityImageSource }>;
}

export type ProductGender = "mens" | "womens";

export interface ProductVariant {
  name?: string;
  color?: string;
  image?: SanityImageSource;
  hoverImage?: SanityImageSource;
}

export interface SliderProduct {
  _id: string;
  title?: string;
  price?: string;
  gender?: ProductGender;
  variants?: ProductVariant[];
  thumb?: SanityImageSource;
  hoverImage?: SanityImageSource;
}

export interface SectionProductSlider extends SectionBase {
  _type: "sectionProductSlider";
  title?: string;
  source?: "auto" | "manual";
  tag?: string;
  products?: Array<SliderProduct | null>;
}

export interface CarouselItem {
  _key?: string;
  title?: string;
  description?: string;
  image?: SanityImageSource;
}

export interface SectionCarousel extends SectionBase {
  _type: "sectionCarousel";
  eyebrow?: string;
  /* strings are legacy data from before items carried image/description */
  items?: Array<string | CarouselItem>;
  description?: string;
  image?: SanityImageSource;
}

export interface SectionFiftyFifty extends SectionBase {
  _type: "sectionFiftyFifty";
  ratio?: "5:4" | "1:1" | "flex";
  panels?: Array<
    { _key: string; title?: string; image?: SanityImageSource } & MediaBlockFields
  >;
}

export interface SectionRichText extends SectionBase {
  _type: "sectionRichText";
  body?: PortableTextBlock[];
}

export type PageSection =
  | SectionHero
  | SectionFullWidth
  | SectionInfoSlider
  | SectionProductSlider
  | SectionCarousel
  | SectionFiftyFifty
  | SectionRichText;

export interface Page {
  _id: string;
  title: string;
  slug: string;
  sections?: PageSection[];
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
