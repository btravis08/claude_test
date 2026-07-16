import { defineArrayMember, defineField, defineType } from "sanity";

/*
  Shopify-modeled collection: manual (hand-picked, kept in order) or
  smart (rule-based — products matching the conditions are pulled in
  automatically). Product sliders can source a collection directly.
*/

export const RULE_FIELDS = [
  { title: "Tag", value: "tag" },
  { title: "Gender", value: "gender" },
  { title: "Vendor", value: "vendor" },
  { title: "Product type", value: "productType" },
  { title: "Title", value: "title" },
  { title: "Price", value: "price" },
];

export const RULE_OPERATORS = [
  { title: "is equal to", value: "eq" },
  { title: "is not equal to", value: "neq" },
  { title: "contains", value: "contains" },
  { title: "is greater than", value: "gt" },
  { title: "is less than", value: "lt" },
];

export const collection = defineType({
  name: "collection",
  title: "Collection",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Handle",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "type",
      title: "Collection type",
      type: "string",
      options: {
        list: [
          { title: "Manual — pick products by hand", value: "manual" },
          { title: "Smart — products match conditions automatically", value: "smart" },
        ],
        layout: "radio",
      },
      initialValue: "manual",
    }),
    defineField({
      name: "products",
      title: "Products",
      description: "Shown in this order when the sort order is Manual.",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "product" }] })],
      hidden: ({ parent }) => parent?.type === "smart",
    }),
    defineField({
      name: "match",
      title: "Products must match",
      type: "string",
      options: {
        list: [
          { title: "All conditions", value: "all" },
          { title: "Any condition", value: "any" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "all",
      hidden: ({ parent }) => parent?.type !== "smart",
    }),
    defineField({
      name: "rules",
      title: "Conditions",
      type: "array",
      hidden: ({ parent }) => parent?.type !== "smart",
      of: [
        defineArrayMember({
          type: "object",
          name: "collectionRule",
          options: { columns: 3 },
          fields: [
            defineField({
              name: "field",
              type: "string",
              options: { list: RULE_FIELDS },
              initialValue: "tag",
            }),
            defineField({
              name: "operator",
              type: "string",
              options: { list: RULE_OPERATORS },
              initialValue: "eq",
            }),
            defineField({
              name: "value",
              type: "string",
              description: "For price rules, a number (e.g. 100).",
            }),
          ],
          preview: {
            select: { field: "field", operator: "operator", value: "value" },
            prepare: ({ field, operator, value }) => ({
              title: `${field ?? "?"} ${operator ?? "?"} ${value ?? "?"}`,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "storyCards",
      title: "Story cards",
      description:
        "Editorial tiles interleaved in the collection grid. They span two columns and stick while the neighboring products scroll past.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "storyCard",
          fields: [
            defineField({ name: "title", type: "string", initialValue: "Lorem Ipsum Dolor" }),
            defineField({ name: "body", type: "text", rows: 4 }),
            defineField({
              name: "ctaLabel",
              title: "Button label",
              type: "string",
              initialValue: "Explore the Collection",
            }),
            defineField({ name: "url", title: "URL", type: "string", initialValue: "#" }),
            defineField({
              name: "image",
              type: "image",
              options: { hotspot: true },
            }),
            defineField({
              name: "align",
              title: "Grid side",
              type: "string",
              options: {
                list: [
                  { title: "Left", value: "left" },
                  { title: "Right", value: "right" },
                ],
                layout: "radio",
                direction: "horizontal",
              },
              description: "Empty = alternate automatically.",
            }),
          ],
          preview: { select: { title: "title", media: "image" } },
        }),
      ],
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "string",
      options: {
        list: [
          { title: "Newest first", value: "newest" },
          { title: "Price: low to high", value: "priceAsc" },
          { title: "Price: high to low", value: "priceDesc" },
          { title: "Title: A–Z", value: "titleAsc" },
          { title: "Manual (as arranged above)", value: "manual" },
        ],
      },
      initialValue: "newest",
    }),
  ],
  preview: {
    select: { title: "title", type: "type", media: "image" },
    prepare: ({ title, type, media }) => ({
      title,
      subtitle: type === "smart" ? "Smart collection" : "Manual collection",
      media,
    }),
  },
});
