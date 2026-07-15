import Link from "next/link";

const leftLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/projects?category=residential", label: "Residential" },
  { href: "/projects?category=commercial", label: "Commercial" },
];

const rightLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function NavLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`label group relative font-medium text-ink ${className}`}
    >
      {label}
      <span className="absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-ink transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
    </Link>
  );
}

export function SiteHeader({ companyName }: { companyName: string }) {
  return (
    <header className="sticky top-0 z-50 border-b-[1.5px] border-line-2 bg-surface">
      <div className="grid h-[60px] grid-cols-[1fr_auto_1fr] items-center px-6">
        <nav className="flex items-center gap-8">
          {leftLinks.map((link, i) => (
            <NavLink
              key={link.label}
              {...link}
              className={i > 0 ? "hidden sm:inline-block" : ""}
            />
          ))}
        </nav>
        <Link
          href="/"
          className="font-display text-title-sm tracking-tight text-ink"
        >
          {companyName}
        </Link>
        <nav className="flex items-center justify-end gap-8">
          {rightLinks.map((link) => (
            <NavLink key={link.label} {...link} />
          ))}
        </nav>
      </div>
    </header>
  );
}
