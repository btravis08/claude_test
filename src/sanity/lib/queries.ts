import { groq } from "next-sanity";

const projectFields = groq`
  _id,
  title,
  "slug": slug.current,
  category,
  featured,
  summary,
  mainImage,
  location,
  squareFeet,
  bedrooms,
  bathrooms,
  completedYear
`;

export const allProjectsQuery = groq`
  *[_type == "project"] | order(completedYear desc, _createdAt desc) {
    ${projectFields}
  }
`;

export const projectsByCategoryQuery = groq`
  *[_type == "project" && category == $category]
    | order(completedYear desc, _createdAt desc) {
    ${projectFields}
  }
`;

export const featuredProjectsQuery = groq`
  *[_type == "project" && featured == true]
    | order(completedYear desc, _createdAt desc)[0...3] {
    ${projectFields}
  }
`;

export const projectBySlugQuery = groq`
  *[_type == "project" && slug.current == $slug][0] {
    ${projectFields},
    gallery,
    body
  }
`;

/* Active products only (legacy documents without a status count as
   active) */
const activeFilter = groq`(!defined(status) || status == "active")`;

/* Full card projection: commerce fields + the SDR colorway visuals.
   collectionIds reverse-looks-up manual collection membership so
   collection-scoped discounts can resolve on the card. */
const sliderProductFields = groq`
  _id, title, price, pricing, status, gender, tags, vendor, productType, postedAt,
  variants[] {
    name, color, image, hoverImage, price, compareAtPrice, sku, inventory
  },
  "thumb": images[0],
  "hoverImage": images[1],
  "collectionIds": *[_type == "collection" && ^._id in products[]._ref]._id
`;

const lookProductFields = groq`
  _id, title, price, pricing, gender,
  variants[] { name, color, image },
  "thumb": images[0]
`;

const sectionFields = groq`
  _key,
  _type,
  colorMode,
  eyebrow,
  headline,
  align,
  primaryCta,
  secondaryCta,
  title,
  description,
  items,
  body,
  image,
  source,
  tag,
  ratio,
  mediaKind,
  "videoUrl": video.asset->url,
  lookProducts[]->{ ${lookProductFields} },
  cards[] { _key, title, image },
  collection->{ _id, title, type, match, rules, sortOrder },
  products[]->{ ${sliderProductFields} },
  panels[] {
    _key, title, image, mediaKind,
    "videoUrl": video.asset->url,
    lookProducts[]->{ ${lookProductFields} }
  }
`;

/* Products for automatic sliders: filtered by tag, newest post first */
export const productsByTagQuery = groq`
  *[_type == "product" && ${activeFilter} && ($productTag == "all" || $productTag in tags)]
    | order(postedAt desc, _createdAt desc)[0...24] {
    ${sliderProductFields}
  }
`;

/* Products referenced by a manual collection, in the arranged order */
export const collectionProductsQuery = groq`
  *[_type == "collection" && _id == $collectionId][0]
    .products[]->{ ${sliderProductFields} }
`;

/* Smart collections inject a compiled rules filter (see
   buildRulesFilter — fields/operators are whitelisted, values are
   bound params) and an order from COLLECTION_ORDER. */
export const smartCollectionProductsQuery = (filter: string, order: string) => groq`
  *[_type == "product" && ${activeFilter} && ${filter}]
    | order(${order})[0...24] {
    ${sliderProductFields}
  }
`;

/* Active automatic price discounts, with enough collection context to
   scope them per product without extra round trips */
export const automaticDiscountsQuery = groq`
  *[_type == "discount" && method == "automatic" && status == "active"
    && type in ["percentage", "fixedAmount"]] {
    _id, title, status, method, type, value, appliesTo, startsAt, endsAt,
    "productIds": products[]._ref,
    collections[]->{ _id, type, match, rules, "productIds": products[]._ref }
  }
`;

export const storeSettingsQuery = groq`
  *[_type == "storeSettings"][0] {
    currency, locale, showCompareAt, applyAutomaticDiscounts
  }
`;

export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    sections[] { ${sectionFields} },
    heroImage,
    body
  }
`;

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    companyName,
    tagline,
    phone,
    email,
    address
  }
`;
