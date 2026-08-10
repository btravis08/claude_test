// Envoy Split Shot — options page: store the Figma token + team and fetch
// the project/file list the capture pill's dropdown shows.

const tokenInput = document.getElementById('token');
const teamInput = document.getElementById('team');
const saveBtn = document.getElementById('save');
const statusEl = document.getElementById('status');
const filesEl = document.getElementById('files');

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = kind || '';
}

function parseTeamId(value) {
  const trimmed = (value || '').trim();
  const fromUrl = trimmed.match(/\/team\/(\d+)/);
  if (fromUrl) return fromUrl[1];
  if (/^\d+$/.test(trimmed)) return trimmed;
  return null;
}

function showFileList(fileList) {
  if (!fileList) {
    filesEl.textContent = '';
    return;
  }
  const fileCount = fileList.projects.reduce((n, p) => n + p.files.length, 0);
  filesEl.textContent = `Connected to "${fileList.teamName}": ${fileList.projects.length} projects, ${fileCount} files.`;
}

async function restore() {
  const { figmaToken, figmaTeamId, fileList } = await chrome.storage.local.get(['figmaToken', 'figmaTeamId', 'fileList']);
  if (figmaToken) tokenInput.value = figmaToken;
  if (figmaTeamId) teamInput.value = figmaTeamId;
  showFileList(fileList);
}

saveBtn.addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  const teamId = parseTeamId(teamInput.value);
  if (!token) return setStatus('Paste a personal access token first.', 'error');
  if (!teamId) return setStatus('That team URL has no /team/<id>/ segment — copy it from the address bar.', 'error');

  saveBtn.disabled = true;
  setStatus('Fetching your projects and files…');
  await chrome.storage.local.set({ figmaToken: token, figmaTeamId: teamId });

  const res = await chrome.runtime.sendMessage({ action: 'refresh-files' });
  saveBtn.disabled = false;
  if (res && res.ok) {
    setStatus('Connected ✓', 'ok');
    showFileList(res.fileList);
  } else {
    setStatus((res && res.error) || 'Could not reach the Figma API.', 'error');
  }
});

restore();
