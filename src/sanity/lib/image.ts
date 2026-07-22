import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";

import { dataset, projectId } from "@/sanity/env";

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: SanityImageSource) {
  /* auto("format") lets the Sanity CDN serve AVIF/WebP to browsers
     that accept them — every image URL in the app flows through here,
     so this is the single lever for modern formats */
  return builder.image(source).auto("format");
}
