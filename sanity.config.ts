"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import type { StructureResolver } from "sanity/structure";

import { apiVersion, dataset, projectId } from "@/sanity/env";
import { schemaTypes } from "@/sanity/schemaTypes";

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
        .schemaType("collection")
        .child(S.documentTypeList("collection").title("Collections")),
      S.listItem()
        .title("Discounts")
        .schemaType("discount")
        .child(S.documentTypeList("discount").title("Discounts")),
      S.divider(),
      S.listItem()
        .title("Pages")
        .schemaType("page")
        .child(S.documentTypeList("page").title("Pages")),
      S.listItem()
        .title("Navigation")
        .child(S.document().schemaType("navigation").documentId("navigation")),
      S.listItem()
        .title("Projects")
        .schemaType("project")
        .child(S.documentTypeList("project").title("Projects")),
      S.divider(),
      S.listItem()
        .title("Store settings")
        .child(
          S.document().schemaType("storeSettings").documentId("storeSettings"),
        ),
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
