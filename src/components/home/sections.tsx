import { AnimatedMedia } from "@/components/home/AnimatedMedia";
import { ArrowLink, ArrowSwap } from "@/components/home/ArrowHover";
import { CampaignOverlay } from "@/components/home/CampaignOverlay";
import {
  AutoplayVideo,
  ShopTheLook,
  VideoPlayerBlock,
} from "@/components/home/MediaBlock";
import type { LookProductData } from "@/components/home/MediaBlock";
import { ProductCard } from "@/components/home/ProductCard";
import type { ProductCardData } from "@/components/home/ProductCard";
import { SliderShell } from "@/components/home/SliderShell";
import { ArrowUpRight } from "@/components/icons";

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
    <a href="#" className="group relative text-label-md font-medium uppercase text-ink">
      {label}
      <span className="absolute inset-x-0 -bottom-1 h-px origin-right bg-ink transition-transform duration-300 group-hover:scale-x-0" />
    </a>
  );
}

/* Media-block behaviors shared by Full Width and 50/50 columns;
   "text" is a 50/50-only column kind handled before media renders */
export type MediaKind = "image" | "look" | "videoPlayer" | "videoAutoplay" | "text";

export interface MediaBlockProps {
  kind?: MediaKind;
  videoUrl?: string;
  lookProducts?: LookProductData[];
}

function Media({
  aspect,
  image,
  overlay = false,
  position = "center",
  hoverScale = false,
  parallax = false,
  kind = "image",
  videoUrl,
  lookProducts,
  entranceDuration,
}: {
  aspect: string;
  image?: string;
  /* true = gradient scrim; "flat" = constant 25% black layer */
  overlay?: boolean | "flat";
  position?: string;
  hoverScale?: boolean;
  parallax?: boolean;
  entranceDuration?: number;
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
            entranceDuration={entranceDuration}
          />
        )
      )}
      {overlay && (
        <div
          className={
            overlay === "flat"
              ? "pointer-events-none absolute inset-0 bg-black/25"
              : "media-overlay"
          }
        />
      )}
      {/* video UI only exists on video kinds — an image shows none */}
      {kind === "videoPlayer" && videoUrl && <VideoPlayerBlock src={videoUrl} />}
      {kind === "look" && lookProducts && <ShopTheLook products={lookProducts} />}
    </div>
  );
}

/* ---------- Hero ---------- */

export interface HeroProps {
  mode?: Mode;
  /* three overlay texts: left / center / right (right hover-underlines) */
  eyebrow?: string;
  headline?: string;
  primaryCta?: string;
  image?: string;
  /* the hero's media is a static image or an autoplay video only */
  kind?: "image" | "videoAutoplay";
  videoUrl?: string;
}

export function Hero({
  mode = "dark",
  eyebrow = "Now Arriving",
  headline = "Spring Traditions",
  primaryCta = "Shop Collection",
  image = "/figma/campaign.png",
  kind = "image",
  videoUrl,
}: HeroProps) {
  return (
    <section data-mode={mode} className="relative w-full bg-surface text-ink">
      {/* the whole hero is the link and the hover parent: image scales,
          the right text's underline draws in */}
      <a href="#" aria-label={headline} className="group block w-full">
        {/* slower entrance (2x) and no hover zoom on the hero image */}
        <Media
          aspect="h-screen"
          image={image}
          overlay="flat"
          parallax
          kind={kind}
          videoUrl={videoUrl}
          entranceDuration={1.8}
        />
        <CampaignOverlay left={eyebrow} center={headline} right={primaryCta} />
      </a>
    </section>
  );
}

/* ---------- Full Width campaign ---------- */

export interface FullWidthProps extends MediaBlockProps {
  mode?: Mode;
  /* three overlay texts: left / center / right (right hover-underlines) */
  eyebrow?: string;
  headline?: string;
  primaryCta?: string;
  image?: string;
}

