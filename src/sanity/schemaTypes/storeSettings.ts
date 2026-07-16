import { defineField, defineType } from "sanity";

/* Store-wide commerce settings (Shopify's Settings → Store details) */
export const storeSettings = defineType({
  name: "storeSettings",
  title: "Store settings",
  type: "document",
  fields: [
    defineField({
      name: "currency",
      title: "Store currency",
      type: "string",
      options: {
        list: ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"],
      },
      initialValue: "USD",
    }),
    defineField({
      name: "locale",
      title: "Price format locale",
      type: "string",
      description: "BCP 47 locale used to format prices, e.g. en-US.",
      initialValue: "en-US",
    }),
    defineField({
      name: "showCompareAt",
      title: "Show compare-at (sale) prices on cards",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "applyAutomaticDiscounts",
      title: "Apply active automatic discounts to displayed prices",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    prepare: () => ({ title: "Store settings" }),
  },
});
