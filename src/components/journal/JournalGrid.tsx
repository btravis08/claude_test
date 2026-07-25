"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { JOURNAL_CATEGORIES } from "@/components/journal/articles";
import {
  HERO_READY_EVENT,
  setFieldEntry,
} from "@/components/journal/field-transition";

/*
  Alt journal landing: an infinite drag-anywhere masonry field.

  One fullscreen WebGL quad draws the whole grid: the fragment shader
  tiles world space into square cells (odd columns dropped half a
  stride, reference-style), picks each cell's image from a texture
  atlas with a stable hash, and leaves the gutters as the dark field.
  Because the grid is procedural it is endless in every direction —
  panning just moves one offset uniform.

  It never moves on its own: dragging pans it 1:1 (any pointer), a
  flick carries momentum that decays to rest. The "shader effect" is
  deliberately subtle — while the field is in motion the tiles lag a
  few pixels behind and split chromatically in proportion to
  velocity, settling clean the moment it stops.

  A click that didn't travel opens the article the tile belongs to
  (the same cell hash runs in JS for hit-testing).
*/

interface GridEntry {
  src: string;
  href: string;
}

/* one entry per unique image across the fake articles */
const ENTRIES: GridEntry[] = (() => {
  const seen = new Map<string, GridEntry>();
  for (const category of JOURNAL_CATEGORIES)
    for (const article of category.articles)
      for (const image of article.stream)
        if (!seen.has(image.src))
          seen.set(image.src, { src: image.src, href: `/journal/${article.slug}` });
  return [...seen.values()];
})();

const ATLAS_GRID = 4; // 4x4 atlas
const ATLAS_CELL = 512;
/* gap ≈ 0.62 of the tile, per the reference */
const DESKTOP_CELL = 240;
const MOBILE_CELL = 140;
const GAP_RATIO = 0.62;
const BG = 0.043; // near-black field (#0b0b0b)

/*
  Hand-rolled FLIP: an imperative overlay (plain DOM, so it survives
  the route change) expands the clicked tile's image from its rect to
  the full viewport with the house dramatic ease, holds while the
  article mounts its identical fullscreen hero underneath, then fades
  out over the same pixels.
*/
function launchFieldFlip(
  src: string,
  from: { left: number; top: number; width: number; height: number },
) {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    `position:fixed;left:${from.left}px;top:${from.top}px;` +
    `width:${from.width}px;height:${from.height}px;` +
    "z-index:80;overflow:hidden;pointer-events:none;background:#0b0b0b;";
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.style.cssText = "width:100%;height:100%;object-fit:cover;";
  wrap.appendChild(img);
  document.body.appendChild(wrap);

  const expand = wrap.animate(
    [
      {
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
      },
      /* px, not vh/svh — viewport units in WAAPI keyframes are shaky
         on older iOS */
      {
        left: "0px",
        top: "0px",
        width: `${window.innerWidth}px`,
        height: `${window.innerHeight}px`,
      },
    ],
    /* CSS twin of EASE_DRAMATIC */
    { duration: 750, easing: "cubic-bezier(0.85, 0, 0.15, 1)", fill: "forwards" },
  );

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.removeEventListener(HERO_READY_EVENT, onReady);
    const fade = wrap.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 350,
      fill: "forwards",
    });
    fade.onfinish = () => wrap.remove();
  };
  const onReady = () => {
    /* never fade before the expansion lands */
    expand.finished.then(() => setTimeout(finish, 80)).catch(finish);
  };
  window.addEventListener(HERO_READY_EVENT, onReady);
  /* failsafe: a failed navigation must not leave the screen covered */
  window.setTimeout(finish, 3000);
}

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform vec2 uOffset;
uniform vec2 uLag;
uniform vec2 uGrab;
uniform float uCell;
uniform float uStride;
uniform float uCount;
uniform vec2 uVel;
uniform sampler2D uTex;

