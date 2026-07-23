import { AnimatedMedia } from "@/components/home/AnimatedMedia";
import { ArrowInViewPlay, ArrowLink, ArrowSwap } from "@/components/home/ArrowHover";
import { CampaignOverlay } from "@/components/home/CampaignOverlay";
import {
  AutoplayVideo,
  ShopTheLook,
  VideoPlayerBlock,
} from "@/components/home/MediaBlock";
import type { LookProductData } from "@/components/home/MediaBlock";
import { ProductCard } from "@/components/home/ProductCard";
import type { ProductCardData } from "@/components/home/ProductCard";
import { SectionReveal, RevealLine, RevealText } from "@/components/home/SectionReveal";
import { SliderShell } from "@/components/home/SliderShell";
import { StatDials } from "@/components/home/StatDial";
import { ArrowUpRight } from "@/components/icons";

/*
  Presentational sections from the Figma SDR library. Content and color
  mode come in as props (fed from Sanity page sections); defaults match
  the Figma "Homepage — V1 Grid" design. Breakpoints follow the
  desktop/tablet/mobile variants in the library.
*/

type Mode = "light" | "light-mid" | "dark-mid" | "dark";

/* ---------- shared primitives ---------- */

export function PrimaryButton({ label }: { label: string }) {
  return (
    <a
      href="#"
      className="label flex h-[2.875rem] min-w-[9.375rem] items-center justify-center rounded-xs bg-btn px-3.5 font-medium text-btn-fg transition-opacity hover:opacity-80 md:h-10"
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
  priority = false,
  lqip,
}: {
  aspect: string;
  image?: string;
  /* true = gradient scrim; "flat" = constant 25% black layer */
  overlay?: boolean | "flat";
  position?: string;
  hoverScale?: boolean;
  parallax?: boolean;
  entranceDuration?: number;
  priority?: boolean;
  lqip?: string;
} & MediaBlockProps) {
  const autoplay = kind === "videoAutoplay" && videoUrl;
  return (
    /* data-mode=dark: imagery is dark-mode content, so the fixed
       bars' point-sampling inverts over any media section */
    /* sdr-parallax-frame: names the view() timeline the touch-device
       CSS parallax scrubs against — it must live on this wrapper (the
       outermost overflow ancestor) so the timeline tracks the
       viewport, not a degenerate inner scrollport */
    <div
      data-mode="dark"
      className={`relative w-full overflow-hidden rounded-xs bg-surface-2 ${
        parallax ? "sdr-parallax-frame" : ""
      } ${aspect}`}
    >
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
            priority={priority}
            lqip={lqip}
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
  /* base64 blur preview from Sanity image metadata */
  lqip?: string;
}

export function Hero({
  mode = "dark",
  eyebrow = "Now Arriving",
  headline = "Spring Traditions",
  primaryCta = "Shop Collection",
  image = "/figma/campaign.jpg",
  kind = "image",
  videoUrl,
  lqip,
}: HeroProps) {
  return (
    <section data-mode={mode} className="relative w-full bg-surface text-ink">
      {/* the whole hero is the link and the hover parent: image scales,
          the right text's underline draws in */}
      <a href="#" aria-label={headline} className="group block w-full">
        {/* slower entrance (2x) and no hover zoom on the hero image */}
        <Media
          aspect="h-svh"
          image={image}
          overlay="flat"
          parallax
          kind={kind}
          videoUrl={videoUrl}
          entranceDuration={1.8}
          priority
          lqip={lqip}
        />
        <CampaignOverlay
          left={eyebrow}
          center={headline}
          right={primaryCta}
          stack="button"
        />
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
  /* base64 blur preview from Sanity image metadata */
  lqip?: string;
}

export function FullWidth({
  mode = "dark",
  eyebrow = "Now Arriving",
  headline = "Spring Traditions",
  primaryCta = "Shop Collection",
  image = "/figma/campaign.jpg",
  kind = "image",
  videoUrl,
  lookProducts,
  lqip,
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
        lqip={lqip}
      />
      {/* pointer-events pass through the text overlay so the media's
          own controls (bag, play, pause) stay hoverable beneath it */}
      <CampaignOverlay left={eyebrow} center={headline} right={primaryCta} stack="link" />
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
    image: "/figma/media-portrait.jpg",
  }),
);

export function InfoSlider({
  mode = "light",
  title = "Explore Sun Day Red",
  cards = defaultInfoCards,
}: InfoSliderProps) {
  /* card bodies mark the bordered info-card variant (Features /
     Technology): hairlines between and around the cards plus generous
     space under the slider; category sliders keep the open look */
  const framed = cards.some((card) => card.body);
  return (
    <section
      data-mode={mode}
      className={`flex w-full flex-col bg-surface text-ink ${framed ? "py-9xl" : ""}`}
    >
      <SliderShell
        title={title}
        titleClassName={
          framed ? "font-display text-title-md text-ink" : undefined
        }
        bordered={!framed}
        headerClassName={framed ? "border-b border-line px-4 pb-12 pt-4 md:px-6 md:pt-6" : undefined}
        cols={
          framed
            ? "auto-cols-[85%] sm:auto-cols-[45%] lg:auto-cols-[28.75%]"
            : undefined
        }
        items={cards.map((card, i) => {
          const media = (
            <Media
              aspect="aspect-[3/4]"
              image={card.image ?? "/figma/media-portrait.jpg"}
              hoverScale={card.kind !== "videoAutoplay"}
              kind={card.kind === "videoAutoplay" ? "videoAutoplay" : "image"}
              videoUrl={card.videoUrl}
            />
          );
          /* info cards (with body copy — Features / Technology) frame
             the image with padding and use the serif title; category
             cards keep the full-bleed portrait look */
          return {
            key: card._key ?? String(i),
            card: card.body ? (
              <a
                href="#"
                /* border-b only: the header row above already draws
                   the top rule — border-y would stack into a 2px line */
                className="group flex w-full flex-col gap-[1.125rem] border-b border-r border-line bg-surface p-4 pb-16 md:p-6 md:pb-16"
              >
                {media}
                <p className="font-display text-title-xs text-ink">{card.title}</p>
                <p className="text-body-sm text-ink-2">{card.body}</p>
              </a>
            ) : (
              <a href="#" className="group flex w-full flex-col gap-[1.125rem] bg-surface pb-16">
                {media}
                <p className="px-4 text-body-md font-medium text-ink md:px-6">{card.title}</p>
              </a>
            ),
          };
        })}
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
        bordered={false}
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
  /* image columns: a link turns on the arrow button + hover state */
  url?: string;
  /* text-module columns (kind === "text") */
  eyebrow?: string;
  body?: string;
  /* CMS toggles for the eyebrow and CTA (default on when content exists) */
  showEyebrow?: boolean;
  showButton?: boolean;
  ctaLabel?: string;
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
    image: "/figma/campaign.jpg",
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
      className={`grid w-full grid-cols-1 bg-white text-ink sm:grid-cols-2 ${
        ratio === "flex" ? "sm:h-svh" : ""
      }`}
    >
      {panels.map((panel, i) => {
        const kind = panel.kind ?? "image";
        /* text module (comp 33321:30688): a left-aligned 460px stack
           centered in the column — label eyebrow, Title Large body,
           and the 46px Secondary CTA; eyebrow and button carry CMS
           toggles. Mobile runs top-left on a 64px rhythm. */
        if (kind === "text") {
          const showEyebrow = panel.showEyebrow !== false && panel.eyebrow;
          const showButton = panel.showButton !== false && panel.ctaLabel;
          return (
            <div
              key={panel._key ?? i}
              className={`flex flex-col items-start bg-surface px-4 py-8 md:items-center md:justify-center md:px-16 md:py-[4.5rem] ${aspect}`}
            >
              <div className="flex w-full flex-col items-start gap-16 md:max-w-[28.75rem] md:gap-12">
                {showEyebrow && (
                  <p className="label font-medium text-ink">{panel.eyebrow!.toUpperCase()}</p>
                )}
                {panel.body && (
                  <p className="font-display text-title-lg text-ink">{panel.body}</p>
                )}
                {showButton && (
                  <a
                    href="#"
                    className="label flex h-[2.875rem] min-w-[7.5rem] items-center justify-center gap-1.5 rounded-xs bg-surface-2 px-4 font-medium text-ink transition-colors hover:bg-[#cacbc8]"
                  >
                    {panel.ctaLabel!.toUpperCase()}
                    <ArrowUpRight size={10} />
                  </a>
                )}
              </div>
            </div>
          );
        }
        const media = (
          <Media
            aspect={aspect}
            image={panel.image ?? "/figma/campaign.jpg"}
            overlay
            hoverScale={kind === "image" && Boolean(panel.url)}
            parallax={kind !== "videoAutoplay"}
            kind={kind}
            videoUrl={panel.videoUrl}
            lookProducts={panel.lookProducts}
          />
        );
        /* Image columns with a link are the clickable panel with the
           arrow swap + hover zoom; without a link they fall through
           to the static render. Interactive media owns its own
           controls instead. */
        if (kind === "image" && panel.url) {
          return (
            <ArrowLink
              key={panel._key ?? i}
              href={panel.url}
              aria-label={panel.title}
              className="sdr-parallax-frame group relative block overflow-hidden"
            >
              {media}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4 md:p-6">
                {/* mobile: same display size as the Full Width headline */}
                <p className="font-display text-headline-lg md:text-title-md">
                  {panel.title}
                </p>
                {/* md+: swap on panel hover; mobile: plays once in view */}
                <span className="hidden size-10 items-center justify-center rounded-xs bg-white text-[#161716] md:flex">
                  <ArrowSwap dx={1} dy={-1}>
                    <ArrowUpRight />
                  </ArrowSwap>
                </span>
                <ArrowInViewPlay className="flex size-10 items-center justify-center rounded-xs bg-white text-[#161716] md:hidden">
                  <ArrowSwap dx={1} dy={-1}>
                    <ArrowUpRight />
                  </ArrowSwap>
                </ArrowInViewPlay>
              </div>
            </ArrowLink>
          );
        }
        return (
          <div
            key={panel._key ?? i}
            className={`relative overflow-hidden ${
              kind !== "videoAutoplay" ? "sdr-parallax-frame" : ""
            }`}
          >
            {media}
            {panel.title && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4 md:p-6">
                {/* mobile: same display size as the Full Width headline */}
                <p className="font-display text-headline-lg md:text-title-md">
                  {panel.title}
                </p>
                {/* mobile: the square NE arrow, playing once in view */}
                <ArrowInViewPlay className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-white text-[#161716] md:hidden">
                  <ArrowSwap dx={1} dy={-1}>
                    <ArrowUpRight />
                  </ArrowSwap>
                </ArrowInViewPlay>
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
  /* closing paragraph under the rows */
  description?: string;
  stats?: Array<{ _key?: string; value?: number; label?: string }>;
}

const defaultSpecRows = [
  { label: "First Light Collection", value: "140 grams" },
  { label: "First Light Collection", value: "89% Polyamide 11% Elastane" },
  { label: "Temperature Range", value: "8-20 deg C\n8-20 deg C\n8-20 deg C" },
  { label: "Features", value: "Torsion Control\nMoisture Wicking\nDermacare Breathability" },
];

const defaultSpecDescription =
  "Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget convallis lorem faucibus tortor in. Cursus feugiat feugiat a quam vestibulum dignissim sem ullamcorper.";

const defaultSpecStats = [
  { value: 66, label: "Breathability" },
  { value: 80, label: "Weathers Resistance" },
  { value: 91, label: "Mobility" },
];


export function TechSpecs({
  mode = "light",
  title = "Technical Specifications",
  rows = defaultSpecRows,
  description = defaultSpecDescription,
  stats = defaultSpecStats,
}: TechSpecsProps) {
  return (
    <section data-mode={mode} className="w-full bg-surface text-ink">
      {/* heavy 6px rule opening the section, per the comp — the margin
          above keeps the section's own surface at the boundary (flush
          against a light neighbor, a dark section otherwise peeks up
          beside the inset rule) */}
      <div className="mx-4 mt-14 h-1.5 bg-ink md:mx-8 md:mt-8xl" />
      {/* no column gap: the right column starts on the same centerline
          as the description section's pairs rail above */}
      <SectionReveal className="grid w-full grid-cols-1 gap-y-10 px-4 pb-28 pt-14 md:grid-cols-2 md:px-8 md:pb-10xl md:pt-24">
        <p className="max-w-[26rem] font-display text-title-lg">{title}</p>
        <div className="flex flex-col gap-8">
          {/* each group opens with a 1.5px full-width rule; value rows
              sit on a 12px rhythm with hairlines spanning only the
              value column. The rules and text share one timeline: a
              group's opener draws left→right while its title fades
              up, its value rows follow one after another, and each
              group starts on the tail of the one before */}
          {(() => {
            const STEP = 0.08;
            let t = 0;
            const groups = rows.map((row, i) => {
              const lines = (row.value ?? "").split("\n").filter(Boolean);
              const d0 = t;
              t += STEP * (lines.length + 1);
              return (
                <div key={row._key ?? i} className="grid grid-cols-2">
                  <RevealLine delay={d0} className="col-span-2 h-[1.5px] w-full bg-line" />
                  <RevealText delay={d0}>
                    <p className="label py-3 font-medium text-ink-2">
                      {(row.label ?? "").toUpperCase()}
                    </p>
                  </RevealText>
                  <div className="flex flex-col">
                    {lines.map((line, j) => (
                      <div key={j} className="flex flex-col">
                        <RevealText delay={d0 + STEP * (j + 1)}>
                          <p className="label py-3 font-medium">{line.toUpperCase()}</p>
                        </RevealText>
                        <RevealLine
                          delay={d0 + STEP * (j + 1)}
                          className="h-px w-full bg-line"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
            return (
              <>
                {groups}
                {description && (
                  <div className="grid grid-cols-2 gap-y-3">
                    <RevealLine delay={t} className="col-span-2 h-[1.5px] w-full bg-line" />
                    <span />
                    <RevealText delay={t}>
                      <p className="label font-medium leading-relaxed">
                        {description.toUpperCase()}
                      </p>
                    </RevealText>
                  </div>
                )}
              </>
            );
          })()}
          {stats.length > 0 && <StatDials stats={stats} />}
        </div>
      </SectionReveal>
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
  { image: "/figma/media-portrait.jpg", aspect: 3 / 4 },
  { image: "/figma/campaign.jpg", aspect: 16 / 9 },
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
      <div className="flex flex-col items-center gap-6 px-4 py-20 text-center md:px-6">
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