export function FullWidth({
  mode = "dark",
  eyebrow = "Now Arriving",
  headline = "Spring Traditions",
  primaryCta = "Shop Collection",
  image = "/figma/campaign.png",
  kind = "image",
  videoUrl,
  lookProducts,
}: FullWidthProps) {
  const media = (
    <>
      <Media
        aspect="aspect-[2/3] sm:aspect-[16/9]"
        image={image}
        overlay
        position="bottom"
        hoverScale={kind === "image"}
        parallax
        kind={kind}
        videoUrl={videoUrl}
        lookProducts={lookProducts}
      />
      {/* pointer-events pass through the text overlay so the media's
          own controls (bag, play, pause) stay hoverable beneath it */}
      <CampaignOverlay left={eyebrow} center={headline} right={primaryCta} />
    </>
  );
  return (
    /* plain-image sections are one big link; interactive media keeps
       its own controls clickable instead */
    <section data-mode={mode} className="group relative w-full bg-white text-ink">
      {kind === "image" ? (
        <a href="#" aria-label={headline} className="block w-full">
          {media}
        </a>
      ) : (
        media
      )}
    </section>
  );
}

/* ---------- Info Card Slider ---------- */

export interface InfoCardData {
  _key?: string;
  title?: string;
  /* optional body copy (feature / technology cards) */
  body?: string;
  image?: string;
  /* info cards allow a static image or an autoplay video */
  kind?: MediaKind;
  videoUrl?: string;
}

export interface InfoSliderProps {
  mode?: Mode;
  title?: string;
  cards?: InfoCardData[];
}

const defaultInfoCards: InfoCardData[] = ["Footwear", "Polos", "Headwear", "T-Shirts"].map(
  (title) => ({
    title,
    image: "/figma/media-portrait.png",
  }),
);

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
                hoverScale={card.kind !== "videoAutoplay"}
                kind={card.kind === "videoAutoplay" ? "videoAutoplay" : "image"}
                videoUrl={card.videoUrl}
              />
              <div className="flex flex-col gap-2 px-4 sm:px-6">
                <p className="text-body-md font-medium text-ink">{card.title}</p>
                {card.body && <p className="text-body-sm text-ink-2">{card.body}</p>}
              </div>
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
  /* text-module columns (kind === "text") */
  eyebrow?: string;
  body?: string;
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
        /* text module: eyebrow + body centered in the column, no media */
        if (kind === "text") {
          return (
            <div
              key={panel._key ?? i}
              className={`flex flex-col items-center justify-center gap-6 bg-surface px-6 py-16 text-center sm:px-16 ${aspect}`}
            >
              {panel.eyebrow && (
                <p className="label font-medium text-ink-2">{panel.eyebrow.toUpperCase()}</p>
              )}
              {panel.body && (
                <p className="max-w-md text-body-md font-medium text-ink">{panel.body}</p>
              )}
            </div>
          );
        }
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

/* ---------- Technical Specifications ---------- */

export interface TechSpecsProps {
  mode?: Mode;
  title?: string;
  rows?: Array<{ _key?: string; label?: string; value?: string }>;
  stats?: Array<{ _key?: string; value?: number; label?: string }>;
}

const defaultSpecRows = [
  { label: "Lorem Label", value: "Lorem ipsum dolor sit amet" },
  { label: "Ipsum Label", value: "Consectetur adipiscing elit" },
  { label: "Dolor Label", value: "Sed do eiusmod tempor" },
  { label: "Sit Label", value: "Incididunt ut labore et dolore" },
];

const defaultSpecStats = [
  { value: 82, label: "Lorem Stat" },
  { value: 64, label: "Ipsum Stat" },
  { value: 91, label: "Dolor Stat" },
];

/* Circular percentage dial (SVG stroke) */
function StatDial({ value = 0, label }: { value?: number; label?: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="3" className="stroke-line" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          strokeLinecap="butt"
          className="stroke-ink"
        />
      </svg>
      <div className="flex flex-col gap-1">
        <p className="text-body-md font-medium text-ink">{pct}%</p>
        {label && <p className="label text-ink-2">{label.toUpperCase()}</p>}
      </div>
    </div>
  );
}

