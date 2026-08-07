// Envoy Split Shot — bridge content script, runs on figma.com.
// The Envoy Split Shot Figma plugin's UI announces itself by posting to the
// figma.com window (its parent). This script answers, pulls any captures
// pending for the open file from the background worker, and forwards them
// into the plugin iframe. Nothing here touches Figma's own UI.

(() => {
  let pluginWindow = null;
  let delivering = false;

  function fileKeyFromUrl() {
    const m = location.pathname.match(/\/(?:design|file|proto|board)\/([A-Za-z0-9]+)/);
    return m ? m[1] : null;
  }

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.source !== 'envoy-split-shot-plugin') return;

    if (data.type === 'ready') {
      pluginWindow = event.source;
      pluginWindow.postMessage({ source: 'envoy-split-shot-bridge', type: 'ready-ack' }, '*');
      deliverPending();
    } else if (data.type === 'placed' && data.captureId) {
      chrome.runtime.sendMessage({ action: 'delivered', captureId: data.captureId }).catch(() => {});
    }
  });

  async function deliverPending() {
    if (!pluginWindow || delivering) return;
    const fileKey = fileKeyFromUrl();
    if (!fileKey) return;

    delivering = true;
    try {
      const res = await chrome.runtime.sendMessage({ action: 'get-pending', fileKey });
      for (const cap of (res && res.captures) || []) {
        const slices = [];
        for (let i = 0; i < cap.sliceCount; i++) {
          const s = await chrome.runtime.sendMessage({ action: 'get-slice', captureId: cap.id, index: i });
          if (!s || !s.ok) {
            slices.length = 0;
            break;
          }
          slices.push({ name: s.slice.name, y: s.slice.y, cssWidth: s.slice.cssWidth, cssHeight: s.slice.cssHeight, base64: s.slice.base64 });
        }
        if (slices.length === cap.sliceCount) {
          pluginWindow.postMessage(
            {
              source: 'envoy-split-shot-bridge',
              type: 'capture',
              capture: { captureId: cap.id, ...cap.meta, slices },
            },
            '*'
          );
        }
      }
    } catch (_) {
      // Background worker unavailable (extension reloading) — captures stay pending.
    } finally {
      delivering = false;
    }
  }

  // The background pokes us right after a capture finishes.
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === 'deliver-now') {
      deliverPending();
      sendResponse({ pluginReady: !!pluginWindow });
    }
    return false;
  });
})();
