// Envoy Split Shot — service worker.
// Relays captureVisibleTab for the capture loop, pulls the Figma file list
// via the REST API, and holds finished captures in IndexedDB until the
// Envoy Split Shot Figma plugin (via figma-bridge.js) collects them.

const FIGMA_API = 'https://api.figma.com/v1';
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// IndexedDB (captures pending delivery to Figma)
// ---------------------------------------------------------------------------

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('splitshot', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('captures', { keyPath: 'id' });
      db.createObjectStore('slices', { keyPath: ['captureId', 'index'] });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function withDb(storeNames, mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeNames, mode);
        let out;
        fn(tx, (value) => {
          out = value;
        });
        tx.oncomplete = () => resolve(out);
        tx.onerror = () => reject(tx.error);
      })
  );
}

function idbGet(store, key) {
  return withDb([store], 'readonly', (tx, done) => {
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => done(req.result);
  });
}

function idbGetAll(store) {
  return withDb([store], 'readonly', (tx, done) => {
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => done(req.result);
  });
}

function idbWrite(stores, fn) {
  return withDb(stores, 'readwrite', (tx) => fn(tx));
}

async function pruneExpired() {
  const cutoff = Date.now() - PENDING_TTL_MS;
  const captures = await idbGetAll('captures');
  for (const cap of captures || []) {
    if (cap.createdAt < cutoff) await deleteCapture(cap.id);
  }
}

async function deleteCapture(captureId) {
  const cap = await idbGet('captures', captureId);
  await idbWrite(['captures', 'slices'], (tx) => {
    tx.objectStore('captures').delete(captureId);
    const count = (cap && cap.meta && cap.meta.sliceCount) || 100;
    for (let i = 0; i < count; i++) tx.objectStore('slices').delete([captureId, i]);
  });
}

// ---------------------------------------------------------------------------
// Figma REST (file list for the dropdown)
// ---------------------------------------------------------------------------

async function figmaGet(path, token) {
  const res = await fetch(`${FIGMA_API}${path}`, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) {
    const detail = res.status === 403 ? 'token is invalid or missing scopes' : `HTTP ${res.status}`;
    throw new Error(`Figma API ${path} failed (${detail})`);
  }
  return res.json();
}

async function refreshFileList() {
  const { figmaToken, figmaTeamId } = await chrome.storage.local.get(['figmaToken', 'figmaTeamId']);
  if (!figmaToken || !figmaTeamId) {
    return { ok: false, error: 'Figma is not connected yet — set a token and team in the extension options.' };
  }
  try {
    const team = await figmaGet(`/teams/${figmaTeamId}/projects`, figmaToken);
    const projects = [];
    for (const project of team.projects || []) {
      const files = await figmaGet(`/projects/${project.id}/files`, figmaToken);
      projects.push({
        id: project.id,
        name: project.name,
        files: (files.files || []).map((f) => ({ key: f.key, name: f.name })),
      });
    }
    const fileList = { teamName: team.name, projects, fetchedAt: Date.now() };
    await chrome.storage.local.set({ fileList });
    return { ok: true, fileList };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Capture intake (from content.js) and delivery (to figma-bridge.js)
// ---------------------------------------------------------------------------

async function beginCapture({ fileKey }, sender) {
  const id = `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await idbWrite(['captures'], (tx) => {
    tx.objectStore('captures').put({
      id,
      fileKey,
      meta: null,
      ready: false,
      createdAt: Date.now(),
      sourceTabId: sender.tab ? sender.tab.id : null,
    });
  });
  return { ok: true, captureId: id };
}

async function addSlice({ captureId, index, slice }) {
  await idbWrite(['slices'], (tx) => {
    tx.objectStore('slices').put({ captureId, index, ...slice });
  });
  return { ok: true };
}

async function finishCapture({ captureId, meta }) {
  const cap = await idbGet('captures', captureId);
  if (!cap) return { ok: false, error: 'Unknown capture.' };
  cap.meta = meta;
  cap.ready = true;
  await idbWrite(['captures'], (tx) => {
    tx.objectStore('captures').put(cap);
  });
  return { ok: true, delivery: await attemptDelivery(cap.fileKey) };
}

// Finds an open figma.com tab for the file and pokes its bridge. Returns how
// far delivery got so the pill can tell the user what happens next.
async function attemptDelivery(fileKey) {
  const tabs = await chrome.tabs.query({ url: 'https://www.figma.com/*' });
  const fileTabs = tabs.filter((t) => t.url && t.url.includes(`/${fileKey}`));
  if (fileTabs.length === 0) {
    await chrome.tabs.create({ url: `https://www.figma.com/design/${fileKey}`, active: true });
    return 'opened-tab';
  }
  for (const tab of fileTabs) {
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { action: 'deliver-now' });
      if (res && res.pluginReady) return 'plugin-live';
    } catch (_) {
      // Bridge not ready in that tab (e.g. still loading) — try the next one.
    }
  }
  await chrome.tabs.update(fileTabs[0].id, { active: true });
  return 'plugin-needed';
}

async function getPending({ fileKey }) {
  const captures = await idbGetAll('captures');
  const ready = (captures || []).filter((c) => c.ready && c.fileKey === fileKey);
  return {
    ok: true,
    captures: ready.map((c) => ({ id: c.id, meta: c.meta, sliceCount: c.meta.sliceCount })),
  };
}

async function getSlice({ captureId, index }) {
  const slice = await idbGet('slices', [captureId, index]);
  return slice ? { ok: true, slice } : { ok: false, error: `Slice ${index} missing.` };
}

async function markDelivered({ captureId }) {
  const cap = await idbGet('captures', captureId);
  await deleteCapture(captureId);
  // Tell the tab the capture came from so its pill can confirm placement.
  if (cap && cap.sourceTabId != null) {
    chrome.tabs.sendMessage(cap.sourceTabId, { action: 'capture-status', captureId, status: 'placed' }).catch(() => {});
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Message routing
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'capture':
      chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }, (dataUrl) => sendResponse(dataUrl));
      return true;
    case 'open-options':
      chrome.runtime.openOptionsPage();
      return false;
    case 'refresh-files':
      refreshFileList().then(sendResponse);
      return true;
    case 'begin-capture':
      beginCapture(message, sender).then(sendResponse);
      return true;
    case 'add-slice':
      addSlice(message).then(sendResponse);
      return true;
    case 'finish-capture':
      finishCapture(message).then(sendResponse);
      return true;
    case 'get-pending':
      getPending(message).then(sendResponse);
      return true;
    case 'get-slice':
      getSlice(message).then(sendResponse);
      return true;
    case 'delivered':
      markDelivered(message).then(sendResponse);
      return true;
  }
  return false;
});

// Toolbar click → inject the capture UI into the current tab.
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['jszip.min.js', 'content.js'],
  });
});

pruneExpired().catch(() => {});
