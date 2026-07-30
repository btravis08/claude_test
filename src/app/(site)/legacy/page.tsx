import type { Metadata } from "next";

import { FloatingWords } from "@/components/legacy/FloatingWords";
import { LegacyHero } from "@/components/legacy/LegacyHero";
import { ProductSwirl } from "@/components/legacy/ProductSwirl";
import { SplitTextBlock } from "@/components/legacy/SplitTextBlock";
import { FullBleedCarousel } from "@/components/legacy/FullBleedCarousel";

/*
  The Legacy page (Figma node 33599:69683) — a scroll-driven brand
  story: locked title intro, split-text mantra blocks, the pinned
  Pursue/Better/Always stage, the pinned info-card ride, the embossed
  mark, and the product swirl. Site chrome (nav + footer) comes from
  the (site) layout; the bespoke Legacy footer design is a separate,
  later pass.
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

export default function LegacyPage() {
  return (
    <div className="flex w-full flex-col">
      <LegacyHero />
      <SplitTextBlock eyebrow="Our Mantra" text={MANTRA} cta="Shop Sun Day Red" />
      <FloatingWords />
      <SplitTextBlock eyebrow="Our Mantra" text={MANTRA} cta="Shop Sun Day Red" />
      <FullBleedCarousel />
      <SplitTextBlock
        mode="light-mid"
        eyebrow="Our Mark"
        text={MARK_COPY}
        markImage="/figma/legacy/mark-emboss.svg"
      />
      <ProductSwirl />
    </div>
  );
}
