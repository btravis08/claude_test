/**
 * Apparel-brand sample pack — a small but complete commerce dataset:
 * 20 products with colorway variants across four categories, smart
 * collections + a manual one, an automatic discount, search synonyms,
 * a mega-menu navigation, and a two-post journal.
 *
 * buildDocuments(img) returns the document list; img(filename)
 * resolves a file from this pack's images/ folder (uploaded first by
 * seed-pack.ts). Fixed dot-free _ids keep re-seeding idempotent.
 */

let keyCounter = 0;
const key = () => `pack${(keyCounter++).toString().padStart(3, "0")}`;
const ref = (id) => ({ _type: "reference", _ref: id });
const refk = (id) => ({ _type: "reference", _key: key(), _ref: id });
const block = (text, style = "normal") => ({
  _type: "block",
  _key: key(),
  style,
  markDefs: [],
  children: [{ _type: "span", _key: key(), marks: [], text }],
});

const COLORS = {
  ecru: { name: "Ecru", hex: "#e8e2d6" },
  ink: { name: "Ink", hex: "#26272b" },
  moss: { name: "Moss", hex: "#5a6650" },
  clay: { name: "Clay", hex: "#b0603f" },
  harbor: { name: "Harbor", hex: "#3f5668" },
  oat: { name: "Oat", hex: "#cfc4ae" },
  cherry: { name: "Cherry", hex: "#7d2a2e" },
  slate: { name: "Slate", hex: "#8a8f94" },
};

const SIZES = {
  tshirts: ["S", "M", "L", "XL"],
  hoodies: ["S", "M", "L", "XL"],
  headwear: ["OS"],
  pants: ["28", "30", "32", "34", "36"],
};
const TYPE_LABEL = {
  tshirts: "T-Shirts",
  hoodies: "Hoodies",
  headwear: "Headwear",
  pants: "Pants",
};

/* name, tag, price, colorways (order = images order) */
const PRODUCTS = [
  ["Atlas Tee", "tshirts", 48, ["ecru", "ink", "moss"]],
  ["Field Tee", "tshirts", 48, ["oat", "harbor"]],
  ["Meridian Tee", "tshirts", 52, ["ink", "slate", "cherry"]],
  ["Harbor Tee", "tshirts", 48, ["harbor", "ecru"]],
  ["Trace Tee", "tshirts", 55, ["moss", "oat", "ink", "clay"]],
  ["Standard Tee", "tshirts", 42, ["ecru", "slate"]],
  ["Summit Hoodie", "hoodies", 118, ["ink", "moss", "oat"]],
  ["Basin Pullover", "hoodies", 108, ["slate", "cherry"]],
  ["Ridge Hoodie", "hoodies", 124, ["harbor", "ecru", "ink"]],
  ["Coast Crewneck", "hoodies", 98, ["oat", "moss"]],
  ["Northline Hoodie", "hoodies", 128, ["cherry", "ink", "slate"]],
  ["Camp Cap", "headwear", 38, ["moss", "clay", "ink"]],
  ["Dune Cap", "headwear", 38, ["oat", "harbor"]],
  ["Wharf Beanie", "headwear", 34, ["ink", "cherry", "harbor"]],
  ["Trail Visor", "headwear", 32, ["ecru", "slate"]],
  ["Traverse Pant", "pants", 128, ["ink", "moss", "oat"]],
  ["Dockside Short", "pants", 78, ["oat", "harbor", "ecru"]],
  ["Granite Pant", "pants", 138, ["slate", "ink"]],
  ["Drift Jogger", "pants", 98, ["moss", "cherry"]],
  ["Anchor Chino", "pants", 118, ["clay", "harbor", "ink"]],
];

