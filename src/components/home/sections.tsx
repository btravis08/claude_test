import { AnimatedMedia } from "@/components/home/AnimatedMedia";
import { ArrowLink, ArrowSwap } from "@/components/home/ArrowHover";
import {
  AutoplayVideo,
  ShopTheLook,
  VideoPlayerBlock,
} from "@/components/home/MediaBlock";
import type { LookProductData } from "@/components/home/MediaBlock";
import { ProductCard } from "@/components/home/ProductCard";
import type { ProductCardData } from "@/components/home/ProductCard";
import { SliderShell } from "@/components/home/SliderShell";
import { ArrowUpRight, Pause } from "@/components/icons";

/*
  Presentational sections from the Figma SDR library. Content and color
  mode come in as props (fed from Sanity page sections); defaults match
  the Figma "Homepage — V1 Grid" design. Breakpoints follow the
  desktop/tablet/mobile variants in the library.
*/

type Mode = "light" | "dark";

/* ---------- shared primitives ---------- */

export function PrimaryButton({ label }: { label: string }) {
  return (
    <a
      href="#"
      className="label flex h-10 min-w-[9.375rem] items-center justify-center rounded-xs bg-btn px-3.5 font-medium text-btn-fg transition-opacity hover:opacity-80"
    >
      {label}
    </a>
  );
}

export function SecondaryTextButton({ label }: { label: string }) {
  return (
    <a href="#" className="group relative font-mono text-label-md uppercase text-ink">
      {label}
      <span className="absolute inset-x-0 -bottom-1 h-px origin-right bg-ink transition-transform duration-300 group-hover:scale-x-0" />
    </a>
  );
}

function PausePill() {
  return (
    <div className="absolute inset-0 flex items-end justify-end p-6">
      <button
        aria-label="Pause"
        className="flex size-7 items-center justify-center rounded-full bg-btn text-btn-fg"
      >
        <Pause />
      </button>
    </div>
  );
}

/* Media-block behaviors shared by Full Width and 50/50 columns */
export type MediaKind = "image" | "look" | "videoPlayer" | "videoAutoplay";

export interface MediaBlockProps {
  kind?: MediaKind;
  videoUrl?: string;
  lookProducts?: LookProductData[];
}

function Media({
  aspect,
  image,
  overlay = false,
  pill = false,
  position = "center",
  hoverScale = false,
  parallax = false,
  kind = "image",
  videoUrl,
  lookProducts,
}: {
  aspect: string;
  image?: string;
  overlay?: boolean;
  pill?: boolean;
  position?: string;
  hoverScale?: boolean;
  parallax?: boolean;
} & MediaBlockProps) {
  const autoplay = kind === "videoAutoplay" && videoUrl;
  return (
    <div className={`relative w-full overflow-hidden rounded-xs bg-surface-2 ${aspect}`}>
      {autoplay ? (
        <AutoplayVideo src={videoUrl} poster={image} />
      ) : (
        image && (
          <AnimatedMedia
            image={image}
            position={position}
            hoverScale={hoverScale}
            parallax={parallax}
          />
        )
      )}
      {overlay && <div className="media-overlay" />}
      {kind === "videoPlayer" && videoUrl && <VideoPlayerBlock src={videoUrl} />}
      {kind === "look" && lookProducts && <ShopTheLook products={lookProducts} />}
      {/* decorative pill only on plain images — videos bring their own */}
      {pill && kind === "image" && <PausePill />}
    </div>
  );
}

/* ---------- Hero ---------- */

export interface HeroProps {
  mode?: Mode;
  eyebrow?: string;
  headline?: string;
  align?: "left" | "center";
  primaryCta?: string;
  secondaryCta?: string;
  image?: string;
}

