"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import tokens from "@/design/tokens.site.json";

/*
  Token inspector — Figma Dev Mode for the running site.

  Hover any element and the panel names the tokens behind what you're
  looking at: the section's color mode, the semantic color vars for
  its surface and ink, the type style (with line-height and tracking),
  the spacing steps behind its padding and gaps, and its radius.
  Values that match no token are flagged "off-token" — the whole point
  is that drift is visible.

  Resolution is measured, not guessed: on mount, hidden probes read
  every token's computed value at the current viewport (clamp() type
  and rem spacing resolve to real px; every color resolves per mode),
  then computed styles are matched back against those tables.

  Toggle with Alt+T, or load any page with ?inspect=1. Click to pin a
  reading, Esc to unpin. Never loads for ordinary visitors — the gate
  only imports this chunk once inspection is switched on.
*/

const PANEL_W = 300;

type Match = { token: string | null; value: string };

interface Readout {
  tag: string;
  mode: string;
  size: string;
  color: Match;
  background: Match;
  font: Match;
  type: Match & { lineHeight?: string; letterSpacing?: string };
  padding: Match[];
  gap: Match[];
  radius: Match;
}

/* ---- token resolution tables, measured in the live document ---- */

interface Tables {
  /* mode → normalized css color → token var; a color is only named
     from the mode the element actually sits in (white is --ink in
     dark and --btn-fg in light — the mode decides which is true) */
  color: Map<string, Map<string, string>>;
  /* px → spacing token name */
  spacing: Map<number, string>;
  /* px → type token name + its metrics */
  type: Map<number, { name: string; lineHeight?: string; letterSpacing?: string }>;
  radius: Map<number, string>;
  font: Map<string, string>;
}

