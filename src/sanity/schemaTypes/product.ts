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
      name: "price",
      title: "Price",
      type: "string",
      description: "Display price, e.g. $198.00",
    }),
    defineField({
      name: "variants",
      title: "Color variants",
      description: "First variant shows on the card; the rest count toward “+N colors”.",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
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