export function Hero({
  mode = "dark",
  eyebrow = "JUST ARRIVED",
  headline = "Spring Traditions",
  align = "left",
  primaryCta = "SHOP SPRING TRADITIONS",
  secondaryCta = "Secondary Button",
  image = "/figma/campaign.png",
}: HeroProps) {
  const centered = align === "center";
  return (
    <section data-mode={mode} className="relative w-full bg-surface text-ink">
      <Media aspect="aspect-[1/2] sm:aspect-[3/2]" image={image} overlay pill parallax />
      <div
        className={`absolute inset-0 flex flex-col justify-end gap-6 p-6 ${
          centered ? "items-center text-center" : "items-start"
        }`}
      >
        <div className={`flex flex-col gap-6 ${centered ? "items-center" : "items-start"}`}>
          {eyebrow && <p className="label font-medium">{eyebrow}</p>}
          {headline && (
            <h1 className="font-display text-headline-lg">{headline}</h1>
          )}
        </div>
        <div
          className={`flex ${
            centered ? "flex-col items-center gap-4" : "flex-wrap items-center gap-6"
          }`}
        >
          {primaryCta && <PrimaryButton label={primaryCta} />}
          {secondaryCta && <SecondaryTextButton label={secondaryCta} />}
        </div>
      </div>
    </section>
  );
}

/* ---------- Full Width campaign ---------- */

export interface FullWidthProps extends MediaBlockProps {
  mode?: Mode;
  eyebrow?: string;
  headline?: string;
  align?: "left" | "center";
  primaryCta?: string;
  secondaryCta?: string;
  image?: string;
}

export function FullWidth({
  mode = "dark",
  eyebrow = "JUST ARRIVED",
  headline = "Spring Traditions",
  align = "center",
  primaryCta = "SHOP SPRING TRADITIONS",
  secondaryCta,
  image = "/figma/campaign.png",
  kind = "image",
  videoUrl,
  lookProducts,
}: FullWidthProps) {
  const centered = align === "center";
  return (
    <section data-mode={mode} className="relative w-full bg-white text-ink">
      <Media
        aspect="aspect-[2/3] sm:aspect-[16/9]"
        image={image}
        overlay
        pill
        position="bottom"
        parallax
        kind={kind}
        videoUrl={videoUrl}
        lookProducts={lookProducts}
      />
      {/* pointer-events pass through the text overlay so the media's
          own controls (bag, play, pause) stay hoverable beneath it */}
      <div
        className={`pointer-events-none absolute inset-0 flex flex-col justify-end gap-6 p-6 ${
          centered ? "items-center pb-12 text-center" : "items-start"
        }`}
      >
        <div className={`flex flex-col gap-6 ${centered ? "items-center" : "items-start"}`}>
          {eyebrow && <p className="label font-medium">{eyebrow}</p>}
          {headline && (
            <h2 className="font-display text-headline-lg">{headline}</h2>
          )}
        </div>
        <div
          className={`pointer-events-auto flex ${
            centered ? "flex-col items-center gap-4" : "items-center gap-6"
          }`}
        >
          {primaryCta && <PrimaryButton label={primaryCta} />}
          {secondaryCta && <SecondaryTextButton label={secondaryCta} />}
        </div>
      </div>
    </section>
  );
}

/* ---------- Info Card Slider ---------- */

export interface InfoSliderProps {
  mode?: Mode;
  title?: string;
  cards?: Array<{ _key?: string; title?: string; image?: string }>;
}

const defaultInfoCards = ["Footwear", "Polos", "Headwear", "T-Shirts"].map((title) => ({
  title,
  image: "/figma/media-portrait.png",
}));

export function InfoSlider({
  mode = "light",
  title = "Explore Sun Day Red",
  cards = defaultInfoCards,
}: InfoSliderProps) {
  return (
    <section data-mode={mode} className="flex w-full flex-col bg-surface text-ink">
      <SliderShell
        title={title}
        items={cards.map((card, i) => ({
          key: card._key ?? String(i),
          card: (
            <a
              href="#"
              className="group flex w-full flex-col gap-[1.125rem] bg-surface pb-16"
            >
              <Media
                aspect="aspect-[3/4]"
                image={card.image ?? "/figma/media-portrait.png"}
                hoverScale
              />
              <p className="text-body-md font-medium text-ink">{card.title}</p>
            </a>
          ),
        }))}
      />
    </section>
  );
}

/* ---------- Product Slider ---------- */

export interface ProductSliderProps {
  mode?: Mode;
  title?: string;
  products?: ProductCardData[];
}

/* Mirrors the seeded Presidio colorways so the CMS-less fallback
   behaves exactly like production data */
