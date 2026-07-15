import { defineArrayMember, defineField, defineType } from "sanity";

/*
  Page-builder sections mirroring the Figma "[i] Design Library — SDR"
  components. Every section carries a colorMode matching the library's
  variable modes; the frontend wraps each section in data-mode so the
  design tokens resolve per section.
*/

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
  });

export const sectionHero = defineType({
  name: "sectionHero",
  title: "Hero",
  type: "object",
  fields: [
    colorMode("dark"),
    defineField({ name: "eyebrow", type: "string", initialValue: "JUST ARRIVED" }),
    defineField({ name: "headline", type: "string" }),
    defineField({
      name: "align",
      type: "string",
      options: {
        list: ["left", "center"],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "left",
    }),
    defineField({ name: "primaryCta", title: "Primary button label", type: "string" }),
    defineField({ name: "secondaryCta", title: "Secondary button label", type: "string" }),
    image(),
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
  fields: [
    colorMode("dark"),
    defineField({ name: "eyebrow", type: "string", initialValue: "JUST ARRIVED" }),
    defineField({ name: "headline", type: "string" }),
    defineField({
      name: "align",
      type: "string",
      options: {
        list: ["left", "center"],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "center",
    }),
    defineField({ name: "primaryCta", title: "Primary button label", type: "string" }),
    defineField({ name: "secondaryCta", title: "Secondary button label", type: "string" }),
    image(),
  ],
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
    defineField({ name: "title", type: "string" }),
    defineField({
      name: "cards",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "infoCard",
          fields: [
            defineField({ name: "title", type: "string" }),
            image(),
          ],
          preview: { select: { title: "title", media: "image" } },
        }),
      ],
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
    }),
    defineField({
      name: "products",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "productCard",
          fields: [
            defineField({ name: "title", type: "string" }),
            defineField({ name: "price", type: "string" }),
            defineField({ name: "colorway", type: "string" }),
            defineField({ name: "colorCount", title: "Extra colors note", type: "string" }),
            image(),
          ],
          preview: { select: { title: "title", subtitle: "price", media: "image" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Product Slider", subtitle: "Product Slider" }),
  },
});

export const sectionCarousel = defineType({
  name: "sectionCarousel",
  title: "Carousel",
  type: "object",
  fields: [
    colorMode("light"),
    defineField({ name: "eyebrow", type: "string" }),
    defineField({
      name: "items",
      title: "List items (first is highlighted)",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "description", type: "text", rows: 3 }),
    image(),
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
      name: "panels",
      type: "array",
      validation: (rule) => rule.max(2),
      of: [
        defineArrayMember({
          type: "object",
          name: "panel",
          fields: [
            defineField({ name: "title", type: "string" }),
            image(),
          ],
          preview: { select: { title: "title", media: "image" } },
        }),
      ],
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
    defineField({ name: "body", type: "blockContent" }),
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
