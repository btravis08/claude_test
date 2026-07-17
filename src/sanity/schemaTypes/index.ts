import { blockContent } from "./blockContent";
import { collection } from "./collection";
import { discount } from "./discount";
import { navigation } from "./navigation";
import { page } from "./page";
import { product } from "./product";
import { project } from "./project";
import { sectionTypes } from "./sections";
import { siteSettings } from "./siteSettings";
import { story } from "./story";
import { storeSettings } from "./storeSettings";

export const schemaTypes = [
  project,
  product,
  collection,
  discount,
  story,
  page,
  navigation,
  siteSettings,
  storeSettings,
  blockContent,
  ...sectionTypes,
];
