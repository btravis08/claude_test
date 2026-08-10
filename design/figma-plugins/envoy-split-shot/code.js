// Envoy Split Shot — places page captures from the Envoy Split Shot Chrome
// extension into Figma. Two paths:
//   direct-capture — arrives from the extension via the figma.com bridge while
//     this plugin is open; lands on the "Split Shot Inspo" page automatically.
//   slice-data — the classic zip drag-and-drop fallback (ui.html unzips).
// The UI thread unzips/decodes and validates; this thread only builds nodes.

figma.showUI(__html__, { width: 360, height: 480 });

const INSPO_PAGE_NAME = 'Split Shot Inspo';

figma.ui.onmessage = async (msg) => {
  if (!msg) return;
  if (msg.type === 'slice-data') importZipCapture(msg);
  else if (msg.type === 'direct-capture') await importDirectCapture(msg);
};

// ---------------------------------------------------------------------------
// Direct path: capture pushed from the Chrome extension
// ---------------------------------------------------------------------------

async function importDirectCapture(msg) {
  const { captureId, pageName, cssWidth, totalCssHeight, slices } = msg;
  let frame = null;
  try {
    if (!Array.isArray(slices) || slices.length === 0) throw new Error('The capture contained no slices.');
    if (!(cssWidth > 0) || !(totalCssHeight > 0)) throw new Error('The capture has invalid dimensions.');

    let page = figma.root.children.find((p) => p.name === INSPO_PAGE_NAME);
    if (!page) {
      page = figma.createPage();
      page.name = INSPO_PAGE_NAME;
    }
    await page.loadAsync();

    frame = figma.createFrame();
    frame.name = pageName || 'Capture';
    frame.fills = [];
    frame.clipsContent = true;
    frame.resizeWithoutConstraints(cssWidth, totalCssHeight);

    // Slices are full viewport shots positioned at their scroll offsets (the
    // last one overlaps the previous on purpose), so absolute placement
    // reproduces the page exactly; the frame clips nothing sticking out.
    for (const slice of slices) {
      const image = figma.createImage(new Uint8Array(slice.data));
      const rect = figma.createRectangle();
      rect.name = slice.name || 'Slice';
      rect.resizeWithoutConstraints(slice.cssWidth, slice.cssHeight);
      rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
      frame.appendChild(rect);
      rect.x = 0;
      rect.y = slice.y;
    }

    // Place to the right of whatever is already on the Inspo page.
    let rightEdge = 0;
    for (const child of page.children) {
      if (child !== frame) rightEdge = Math.max(rightEdge, child.x + child.width);
    }
    page.appendChild(frame);
    frame.x = rightEdge > 0 ? rightEdge + 200 : 0;
    frame.y = 0;

    await figma.setCurrentPageAsync(page);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);
    figma.notify(`Placed "${frame.name}" on ${INSPO_PAGE_NAME}`);
    figma.ui.postMessage({ type: 'direct-placed', captureId, frameName: frame.name });
    // Stay open — more captures may follow.
  } catch (err) {
    if (frame) frame.remove();
    const message = `Import failed${err && err.message ? ` (${err.message})` : ''}`;
    figma.notify(message, { error: true });
    figma.ui.postMessage({ type: 'direct-failed', captureId, message });
  }
}

// ---------------------------------------------------------------------------
// Fallback path: zip dropped onto the plugin UI
// ---------------------------------------------------------------------------

function importZipCapture(msg) {
  const { pageName, slices, scale } = msg;
  // scale is the capture devicePixelRatio; divide it out so the frame lands
  // at CSS-pixel size. Guard against 0/undefined from an older extension.
  const pixelScale = typeof scale === 'number' && scale > 0 ? scale : 1;

  if (!Array.isArray(slices) || slices.length === 0) {
    figma.notify('The zip contained no slices.', { error: true });
    figma.ui.postMessage({ type: 'import-failed' });
    return;
  }

  const frame = figma.createFrame();
  frame.name = pageName || 'Imported capture';
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = 0;
  frame.fills = [];

  try {
    for (const slice of slices) {
      // Throws on undecodable bytes or images over Figma's 4096px-per-side limit.
      const image = figma.createImage(new Uint8Array(slice.data));
      const rect = figma.createRectangle();
      rect.name = slice.name || 'Slice';
      rect.resizeWithoutConstraints(slice.width / pixelScale, slice.height / pixelScale);
      rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
      frame.appendChild(rect);
    }
  } catch (err) {
    frame.remove();
    const detail = err && err.message ? ` (${err.message})` : '';
    figma.notify(`Import failed${detail}`, { error: true });
    figma.ui.postMessage({ type: 'import-failed' });
    return;
  }

  frame.x = Math.round(figma.viewport.center.x - frame.width / 2);
  frame.y = Math.round(figma.viewport.center.y - frame.height / 2);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);

  figma.notify(`Imported ${slices.length} slice${slices.length === 1 ? '' : 's'} into "${frame.name}"`);
  figma.closePlugin();
}
