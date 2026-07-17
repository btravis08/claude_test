import { defineArrayMember, defineField, defineType } from "sanity";

export const page = defineType({
  name: "page",
  title: "Page",
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
      title: "Slug",
      description:
        "The page URL, e.g. “about” becomes /about. Use “home” for the homepage. Avoid “projects” and “studio”, which are reserved.",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "showFooterTagline",
      title: "Show footer tagline",
      description:
        "Shows the “Earned Never Given” art above the footer links on this page. Off by default.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "sections",
      title: "Sections",
      description:
        "The page is built from these sections, top to bottom. Drag to reorder; each section has its own color mode.",
      type: "array",
      of: [
        defineArrayMember({ type: "sectionHero" }),
        defineArrayMember({ type: "sectionInfoSlider" }),
        defineArrayMember({ type: "sectionFullWidth" }),
        defineArrayMember({ type: "sectionCarousel" }),
        defineArrayMember({ type: "sectionFiftyFifty" }),
        defineArrayMember({ type: "sectionProductSlider" }),
        defineArrayMember({ type: "sectionRichText" }),
        defineArrayMember({ type: "sectionTechSpecs" }),
        defineArrayMember({ type: "sectionGallery" }),
        defineArrayMember({ type: "sectionReviews" }),
        defineArrayMember({ type: "sectionThreeD" }),
      ],
    }),
    // Legacy fields, kept so pre-section documents still render
    defineField({
      name: "heroImage",
      title: "Hero image (legacy)",
      type: "image",
      options: { hotspot: true },
      hidden: ({ document }) => Boolean(document?.sections),
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Body (legacy)",
      type: "blockContent",
      hidden: ({ document }) => Boolean(document?.sections),
    }),
  ],
});