export function TechSpecs({
  mode = "light",
  title = "Technical Specifications",
  rows = defaultSpecRows,
  stats = defaultSpecStats,
}: TechSpecsProps) {
  return (
    <section data-mode={mode} className="w-full border-t border-line bg-surface text-ink">
      <div className="grid w-full grid-cols-1 gap-10 p-6 md:grid-cols-2 md:py-16">
        <p className="max-w-xs font-display text-title-md">{title}</p>
        <div className="flex flex-col">
          {rows.map((row, i) => (
            <div
              key={row._key ?? i}
              className="grid grid-cols-2 gap-6 border-b border-line py-4 first:border-t"
            >
              <p className="label font-medium text-ink-2">{(row.label ?? "").toUpperCase()}</p>
              <p className="label whitespace-pre-line text-ink">{row.value}</p>
            </div>
          ))}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-x-12 gap-y-8 pt-10">
              {stats.map((stat, i) => (
                <StatDial key={stat._key ?? i} value={stat.value} label={stat.label} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Gallery (variable-aspect media slider) ---------- */

export interface GallerySlideData extends MediaBlockProps {
  _key?: string;
  image?: string;
  /* natural aspect ratio (w / h); slides fill the track height */
  aspect?: number;
}

export interface GalleryProps {
  mode?: Mode;
  title?: string;
  slides?: GallerySlideData[];
}

const defaultGallerySlides: GallerySlideData[] = [
  { image: "/figma/products/presidio-white-hover.png", aspect: 4 / 3 },
  { image: "/figma/media-portrait.png", aspect: 3 / 4 },
  { image: "/figma/campaign.png", aspect: 16 / 9 },
  { image: "/figma/products/presidio-black-hover.png", aspect: 1 },
];

export function Gallery({ mode = "light", title = "Gallery", slides = defaultGallerySlides }: GalleryProps) {
  return (
    <section data-mode={mode} className="flex w-full flex-col bg-surface text-ink">
      <SliderShell
        title={title}
        variable
        items={slides.map((slide, i) => ({
          key: slide._key ?? String(i),
          card: (
            <div
              className="relative h-[60vh] max-w-[92vw] overflow-hidden bg-surface-2 sm:h-[70vh]"
              style={{ aspectRatio: slide.aspect ?? 4 / 3 }}
            >
              {slide.kind === "videoAutoplay" && slide.videoUrl ? (
                <AutoplayVideo src={slide.videoUrl} poster={slide.image} />
              ) : (
                slide.image && <AnimatedMedia image={slide.image} />
              )}
              {slide.kind === "videoPlayer" && slide.videoUrl && (
                <VideoPlayerBlock src={slide.videoUrl} />
              )}
              {slide.kind === "look" && slide.lookProducts && (
                <ShopTheLook products={slide.lookProducts} />
              )}
            </div>
          ),
        }))}
      />
    </section>
  );
}

/* ---------- Reviews (Yotpo placeholder) ---------- */

export function Reviews({ mode = "light", title = "Reviews" }: { mode?: Mode; title?: string }) {
  return (
    <section data-mode={mode} className="w-full border-t border-line bg-surface text-ink">
      <div className="flex flex-col items-center gap-6 px-6 py-20 text-center">
        <p className="font-display text-title-md">{title}</p>
        <p className="label text-ink-2">4.8 ★★★★★ · 3 REVIEWS</p>
        {/* Yotpo main widget mounts here once the integration lands */}
        <div
          id="yotpo-reviews"
          className="yotpo yotpo-main-widget flex w-full max-w-3xl items-center justify-center rounded-xs border border-dashed border-line py-16"
        >
          <p className="label text-ink-3">YOTPO REVIEWS PLACEHOLDER</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3D Viewer (FIBL placeholder) ---------- */

export function ThreeDViewer({
  mode = "light",
  title = "Explore in 3D",
  image,
}: {
  mode?: Mode;
  title?: string;
  image?: string;
}) {
  return (
    <section data-mode={mode} className="relative w-full bg-surface text-ink">
      {/* FIBL interactive viewer mounts here once the integration lands */}
      <div
        data-fibl-viewer
        className="relative flex aspect-[2/3] w-full items-center justify-center overflow-hidden bg-surface-2 sm:aspect-[16/9]"
      >
        {image && (
          <div
            aria-hidden
            className="absolute inset-[12%] bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${image})` }}
          />
        )}
        <div className="absolute bottom-6 left-6 flex flex-col gap-1 rounded-xs bg-surface/85 p-4 backdrop-blur-md">
          <p className="text-body-md font-medium text-ink">{title}</p>
          <p className="label text-ink-2">FIBL 3D VIEWER PLACEHOLDER</p>
        </div>
      </div>
    </section>
  );
}
