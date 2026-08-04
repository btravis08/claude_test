"use client";

import { assist } from "@sanity/assist";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { defineDocuments, defineLocations, presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { media } from "sanity-plugin-media";
import { icons } from "@sanity/icons";
import type { StructureResolver } from "sanity/structure";

import { apiVersion, dataset, projectId } from "@/sanity/env";
import { schemaTypes } from "@/sanity/schemaTypes";
import { calendarTool } from "@/sanity/tools/Calendar";
import { designTokensTool } from "@/sanity/tools/DesignTokens";
import { performanceTool } from "@/sanity/tools/Performance";
import { sectionLibraryTool } from "@/sanity/tools/SectionLibrary";
import { overviewTool } from "@/sanity/tools/Overview";
import { theme } from "@/sanity/theme";
import designops from "./designops.config.json";

/*
  Studio sidebar modeled on the Shopify admin: Products (with status,
  gender, and stock views), Collections, Discounts, then the online
  store (Pages) and settings singletons.
*/
const productList = (
  S: Parameters<StructureResolver>[0],
  title: string,
  filter: string,
) =>
  S.listItem()
    .title(title)
    .schemaType("product")
    .child(
      S.documentList()
        .title(title)
        .apiVersion(apiVersion)
        .schemaType("product")
        .filter(`_type == "product" && ${filter}`),
    );

const structure: StructureResolver = (S) =>
  S.list()
    .title("Store")
    .items([
      ...(designops.features.blog
        ? [
S.listItem()
        .title("Blog")
        .icon(icons["compose"])
        .child(
          S.list()
            .title("Blog")
            .items([
              S.listItem()
                .title("All posts")
                .schemaType("post")
                .child(S.documentTypeList("post").title("All posts").defaultOrdering([{ field: "publishedAt", direction: "desc" }])),
              S.listItem()
                .title("Featured")
                .schemaType("post")
                .child(
                  S.documentList()
                    .title("Featured")
                    .apiVersion(apiVersion)
                    .schemaType("post")
                    .filter('_type == "post" && featured == true'),
                ),
              S.divider(),
              S.documentTypeListItem("postCategory").title("Categories"),
              S.documentTypeListItem("author").title("Authors"),
            ]),
        ),
              ]
        : []),
      ...(designops.features.commerce
        ? [
S.listItem()
        .title("Products")
        .icon(icons["package"])
        .schemaType("product")
        .child(
          S.list()
            .title("Products")
            .items([
              S.listItem()
                .title("All products")
                .schemaType("product")
                .child(S.documentTypeList("product").title("All products")),
              productList(S, "Active", '(!defined(status) || status == "active")'),
              productList(S, "Draft", 'status == "draft"'),
              productList(S, "Archived", 'status == "archived"'),
              S.divider(),
              productList(S, "Mens", 'gender == "mens"'),
              productList(S, "Womens", 'gender == "womens"'),
              S.divider(),
              productList(
                S,
                "Out of stock",
                "count(variants[inventory.track == true && inventory.quantity <= 0]) > 0",
              ),
            ]),
        ),
      S.listItem()
        .title("Collections")
        .icon(icons["folder"])
        .schemaType("collection")
        .child(S.documentTypeList("collection").title("Collections")),
      S.listItem()
        .title("Stories")
        .icon(icons["book"])
        .schemaType("story")
        .child(S.documentTypeList("story").title("Stories")),
      S.listItem()
        .title("Discounts")
        .icon(icons["tag"])
        .schemaType("discount")
        .child(S.documentTypeList("discount").title("Discounts")),
              ]
        : []),
      S.divider(),
      S.listItem()
        .title("Pages")
        .icon(icons["documents"])
        .child(
          S.list()
            .title("Pages")
            .items([
              S.listItem()
                .title("All pages")
                .schemaType("page")
                .child(S.documentTypeList("page").title("All pages")),
              S.divider(),
              S.listItem()
                .title("Legacy page")
                .icon(icons["document"])
                .child(
                  S.document().schemaType("legacyPage").documentId("legacyPage"),
                ),
            ]),
        ),
      S.listItem()
        .title("Navigation")
        .icon(icons["menu"])
        .child(S.document().schemaType("navigation").documentId("navigation")),
      S.listItem()
        .title("Inbox")
        .icon(icons["envelope"])
        .child(
          S.list()
            .title("Inbox")
            .items([
              S.listItem()
                .title("Unread")
                .schemaType("formSubmission")
                .child(
                  S.documentList()
                    .title("Unread")
                    .apiVersion(apiVersion)
                    .schemaType("formSubmission")
                    .filter('_type == "formSubmission" && read != true')
                    .defaultOrdering([{ field: "submittedAt", direction: "desc" }]),
                ),
              S.listItem()
                .title("All submissions")
                .schemaType("formSubmission")
                .child(
                  S.documentTypeList("formSubmission")
                    .title("All submissions")
                    .defaultOrdering([{ field: "submittedAt", direction: "desc" }]),
                ),
            ]),
        ),
      ...(designops.features.projects
        ? [
S.listItem()
        .title("Projects")
        .icon(icons["case"])
        .schemaType("project")
        .child(S.documentTypeList("project").title("Projects")),
              ]
        : []),
      S.divider(),
      ...(designops.features.commerce
        ? [
S.listItem()
        .title("Store settings")
        .icon(icons["cog"])
        .child(
          S.document().schemaType("storeSettings").documentId("storeSettings"),
        ),
              ]
        : []),
      S.listItem()
        .title("Site settings")
        .icon(icons["controls"])
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
    ]);



export default defineConfig({
  basePath: "/studio",
  title: "Sun Day Red",
  projectId,
  dataset,
  theme,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ structure, title: "Content" }),
    /* Presentation: live preview of the real site (drafts included)
       with click-to-edit overlays. The site and Studio share an
       origin, so the default previewUrl just works; the enable route
       flips Next draft mode before loading the page. */
    presentationTool({
      title: "Preview",
      previewUrl: {
        previewMode: { enable: "/api/draft-mode/enable" },
      },
      resolve: {
        /* the reverse direction: documents show a "used on page"
           banner that jumps Presentation to their URL */
        locations: {
          product: defineLocations({
            select: { title: "title", slug: "slug.current" },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title ?? "Product",
                  href: `/products/${doc?.slug}`,
                },
              ],
            }),
          }),
          collection: defineLocations({
            select: { title: "title", slug: "slug.current" },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title ?? "Collection",
                  href: `/collections/${doc?.slug}`,
                },
              ],
            }),
          }),
          page: defineLocations({
            select: { title: "title", slug: "slug.current" },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title ?? "Page",
                  href: doc?.slug === "home" ? "/" : `/${doc?.slug}`,
                },
              ],
            }),
          }),
          /* singletons: static state, no fields to select */
          navigation: {
            locations: [{ title: "Site navigation", href: "/" }],
          },
          legacyPage: {
            locations: [{ title: "A New Legacy", href: "/legacy" }],
          },
        },
        /* opening one of these documents jumps the preview to its page */
        mainDocuments: defineDocuments([
          {
            route: "/",
            filter: `_type == "page" && slug.current == "home"`,
          },
          {
            route: "/products/:slug",
            filter: `_type == "product" && slug.current == $slug`,
          },
          {
            route: "/collections/:slug",
            filter: `_type == "collection" && slug.current == $slug`,
          },
          {
            route: "/legacy",
            filter: `_type == "legacyPage"`,
          },
          {
            route: "/:slug",
            filter: `_type == "page" && slug.current == $slug`,
          },
        ]),
      },
    }),
    /* Media library: searchable, taggable browser for every asset in
       the dataset — image pickers across the Studio gain a "Media"
       source too */
    media(),
    /* AI Assist: field-level generate/rewrite/translate + image alt
       text, using the schema as context. Instructions are authored
       per field in the Studio (sparkle menu). */
    assist(),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  /* read-only design-system reference alongside Content/Preview */
  tools: (prev) => [
    ...prev,
    overviewTool,
    sectionLibraryTool,
    designTokensTool,
    performanceTool,
    ...(designops.features.blog ? [calendarTool] : []),
  ],
});
