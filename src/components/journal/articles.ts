/*
  Honors Journal fake content — placeholder articles per category so
  the journal reads like a living publication before real editorial
  (or a CMS article schema) exists. Copy is the design's lorem; the
  imagery is the design's editorial pool (public/figma/journal) plus
  campaign photography already shipped for other sections.
*/

export type StreamRatio = "1 / 1" | "4 / 5" | "3 / 4";

export interface ArticleImage {
  src: string;
  ratio: StreamRatio;
}

export interface JournalArticle {
  slug: string;
  title: string;
  hero: string;
  /* imagery surfaced in the landing stream for its category */
  stream: ArticleImage[];
  /* 50/50 panel images (article midpoint) */
  pair: [string, string];
  /* carousel entries */
  carousel: { title: string; image: string }[];
}

export interface JournalCategory {
  slug: string;
  title: string;
  label: string;
  articles: JournalArticle[];
}

/* design lorem — lead (Title Large serif) + body paragraphs */
export const ARTICLE_LEAD =
  "In Augusta, Georgia sloped fairways, and undulating greens teach egestas sodales sit mauris leo. Sed ullamcorper orci at vitae sit mauris aenean. Non habitasse facilisis facilisi ornare. Eget sed leo.";

export const ARTICLE_BODY: [string, string] = [
  "Ultricies malesuada condimentum leo vel mattis scelerisque vitae. Tellus ornare nibh eget vivamus bibendum at enim arcu pellentesque. Convallis velit integer egestas sed. Rhoncus tincidunt enim mattis et. Ante mi velit nibh massa dictum turpis egestas consectetur tincidunt. Ornare vitae libero amet ac potenti id at interdum amet. Ullamcorper senectus nunc augue ut nunc pulvinar adipiscing ultricies aliquam. Facilisis tellus odio magna duis pharetra at eget arcu. Ac urna consequat consectetur lorem. Vestibulum odio ac tortor consectetur iaculis neque ipsum odio et. Id morbi nisi fermentum in egestas at risus gravida eget. Eu nec lectus ultricies viverra ac semper urna. Dictumst bibendum quis blandit eget. Lectus tincidunt enim viverra tempor aliquam lorem non ut.",
  "Orci faucibus erat cras sit. Sit duis elit orci ac amet. Risus nec turpis auctor vel id tortor. Ipsum integer donec et fringilla dictumst odio. Varius egestas vitae purus amet bibendum pharetra ac neque gravida. Aliquam non odio pretium urna. At eleifend amet elementum est pharetra aliquam pharetra nec. Porttitor sit a ligula arcu sed pretium molestie.",
];

const J = (n: number) => `/figma/journal/stream-${String(n).padStart(2, "0")}.jpg`;
const HERO = (n: number) => `/figma/journal/hero-0${n}.jpg`;

/* shared carousel imagery (product-forward, mirrors the home carousel) */
const CAROUSEL = [
  { title: "Pioneer", image: "/figma/media-portrait.jpg" },
  { title: "Presidio", image: "/figma/products/presidio-white.png" },
  { title: "Osprey", image: "/figma/card-shoe.jpg" },
  { title: "Jupiter", image: "/figma/campaign.jpg" },
];

/* article factory: rotates the stream pool + heroes so neighbouring
   articles never share a lead image */
const article = (
  slug: string,
  title: string,
  heroIdx: number,
  imgs: [number, number, number],
  ratios: [StreamRatio, StreamRatio, StreamRatio],
): JournalArticle => ({
  slug,
  title,
  hero: HERO(heroIdx),
  stream: imgs.map((n, i) => ({ src: J(n), ratio: ratios[i] })),
  pair: [J(imgs[1]), J(imgs[2])],
  carousel: CAROUSEL,
});

export const JOURNAL_CATEGORIES: JournalCategory[] = [
  {
    slug: "ambassadors",
    title: "Ambassadors",
    label: "The players & partners",
    articles: [
      article("next-in-line", "Next in Line", 1, [2, 8, 14], ["3 / 4", "1 / 1", "4 / 5"]),
      article("inside-the-team-room", "Inside the Team Room", 2, [1, 12, 5], ["1 / 1", "3 / 4", "4 / 5"]),
      article("the-first-signing", "The First Signing", 3, [16, 3, 9], ["3 / 4", "4 / 5", "1 / 1"]),
    ],
  },
  {
    slug: "stories-from-the-course",
    title: "Stories from the Course",
    label: "People, ideas, & culture",
    articles: [
      article("sunday-at-augusta", "Sunday at Augusta", 4, [4, 6, 11], ["3 / 4", "1 / 1", "4 / 5"]),
      article("the-back-nine-wind", "The Back Nine Wind", 5, [10, 15, 2], ["1 / 1", "4 / 5", "3 / 4"]),
      article("a-caddies-eye", "Through a Caddie's Eye", 1, [7, 13, 8], ["4 / 5", "1 / 1", "3 / 4"]),
    ],
  },
  {
    slug: "on-craft-and-culture",
    title: "On Craft and Culture",
    label: "Design, materials, & making",
    articles: [
      article("anatomy-of-a-polo", "The Anatomy of a Polo", 2, [12, 1, 16], ["3 / 4", "1 / 1", "4 / 5"]),
      article("cashmere-on-course", "Why Cashmere Belongs on Course", 3, [5, 9, 3], ["4 / 5", "1 / 1", "3 / 4"]),
      article("building-the-presidio", "Building the Presidio", 4, [14, 4, 10], ["4 / 5", "3 / 4", "1 / 1"]),
    ],
  },
  {
    slug: "in-the-press",
    title: "In the Press",
    label: "Coverage & conversation",
    articles: [
      article("a-year-of-red", "A Year of Red", 5, [6, 2, 15], ["1 / 1", "3 / 4", "4 / 5"]),
      article("what-theyre-saying", "What They're Saying", 1, [11, 8, 1], ["4 / 5", "1 / 1", "3 / 4"]),
      article("majors-season", "Majors Season, Reviewed", 2, [13, 16, 7], ["1 / 1", "3 / 4", "4 / 5"]),
    ],
  },
  {
    slug: "from-tiger",
    title: "From Tiger",
    label: "In his words",
    articles: [
      article("why-sunday-red", "Why Sunday Red", 3, [3, 10, 12], ["3 / 4", "1 / 1", "4 / 5"]),
      article("the-meaning-of-the-tiger", "The Meaning of the Tiger", 4, [9, 5, 4], ["1 / 1", "4 / 5", "3 / 4"]),
      article("letters-from-the-founder", "Letters from the Founder", 5, [15, 14, 6], ["4 / 5", "3 / 4", "1 / 1"]),
    ],
  },
  {
    slug: "beyond-the-red",
    title: "Beyond the Red",
    label: "Off the course",
    articles: [
      article("golf-after-dark", "Golf After Dark", 1, [8, 7, 2], ["1 / 1", "4 / 5", "3 / 4"]),
      article("training-days", "Training Days", 2, [4, 11, 13], ["3 / 4", "4 / 5", "1 / 1"]),
      article("the-travel-kit", "The Travel Kit", 3, [1, 6, 16], ["4 / 5", "1 / 1", "3 / 4"]),
    ],
  },
];

export function findArticle(
  slug: string,
): { article: JournalArticle; category: JournalCategory } | null {
  for (const category of JOURNAL_CATEGORIES) {
    const hit = category.articles.find((a) => a.slug === slug);
    if (hit) return { article: hit, category };
  }
  return null;
}
