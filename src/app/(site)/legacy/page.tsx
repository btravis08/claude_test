import type { Metadata } from "next";

import { FloatingWords } from "@/components/legacy/FloatingWords";
import { LegacyHero } from "@/components/legacy/LegacyHero";
import { ProductSwirl } from "@/components/legacy/ProductSwirl";
import { SplitTextBlock } from "@/components/legacy/SplitTextBlock";
import { FullBleedCarousel } from "@/components/legacy/FullBleedCarousel";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { legacyPageQuery } from "@/sanity/lib/queries";
import type { LegacyPageDoc } from "@/sanity/types";
import type { SanityImageSource } from "@sanity/image-url";

/*
  The Legacy page (Figma node 33599:69683) — a scroll-driven brand
  story: locked title intro, split-text mantra blocks, the pinned
  gallery ride, the timed full-bleed carousel, the embossed mark, and
  the product swirl. Site chrome (nav + footer) comes from the (site)
  layout; the bespoke Legacy footer design is a separate, later pass.

  Content comes from the "legacyPage" Sanity singleton; every field
  falls back to the built-in design content, so the page renders
  identically when the document (or any field) is absent.
*/

export const metadata: Metadata = {
  title: "A New Legacy — Sun Day Red",
  description:
    "Every seam, every stitch, every fold of Sun Day Red is sewn with the meticulousness, care, and unwavering focus that has defined Tiger Woods' legendary career.",
};

const MANTRA =
  "Every seam, every stitch, every fold of Sun Day Red, is sewn with the meticulousness, care, and unwavering focus that has defined Tiger Woods’ legendary career.";

const MARK_COPY =
  "When you wear these clothes, you wear the confidence to compete. You carry the legacy of a champion. You become part of the SUN DAY RED story.";

/* CDN URL for a Sanity image, or undefined (→ component fallback) */
function img(source: SanityImageSource | undefined, width: number) {
  if (!source) return undefined;
  try {
    return urlFor(source).width(width).url();
  } catch {
    return undefined;
  }
}

export default async function LegacyPage() {
  const doc = await sanityFetch<LegacyPageDoc | null>(legacyPageQuery, {}, null);

  const slides = doc?.slides
    ?.map((s) => ({
      title: s.title ?? "",
      bg: img(s.background, 2000) ?? "",
      media: img(s.media, 900) ?? "",
      body: s.body ?? "",
    }))
    .filter((s) => s.title && s.bg && s.media);

  return (
    <div className="flex w-full flex-col">
      <LegacyHero
        left={doc?.hero?.wordLeft || undefined}
        right={doc?.hero?.wordRight || undefined}
        image={img(doc?.hero?.image, 2000)}
      />
      <SplitTextBlock
        eyebrow={doc?.mantraTop?.eyebrow || "Our Mantra"}
        text={doc?.mantraTop?.copy || MANTRA}
        cta={doc?.mantraTop?.cta || "Shop Sun Day Red"}
      />
      <FloatingWords
        cards={doc?.gallery?.cards?.map((card) => ({
          src: img(card.image, 1400),
          meta: card.meta,
        }))}
        texts={[
          doc?.gallery?.textLeft || undefined,
          doc?.gallery?.textRight || undefined,
        ]}
      />
      <SplitTextBlock
        mode="light-mid"
        eyebrow={doc?.mantraBottom?.eyebrow || "Our Mantra"}
        text={doc?.mantraBottom?.copy || MANTRA}
        cta={doc?.mantraBottom?.cta || "Shop Sun Day Red"}
      />
      <FullBleedCarousel slides={slides} />
      <SplitTextBlock
        mode="light-mid"
        eyebrow={doc?.mark?.eyebrow || "Our Mark"}
        text={doc?.mark?.copy || MARK_COPY}
        markImage={img(doc?.mark?.image, 1100) ?? "/figma/legacy/mark-emboss.svg"}
      />
      <ProductSwirl
        cta={doc?.swirl?.cta || undefined}
        centerImage={img(doc?.swirl?.centerImage, 900)}
      />
    </div>
  );
}
