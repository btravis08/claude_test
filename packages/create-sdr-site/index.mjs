#!/usr/bin/env node
/**
 * create-sdr-site — scaffold a new project from this repo's skeleton.
 *
 *   node packages/create-sdr-site/index.mjs <target-dir>
 *
 * Asks what kind of site you're building (commerce / blog / projects),
 * copies the skeleton (excluding SDR-only content: the product
 * catalog, seed scripts, brand data), and writes a fresh
 * designops.config.json with your answers. v1 gates modules at
 * RUNTIME (Studio schema + desk hide unchosen modules); file-level
 * omission arrives with the import-seam cleanup (see
 * scaffold.manifest.json). Provisioning (Sanity project, GitHub,
 * Vercel) is printed as next steps rather than run for you.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const TEMPLATE_ROOT = path.resolve(HERE, "../..");

/* SDR-only content a new project must not inherit (sample packs
   replace it later; see scaffold.manifest.json "site-specific") */
const EXCLUDE = [
  ".git",
  "node_modules",
  ".next",
  "packages",
  "public/sdr",
  "public/figma",
  "design/sdr-catalog",
  "scripts/seed.ts",
  "scripts/seed-legacy.ts",
  "scripts/fetch-figma-assets.sh",
  "scripts/import-sdr-catalog.ts",
  "scripts/retire-lorem.ts",
  "scripts/wire-nav-collections.ts",
  "scripts/fix-catalog-ids.ts",
  "scripts/fetch-sdr-catalog.mjs",
  ".github/workflows/fetch-sdr-catalog.yml",
];

/* flags for non-interactive use:
   --name= --url= --commerce=y|n --blog=y|n --projects=y|n */
const flags = Object.fromEntries(
  process.argv
    .filter((a) => a.startsWith("--"))
    .map((a) => a.replace(/^--/, "").split("=")),
);
const interactive = !("name" in flags);

const rl = interactive
  ? readline.createInterface({ input: process.stdin, output: process.stdout })
  : null;
const ask = async (q, dflt) => {
  if (!interactive) return dflt;
  const a = (await rl.question(`${q}${dflt !== undefined ? ` (${dflt})` : ""}: `)).trim();
  return a || dflt;
};
const askBool = async (q, dflt) =>
  /^y/i.test(await ask(`${q} [y/n]`, dflt ? "y" : "n"));

const target = process.argv[2];
if (!target) {
  console.error("usage: create-sdr-site <target-dir>");
  process.exit(1);
}
const dest = path.resolve(target);
if (existsSync(dest)) {
  console.error(`refusing to scaffold into existing path: ${dest}`);
  process.exit(1);
}

const name = flags.name ?? (await ask("Site name", "My Site"));
const baseUrl = flags.url ?? (await ask("Production base URL", "https://example.vercel.app"));
const commerce = "commerce" in flags ? /^y/i.test(flags.commerce) : await askBool("E-commerce (products, collections, cart, search)?", true);
const blog = "blog" in flags ? /^y/i.test(flags.blog) : await askBool("Blog (posts, authors, categories)?", true);
const projects = "projects" in flags ? /^y/i.test(flags.projects) : await askBool("Projects / portfolio?", false);
rl?.close();

console.log(`\nScaffolding into ${dest} …`);
mkdirSync(dest, { recursive: true });
cpSync(TEMPLATE_ROOT, dest, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(TEMPLATE_ROOT, src);
    if (!rel) return true;
    return !EXCLUDE.some((ex) => rel === ex || rel.startsWith(`${ex}${path.sep}`));
  },
});

/* fresh designops config from the answers */
const cfgPath = path.join(dest, "designops.config.json");
const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
cfg.site.name = name;
cfg.site.baseUrl = baseUrl;
cfg.site.perfPages = [
  "/",
  ...(commerce ? ["/collections/shop-all"] : []),
  ...(blog ? ["/journal"] : []),
];
cfg.features = { commerce, blog, projects };
cfg.figma.fileKey = "REPLACE_WITH_YOUR_FIGMA_FILE_KEY";
writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`);

/* package identity */
const pkgPath = path.join(dest, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`
Done. Next steps (one-time logins assumed: sanity, gh, vercel):

  cd ${target}
  npm install
  npx sanity init --env        # creates the Sanity project + writes ids
  npm run dev                  # http://localhost:3000 (+ /studio)

  gh repo create ${pkg.name} --private --source . --push
  npx vercel link && npx vercel --prod

Notes
  - Modules you declined are hidden from the Studio via
    designops.config.json "features" — flip them on any time.
  - Replace figma.fileKey in designops.config.json to arm the
    design-drift + comp tooling; add FIGMA_TOKEN as a repo secret.
  - The SDR product catalog, brand imagery (public/figma, public/sdr)
    and seeds were not copied — pages fall back to broken image slots
    until you add your own media (a sample-pack seed is the planned
    replacement). design/figma-tokens ships as a working example;
    re-export it from your own Figma file.
`);
