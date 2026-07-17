<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Sun Day Red (SDR) design library implementation

An e-commerce-style site implementing the Figma "[i] Design Library — SDR"
exactly: Next.js 16 (App Router, Turbopack) + Tailwind v4 + Sanity v6
embedded at /studio, with Motion (framer-motion) for interactions.

## Working agreements

- All work happens on branch `claude/sanity-github-app-setup-x49xa8`
  (repo btravis08/claude_test). Push to the same branch; never open a PR
  unless asked.
- Match the Figma design exactly — don't adapt or reinterpret it.
- Verify changes with `npm run build`, then drive the real page (in
  Claude's remote sandbox, Playwright with
  `executablePath: '/opt/pw-browsers/chromium'`) before pushing.

## Design source (Figma)

- File: `0IzKylxJcpsuACWsXu7gnu` ("[i] Design Library — SDR"), homepage
  design node `33581:41491` on the "↳ UI Page Designs" canvas.
- Read it through the official Figma MCP connector (claude.ai
  connectors). The account needs edit access on a Pro-or-better seat
  (rate limit ~200 tool calls/day, 15/min).
- Exported imagery lives in `public/figma/`. Claude's sandbox egress
  policy blocks figma.com, so new assets are fetched by the
  `fetch-figma-assets` GitHub Actions workflow (mint fresh URLs via the
  MCP `download_assets` tool, update `scripts/fetch-figma-assets.sh`,
  push — the workflow commits the files back).
- TODO — sync color variables from Figma: the `light-mid` / `dark-mid`
  blocks in `src/app/globals.css` are PROVISIONAL (derived, not read
  from the library). When a session has the Figma MCP connector (or
  the user uploads a variable CSV export: variable name + value per
  mode for the whole collection), replace all four mode blocks with
  the real values, wire up the unused tokens (`--btn-2-fg`,
  `--ink-disabled`), tokenize the hardcoded on-media UI colors
  (MediaBlock, meganav image card), and make the FullWidth/50-50 gap
  color (`bg-white`) mode-aware.

## Sanity CMS

- Project `alsdve2t`, dataset `production`, apiVersion 2026-07-01;
  config in `sanity.config.ts` / `sanity.cli.ts`, schema in
  `src/sanity/schemaTypes/`, GROQ in `src/sanity/lib/queries.ts`.
- Claude's sandbox CANNOT reach *.sanity.io (egress-blocked): pages
  render fallbacks during remote builds, and dataset writes must run on
  the user's machine: `npx sanity exec scripts/seed.ts --with-user-token`
  (idempotent: uploads imagery, creates 120 tagged products, rebuilds
  the "home" page).
- Content model: `page` documents are built from a reorderable
  `sections[]` array (hero, info slider, full width, carousel, 50/50,
  product slider, rich text). Every section has a `colorMode`
  (light/dark) matching the Figma variable modes. Full Width sections
  and 50/50 columns are media blocks (image / shop-the-look with
  product refs / click-to-play video / autoplay video); 50/50 carries
  a ratio (5:4, 1:1, flex = 100vh). New sections arrive pre-filled
  with lorem copy and a placeholder image resolved from the dataset by
  filename (sdr-placeholder.png).
- Commerce model (Shopify-shaped): `product` has status (only Active
  renders), vendor/productType/gender/tags/postedAt, pricing {price,
  compareAtPrice, costPerItem}, options (Color/Size), variants with
  SKU/barcode/tracked inventory + per-variant price overrides and the
  SDR colorway visuals (swatch, image, hoverImage), shipping, SEO, up
  to 6 images (first = card thumbnail, second = hover). `collection`
  is manual (ordered refs) or smart (whitelisted rules compiled to
  parameterized GROQ in `src/sanity/lib/commerce.ts`). `discount`
  mirrors Shopify (code/automatic × percentage/fixed/BOGO/free
  shipping, scheduling, minimums, usage limits); active automatic
  price discounts are applied to displayed card prices (best wins,
  original struck). `storeSettings` singleton = currency/locale +
  display toggles. Sliders source by tag, collection, or manual refs.
  The Studio desk mirrors the Shopify admin sidebar. `navigation`
  singleton = Shopify-style menu (items → dropdown layout: columns +
  collection-fed image card / product grid / image cards; links can
  reference collections); Navigation.tsx falls back to hardcoded
  defaults when the document is missing.
- GOTCHA: `tag` is a reserved Sanity fetch-option name — GROQ params
  use `$productTag`.

## Frontend architecture

- `src/app/globals.css` is the design-token source of truth: semantic
  vars flip per section via `data-mode="light|dark"` wrappers (never
  hardcode mode colors); fluid type interpolates between the Figma
  428px and 1440px frames via clamp() and freezes beyond; the root
  font-size grows past 1920px (`html { font-size: max(100%, 0.83333vw) }`)
  so every rem-based value zooms proportionally on large screens — keep
  layout values in rem (hairline borders stay px on purpose).
- `src/app/(site)/` holds the site routes inside the chrome
  (Navigation + SiteFooter); /studio deliberately renders bare.
- `src/components/home/sections.tsx` = presentational sections with
  Figma content as prop defaults; `SectionRenderer.tsx` maps Sanity
  sections to them; `SliderShell.tsx` = slider chrome (arrows move one
  card width and disable at the ends, MENS/WOMENS filter with staggered
  Motion fade, eased progress bar replacing the scrollbar, arrow-swap
  hover via `ArrowHover.tsx`).
- Slider cards are borderless: the track is a grid with 1px gaps
  (`gap-px`), cards are full-bleed (no horizontal padding), and the
  arrow/snap step measures consecutive slide offsetLefts so it
  includes the gap.
- Brand fonts are self-hosted from `src/fonts/` via next/font/local:
  Feature Deck (display serif, trial cut), Maison Neue Book 400 +
  Medium 500 (Medium carries the label style), Maison Neue Mono
  (unused by default; available through the `font-mono` utility).

## Local dev (user's machine)

Two terminals: one runs `npm run dev` (localhost:3000), the other runs
git/seeds. Restart the dev server after dependency or Sanity schema
changes. Node >= 22.12 required (Sanity CLI).
