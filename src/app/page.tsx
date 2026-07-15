import {
  Carousel,
  FiftyFifty,
  FullWidth,
  Hero,
  InfoCard,
  ProductCardV1,
  SliderNav,
} from "@/components/home/sections";

/*
  Homepage — V1 Grid from Figma "[i] Design Library — SDR" (node 33581:41491).
  Section order and color modes match the design exactly.
*/
export default function Home() {
  return (
    <div data-mode="light" className="flex flex-col items-start bg-surface">
      <Hero />

      {/* Slider — Explore Sun Day Red (light) */}
      <section data-mode="light" className="flex w-full flex-col">
        <SliderNav title="Explore Sun Day Red" />
        <div className="grid w-full grid-cols-2 lg:grid-cols-4">
          {["Footwear", "Polos", "Headwear", "T-Shirts"].map((title) => (
            <InfoCard key={title} title={title} />
          ))}
        </div>
      </section>

      <FullWidth headline="Spring Traditions" cta="SHOP SPRING TRADITIONS" center secondary="Secondary Button" />

      <Carousel />

      <FiftyFifty />

      {/* Slider — Best Sellers (light) */}
      <section data-mode="light" className="flex w-full flex-col">
        <SliderNav title="Best Sellers" />
        <div className="grid w-full grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <ProductCardV1 key={i} />
          ))}
        </div>
      </section>

      {/* Slider — Best Sellers (light) */}
      <section data-mode="light" className="flex w-full flex-col">
        <SliderNav title="Best Sellers" />
        <div className="grid w-full grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <ProductCardV1 key={i} />
          ))}
        </div>
      </section>

      <FullWidth headline="TW Performance" cta="shop tw performance" />

      {/* Product Slider — no title (light) */}
      <section data-mode="light" className="flex w-full flex-col">
        <SliderNav />
        <div className="grid w-full grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <ProductCardV1 key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
