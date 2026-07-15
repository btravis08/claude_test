# Prefab Company Website

A marketing site for a prefab construction company, built with:

- **[Next.js](https://nextjs.org)** (App Router, TypeScript, Tailwind CSS) — the website itself
- **[Sanity](https://www.sanity.io)** — headless CMS for projects and pages, with the Studio embedded at `/studio`
- **[Vercel](https://vercel.com)** — hosting and automatic deploys from GitHub

## Content model

Managed in Sanity Studio (`/studio`):

- **Project** — a build, tagged `residential` or `commercial`, with photos, location, square footage, beds/baths (residential), year completed, and a rich-text description. Mark a project as **featured** to show it on the home page.
- **Page** — generic pages like About and Contact. The slug becomes the URL (`about` → `/about`).
- **Site settings** — company name, tagline, and contact info shown in the header/footer. Create exactly one of these.

## One-time setup

### 1. Create a Sanity project

1. Sign up at [sanity.io](https://www.sanity.io) (free tier is plenty).
2. Create a new project at [sanity.io/manage](https://www.sanity.io/manage) and note the **project ID**.
3. In the project's **API → CORS origins**, add `http://localhost:3000` and your production URL (with *Allow credentials* checked, so the embedded Studio can log in).

### 2. Run locally

```bash
cp .env.local.example .env.local   # then paste in your project ID
npm install
npm run dev
```

- Site: [http://localhost:3000](http://localhost:3000)
- Studio (content editor): [http://localhost:3000/studio](http://localhost:3000/studio)

In the Studio, create a **Site settings** document, a couple of **Projects**, and **Pages** with slugs `about` and `contact`.

### 3. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and import this repository.
2. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` — your project ID
   - `NEXT_PUBLIC_SANITY_DATASET` — `production`
3. Deploy. Every push to the default branch redeploys automatically.
4. Add your Vercel URL to the Sanity CORS origins (step 1.3).

## Project structure

```
src/
  app/
    page.tsx                  Home (hero + featured projects)
    projects/page.tsx         All projects, filterable by category
    projects/[slug]/page.tsx  Project detail (stats, gallery, rich text)
    [slug]/page.tsx           CMS-driven pages (about, contact, ...)
    studio/[[...tool]]/       Embedded Sanity Studio
  components/                 Header, footer, project card
  sanity/
    schemaTypes/              Content model (project, page, siteSettings)
    lib/                      Client, image URLs, GROQ queries
sanity.config.ts              Studio configuration
```

Content changes in Sanity appear on the site within 60 seconds (ISR revalidation) — no redeploy needed.
