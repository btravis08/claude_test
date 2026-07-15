"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import type { StructureResolver } from "sanity/structure";

import { apiVersion, dataset, projectId } from "@/sanity/env";
import { schemaTypes } from "@/sanity/schemaTypes";

/*
  Studio sidebar: Pages (section-built), the Product catalog with
  gender-filtered views, Projects, and the Site settings singleton.
*/
const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Pages")
        .schemaType("page")
        .child(S.documentTypeList("page").title("Pages")),
      S.listItem()
        .title("Products")
        .schemaType("product")
        .child(
          S.list()
            .title("Products")
            .items([
              S.listItem()
                .title("All products")
                .schemaType("product")
                .child(S.documentTypeList("product").title("All products")),
              S.listItem()
                .title("Mens")
                .schemaType("product")
                .child(
                  S.documentList()
                    .title("Mens")
                    .apiVersion(apiVersion)
                    .schemaType("product")
                    .filter('_type == "product" && gender == "mens"'),
                ),
              S.listItem()
                .title("Womens")
                .schemaType("product")
                .child(
                  S.documentList()
                    .title("Womens")
                    .apiVersion(apiVersion)
                    .schemaType("product")
                    .filter('_type == "product" && gender == "womens"'),
                ),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("Projects")
        .schemaType("project")
        .child(S.documentTypeList("project").title("Projects")),
      S.listItem()
        .title("Site settings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
    ]);

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
