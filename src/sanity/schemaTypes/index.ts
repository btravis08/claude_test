import { blockContent } from "./blockContent";
import { page } from "./page";
import { project } from "./project";
import { sectionTypes } from "./sections";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [project, page, siteSettings, blockContent, ...sectionTypes];