function buildTables(): Tables {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;left:-9999px;top:-9999px;width:0;height:0;pointer-events:none;visibility:hidden";
  document.body.appendChild(probe);

  /* browsers normalize any color to rgb()/rgba() on read-back */
  const norm = (raw: string) => {
    if (!raw) return "";
    probe.style.color = "";
    probe.style.color = raw.trim();
    const out = getComputedStyle(probe).color;
    probe.style.color = "";
    return out;
  };
  const px = (raw: string) => {
    probe.style.width = "";
    probe.style.width = raw.trim();
    const out = parseFloat(getComputedStyle(probe).width);
    probe.style.width = "";
    return Number.isFinite(out) ? Math.round(out * 100) / 100 : NaN;
  };

  const color = new Map<string, Map<string, string>>();
  /* every semantic var, resolved inside each section mode */
  for (const mode of tokens.modes) {
    const modeProbe = document.createElement("div");
    modeProbe.setAttribute("data-mode", mode);
    modeProbe.style.cssText = "position:fixed;left:-9999px;top:-9999px;visibility:hidden";
    document.body.appendChild(modeProbe);
    const cs = getComputedStyle(modeProbe);
    const forMode = new Map<string, string>();
    for (const t of tokens.semantic) {
      const raw = cs.getPropertyValue(t.path).trim();
      if (!raw) continue;
      const key = norm(raw);
      if (key && !forMode.has(key)) forMode.set(key, t.path);
    }
    color.set(mode, forMode);
    modeProbe.remove();
  }

  const spacing = new Map<number, string>();
  for (const t of tokens.spacing) {
    const v = px(t.value);
    if (Number.isFinite(v) && !spacing.has(v)) spacing.set(v, t.name);
  }

  const type = new Map<number, { name: string; lineHeight?: string; letterSpacing?: string }>();
  for (const t of tokens.type) {
    const v = px(t.value);
    if (Number.isFinite(v) && !type.has(v)) {
      type.set(v, {
        name: t.name,
        lineHeight: t.detail?.lineHeight,
        letterSpacing: t.detail?.letterSpacing,
      });
    }
  }

  const radius = new Map<number, string>();
  for (const t of tokens.radius) {
    const v = px(t.value);
    if (Number.isFinite(v) && !radius.has(v)) radius.set(v, t.name);
  }

  const font = new Map<string, string>();
  for (const t of tokens.fonts) {
    /* the var resolves to the next/font family stack */
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(t.value.replace(/^var\(|\)$/g, ""))
      .trim();
    const first = (raw || t.value).split(",")[0].replace(/['"]/g, "").trim();
    if (first) font.set(first.toLowerCase(), t.name);
  }

  probe.remove();
  return { color, spacing, type, radius, font };
}

/* ---- matching ---- */

const TRANSPARENT = /rgba\(0, 0, 0, 0\)|transparent/;

const near = (map: Map<number, string>, v: number) => {
  for (const [k, name] of map) if (Math.abs(k - v) <= 0.6) return name;
  return null;
};

function read(el: Element, t: Tables): Readout {
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const mode = el.closest("[data-mode]")?.getAttribute("data-mode") ?? "—";

  /* name the color from the element's own mode; if it only matches
     some other mode, say so rather than claiming the wrong token */
  const colorOf = (raw: string): Match => {
    const own = t.color.get(mode)?.get(raw);
    if (own) return { token: own, value: raw };
    for (const [m, table] of t.color) {
      const hit = table.get(raw);
      if (hit) return { token: `${hit} · ${m} mode`, value: raw };
    }
    return { token: null, value: raw };
  };

  const spacingOf = (raw: string): Match => {
    const v = parseFloat(raw);
    if (!Number.isFinite(v)) return { token: null, value: raw };
    if (v === 0) return { token: "0", value: "0" };
    return { token: near(t.spacing, v), value: `${Math.round(v * 100) / 100}px` };
  };

  const fontSize = parseFloat(cs.fontSize);
  const typeHit = (() => {
    for (const [k, meta] of t.type) if (Math.abs(k - fontSize) <= 0.6) return meta;
    return null;
  })();

  const family = cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim().toLowerCase();
  const bg = cs.backgroundColor;

  return {
    tag:
      el.tagName.toLowerCase() +
      (el.getAttribute("data-mode") ? `[data-mode="${el.getAttribute("data-mode")}"]` : ""),
    mode,
    size: `${Math.round(rect.width)} × ${Math.round(rect.height)}`,
    color: colorOf(cs.color),
    background: TRANSPARENT.test(bg)
      ? { token: "—", value: "transparent" }
      : colorOf(bg),
    font: { token: t.font.get(family) ?? null, value: cs.fontFamily.split(",")[0] },
    type: {
      token: typeHit?.name ?? null,
      value: `${Math.round(fontSize * 100) / 100}px`,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
    },
    padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(
      spacingOf,
    ),
    gap: cs.display.includes("flex") || cs.display.includes("grid")
      ? [cs.rowGap, cs.columnGap].filter((g) => g && g !== "normal").map(spacingOf)
      : [],
    radius: (() => {
      const v = parseFloat(cs.borderTopLeftRadius);
      if (!Number.isFinite(v) || v === 0) return { token: "—", value: "0" };
      return { token: near(t.radius, v), value: `${v}px` };
    })(),
  };
}

/* ---- presentation ---- */

const S = {
  panel: {
    position: "fixed" as const,
    zIndex: 2147483647,
    width: PANEL_W,
    background: "#111",
    color: "#eee",
    font: '11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
    borderRadius: 6,
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
    overflow: "hidden",
  },
  row: {
    display: "flex",
    gap: 8,
    padding: "3px 10px",
    alignItems: "baseline" as const,
  },
  key: { color: "#7b7b7b", width: 62, flex: "none" as const },
  val: { color: "#eee", wordBreak: "break-all" as const, flex: 1 },
  /* monochrome: a token hit reads bright, a miss inverts to a chip —
     loud without spending a hue */
  hit: { color: "#fff", fontWeight: 600 },
  miss: {
    background: "#fff",
    color: "#111",
    fontWeight: 600,
    padding: "0 4px",
    borderRadius: 2,
  },
};

function Line({ label, m }: { label: string; m: Match }) {
  const ok = m.token && m.token !== "—";
  return (
    <div style={S.row}>
      <span style={S.key}>{label}</span>
      <span style={S.val}>
        <span style={ok ? S.hit : m.token === "—" ? S.key : S.miss}>
          {ok ? m.token : m.token === "—" ? "—" : "off-token"}
        </span>
        {m.token !== "—" && <span style={{ color: "#7b7b7b" }}>{`  ${m.value}`}</span>}
      </span>
    </div>
  );
}

export default function TokenInspector({ onExit }: { onExit: () => void }) {
  const [tables, setTables] = useState<Tables | null>(null);
  const [readout, setReadout] = useState<Readout | null>(null);
  const [box, setBox] = useState<DOMRect | null>(null);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const raf = useRef(0);

  /* probes need the fonts and mode blocks in place */
  useEffect(() => {
    const build = () => setTables(buildTables());
    if (typeof window.requestIdleCallback === "function") {
      const h = window.requestIdleCallback(build);
      return () => window.cancelIdleCallback(h);
    }
    const h = window.setTimeout(build, 50);
    return () => window.clearTimeout(h);
  }, []);

  /* re-measure the clamp()-driven tables when the viewport changes */
  useEffect(() => {
    if (!tables) return;
    const onResize = () => setTables(buildTables());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [tables]);

  const sample = useCallback(
    (x: number, y: number) => {
      if (!tables || pinned) return;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const el = document.elementFromPoint(x, y);
        if (!el || el === document.documentElement || el === document.body) return;
        setReadout(read(el, tables));
        setBox(el.getBoundingClientRect());
        /* keep the panel opposite the cursor's half of the screen */
        setPos({
          x: x > window.innerWidth - PANEL_W - 40 ? 16 : window.innerWidth - PANEL_W - 16,
          y: 16,
        });
      });
    },
    [tables, pinned],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => sample(e.clientX, e.clientY);
    const onClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPinned((v) => !v);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pinned) setPinned(false);
        else onExit();
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf.current);
    };
  }, [sample, pinned, onExit]);

  /* padding bands, drawn inside the element's box like Dev Mode */
  const bands = useMemo(() => {
    if (!box || !readout) return null;
    const [t, r, b, l] = readout.padding.map((p) => parseFloat(p.value) || 0);
    return { t, r, b, l };
  }, [box, readout]);

  return (
    <>
      {/* element outline + padding shading */}
      {box && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            outline: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.55)",
            background: "rgba(255,255,255,0.06)",
            zIndex: 2147483646,
            pointerEvents: "none",
          }}
        >
          {bands &&
            (["t", "r", "b", "l"] as const).map((side) => {
              const v = bands[side];
              if (!v) return null;
              const common = {
                position: "absolute" as const,
                background:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0 3px, rgba(255,255,255,0.06) 3px 6px)",
              };
              const style =
                side === "t"
                  ? { ...common, left: 0, right: 0, top: 0, height: v }
                  : side === "b"
                    ? { ...common, left: 0, right: 0, bottom: 0, height: v }
                    : side === "l"
                      ? { ...common, top: 0, bottom: 0, left: 0, width: v }
                      : { ...common, top: 0, bottom: 0, right: 0, width: v };
              return <div key={side} style={style} />;
            })}
        </div>
      )}

      {/* readout */}
      <div style={{ ...S.panel, left: pos.x, top: pos.y }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            background: pinned ? "#3a3a3a" : "#1c1c1c",
            borderBottom: "1px solid #2a2a2a",
          }}
        >
          <strong style={{ fontWeight: 600, letterSpacing: "0.04em" }}>TOKENS</strong>
          <span style={{ color: "#7b7b7b", flex: 1 }}>
            {pinned ? "pinned · click to release" : "hover · click to pin"}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExit();
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#7b7b7b",
              cursor: "pointer",
              font: "inherit",
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {!tables ? (
          <div style={{ ...S.row, color: "#7b7b7b" }}>measuring tokens…</div>
        ) : !readout ? (
          <div style={{ ...S.row, color: "#7b7b7b" }}>hover any element</div>
        ) : (
          <div style={{ padding: "6px 0" }}>
            <div style={{ ...S.row, color: "#fff" }}>
              <span style={S.key}>element</span>
              <span style={S.val}>
                {readout.tag}
                <span style={{ color: "#7b7b7b" }}>{`  ${readout.size}`}</span>
              </span>
            </div>
            <div style={S.row}>
              <span style={S.key}>mode</span>
              <span style={{ ...S.val, color: "#fff", fontWeight: 600 }}>
                {readout.mode}
              </span>
            </div>

            <Divider label="COLOR" />
            <Line label="surface" m={readout.background} />
            <Line label="ink" m={readout.color} />

            <Divider label="TYPE" />
            <Line label="style" m={readout.type} />
            <div style={S.row}>
              <span style={S.key}>metrics</span>
              <span style={{ ...S.val, color: "#7b7b7b" }}>
                {`lh ${readout.type.lineHeight} · ls ${readout.type.letterSpacing}`}
              </span>
            </div>
            <Line label="family" m={readout.font} />

            <Divider label="SPACING" />
            {(["padding-t", "padding-r", "padding-b", "padding-l"] as const).map(
              (label, i) =>
                readout.padding[i].value !== "0" ? (
                  <Line key={label} label={label} m={readout.padding[i]} />
                ) : null,
            )}
            {readout.gap.map((g, i) => (
              <Line key={`gap${i}`} label={i === 0 ? "row-gap" : "col-gap"} m={g} />
            ))}
            {readout.padding.every((p) => p.value === "0") && !readout.gap.length && (
              <div style={{ ...S.row, color: "#7b7b7b" }}>
                <span style={S.key}>—</span>
                <span style={S.val}>no padding or gap</span>
              </div>
            )}

            <Divider label="SHAPE" />
            <Line label="radius" m={readout.radius} />
          </div>
        )}
      </div>
    </>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div
      style={{
        margin: "6px 10px 3px",
        paddingTop: 6,
        borderTop: "1px solid #2a2a2a",
        color: "#5a5a5a",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </div>
  );
}