const POSTS = [
  {
    id: "post-fabric-guide",
    title: "A Short Guide to Our Fabrics",
    slug: "a-short-guide-to-our-fabrics",
    image: "post-01.jpg",
    excerpt:
      "What the fabric names on our labels actually mean, and how to keep each one alive for years.",
    body: [
      "Every garment we make lists its fabric on the inside seam label. Here is what those names mean in practice.",
      "Loopback cotton",
      "Our hoodies and crewnecks are loopback: smooth on the outside, unbrushed loops inside. It wears cooler than fleece and ages without pilling. Wash cold, hang dry.",
      "Garment-dyed jersey",
      "The tees are dyed after sewing, which is why each colorway has slight depth variations from piece to piece. That is the point — no two are identical.",
    ],
    bodyStyles: ["normal", "h2", "normal", "h2", "normal"],
  },
  {
    id: "post-dye-lots",
    title: "Behind the Dye Lots",
    slug: "behind-the-dye-lots",
    image: "post-02.jpg",
    excerpt:
      "Why this season's Clay is warmer than last season's, and why we let it drift.",
    body: [
      "Color names stay; the colors themselves move a little every season. Dye lots drift with water, temperature, and the cotton itself, and we stopped fighting it.",
      "Instead of forcing every batch to a lab standard, we approve each lot by eye against the last three seasons. The palette stays a family rather than a specification.",
    ],
    bodyStyles: ["normal", "normal"],
  },
];