float cellHash(vec2 cr) {
  return fract(sin(dot(cr, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 atlasUv(float idx, vec2 t) {
  vec2 cell = vec2(mod(idx, ${ATLAS_GRID}.0), floor(idx / ${ATLAS_GRID}.0));
  /* inset keeps warped samples inside the cell */
  return (cell + clamp(t, 0.015, 0.985)) / ${ATLAS_GRID}.0;
}

void main() {
  vec2 fragPx = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);

  /* elastic field: fragments near the grab point ride the live
     offset; the further out, the more they blend toward the spring's
     trailing offset — distant tiles drag into place a beat later.
     Stretch is capped well inside the gutter so tiles never tear. */
  float d = clamp(distance(fragPx, uGrab) / (0.75 * length(uRes)), 0.0, 1.0);
  float lagW = pow(smoothstep(0.0, 1.0, d), 1.3);
  vec2 stretch = (uLag - uOffset) * lagW;
  float maxS = (uStride - uCell) * 0.35;
  float sl = length(stretch);
  if (sl > maxS) stretch *= maxS / sl;

  vec2 p = fragPx + uOffset + stretch;
  float c = floor(p.x / uStride);
  float shifted = p.y + mod(c, 2.0) * uStride * 0.5;
  float r = floor(shifted / uStride);
  vec2 local = vec2(p.x - c * uStride, shifted - r * uStride);
  float pad = (uStride - uCell) * 0.5;
  vec2 t = (local - vec2(pad)) / uCell;

  vec3 col = vec3(${BG});
  if (t.x > 0.0 && t.x < 1.0 && t.y > 0.0 && t.y < 1.0) {
    /* lattice keeps neighbours distinct; block jitter breaks the
       periodicity so the field doesn't read as diagonal stripes */
    float jitter = floor(cellHash(floor(vec2(c, r) / 4.0)) * uCount);
    float idx = mod(c * 5.0 + r * 7.0 + jitter, uCount);
    /* cloth response: while the field moves, each image bows in the
       motion direction — the middle of the tile trails like fabric
       pulled by its edges, settling flat at rest */
    float speedN = clamp(length(uVel) / 3000.0, 0.0, 1.0);
    vec2 base = t * 0.94 + 0.03;
    if (speedN > 0.001) {
      vec2 dir = normalize(uVel);
      float bulge = 1.0 - 4.0 * dot(t - 0.5, t - 0.5);
      base += dir * (speedN * 0.05) * max(bulge, 0.0);
    }
    col = texture2D(uTex, atlasUv(idx, base)).rgb;
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

export function JournalGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return;

    /* ---------- program ---------- */
    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = (name: string) => gl.getUniformLocation(program, name);
    const uRes = U("uRes");
    const uOffset = U("uOffset");
    const uLag = U("uLag");
    const uGrab = U("uGrab");
    const uCell = U("uCell");
    const uStride = U("uStride");
    const uCount = U("uCount");
    const uVel = U("uVel");

    /* ---------- atlas: images cover-cropped into square cells ---------- */
    const atlas = document.createElement("canvas");
    atlas.width = atlas.height = ATLAS_GRID * ATLAS_CELL;
    const actx = atlas.getContext("2d")!;
    actx.fillStyle = "#161616";
    actx.fillRect(0, 0, atlas.width, atlas.height);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const uploadAtlas = () =>
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    uploadAtlas();

    let disposed = false;
    ENTRIES.forEach((entry, i) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (disposed) return;
        const s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2;
        const sy = (img.height - s) / 2;
        const cx = (i % ATLAS_GRID) * ATLAS_CELL;
        const cy = Math.floor(i / ATLAS_GRID) * ATLAS_CELL;
        actx.drawImage(img, sx, sy, s, s, cx, cy, ATLAS_CELL, ATLAS_CELL);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        uploadAtlas();
        requestRender();
      };
      img.src = entry.src;
    });

    /* ---------- pan state (CSS px; device px at draw time) ---------- */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cellCss = DESKTOP_CELL;
    const offset = { x: 0, y: 0 };
    /* the elastic trailing offset — a critically damped spring chasing
       offset; distant tiles render from it, so they ease into place */
    const lag = { x: 0, y: 0 };
    const lagVel = { x: 0, y: 0 };
    const SPRING_K = 90;
    const SPRING_C = 2 * Math.sqrt(SPRING_K);
    const grab = { x: 0, y: 0 }; // CSS px, last drag anchor
    const vel = { x: 0, y: 0 }; // px/s, released momentum
    const shownVel = { x: 0, y: 0 }; // eased copy driving the shader
    let dragging = false;
    let lastPointer = { x: 0, y: 0, t: 0 };
    let travelled = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cellCss = window.innerWidth < 768 ? MOBILE_CELL : DESKTOP_CELL;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      requestRender();
    };

    /* ---------- render loop: frames only while something moves ---------- */
    let raf = 0;
    let running = false;
    let lastT = 0;
    const draw = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uOffset, offset.x * dpr, offset.y * dpr);
      gl.uniform2f(
        uLag,
        (reduced ? offset.x : lag.x) * dpr,
        (reduced ? offset.y : lag.y) * dpr,
      );
      gl.uniform2f(uGrab, grab.x * dpr, grab.y * dpr);
      gl.uniform1f(uCell, cellCss * dpr);
      gl.uniform1f(uStride, cellCss * (1 + GAP_RATIO) * dpr);
      gl.uniform1f(uCount, ENTRIES.length);
      gl.uniform2f(
        uVel,
        reduced ? 0 : shownVel.x * dpr,
        reduced ? 0 : shownVel.y * dpr,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const step = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      if (!dragging) {
        /* momentum decays to rest — the field never moves on its own */
        const decay = Math.exp(-dt / 0.6);
        vel.x *= decay;
        vel.y *= decay;
        if (Math.hypot(vel.x, vel.y) < 4) vel.x = vel.y = 0;
        offset.x -= vel.x * dt;
        offset.y -= vel.y * dt;
      }
      /* critically damped spring: the lag layer chases the live
         offset on a smooth S-curve — the bezier feel of the settle */
      lagVel.x += (SPRING_K * (offset.x - lag.x) - SPRING_C * lagVel.x) * dt;
      lagVel.y += (SPRING_K * (offset.y - lag.y) - SPRING_C * lagVel.y) * dt;
      lag.x += lagVel.x * dt;
      lag.y += lagVel.y * dt;
      /* the shader's motion response eases after the real velocity */
      const k = 1 - Math.exp(-dt / 0.12);
      shownVel.x += (vel.x - shownVel.x) * k;
      shownVel.y += (vel.y - shownVel.y) * k;
      draw();
      const still =
        !dragging &&
        vel.x === 0 &&
        vel.y === 0 &&
        Math.hypot(shownVel.x, shownVel.y) < 2 &&
        Math.hypot(offset.x - lag.x, offset.y - lag.y) < 0.5;
      if (still) {
        shownVel.x = shownVel.y = 0;
        lag.x = offset.x;
        lag.y = offset.y;
        lagVel.x = lagVel.y = 0;
        draw();
        running = false;
        return;
      }
      raf = requestAnimationFrame(step);
    };
    const requestRender = () => {
      if (running) return;
      running = true;
      lastT = performance.now();
      raf = requestAnimationFrame(step);
    };

    /* ---------- input ---------- */
    const onDown = (e: PointerEvent) => {
      dragging = true;
      travelled = 0;
      vel.x = vel.y = 0;
      const rect = canvas.getBoundingClientRect();
      grab.x = e.clientX - rect.left;
      grab.y = e.clientY - rect.top;
      lastPointer = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      canvas.setPointerCapture(e.pointerId);
      requestRender();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      const dt = (e.timeStamp - lastPointer.t) / 1000;
      lastPointer = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      travelled += Math.hypot(dx, dy);
      offset.x -= dx;
      offset.y -= dy;
      if (dt > 0) {
        vel.x = vel.x * 0.7 + (dx / dt) * 0.3;
        vel.y = vel.y * 0.7 + (dy / dt) * 0.3;
      }
      requestRender();
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      /* a stale flick (finger paused) releases dead */
      if (e.timeStamp - lastPointer.t > 120) vel.x = vel.y = 0;
      if (reduced) vel.x = vel.y = 0;
      /* a press that never travelled is a click — open the tile's
         article (same cell math as the shader, in CSS px). Fingers
         wobble: a touch tap gets far more slop than a mouse click. */
      const slop = e.pointerType === "mouse" ? 6 : 16;
      if (travelled < slop) {
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left + offset.x;
        const py = e.clientY - rect.top + offset.y;
        const stride = cellCss * (1 + GAP_RATIO);
        const c = Math.floor(px / stride);
        const shifted = py + (((c % 2) + 2) % 2) * stride * 0.5;
        const r = Math.floor(shifted / stride);
        const pad = (stride - cellCss) / 2;
        const lx = px - c * stride - pad;
        const ly = shifted - r * stride - pad;
        if (lx > 0 && lx < cellCss && ly > 0 && ly < cellCss) {
          /* mirror of the shader's lattice + block-jitter cell hash */
          const n = ENTRIES.length;
          const bh =
            Math.sin(Math.floor(c / 4) * 127.1 + Math.floor(r / 4) * 311.7) *
            43758.5453;
          const jitter = Math.floor((bh - Math.floor(bh)) * n);
          const idx = ((((c * 5 + r * 7 + jitter) % n) + n) % n);
          const entry = ENTRIES[idx];
          const slug = entry.href.split("/").pop()!;
          /* FLIP the tile into the article's fullscreen hero (skipped
             under reduced motion — plain navigation instead). The
             overlay is decoration: it must never block navigation. */
          if (!reduced) {
            try {
              setFieldEntry({ slug, src: entry.src });
              const colShift = (((c % 2) + 2) % 2) * stride * 0.5;
              launchFieldFlip(entry.src, {
                left: rect.left + c * stride + pad - offset.x,
                top: rect.top + r * stride + pad - colShift - offset.y,
                width: cellCss,
                height: cellCss,
              });
            } catch {
              /* navigate plainly */
            }
          }
          router.push(entry.href);
        }
      }
      requestRender();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      gl.deleteTexture(tex);
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
    };
  }, [router]);

  return (
    <div
      data-mode="dark"
      /* pull the field under the fixed nav so it's a full-bleed canvas */
      className="relative -mt-[3.75rem] h-svh w-full overflow-hidden bg-[#0b0b0b] text-white"
    >
      <canvas
        ref={canvasRef}
        aria-label="Honors Journal image field — drag to explore, click a tile to open its article"
        className="size-full cursor-grab touch-none select-none active:cursor-grabbing"
      />
      {/* the same articles as real links, for keyboards and crawlers */}
      <ul className="sr-only">
        {ENTRIES.map((entry) => (
          <li key={entry.src}>
            <a href={entry.href}>{entry.href.split("/").pop()}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
