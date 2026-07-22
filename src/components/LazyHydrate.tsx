"use client";

import { useEffect, useRef, useState } from "react";

/*
  Defers hydration of below-fold sections: the server HTML is left
  untouched (dangerouslySetInnerHTML makes React adopt the existing
  DOM without reconciling it), and the real client tree mounts when
  the section approaches the viewport. Startup JS cost then scales
  with what's on screen, not with the whole page.

  Trade-off: on activation the subtree remounts, so enter animations
  run then — which is exactly when these sections' in-view animations
  are meant to fire anyway.
*/
export function LazyHydrate({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setLive(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLive(true);
          io.disconnect();
        }
      },
      /* activate well before arrival so animations are ready */
      { rootMargin: "150% 0%" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (typeof window === "undefined" || live) {
    return (
      <div ref={ref} className="w-full">
        {children}
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className="w-full"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: "" }}
    />
  );
}
