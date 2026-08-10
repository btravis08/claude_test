# Envoy Split Shot (Chrome extension)

Captures full web pages as viewport slices at native devicePixelRatio and
places them straight into Figma — into a page called **Split Shot Inspo** in
the Figma file you pick from the pill's dropdown. Falls back to the classic
`page-capture.zip` download when Figma isn't connected.

## Install

`chrome://extensions` → enable Developer mode → **Load unpacked** → this
folder.

## Connect Figma (one-time)

1. Right-click the extension icon → **Options** (or click **Connect Figma**
   in the pill).
2. Paste a Figma personal access token (Figma → Settings → Security →
   Personal access tokens; needs read access to **File content** and
   **Projects**) and your team URL (open your team in Figma, copy the
   address bar). Both stay in this browser's extension storage.
3. Save — the extension pulls every project and file in the team for the
   pill's dropdown. The ↻ button in the pill re-fetches later.

## Using it

Click the toolbar icon on any page → the pill appears: file dropdown
(grouped by project, your last-used file preselected) + **Capture Page**.
The capture scrolls the page (triggering lazy-load), snapshots each
viewport, hides sticky navs after the first slice, then hands the slices to
the background worker.

Delivery — this is the part that needs the Figma **plugin** as the receiving
end, because Figma's REST API cannot write to a file's canvas:

- If the file is open in a Chrome tab with the **Envoy Split Shot** plugin
  running, the capture is placed immediately: the plugin finds or creates
  the **Split Shot Inspo** page and adds the stitched frame to the right of
  what's already there. The pill confirms with "Placed ✓".
- Otherwise the extension opens the file (or focuses its tab) and the
  capture waits — it auto-places the moment you run the plugin there.
  Pending captures are kept for 24 hours.
- No file selected / not connected → downloads `page-capture.zip` exactly as
  before (drag it onto the plugin to import).

Because the hand-off runs through this extension, auto-place only works with
**Figma in Chrome** — the Figma desktop app can't talk to a Chrome
extension. The zip path works everywhere.

## Files

- `manifest.json` — MV3 manifest.
- `background.js` — service worker: captureVisibleTab relay, Figma REST
  file listing, pending-capture store (IndexedDB), delivery orchestration.
- `content.js` — the capture pill UI + slice capture loop; injected by the
  toolbar button together with `jszip.min.js`.
- `figma-bridge.js` — content script on figma.com; answers the plugin UI's
  ready ping and forwards pending captures into the plugin iframe.
- `options.html` / `options.js` — Figma token + team setup.
- `jszip.min.js` — vendored JSZip v3.10.1 (zip fallback).

## Message protocol (extension ↔ plugin)

The plugin UI posts `{source: 'envoy-split-shot-plugin', type: 'ready'}` to
its parent (the figma.com page) every 1.5s; `figma-bridge.js` acks with
`{source: 'envoy-split-shot-bridge', type: 'ready-ack'}`, then pushes
`{type: 'capture', capture: {captureId, pageName, scale, cssWidth,
totalCssHeight, sliceCount, slices: [{name, y, cssWidth, cssHeight,
base64}]}}`. After placing, the plugin posts `{type: 'placed', captureId}`
back, and the bridge tells the background to delete the pending capture and
confirm in the pill. Slices are full-viewport shots positioned by their
scroll offset `y` in CSS px (the last one intentionally overlaps).
