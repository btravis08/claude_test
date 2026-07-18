"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

/*
  Route-change cross-fade: the wrapper is keyed by pathname, so on
  navigation the old page content exits (fade out) while the new page
  enters (fade in) via the browser View Transitions API — the fixed
  chrome (nav, footer) never remounts and holds still. Animations live
  in globals.css (.page-exit / .page-enter).

  React's <ViewTransition> ships in the canary React that Next vendors
  for the App Router; the installed react types don't know it yet, so
  it's pulled off the namespace. Browsers without the API (and any
  React without the export) just swap instantly.
*/
const ViewTransition = (
  React as unknown as {
    ViewTransition?: React.ComponentType<{
      children: React.ReactNode;
      enter?: string;
      exit?: string;
      default?: string;
    }>;
  }
).ViewTransition;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!ViewTransition) return <>{children}</>;
  return (
    <ViewTransition key={pathname} enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
