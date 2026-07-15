import { AnimatedMedia } from "@/components/home/AnimatedMedia";
import { ArrowLink, ArrowSwap } from "@/components/home/ArrowHover";
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

function Media({
  aspect,
  image,
  overlay = false,
  pill = false,
  position = "center",
  hoverScale = false,
}: {
  aspect: string;
  image?: string;
  overlay?: boolean;
  pill?: boolean;
  position?: string;
  hoverScale?: boolean;
}) {
  return (
    <div className={`relative w-full overflow-hidden rounded-xs bg-surface-2 ${aspect}`}>
      {image && <AnimatedMedia image={image} position={position} hoverScale={hoverScale} />}
      {overlay && <div className="media-overlay" />}
      {pill && <PausePill />}
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
      <Media aspect="aspect-[1/2] sm:aspect-[3/2]" image={image} overlay pill />
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

export interface FullWidthProps {
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
      />
      <div
        className={`absolute inset-0 flex flex-col justify-end gap-6 p-6 ${
          centered ? "items-center pb-12 text-center" : "items-start"
        }`}
      >
        <div className={`flex flex-col gap-6 ${centered ? "items-center" : "items-start"}`}>
          {eyebrow && <p className="label font-medium">{eyebrow}</p>}
          {headline && (
            <h2 className="font-display text-headline-lg">{headline}</h2>
          )}
        </div>
        <div className={`flex ${centered ? "flex-col items-center gap-4" : "items-center gap-6"}`}>
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
              className="group flex w-full flex-col gap-[1.125rem] border-r border-line bg-surface px-6 pb-16 pt-6"
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

const SAMPLE_SWATCHES = [
  { name: "White / Navy", color: "#f4f4f2" },
  { name: "Black / Gray", color: "#161716" },
  { name: "Navy / White", color: "#232c3b" },
  { name: "Sky / Gray", color: "#c9d7e4" },
];

const defaultProducts: ProductCardData[] = Array.from({ length: 24 }, (_, i) => ({
  title: "Presidio",
  price: "$198.00",
  gender: i % 2 === 0 ? "mens" : "womens",
  colorway: "Gray / Navy",
  image: "/figma/card-shoe.png",
  hoverImage: "/figma/campaign.png",
  variants: SAMPLE_SWATCHES.map((swatch) => ({
    ...swatch,
    image: "/figma/card-shoe.png",
  })),
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

/* ---------- Carousel ---------- */

export interface CarouselProps {
  mode?: Mode;
  eyebrow?: string;
  items?: string[];
  description?: string;
  image?: string;
}

export function Carousel({
  mode = "light",
  eyebrow = "Shop Footwear",
  items = ["Pioneer→", "Presidio", "Osprey", "Cardinal", "Jupiter"],
  description = "Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget convallis lorem faucibus tortor in. Cursus feugiat feugiat a quam vestibulum dignissim sem ullamcorper.",
  image = "/figma/media-portrait.png",
}: CarouselProps) {
  return (
    <section
      data-mode={mode}
      className="flex w-full flex-col items-stretch justify-between bg-surface text-ink lg:flex-row"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-12 px-8 py-12 lg:px-32 lg:py-24">
        <div className="flex flex-col gap-8">
          {eyebrow && <p className="label font-medium text-ink">{eyebrow}</p>}
          <div className="flex flex-col font-display text-headline-sm">
            {items.map((item, i) => (
              <p key={i} className={i === 0 ? "text-ink" : "text-ink-2"}>
                {item}
              </p>
            ))}
          </div>
        </div>
        {description && (
          <p className="label max-w-[30.375rem] font-medium text-ink-2">{description}</p>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-end">
        <Media aspect="aspect-[4/5]" image={image} pill />
      </div>
    </section>
  );
}

/* ---------- 50/50 ---------- */

export interface FiftyFiftyProps {
  mode?: Mode;
  panels?: Array<{ _key?: string; title?: string; image?: string }>;
}

const defaultPanels = ["Women’s Apparel", "Men’s Apparel"].map((title) => ({
  title,
  image: "/figma/campaign.png",
}));

export function FiftyFifty({ mode = "dark", panels = defaultPanels }: FiftyFiftyProps) {
  return (
    <section
      data-mode={mode}
      className="grid w-full grid-cols-1 gap-y-0.5 bg-white text-ink sm:grid-cols-2"
    >
      {panels.map((panel, i) => (
        /* The whole panel is the link and the hover parent — hovering
           anywhere on the image triggers the arrow's swap animation */
        <ArrowLink
          key={panel._key ?? i}
          href="#"
          aria-label={panel.title}
          className="group relative block overflow-hidden"
        >
          <Media
            aspect="aspect-[4/5]"
            image={panel.image ?? "/figma/campaign.png"}
            overlay
            hoverScale
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
            <p className="font-display text-title-md">{panel.title}</p>
            <span className="flex size-10 items-center justify-center rounded-xs bg-btn text-btn-fg">
              <ArrowSwap dx={1} dy={-1}>
                <ArrowUpRight />
              </ArrowSwap>
            </span>
          </div>
        </ArrowLink>
      ))}
    </section>
  );
}
