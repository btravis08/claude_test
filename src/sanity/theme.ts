import { defaultTheme } from "sanity";
import type { StudioTheme } from "sanity";

/*
  Studio theme: the default Sanity theme with BOTH color schemes —
  the earlier buildLegacyTheme() monochrome pass overrode the color
  system for both schemes at once, which broke the Studio's
  appearance toggle (dark mode effectively disappeared).

  This keeps the default light scheme untouched and rebuilds the
  DARK scheme with desaturated colors only: every color in the dark
  subtree is pulled toward gray (saturation cut to 15%), so dark
  mode reads as the brand's monochrome system — differences carry
  through lightness, not chroma.
*/

const HEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8}|[0-9a-fA-F]{3,4})$/;

function hexToRgb(hex: string): [number, number, number, string] {
  let h = hex.slice(1);
  let alpha = "";
  if (h.length === 3 || h.length === 4) {
    if (h.length === 4) alpha = h[3] + h[3];
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  } else if (h.length === 8) {
    alpha = h.slice(6);
    h = h.slice(0, 6);
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    alpha,
  ];
}

function desaturate(hex: string, keep = 0.15): string {
  const [r, g, b, alpha] = hexToRgb(hex);
  /* toward the luma gray of the same color */
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const mix = (c: number) => Math.round(l + (c - l) * keep);
  const to2 = (c: number) => c.toString(16).padStart(2, "0");
  return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}${alpha}`;
}

/* Rebuild the theme object, transforming color strings only inside
   "dark" subtrees. Plain objects/arrays are copied; anything else
   (functions, class instances) passes through by reference. */
function transform<T>(value: T, inDark: boolean): T {
  if (typeof value === "string") {
    return (HEX.test(value) && inDark ? desaturate(value) : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => transform(item, inDark)) as T;
  }
  if (
    value &&
    typeof value === "object" &&
    (value as object).constructor === Object
  ) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = transform(child, inDark || key === "dark");
    }
    return out as T;
  }
  return value;
}

export const theme: StudioTheme = transform(defaultTheme, false);
