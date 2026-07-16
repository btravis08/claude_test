import { Navigation } from "@/components/Navigation";
import type { MenuItem, NavData, NavLink } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { navigationQuery } from "@/sanity/lib/queries";
import type { NavigationDoc, NavLinkDoc } from "@/sanity/types";
import type { SanityImageSource } from "@sanity/image-url";

function img(source: SanityImageSource | undefined | null, width = 1400) {
  if (!source) return undefined;
  try {
    return urlFor(source).width(width).url();
  } catch {
    return undefined;
  }
}

/* Resolve CMS links: a linked collection supplies the label fallback
   and routes to its collection page */
function toLink(link: NavLinkDoc): NavLink {
  const collectionUrl = link.collection?.slug
    ? `/collections/${link.collection.slug}`
    : undefined;
  return {
    label: link.label ?? link.collection?.title ?? "",
    url: (link.url && link.url !== "#" ? link.url : undefined) ?? collectionUrl ?? "#",
  };
}

function toNavData(doc: NavigationDoc | null): NavData | undefined {
  if (!doc?.items?.length) return undefined;
  const items: MenuItem[] = doc.items.map((item) => ({
    title: item.title ?? "",
    layout: item.layout ?? "columns",
    columns: item.columns?.map((column) => ({
      title: column.title ?? "",
      links: (column.links ?? []).map(toLink),
    })),
    products: (item.products ?? [])
      .filter((product) => Boolean(product?._id))
      .map((product) => ({
        title: product!.title ?? "",
        image: img(product!.hoverImage ?? product!.thumb, 900),
      })),
    cards: item.cards?.map((card) => ({
      title: card.title ?? "",
      image: img(card.image, 1100),
      url: card.url || "#",
    })),
    /* image card: collection first, overrides win */
    image: img(item.image, 1100) ?? img(item.imageCollection?.image, 1100),
    imageTitle: item.imageTitle ?? item.imageCollection?.title,
  }));
  return { items, company: (doc.companyLinks ?? []).map(toLink) };
}

/* SDR site chrome — wraps every site route, but not /studio */
export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navDoc = await sanityFetch<NavigationDoc | null>(navigationQuery, {}, null);

  return (
    <div className="relative flex min-h-svh flex-col">
      <Navigation data={toNavData(navDoc)} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
