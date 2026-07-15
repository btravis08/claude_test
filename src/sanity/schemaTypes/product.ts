import { defineArrayMember, defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "gender",
      title: "Gender",
      type: "string",
      options: {
        list: [
          { title: "Mens", value: "mens" },
          { title: "Womens", value: "womens" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      description: "Categories this product belongs to — sliders pull products by these.",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: {
        list: [
          { title: "Footwear", value: "footwear" },
          { title: "Pants", value: "pants" },
          { title: "Polos", value: "polos" },
          { title: "Headwear", value: "headwear" },
          { title: "T-Shirts", value: "tshirts" },
        ],
        layout: "grid",
      },
    }),
    defineField({
      name: "postedAt",
      title: "Post date",
      description: "Used to sort sliders newest-first (new arrivals).",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: "Display price, e.g. $198.00",
    }),
    defineField({
      name: "variants",
      title: "Color variants",
      description:
        "First variant is the card default; the rest show as swatches on hover. Each has a display name, a swatch color, and the product image for that colorway.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "productVariant",
          fields: [
            defineField({ name: "name", type: "string", initialValue: "Lorem / Ipsum" }),
            defineField({
              name: "color",
              title: "Swatch color",
              type: "string",
              description: "Hex value, e.g. #232c3b",
              initialValue: "#9d9e9b",
            }),
            defineField({
              name: "image",
              type: "image",
              options: { hotspot: true },
            }),
          ],
          preview: { select: { title: "name", subtitle: "color", media: "image" } },
        }),
      ],
    }),
    defineField({
      name: "images",
      title: "Images",
      description: "Up to 6. The first image is the card thumbnail.",
      type: "array",
      of: [defineArrayMember({ type: "image", options: { hotspot: true } })],
      validation: (rule) => rule.max(6),
    }),
  ],
  preview: {
    select: { title: "title", gender: "gender", price: "price", media: "images.0" },
    prepare: ({ title, gender, price, media }) => ({
      title,
      subtitle: [gender, price].filter(Boolean).join(" · "),
      media,
    }),
  },
});
