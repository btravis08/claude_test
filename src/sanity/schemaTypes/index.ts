import { blockContent } from "./blockContent";
import { collection } from "./collection";
import { discount } from "./discount";
import { page } from "./page";
import { product } from "./product";
import { project } from "./project";
import { sectionTypes } from "./sections";
import { siteSettings } from "./siteSettings";
import { storeSettings } from "./storeSettings";

export const schemaTypes = [
  project,
  product,
  collection,
  discount,
  page,
  siteSettings,
  storeSettings,
  blockContent,
  ...sectionTypes,
];
