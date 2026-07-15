"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/Logo";
import { SearchMd } from "@/components/icons";

const leftLinks = ["Men", "Women", "Footwear", "Gear", "Collections", "Explore"];
const rightLinks = ["Account", "BAG [1]"];

function NavButton({ label }: { label: string }) {
  return (
    <a
      href="#"
      className="label group relative font-medium text-ink"
    >
      {label}
      <span className="absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-ink transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
    </a>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const overlay = pathname === "/";

  return (
    <header
      data-mode={overlay ? "dark" : "light"}
      className={`${
        overlay ? "absolute" : "sticky bg-surface"
      } top-0 z-50 w-full border-b-[1.5px] border-line-2 text-ink`}
    >
      <div className="flex h-[3.75rem] items-center px-6 py-3">
        <div className="flex flex-1 items-center gap-8">
          {leftLinks.map((label, i) => (
            <span key={label} className={i > 2 ? "hidden lg:inline-block" : ""}>
              <NavButton label={label} />
            </span>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-8">
          <a href="#" aria-label="Search" className="text-ink">
            <SearchMd />
          </a>
          {rightLinks.map((label) => (
            <span key={label} className="hidden sm:inline-block">
              <NavButton label={label} />
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