const SAMPLE_SWATCHES = [
  { name: "White / White", color: "#f4f4f2", image: "/figma/products/presidio-white.png", hoverImage: "/figma/products/presidio-white-hover.png" },
  { name: "White / Red", color: "#b01f24", image: "/figma/products/presidio-red.png", hoverImage: "/figma/products/presidio-red-hover.png" },
  { name: "Black / White", color: "#161716", image: "/figma/products/presidio-black.png", hoverImage: "/figma/products/presidio-black-hover.png" },
  { name: "White / Blue", color: "#4b74ad", image: "/figma/products/presidio-blue.png", hoverImage: "/figma/products/presidio-blue-hover.png" },
  { name: "Gray / Navy", color: "#9aa0a8", image: "/figma/products/presidio-navy.png", hoverImage: "/figma/products/presidio-navy-hover.png" },
];

const defaultProducts: ProductCardData[] = Array.from({ length: 24 }, (_, i) => ({
  title: "Presidio",
  price: "$198.00",
  gender: i % 2 === 0 ? "mens" : "womens",
  image: "/figma/products/presidio-white.png",
  hoverImage: "/figma/products/presidio-white-hover.png",
  variants: SAMPLE_SWATCHES,
  // variant-per-card: each card defaults to a different colorway
  defaultVariant: i % SAMPLE_SWATCHES.length,
}));

export function ProductSlider({
  mode = "light",
  title,
  products = defaultProducts,
}: ProductSliderProps) {
  return (
    <section data-mode={mode} className="flex w-full flex-col bg-surface text-ink">
      <SliderShell
        title={title}
        items={products.map((product, i) => ({
          key: product._key ?? String(i),
          gender: product.gender,
          card: <ProductCard product={product} />,
        }))}
      />
    </section>
  );
}

/* ---------- Carousel (client, interactive) ---------- */

export { Carousel } from "@/components/home/Carousel";
export type { CarouselProps } from "@/components/home/Carousel";

/* ---------- 50/50 ---------- */

export interface FiftyPanelData extends MediaBlockProps {
  _key?: string;
  title?: string;
  image?: string;
}

export type FiftyRatio = "5:4" | "1:1" | "flex";

export interface FiftyFiftyProps {
  mode?: Mode;
  /* aspect applied to both columns; flex = the whole 50/50 fills the
     viewport height and the columns fill it */
  ratio?: FiftyRatio;
  panels?: FiftyPanelData[];
}

const defaultPanels: FiftyPanelData[] = ["Women’s Apparel", "Men’s Apparel"].map(
  (title) => ({
    title,
    image: "/figma/campaign.png",
  }),
);

const RATIO_ASPECT: Record<FiftyRatio, string> = {
  "5:4": "aspect-[4/5]",
  "1:1": "aspect-square",
  // flex: columns fill the 100vh section (stacked 50vh each on mobile)
  flex: "h-[50vh] sm:h-full",
};

export function FiftyFifty({
  mode = "dark",
  ratio = "5:4",
  panels = defaultPanels,
}: FiftyFiftyProps) {
  const aspect = RATIO_ASPECT[ratio] ?? RATIO_ASPECT["5:4"];
  return (
    <section
      data-mode={mode}
      className={`grid w-full grid-cols-1 gap-y-0.5 bg-white text-ink sm:grid-cols-2 ${
        ratio === "flex" ? "sm:h-screen" : ""
      }`}
    >
      {panels.map((panel, i) => {
        const kind = panel.kind ?? "image";
        const media = (
          <Media
            aspect={aspect}
            image={panel.image ?? "/figma/campaign.png"}
            overlay
            hoverScale={kind === "image"}
            parallax={kind !== "videoAutoplay"}
            kind={kind}
            videoUrl={panel.videoUrl}
            lookProducts={panel.lookProducts}
          />
        );
        /* Plain image columns keep the clickable panel with the arrow
           swap; interactive media owns its own controls instead */
        if (kind === "image") {
          return (
            <ArrowLink
              key={panel._key ?? i}
              href="#"
              aria-label={panel.title}
              className="group relative block overflow-hidden"
            >
              {media}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                <p className="font-display text-title-md">{panel.title}</p>
                <span className="flex size-10 items-center justify-center rounded-xs bg-btn text-btn-fg">
                  <ArrowSwap dx={1} dy={-1}>
                    <ArrowUpRight />
                  </ArrowSwap>
                </span>
              </div>
            </ArrowLink>
          );
        }
        return (
          <div key={panel._key ?? i} className="relative overflow-hidden">
            {media}
            {panel.title && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end p-6">
                <p className="font-display text-title-md">{panel.title}</p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
