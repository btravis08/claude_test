import { defineArrayMember, defineField, defineType } from "sanity";
import type { SanityClient } from "sanity";

/*
  Page-builder sections mirroring the Figma "[i] Design Library — SDR"
  components. Every section carries a colorMode matching the library's
  variable modes; the frontend wraps each section in data-mode so the
  design tokens resolve per section.

  Every field ships an initialValue so a freshly added section arrives
  pre-filled: lorem copy, sample labels, and a placeholder image asset
  resolved from the dataset (seeded by scripts/seed.ts).
*/

const API = { apiVersion: "2026-07-01" };

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const key = () => `k${Math.random().toString(36).slice(2, 10)}`;

type GetClient = (options: { apiVersion: string }) => SanityClient;

async function placeholderAssetId(getClient: GetClient): Promise<string | null> {
  try {
    const client = getClient(API);
    return await client.fetch(
      `*[_type == "sanity.imageAsset" && originalFilename in ["sdr-placeholder.png", "campaign.png"]]
        | order(originalFilename desc)[0]._id`,
    );
  } catch {
    return null;
  }
}

async function placeholderImage(getClient: GetClient) {
  const id = await placeholderAssetId(getClient);
  // An empty image value keeps the field blank when no asset is seeded yet
  return id
    ? { _type: "image" as const, asset: { _type: "reference" as const, _ref: id } }
    : { _type: "image" as const };
}

const colorMode = (initialValue: "light" | "dark") =>
  defineField({
    name: "colorMode",
    title: "Color mode",
    type: "string",
    options: {
      list: [
        { title: "Light", value: "light" },
        { title: "Dark", value: "dark" },
      ],
      layout: "radio",
      direction: "horizontal",
    },
    initialValue,
  });

const image = (title = "Image") =>
  defineField({
    name: "image",
    title,
    type: "image",
    options: { hotspot: true },
    initialValue: async (_, { getClient }) => placeholderImage(getClient),
  });

/* Media block: every media slot (hero, Full Width, 50/50 columns) is
   an image or a video with a behavior picked here. The image doubles
   as the poster frame for videos. Pass `allowed` to restrict the
   choices (the hero only offers image / autoplay). */
const isVideoKind = (parent: { mediaKind?: string } | undefined) =>
  parent?.mediaKind !== "videoPlayer" && parent?.mediaKind !== "videoAutoplay";

const MEDIA_KIND_OPTIONS = [
  { title: "Image", value: "image" },
  { title: "Image — Shop the look", value: "look" },
  { title: "Video — click to play", value: "videoPlayer" },
  { title: "Video — autoplay", value: "videoAutoplay" },
];

const mediaBlockFields = (
  allowed: string[] = ["image", "look", "videoPlayer", "videoAutoplay"],
) => [
  defineField({
    name: "mediaKind",
    title: "Media type",
    type: "string",
    options: {
      list: MEDIA_KIND_OPTIONS.filter((option) => allowed.includes(option.value)),
      layout: "radio",
    },
    initialValue: "image",
  }),
  ...(allowed.some((kind) => kind.startsWith("video"))
    ? [
        defineField({
          name: "video",
          title: "Video file",
          type: "file",
          options: { accept: "video/*" },
          description:
            "Click to play: opens in a player. Autoplay: plays muted in view with a pause control. The image above is the poster frame.",
          hidden: ({ parent }) => isVideoKind(parent),
        }),
      ]
    : []),
  ...(allowed.includes("look")
    ? [
        defineField({
          name: "lookProducts",
          title: "Shop the look — products",
          type: "array",
          of: [defineArrayMember({ type: "reference", to: [{ type: "product" }] })],
          description:
            "Products tagged in this look. A bag button appears on the media; hovering it lists these over the image.",
          hidden: ({ parent }) => parent?.mediaKind !== "look",
        }),
      ]
    : []),
];

