import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";

/* SDR site chrome — wraps every site route, but not /studio */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-svh flex-col">
      <Navigation />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
