import Link from "next/link";

/*
  Internal hrefs ride next/link so navigation stays client-side (the
  chrome never remounts and the page content can transition); hashes,
  external URLs, and placeholder "#" links stay plain anchors.
*/
export function SmartLink({
  href = "#",
  ...props
}: Omit<React.ComponentProps<"a">, "href"> & { href?: string }) {
  if (href.startsWith("/")) return <Link href={href} {...props} />;
  return <a href={href} {...props} />;
}
