// Envoy Split Shot — imports a capture zip produced by the Envoy Split Shot
// Chrome extension and stitches its slices into one vertical auto-layout frame.
// The UI thread (ui.html) unzips and validates; this thread only builds nodes.

figma.showUI(__html__, { width: 360, height: 480 });

figma.ui.onmessage = (msg) => {
  if (!msg || msg.type !== 'slice-data') return;

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
};
