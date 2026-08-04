import { defaultTheme } from "sanity";
import type { StudioTheme } from "sanity";

/*
  Studio theme: the default Sanity theme re-branded to the dashboard
  reference (2026-08-03) by a generic hue remap over every color in
  BOTH schemes — the appearance toggle keeps working:

  - Sanity's blue/violet brand hues (focus rings, buttons, links,
    selected states) → SDR orange, keeping each color's lightness so
    contrast relationships survive.
  - Near-grays → warm neutrals (the reference's paper/charcoal cast).
  - Semantic colors (critical red, positive green, caution yellow)
    keep their hues — they're meaning, not brand.

  Custom tool panes are plain @sanity/ui components, so this theme
  reaches them too — one look everywhere.
*/

const HEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8}|[0-9a-fA-F]{3,4})$/;

const BRAND_HUE = 19; /* SDR orange (#f2622e) */
const WARM_HUE = 40; /* paper/charcoal warm cast */

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

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number, alpha: string): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const to2 = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to2(rgb[0])}${to2(rgb[1])}${to2(rgb[2])}${alpha}`;
}

function rebrand(hex: string): string {
  const [r, g, b, alpha] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  /* Sanity's brand blues and violets → SDR orange */
  if (s > 0.2 && h >= 190 && h <= 290) {
    return hslToHex(BRAND_HUE, Math.min(0.85, s), l, alpha);
  }
  /* near-grays → warm neutrals */
  if (s < 0.12) {
    return hslToHex(WARM_HUE, Math.min(0.07, s + 0.045), l, alpha);
  }
  /* semantic colors keep their hue */
  return hex;
}

/* Rebuild the theme object, transforming color strings everywhere.
   Plain objects/arrays are copied; anything else (functions, class
   instances) passes through by reference. */
function transform<T>(value: T): T {
  if (typeof value === "string") {
    return (HEX.test(value) ? rebrand(value) : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => transform(item)) as T;
  }
  if (
    value &&
    typeof value === "object" &&
    (value as object).constructor === Object
  ) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = transform(child);
    }
    return out as T;
  }
  return value;
}

export const theme: StudioTheme = transform(defaultTheme);