/* Shared fields for hero / full-width campaign sections: three texts
   sit on the media's vertical center — they load clustered in the
   middle and spread to left / center / right. The right text carries
   the nav-style hover underline. */
const campaignFields = () => [
  defineField({
    name: "eyebrow",
    title: "Left text",
    type: "string",
    initialValue: "Now Arriving",
  }),
  defineField({
    name: "headline",
    title: "Center text",
    type: "string",
    initialValue: "Lorem Ipsum Dolor",
  }),
  defineField({
    name: "primaryCta",
    title: "Right link text",
    type: "string",
    initialValue: "Shop Collection",
  }),
  image(),
];

export const sectionHero = defineType({
  name: "sectionHero",
  title: "Hero",
  type: "object",
  fields: [
    colorMode("dark"),
    ...campaignFields(),
    ...mediaBlockFields(["image", "videoAutoplay"]),
  ],
  preview: {
    select: { title: "headline", media: "image" },
    prepare: ({ title, media }) => ({ title: title || "Hero", subtitle: "Hero", media }),
  },
});

export const sectionFullWidth = defineType({
  name: "sectionFullWidth",
  title: "Full Width",
  type: "object",
  fields: [colorMode("dark"), ...campaignFields(), ...mediaBlockFields()],
  preview: {
    select: { title: "headline", media: "image" },
    prepare: ({ title, media }) => ({ title: title || "Full Width", subtitle: "Full Width", media }),
  },
});

export const sectionInfoSlider = defineType({
  name: "sectionInfoSlider",
  title: "Info Card Slider",
  type: "object",
  fields: [
    colorMode("light"),
    defineField({ name: "title", type: "string", initialValue: "Lorem Ipsum Slider" }),
    defineField({
      name: "cards",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "infoCard",
          fields: [
            defineField({ name: "title", type: "string", initialValue: "Lorem Card" }),
            image(),
          ],
          preview: { select: { title: "title", media: "image" } },
        }),
      ],
      // Four pre-filled cards so a new slider arrives full
      initialValue: async (_, { getClient }) => {
        const img = await placeholderImage(getClient);
        return [1, 2, 3, 4].map((n) => ({
          _type: "infoCard",
          _key: key(),
          title: `Lorem Card ${n}`,
          ...(img ? { image: img } : {}),
        }));
      },
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Info Card Slider", subtitle: "Info Card Slider" }),
  },
});

export const sectionProductSlider = defineType({
  name: "sectionProductSlider",
  title: "Product Slider",
  type: "object",
  fields: [
    colorMode("light"),
    defineField({
      name: "title",
      type: "string",
      description: "Optional — leave empty for the untitled variant",
      initialValue: "Lorem Ipsum Slider",
    }),
    defineField({
      name: "source",
      title: "Products source",
      type: "string",
      options: {
        list: [
          { title: "Automatic (by tag, newest first)", value: "auto" },
          { title: "Collection", value: "collection" },
          { title: "Manual selection", value: "manual" },
        ],
        layout: "radio",
      },
      initialValue: "auto",
    }),
    defineField({
      name: "collection",
      title: "Collection",
      type: "reference",
      to: [{ type: "collection" }],
      hidden: ({ parent }) => parent?.source !== "collection",
    }),
    defineField({
      name: "tag",
      title: "Tag",
      description: "Which products the slider pulls in automatically.",
      type: "string",
      options: {
        list: [
          { title: "All products", value: "all" },
          { title: "Footwear", value: "footwear" },
          { title: "Pants", value: "pants" },
          { title: "Polos", value: "polos" },
          { title: "Headwear", value: "headwear" },
          { title: "T-Shirts", value: "tshirts" },
        ],
      },
      initialValue: "all",
      hidden: ({ parent }) => parent?.source !== "auto" && parent?.source !== undefined,
    }),
    defineField({
      name: "products",
      title: "Products (manual selection)",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "product" }] })],
      hidden: ({ parent }) => parent?.source !== "manual",
    }),
  ],
  preview: {
    select: { title: "title", tag: "tag", source: "source" },
    prepare: ({ title, tag, source }) => ({
      title: title || "Product Slider",
      subtitle: `Product Slider — ${source === "manual" ? "manual" : tag || "all"}`,
    }),
  },
});

