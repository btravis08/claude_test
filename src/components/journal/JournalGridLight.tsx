"use client";

import { m } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ENTRIES, flipToArticle } from "@/components/journal/field-flip";
import { PhotoHeader } from "@/components/journal/PhotoHeader";
import { EASE_OUT } from "@/lib/motion";

/*
  Alt journal landing v2 — after photoyoshi.com: a cream field of
  small, natural-ratio thumbnails on an airy uniform lattice. Every
  tile sits ghosted (grayscale, faded almost into the ground); the
  cursor carries a soft spotlight that brings nearby tiles up to full
  color. On touch there is no cursor, so a horizontal band around the
  viewport's center does the revealing as you scroll.

  The field scrolls vertically (wheel, or touch drag with momentum
  decaying to rest — it never moves on its own) and is endless: one
  fullscreen WebGL quad tiles world space procedurally, each cell
  keeping its image's natural aspect (baked into the atlas as a
  contain-fit over the cream ground) at a per-cell size jitter so the
  lattice reads organic, like the reference. While scrolling, rows bow
  toward the screen edges in proportion to velocity — the reference's
  lens-bend — settling straight at rest.

  A click that didn't travel FLIPs the tile into its article, same as
  the dark field.
*/

const ATLAS_GRID = 4;
const ATLAS_CELL = 512;
/* airy lattice: small tiles, wide gutters (photoyoshi ~8 cols/1440) */
const DESKTOP_STRIDE = 180;
const MOBILE_STRIDE = 132;
/* the largest a tile's long edge gets, as a fraction of stride */
const TILE_MAX = 0.78;
/* the reference's exact ground: rgb(241, 239, 231) */
const CREAM = "#f1efe7";
/* the intro must breathe even on a warm cache */
const INTRO_MIN_MS = 2300;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uScroll;
uniform float uVel;
uniform vec2 uFocus;
uniform float uTouchMode;
uniform float uStride;
uniform float uCount;
uniform sampler2D uTex;

const vec3 CREAM = vec3(0.9451, 0.9373, 0.9059);

vec2 atlasUv(float idx, vec2 t) {
  vec2 cell = vec2(mod(idx, ${ATLAS_GRID}.0), floor(idx / ${ATLAS_GRID}.0));
  return (cell + clamp(t, 0.002, 0.998)) / ${ATLAS_GRID}.0;
}

