import { FiftyFifty, FullWidth, Hero } from "@/components/home/sections";
import type { LookProductData } from "@/components/home/MediaBlock";

/*
  Internal preview of the media-block paradigm — every media kind
  (image / shop the look / click-to-play video / autoplay video) and
  every 50/50 ratio, using local sample assets. Not linked from the
  site; the CMS drives the real pages.
*/

const sampleLook: LookProductData[] = [
  {
    _key: "presidio",
    title: "Presidio",
    price: "$198.00",
    colorway: "Gray / Navy",
    colorCount: "+4 colors",
    thumb: "/figma/products/presidio-navy.png",
  },
  {
    _key: "presidio-2",
    title: "Presidio",
    price: "$198.00",
    colorway: "White / Red",
    colorCount: "+4 colors",
    thumb: "/figma/products/presidio-red.png",
  },
];

export default function MediaTest() {
  return (
    <div data-mode="light" className="flex flex-col items-start bg-surface">
      <Hero
        headline="Hero Autoplay"
        eyebrow="HERO — VIDEO AUTOPLAY"
        kind="videoAutoplay"
        videoUrl="/figma/sample-video.webm"
      />
      <FullWidth
        headline="Shop the Look"
        eyebrow="FULL WIDTH — LOOK"
        kind="look"
        lookProducts={sampleLook}
        image="/figma/products/presidio-white-hover.png"
      />
      <FullWidth
        headline="Click to Play"
        eyebrow="FULL WIDTH — VIDEO PLAYER"
        kind="videoPlayer"
        videoUrl="/figma/sample-video.webm"
        image="/figma/products/presidio-black-hover.png"
      />
      <FullWidth
        headline="Autoplay"
        eyebrow="FULL WIDTH — VIDEO AUTOPLAY"
        kind="videoAutoplay"
        videoUrl="/figma/sample-video.webm"
      />
      <FiftyFifty
        ratio="5:4"
        panels={[
          { title: "Image 5:4", image: "/figma/campaign.jpg" },
          {
            title: "Look 5:4",
            image: "/figma/products/presidio-navy-hover.png",
            kind: "look",
            lookProducts: sampleLook,
          },
        ]}
      />
      <FiftyFifty
        ratio="1:1"
        panels={[
          {
            title: "Player 1:1",
            image: "/figma/products/presidio-blue-hover.png",
            kind: "videoPlayer",
            videoUrl: "/figma/sample-video.webm",
          },
          {
            title: "Autoplay 1:1",
            kind: "videoAutoplay",
            videoUrl: "/figma/sample-video.webm",
          },
        ]}
      />
      <FiftyFifty
        ratio="flex"
        panels={[
          { title: "Flex Image", image: "/figma/campaign.jpg" },
          {
            title: "Flex Autoplay",
            kind: "videoAutoplay",
            videoUrl: "/figma/sample-video.webm",
          },
        ]}
      />
    </div>
  );
}