export const sectionCarousel = defineType({
  name: "sectionCarousel",
  title: "Carousel",
  type: "object",
  fields: [
    colorMode("light"),
    defineField({ name: "eyebrow", type: "string", initialValue: "SAMPLE BROW" }),
    defineField({
      name: "items",
      title: "Items",
      description:
        "Hovering an item on the site swaps in its image and description. First item is active by default.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "carouselItem",
          fields: [
            defineField({ name: "title", type: "string", initialValue: "Lorem" }),
            defineField({ name: "description", type: "text", rows: 3, initialValue: LOREM }),
            image(),
          ],
          preview: { select: { title: "title", media: "image" } },
        }),
      ],
      // Five pre-filled items so a new carousel arrives full
      initialValue: async (_, { getClient }) => {
        const img = await placeholderImage(getClient);
        return ["Lorem", "Ipsum", "Dolor", "Sit", "Amet"].map((title) => ({
          _type: "carouselItem",
          _key: key(),
          title,
          description: LOREM,
          ...(img ? { image: img } : {}),
        }));
      },
    }),
  ],
  preview: {
    select: { title: "eyebrow", media: "image" },
    prepare: ({ title, media }) => ({ title: title || "Carousel", subtitle: "Carousel", media }),
  },
});

export const sectionFiftyFifty = defineType({
  name: "sectionFiftyFifty",
  title: "50/50",
  type: "object",
  fields: [
    colorMode("dark"),
    defineField({
      name: "ratio",
      title: "Column ratio",
      type: "string",
      description:
        "Aspect ratio applied to both columns. Flex scales the whole 50/50 to the viewport height and the columns fill it.",
      options: {
        list: [
          { title: "5:4 portrait", value: "5:4" },
          { title: "Square (1:1)", value: "1:1" },
          { title: "Flex — fill screen height", value: "flex" },
        ],
        layout: "radio",
      },
      initialValue: "5:4",
    }),
    defineField({
      name: "panels",
      title: "Columns",
      type: "array",
      validation: (rule) => rule.max(2),
      of: [
        defineArrayMember({
          type: "object",
          name: "panel",
          fields: [
            defineField({
              name: "title",
              type: "string",
              description: "Optional overlay title; image columns with a title get the arrow link.",
              initialValue: "Lorem Panel",
            }),
            image(),
            ...mediaBlockFields(),
          ],
          preview: { select: { title: "title", media: "image" } },
        }),
      ],
      // Both panels pre-filled
      initialValue: async (_, { getClient }) => {
        const img = await placeholderImage(getClient);
        return [1, 2].map((n) => ({
          _type: "panel",
          _key: key(),
          title: `Lorem Panel ${n}`,
          ...(img ? { image: img } : {}),
        }));
      },
    }),
  ],
  preview: {
    select: { title: "panels.0.title" },
    prepare: ({ title }) => ({ title: title ? `50/50 — ${title}…` : "50/50", subtitle: "50/50" }),
  },
});

export const sectionRichText = defineType({
  name: "sectionRichText",
  title: "Rich Text",
  type: "object",
  fields: [
    colorMode("light"),
    defineField({
      name: "body",
      type: "blockContent",
      initialValue: () => [
        {
          _type: "block",
          _key: key(),
          style: "normal",
          markDefs: [],
          children: [{ _type: "span", _key: key(), text: `${LOREM} ${LOREM}`, marks: [] }],
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Rich Text", subtitle: "Rich Text" }),
  },
});

export const sectionTypes = [
  sectionHero,
  sectionFullWidth,
  sectionInfoSlider,
  sectionProductSlider,
  sectionCarousel,
  sectionFiftyFifty,
  sectionRichText,
];