void main() {
  vec2 fragPx = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);

  /* the reference's lens bend: while scrolling, rows bow at the
     screen edges in proportion to velocity, settling flat at rest */
  float xn = fragPx.x / uRes.x - 0.5;
  float bend = xn * xn * 4.0 * clamp(uVel / 2600.0, -1.0, 1.0) * 90.0;

  vec2 p = vec2(fragPx.x, fragPx.y + uScroll + bend);
  float c = floor(p.x / uStride);
  float r = floor(p.y / uStride);
  vec2 local = p - vec2(c, r) * uStride;

  /* per-cell size jitter (integer arithmetic — the JS hit-test must
     agree exactly) */
  float sj = mod(c * 31.0 + r * 47.0 + c * r * 13.0, 5.0);
  float scale = 0.55 + 0.1125 * sj; /* 0.55 .. 1.0 of TILE_MAX */
  float side = uStride * ${TILE_MAX} * scale;
  vec2 pad = vec2((uStride - side) * 0.5);
  vec2 t = (local - pad) / side;

  vec3 col = CREAM;
  if (t.x > 0.0 && t.x < 1.0 && t.y > 0.0 && t.y < 1.0) {
    vec2 b = floor(vec2(c, r) / 4.0);
    float jitter = mod(b.x * 13.0 + b.y * 29.0 + b.x * b.y * 7.0, uCount);
    float idx = mod(c * 5.0 + r * 7.0 + jitter, uCount);
    vec3 photo = texture2D(uTex, atlasUv(idx, t)).rgb;

    /* spotlight: radial around the cursor; a center band on touch */
    float focus;
    if (uTouchMode > 0.5) {
      float dy = abs(fragPx.y - uRes.y * 0.45);
      focus = 1.0 - smoothstep(uRes.y * 0.12, uRes.y * 0.34, dy);
    } else {
      float dd = distance(fragPx, uFocus);
      focus = 1.0 - smoothstep(120.0, 420.0, dd);
    }

    /* ghost state: grayscale sunk almost into the cream */
    float g = dot(photo, vec3(0.299, 0.587, 0.114));
    vec3 ghost = mix(CREAM, vec3(g), 0.16);
    col = mix(ghost, photo, focus);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

/* the reference's preloader: giant wordmark over the cream, a small
   photo slowly zooming at center, +marks at the edges, a caption, a
   house label bottom left, and the load counter bottom right. When
   the count lands the wordmark rolls up and the field fades in. */
function Intro({ progress, done }: { progress: number; done: boolean }) {
  /* state-driven zoom — mount animations are suppressed under the
     page transition's presence context */
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setZoomed(true), 60);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div
      aria-hidden
      className={`absolute inset-0 z-[60] bg-[#f1efe7] text-[#252726] transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* photo, dead center, breathing outward through the sequence */}
      <div className="absolute left-1/2 top-1/2 w-[7.5rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden md:w-[8.5rem]">
        <m.img
          src="/figma/journal/hero-01.jpg"
          alt=""
          initial={false}
          animate={{ scale: zoomed ? 1.22 : 1 }}
          transition={{ duration: 3.4, ease: [...EASE_OUT] }}
          className="aspect-[2/3] w-full object-cover"
        />
      </div>
      {/* wordmark: rolls out through a mask when the count lands */}
      <div className="absolute inset-x-0 top-[30%] overflow-hidden">
        <div
          className={`whitespace-nowrap text-center font-medium leading-[0.94] tracking-[-0.03em] text-[10.4vw] transition-transform duration-[900ms] ease-[cubic-bezier(0.85,0,0.15,1)] ${
            done ? "-translate-y-[112%]" : "translate-y-0"
          }`}
          style={{ WebkitTextStroke: "0.032em #252726" }}
        >
          HONORS JOURNAL
        </div>
      </div>
      {/* edge marks */}
      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[0.625rem]">+</span>
      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[0.625rem]">+</span>
      {/* caption */}
      <p className="absolute inset-x-0 bottom-14 mx-auto max-w-[24rem] text-center text-[0.625rem] font-medium leading-[1.5]">
        The Honors Journal is the field notes of Sun Day Red — a word that
        combines &ldquo;honors&rdquo; and &ldquo;journal.&rdquo;
      </p>
      {/* house label + live counter */}
      <p className="absolute bottom-6 left-6 text-[0.625rem] font-medium">
        HONORS JOURNAL&nbsp;|*|&nbsp;SUN DAY RED
      </p>
      <p className="absolute bottom-6 right-6 text-[0.8125rem] font-medium tabular-nums">
        {Math.min(progress, 100)}
      </p>
    </div>
  );
}

export function JournalGridLight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /* atlas load percentage drives the intro counter */
  const [progress, setProgress] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const mountAt = useRef(0);
  const router = useRouter();

  /* the intro ends when the counter lands AND it has breathed */
  useEffect(() => {
    if (progress < 100 || introDone) return;
    const elapsed = performance.now() - mountAt.current;
    const t = window.setTimeout(() => {
      setIntroDone(true);
      window.dispatchEvent(new CustomEvent("hj:intro-done"));
    }, Math.max(0, INTRO_MIN_MS - elapsed));
    return () => window.clearTimeout(t);
  }, [progress, introDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return;

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
    const uScroll = U("uScroll");
    const uVel = U("uVel");
    const uFocus = U("uFocus");
    const uTouchMode = U("uTouchMode");
    const uStride = U("uStride");
    const uCount = U("uCount");

    /* ---------- atlas: natural aspect CONTAIN over cream ---------- */
    const atlas = document.createElement("canvas");
    atlas.width = atlas.height = ATLAS_GRID * ATLAS_CELL;
    const actx = atlas.getContext("2d")!;
    actx.fillStyle = CREAM;
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

    mountAt.current = performance.now();
    let disposed = false;
    const imageDims = new Map<string, { w: number; h: number }>();
    /* contain-fit rect of each image inside its atlas cell, as
       fractions — the FLIP starts from the photo, not the cell */
    const photoRect = new Map<string, { x: number; y: number; w: number; h: number }>();
    let loadedCount = 0;
    /* the counter must land even if the network drags */
    const revealTimer = window.setTimeout(() => setProgress(100), 3500);
    ENTRIES.forEach((entry, i) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (disposed) return;
        loadedCount += 1;
        setProgress(Math.round((loadedCount / ENTRIES.length) * 100));
        imageDims.set(entry.src, { w: img.naturalWidth, h: img.naturalHeight });
        const fit = Math.min(
          ATLAS_CELL / img.naturalWidth,
          ATLAS_CELL / img.naturalHeight,
        );
        const w = img.naturalWidth * fit;
        const h = img.naturalHeight * fit;
        const ox = (ATLAS_CELL - w) / 2;
        const oy = (ATLAS_CELL - h) / 2;
        photoRect.set(entry.src, {
          x: ox / ATLAS_CELL,
          y: oy / ATLAS_CELL,
          w: w / ATLAS_CELL,
          h: h / ATLAS_CELL,
        });
        const cx = (i % ATLAS_GRID) * ATLAS_CELL;
        const cy = Math.floor(i / ATLAS_GRID) * ATLAS_CELL;
        actx.drawImage(img, cx + ox, cy + oy, w, h);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        uploadAtlas();
        requestRender();
      };
      img.src = entry.src;
    });

    /* ---------- state (CSS px) ---------- */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let strideCss = DESKTOP_STRIDE;
    let scroll = 0;
    let vel = 0; // px/s vertical momentum
    let shownVel = 0; // eased, drives the bend
    const focus = { x: -9999, y: -9999 };
    /* entrance: after the intro, the spotlight hops a few random
       tiles — pulses of color while the field settles (radial even
       on touch for the duration) */
    let pulsing = false;
    let pulseTimer = 0;
    const onIntroDone = () => {
      let hops = 0;
      pulsing = true;
      const hop = () => {
        focus.x = 50 + Math.random() * (canvas.clientWidth - 100);
        focus.y = 80 + Math.random() * (canvas.clientHeight - 160);
        requestRender();
        hops += 1;
        if (hops < 6) pulseTimer = window.setTimeout(hop, 280);
        else {
          pulsing = false;
          if (touch) {
            focus.x = -9999;
            focus.y = -9999;
          }
          requestRender();
        }
      };
      hop();
    };
    window.addEventListener("hj:intro-done", onIntroDone);
    let dragging = false;
    let lastPointer = { x: 0, y: 0, t: 0 };
    let flickVel = 0;
    let travelled = 0;
    let lastScrub = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      strideCss = window.innerWidth < 768 ? MOBILE_STRIDE : DESKTOP_STRIDE;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      requestRender();
    };

    let raf = 0;
    let running = false;
    let lastT = 0;
    const draw = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uScroll, scroll * dpr);
      gl.uniform1f(uVel, reduced ? 0 : shownVel * dpr);
      gl.uniform2f(uFocus, focus.x * dpr, focus.y * dpr);
      gl.uniform1f(uTouchMode, touch && !pulsing ? 1 : 0);
      gl.uniform1f(uStride, strideCss * dpr);
      gl.uniform1f(uCount, ENTRIES.length);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const step = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      if (!dragging && now - lastScrub > 90) {
        /* momentum decays to rest — the field never moves on its own */
        vel *= Math.exp(-dt / 0.7);
        if (Math.abs(vel) < 4) vel = 0;
        scroll -= vel * dt;
      }
      const k = 1 - Math.exp(-dt / 0.14);
      shownVel += (vel - shownVel) * k;
      draw();
      const still = !dragging && vel === 0 && Math.abs(shownVel) < 2;
      if (still) {
        shownVel = 0;
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
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      lastScrub = performance.now();
      scroll += e.deltaY;
      vel = 0;
      requestRender();
    };
    const onMouseMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      focus.x = e.clientX - rect.left;
      focus.y = e.clientY - rect.top;
      if (!dragging) requestRender();
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      travelled = 0;
      vel = 0;
      flickVel = 0;
      lastPointer = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      canvas.setPointerCapture(e.pointerId);
      requestRender();
    };
    const onMove = (e: PointerEvent) => {
      onMouseMove(e);
      if (!dragging) return;
      const dy = e.clientY - lastPointer.y;
      const dt = (e.timeStamp - lastPointer.t) / 1000;
      travelled += Math.hypot(
        e.clientX - lastPointer.x,
        e.clientY - lastPointer.y,
      );
      lastPointer = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      if (dt > 0) flickVel = flickVel * 0.7 + (dy / dt) * 0.3;
      scroll -= dy;
      requestRender();
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      const stale = e.timeStamp - lastPointer.t > 120;
      vel = stale || reduced ? 0 : Math.max(-3500, Math.min(3500, flickVel));
      const slop = e.pointerType === "mouse" ? 6 : 16;
      if (travelled < slop) {
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top + scroll;
        const c = Math.floor(px / strideCss);
        const r = Math.floor(py / strideCss);
        /* mirrors of the shader's integer hashes */
        const m = (v: number, n: number) => ((v % n) + n) % n;
        const sj = m(c * 31 + r * 47 + c * r * 13, 5);
        const scale = 0.55 + 0.1125 * sj;
        const side = strideCss * TILE_MAX * scale;
        const pad = (strideCss - side) / 2;
        const lx = px - c * strideCss - pad;
        const ly = py - r * strideCss - pad;
        if (lx > 0 && lx < side && ly > 0 && ly < side) {
          const n = ENTRIES.length;
          const jitter = m(
            Math.floor(c / 4) * 13 +
              Math.floor(r / 4) * 29 +
              Math.floor(c / 4) * Math.floor(r / 4) * 7,
            n,
          );
          const idx = m(c * 5 + r * 7 + jitter, n);
          const entry = ENTRIES[idx];
          /* the FLIP starts on the PHOTO inside the tile (the atlas
             cell contains it over cream) — but any click within the
             cell counts; the photos are small targets */
          const pr = photoRect.get(entry.src) ?? { x: 0, y: 0, w: 1, h: 1 };
          const tileLeft = rect.left + c * strideCss + pad;
          const tileTop = r * strideCss + pad - scroll + rect.top;
          flipToArticle(
            entry,
            {
              left: tileLeft + side * pr.x,
              top: tileTop + side * pr.y,
              width: side * pr.w,
              height: side * pr.h,
            },
            imageDims.get(entry.src),
            (href) => router.push(href),
            reduced,
          );
        }
      }
      requestRender();
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return () => {
      disposed = true;
      window.clearTimeout(revealTimer);
      window.clearTimeout(pulseTimer);
      window.removeEventListener("hj:intro-done", onIntroDone);
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      gl.deleteTexture(tex);
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
    };
  }, [router]);

  return (
    <div
      data-mode="light"
      className="relative h-svh w-full overflow-hidden bg-[#f1efe7] text-[#252726]"
    >
      <canvas
        ref={canvasRef}
        aria-label="Honors Journal — scroll to explore, click a photo to open its article"
        className="size-full cursor-pointer touch-none select-none"
      />
      <PhotoHeader />
      {/* the reference's preloader, counter and all */}
      <Intro progress={progress} done={introDone} />
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
