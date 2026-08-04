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
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const TEMPLATE_ROOT = path.resolve(HERE, "../..");

/* scaffold.manifest.json is the copier spec: its "site-specific"
   paths (SDR content a new project must not inherit) and "packs"
   never ship; everything else does. Editing the manifest is the only
   place exclusions live — this file holds no duplicate list. */
const manifest = JSON.parse(
  readFileSync(path.join(TEMPLATE_ROOT, "scaffold.manifest.json"), "utf8"),
);
const ALWAYS_EXCLUDE = [".git", "node_modules", ".next", ".vercel", "sample-pack"];
const EXCLUDE_GLOBS = [
  ...ALWAYS_EXCLUDE,
  ...manifest["site-specific"].paths,
  ...manifest.packs.paths.map((g) => g.replace(/\/\*\*$/, "")),
  "packages",
];
const excluded = (rel) =>
  EXCLUDE_GLOBS.some((g) => {
    const base = g.endsWith("/**") ? g.slice(0, -3) : g;
    return rel === base || rel.startsWith(`${base}/`);
  });

/* sample packs: packs/<slug>/{pack.json,content.mjs,images/} */
const PACKS_DIR = path.join(HERE, "packs");
const PACK_NAMES = existsSync(PACKS_DIR)
  ? readdirSync(PACKS_DIR).filter((d) =>
      existsSync(path.join(PACKS_DIR, d, "pack.json")),
    )
  : [];

/* flags for non-interactive use:
   --name= --url= --pack=<slug>|none --commerce=y|n --blog=y|n --projects=y|n */
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
const packName =
  flags.pack ?? (await ask(`Sample pack (${[...PACK_NAMES, "none"].join(" / ")})`, "none"));
if (packName !== "none" && !PACK_NAMES.includes(packName)) {
  console.error(`unknown pack "${packName}" — available: ${PACK_NAMES.join(", ")} or none`);
  process.exit(1);
}
const pack =
  packName === "none"
    ? null
    : JSON.parse(readFileSync(path.join(PACKS_DIR, packName, "pack.json"), "utf8"));
/* a pack presets the modules; explicit answers/flags still win */
const commerce = "commerce" in flags ? /^y/i.test(flags.commerce) : await askBool("E-commerce (products, collections, cart, search)?", pack?.features.commerce ?? true);
const blog = "blog" in flags ? /^y/i.test(flags.blog) : await askBool("Blog (posts, authors, categories)?", pack?.features.blog ?? true);
const projects = "projects" in flags ? /^y/i.test(flags.projects) : await askBool("Projects / portfolio?", pack?.features.projects ?? false);
rl?.close();

console.log(`\nScaffolding into ${dest} …`);
mkdirSync(dest, { recursive: true });
cpSync(TEMPLATE_ROOT, dest, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(TEMPLATE_ROOT, src).split(path.sep).join("/");
    if (!rel) return true;
    return !excluded(rel);
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
  ...(projects ? ["/projects"] : []),
];
cfg.features = { commerce, blog, projects };
cfg.figma.fileKey = "REPLACE_WITH_YOUR_FIGMA_FILE_KEY";
writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`);

/* sample pack → <dest>/sample-pack (seeded later by scripts/seed-pack.ts) */
if (pack) {
  cpSync(path.join(PACKS_DIR, packName), path.join(dest, "sample-pack"), {
    recursive: true,
  });
  console.log(`Included sample pack: ${pack.title}`);
}

/* package identity */
const pkgPath = path.join(dest, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`
Done. Next steps (one-time logins assumed: sanity, gh, vercel):

  cd ${target}
  npm install
  npx sanity init --env        # creates the Sanity project + writes ids${
    pack
      ? `
  npx sanity exec scripts/seed-pack.ts --with-user-token
                               # loads the "${pack.title}" sample content`
      : ""
  }
  npm run dev                  # http://localhost:3000 (+ /studio)

  gh repo create ${pkg.name} --private --source . --push
  npx vercel link && npx vercel --prod

Notes
  - Modules you declined are hidden from the Studio via
    designops.config.json "features" — flip them on any time.
  - Replace figma.fileKey in designops.config.json to arm the
    design-drift + comp tooling; add FIGMA_TOKEN as a repo secret.
  - The SDR product catalog, brand imagery (public/figma, public/sdr)
    and seeds were not copied.${
      pack
        ? ` The sample pack's imagery is
    program-generated placeholder art owned by this project — replace
    it with your own as the site becomes real.`
        : ` Without a sample pack, pages
    render fallback content with empty image slots until you seed
    your own.`
    }
  - design/figma-tokens ships as a working example; re-export it from
    your own Figma file.
`);