export default function buildDocuments(img) {
  const imgk = (file) => ({ ...img(file), _key: key() });
  const colorImg = (c) => img(`color-${c}.jpg`);
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const BASE_DATE = Date.UTC(2026, 6, 1);

  const products = PRODUCTS.map(([title, tag, price, colorways], i) => {
    const id = `product-${slugify(title)}`;
    const variants = colorways.map((c, vi) => {
      const hoverC = colorways[(vi + 1) % colorways.length];
      return {
        _type: "productVariant",
        _key: key(),
        name: COLORS[c].name,
        color: COLORS[c].hex,
        image: { ...colorImg(c), _key: key() },
        hoverImage: { ...colorImg(hoverC), _key: key() },
        selectedOptions: [
          { _type: "selectedOption", _key: key(), option: "Color", value: COLORS[c].name },
        ],
        sku: `${slugify(title).slice(0, 3).toUpperCase()}-${String(i + 1).padStart(2, "0")}-${c.slice(0, 3).toUpperCase()}`,
        inventory: { track: true, quantity: 12 + ((i * 7 + vi * 11) % 60), continueSelling: false },
      };
    });
    return {
      _id: id,
      _type: "product",
      status: "active",
      title,
      slug: { _type: "slug", current: slugify(title) },
      vendor: "Meridian Supply",
      productType: TYPE_LABEL[tag],
      gender: i % 2 === 0 ? "mens" : "womens",
      tags: [tag],
      postedAt: new Date(BASE_DATE - i * 4 * 86400000).toISOString(),
      pricing: {
        price,
        ...(i % 5 === 4 ? { compareAtPrice: price + 20 } : {}),
        costPerItem: Math.round(price * 0.4),
        chargeTax: true,
      },
      options: [
        { _type: "productOption", _key: key(), name: "Color", values: colorways.map((c) => COLORS[c].name) },
        { _type: "productOption", _key: key(), name: "Size", values: SIZES[tag] },
      ],
      variants,
      shipping: { physical: true, weight: tag === "hoodies" ? 620 : 260, weightUnit: "g" },
      seo: { title, description: `${title} — Meridian Supply.` },
      images: [
        { ...colorImg(colorways[0]), _key: key() },
        { ...colorImg(colorways[1] ?? colorways[0]), _key: key() },
      ],
      description: [
        block(
          `The ${title} in garment-dyed ${TYPE_LABEL[tag].toLowerCase() === "headwear" ? "cotton twill" : "cotton"} — cut to wear in, not wear out. Shown in ${colorways.map((c) => COLORS[c].name).join(", ")}.`,
        ),
      ],
    };
  });

  const smartCol = (id, title, tag, extra = {}) => ({
    _id: id,
    _type: "collection",
    title,
    slug: { _type: "slug", current: id.replace("collection-", "") },
    description: `All ${title.toLowerCase()} — pulled in automatically.`,
    image: colorImg(tag === "headwear" ? "clay" : tag === "pants" ? "harbor" : tag === "hoodies" ? "moss" : "ecru"),
    type: "smart",
    match: "all",
    rules: [{ _type: "collectionRule", _key: key(), field: "tag", operator: "eq", value: tag }],
    sortOrder: "newest",
    parent: ref("collection-shop-all"),
    ...extra,
  });

  const collections = [
    {
      _id: "collection-shop-all",
      _type: "collection",
      title: "Shop All",
      slug: { _type: "slug", current: "shop-all" },
      description: "The whole line — tees, hoodies, headwear, and pants.",
      image: img("campaign-hero.jpg"),
      type: "smart",
      match: "all",
      rules: [],
      sortOrder: "newest",
      subcategories: ["tshirts", "hoodies", "headwear", "pants"].map((t) => refk(`collection-${t}`)),
    },
    smartCol("collection-tshirts", "T-Shirts", "tshirts"),
    smartCol("collection-hoodies", "Hoodies", "hoodies"),
    smartCol("collection-headwear", "Headwear", "headwear"),
    smartCol("collection-pants", "Pants", "pants"),
    {
      _id: "collection-new-arrivals",
      _type: "collection",
      title: "New Arrivals",
      slug: { _type: "slug", current: "new-arrivals" },
      description: "The latest drop, in the order we would wear it.",
      image: img("campaign-full.jpg"),
      type: "manual",
      products: [
        "product-atlas-tee",
        "product-summit-hoodie",
        "product-camp-cap",
        "product-traverse-pant",
        "product-meridian-tee",
        "product-northline-hoodie",
      ].map((id) => refk(id)),
      sortOrder: "manual",
    },
  ];

  const discount = {
    _id: "discount-hoodie-season",
    _type: "discount",
    title: "Hoodie Season",
    status: "active",
    method: "automatic",
    type: "percentage",
    value: 15,
    appliesTo: "collections",
    collections: [refk("collection-hoodies")],
    minimumRequirement: { type: "none" },
    combinesWith: { productDiscounts: false, shippingDiscounts: true },
    startsAt: new Date(Date.UTC(2026, 5, 1)).toISOString(),
  };

  const storeSettings = {
    _id: "storeSettings",
    _type: "storeSettings",
    currency: "USD",
    locale: "en-US",
    showCompareAt: true,
    applyAutomaticDiscounts: true,
    searchSynonyms: [
      { _type: "synonymGroup", _key: key(), terms: ["tee", "t-shirt", "tshirt", "shirt"] },
      { _type: "synonymGroup", _key: key(), terms: ["cap", "hat", "beanie", "headwear"] },
      { _type: "synonymGroup", _key: key(), terms: ["jogger", "chino", "pant", "trousers"] },
    ],
  };

  const author = {
    _id: "author-supply-desk",
    _type: "author",
    name: "The Supply Desk",
    role: "Meridian Supply editorial",
    bio: "Fabric notes, dye-lot diaries, and what we're wearing on the floor.",
  };

  const category = {
    _id: "post-category-journal",
    _type: "postCategory",
    title: "Journal",
    slug: { _type: "slug", current: "journal" },
    description: "Notes from the studio floor.",
  };

  const posts = POSTS.map((p, i) => ({
    _id: p.id,
    _type: "post",
    title: p.title,
    slug: { _type: "slug", current: p.slug },
    heroImage: img(p.image),
    excerpt: p.excerpt,
    body: p.body.map((text, j) => block(text, p.bodyStyles[j])),
    author: ref("author-supply-desk"),
    categories: [refk("post-category-journal")],
    publishedAt: new Date(Date.UTC(2026, 5, 10) + i * 18 * 86400000).toISOString(),
    featured: i === 0,
  }));

  const home = {
    _id: "page-home",
    _type: "page",
    title: "Homepage",
    slug: { _type: "slug", current: "home" },
    sections: [
      {
        _type: "sectionHero",
        _key: key(),
        colorMode: "dark",
        eyebrow: "Summer Drop 02",
        headline: "Garment-Dyed Standards",
        primaryCta: "Shop the Line",
        image: img("campaign-hero.jpg"),
      },
      {
        _type: "sectionInfoSlider",
        _key: key(),
        colorMode: "light",
        title: "Shop by Category",
        cards: [
          ["T-Shirts", "ecru"],
          ["Hoodies", "moss"],
          ["Headwear", "clay"],
          ["Pants", "harbor"],
        ].map(([title, c]) => ({
          _type: "infoCard",
          _key: key(),
          title,
          image: colorImg(c),
          mediaKind: "image",
        })),
      },
      {
        _type: "sectionProductSlider",
        _key: key(),
        colorMode: "light",
        title: "The Tee Wall",
        source: "auto",
        tag: "tshirts",
      },
      {
        _type: "sectionFullWidth",
        _key: key(),
        colorMode: "dark",
        eyebrow: "Lookbook",
        headline: "Color That Drifts",
        primaryCta: "Read the Dye-Lot Diary",
        image: img("campaign-full.jpg"),
        mediaKind: "look",
        lookProducts: [refk("product-summit-hoodie"), refk("product-traverse-pant")],
      },
      {
        _type: "sectionFiftyFifty",
        _key: key(),
        colorMode: "light",
        ratio: "5:4",
        panels: [
          { _type: "panel", _key: key(), image: img("lookbook.jpg"), mediaKind: "image" },
          {
            _type: "panel",
            _key: key(),
            mediaKind: "text",
            eyebrow: "The standard",
            body: "Twenty pieces, eight colors, no logos. Everything is garment-dyed, cut in one place, and meant to be worn until the color is yours.",
          },
        ],
      },
      {
        _type: "sectionProductSlider",
        _key: key(),
        colorMode: "light",
        title: "New Arrivals",
        source: "collection",
        collection: ref("collection-new-arrivals"),
      },
    ],
  };

  const navigation = {
    _id: "navigation",
    _type: "navigation",
    items: [
      {
        _type: "navItem",
        _key: key(),
        title: "Shop",
        layout: "columns",
        columns: [
          {
            _type: "navColumn",
            _key: key(),
            title: "Featured",
            links: [
              { _type: "navLink", _key: key(), label: "New Arrivals", url: "/collections/new-arrivals", collection: ref("collection-new-arrivals") },
              { _type: "navLink", _key: key(), label: "Shop All", url: "/collections/shop-all", collection: ref("collection-shop-all") },
            ],
          },
          {
            _type: "navColumn",
            _key: key(),
            title: "Categories",
            links: [
              ["T-Shirts", "tshirts"],
              ["Hoodies", "hoodies"],
              ["Headwear", "headwear"],
              ["Pants", "pants"],
            ].map(([label, t]) => ({
              _type: "navLink",
              _key: key(),
              label,
              url: `/collections/${t}`,
              collection: ref(`collection-${t}`),
            })),
          },
        ],
        imageCollection: ref("collection-shop-all"),
        imageTitle: "The Whole Line",
        image: img("campaign-hero.jpg"),
      },
      {
        _type: "navItem",
        _key: key(),
        title: "Essentials",
        layout: "products",
        columns: [
          {
            _type: "navColumn",
            _key: key(),
            title: "Essentials",
            links: [
              { _type: "navLink", _key: key(), label: "Tees", url: "/collections/tshirts" },
              { _type: "navLink", _key: key(), label: "Hoodies", url: "/collections/hoodies" },
            ],
          },
        ],
        products: [
          "product-atlas-tee",
          "product-standard-tee",
          "product-summit-hoodie",
          "product-coast-crewneck",
          "product-camp-cap",
          "product-traverse-pant",
        ].map((id) => refk(id)),
      },
      {
        _type: "navItem",
        _key: key(),
        title: "Stories",
        layout: "cards",
        cards: POSTS.map((p) => ({
          _type: "navCard",
          _key: key(),
          title: p.title,
          image: imgk(p.image),
          url: `/journal/${p.slug}`,
        })),
      },
    ],
    companyLinks: [
      { _type: "navLink", _key: key(), label: "Shop All", url: "/collections/shop-all" },
      { _type: "navLink", _key: key(), label: "Journal", url: "/journal" },
    ],
  };

  const siteSettings = {
    _id: "siteSettings",
    _type: "siteSettings",
    companyName: "Meridian Supply",
    tagline: "Garment-dyed standards",
    email: "hello@example.com",
    address: "88 Union Wharf\nSeattle, WA 98101",
  };

  return [
    ...products,
    ...collections,
    discount,
    storeSettings,
    author,
    category,
    ...posts,
    home,
    navigation,
    siteSettings,
  ];
}
