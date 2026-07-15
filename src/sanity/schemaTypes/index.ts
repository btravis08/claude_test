import { blockContent } from "./blockContent";
import { page } from "./page";
import { product } from "./product";
import { project } from "./project";
import { sectionTypes } from "./sections";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [
  project,
  product,
  page,
  siteSettings,
  blockContent,
  ...sectionTypes,
];
