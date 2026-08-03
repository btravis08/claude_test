import { blockContent } from "./blockContent";
import { collection } from "./collection";
import { discount } from "./discount";
import { legacyPage } from "./legacyPage";
import { navigation } from "./navigation";
import { page } from "./page";
import { redirect } from "./redirect";
import { author, post, postCategory } from "./blog";
import { product } from "./product";
import { project } from "./project";
import { sectionTypes } from "./sections";
import { siteSettings } from "./siteSettings";
import { story } from "./story";
import { storeSettings } from "./storeSettings";

export const schemaTypes = [
  project,
  redirect,
  post,
  author,
  postCategory,
  product,
  collection,
  discount,
  story,
  page,
  legacyPage,
  navigation,
  siteSettings,
  storeSettings,
  blockContent,
  ...sectionTypes,
];
