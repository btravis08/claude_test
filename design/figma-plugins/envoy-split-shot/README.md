# Envoy Split Shot (Figma plugin)

Places page captures from the Envoy Split Shot Chrome extension
(`design/chrome-extensions/split-shot/`) into Figma. Two paths:

- **Direct (no zip):** when Figma runs in Chrome with the extension
  installed, captures sent from the extension land automatically while this
  plugin's window is open — the plugin finds or creates a page called
  **Split Shot Inspo** and places the capture as a frame to the right of
  what's already there, sized in CSS pixels. The hand-off protocol is
  documented in the extension's README. (Figma's REST API can't write to a
  canvas, which is why the plugin must be open to receive; the desktop app
  can't talk to a Chrome extension, so direct mode is Chrome-only.)
- **Zip drag-and-drop:** import a `page-capture.zip`, stitched into a single
  vertical auto-layout frame (the capture devicePixelRatio is divided out).

## Install

Figma desktop → **Plugins → Development → Import plugin from manifest…** →
pick `manifest.json` in this folder. There is **no build step** — `code.js`
runs as-is, and JSZip is already inlined in `ui.html`.

## Expected zip format

Produced by the Chrome extension; the plugin validates all of it and reports
what's wrong when a zip doesn't match:

```
capture.zip
├── meta.json
├── slice-01.png       (filenames are whatever meta.json says)
└── slice-02.png
```

`meta.json`:

```json
{
  "pageName": "Homepage",          // becomes the frame name
  "scale": 2,                      // capture devicePixelRatio (fallback: 1)
  "slices": [
    {
      "filename": "slice-01.png",
      "viewportWidth": 2880,       // image px; rendered at width / scale
      "uniqueHeight": 1800         // image px minus overlap; rendered at height / scale
    }
  ]
}
```

Slices are stacked in `meta.json` order. Figma rejects images over 4096px on
a side (`figma.createImage` throws) — the extension's slicing should stay
under that; oversized slices fail the import with a toast naming the limit.

## Files

- `manifest.json` — plugin manifest (`networkAccess: none`; nothing leaves
  the machine, so it works offline).
- `code.js` — main thread: builds the frame from decoded slices. No bundler,
  no imports.
- `ui.html` — UI thread: drag-and-drop / file picker, unzips and validates
  with JSZip, posts slices to the main thread.
- `jszip.min.js` — vendored JSZip v3.10.1 (source of record for the copy
  inlined in `ui.html`).

## Upgrading JSZip

Replace `jszip.min.js` with the new minified build, then re-inline it: put
the marker `/*__JSZIP_INLINE__*/` back as the sole content of the first
`<script>` tag in `ui.html` and run:

```bash
node -e "
const fs = require('fs');
const js = fs.readFileSync('jszip.min.js', 'utf8');
const html = fs.readFileSync('ui.html', 'utf8');
fs.writeFileSync('ui.html', html.split('/*__JSZIP_INLINE__*/').join(js));
"
```
