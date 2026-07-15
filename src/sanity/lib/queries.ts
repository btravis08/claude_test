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

export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
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
