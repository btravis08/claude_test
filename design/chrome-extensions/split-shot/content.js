// Envoy Split Shot — capture UI, injected by the toolbar button.
// Captures the page as viewport slices, then either hands them to the Envoy
// Split Shot Figma plugin (via the background worker + figma-bridge) or falls
// back to downloading the classic capture zip.

(() => {
  // Re-clicking the toolbar button just re-shows the existing pill.
  if (window.__envoySplitShot) {
    window.__envoySplitShot.show();
    return;
  }

  const ENVOY_LOGO = `
  <svg width="72" height="27" viewBox="0 0 72 27" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path d="M68.2119 13.7569V17.6497H62.9035V26.1432H58.3029V17.6497H52.9944V13.7569H68.2119Z" fill="currentColor"/>
<path d="M45.0207 26.3201C39.5707 26.3201 37.235 24.2498 37.235 19.9323C37.235 15.6325 39.5707 13.5799 45.0207 13.5799C50.453 13.5799 52.8064 15.6502 52.8064 19.9323C52.8064 24.2321 50.453 26.3201 45.0207 26.3201ZM45.0207 22.4273C47.728 22.4273 48.2058 21.2417 48.2058 19.9323C48.2058 18.6406 47.7457 17.4727 45.0207 17.4727C42.2957 17.4727 41.8357 18.6229 41.8357 19.9323C41.8357 21.2594 42.3134 22.4273 45.0207 22.4273Z" fill="currentColor"/>
<path d="M32.2812 13.7569H36.8819V26.1432H32.2812V21.8964H25.0264V26.1432H20.4258V13.7569H25.0264V18.0036H32.2812V13.7569Z" fill="currentColor"/>
<path d="M4.07471 21.7726H8.67533C8.67533 22.3742 9.24157 22.7812 12.1612 22.7812C14.8862 22.7812 15.2932 22.6042 15.2932 22.1442C15.2932 21.6133 14.8862 21.5425 11.9842 21.4541C6.39272 21.2771 4.25165 20.357 4.25165 17.4727C4.25165 14.7478 6.92356 13.5799 11.8073 13.5799C16.638 13.5799 19.3629 14.7478 19.3629 17.9151H14.7623C14.7623 17.2604 13.7006 17.1189 11.4534 17.1189C9.29465 17.1189 8.85228 17.225 8.85228 17.7028C8.85228 18.1805 9.29465 18.1628 11.9842 18.269C16.868 18.4637 19.8938 18.7999 19.8938 22.038C19.8938 25.4531 17.0626 26.3201 11.9842 26.3201C6.90586 26.3201 4.07471 25.4531 4.07471 21.7726Z" fill="currentColor"/>
<path d="M71.3266 0.256851V4.14969H66.0182V12.6432H61.4175V4.14969H56.1091V0.256851H71.3266Z" fill="currentColor"/>
<path d="M55.5817 0.256851V4.38562H50.9811V0.256851H55.5817Z" fill="currentColor"/>
<path d="M52.8817 4.38562V8.51439H48.2811V4.38562H52.8817Z" fill="currentColor"/>
<path d="M50.1817 8.51439V12.6432H45.5811V8.51439H50.1817Z" fill="currentColor"/>
<path d="M36.9107 8.75032H45.0503V12.6432H32.3101V0.256851H36.9107V8.75032Z" fill="currentColor"/>
<path d="M27.0431 0.256851C29.8566 0.256851 31.7853 2.23866 31.7853 4.99904C31.7853 7.75941 29.8566 9.74122 27.0431 9.74122H21.9117V12.6432H17.311V0.256851H27.0431ZM26.1584 5.84838C26.6185 5.84838 27.1847 5.84838 27.1847 4.99904C27.1847 4.14969 26.6185 4.14969 26.1584 4.14969H21.9117V5.84838H26.1584Z" fill="currentColor"/>
<path d="M0.960022 8.27257H5.56065C5.56065 8.87419 6.12688 9.28117 9.04651 9.28117C11.7715 9.28117 12.1785 9.10422 12.1785 8.64416C12.1785 8.11331 11.7715 8.04253 8.86956 7.95406C3.27803 7.77711 1.13697 6.85699 1.13697 3.97275C1.13697 1.24776 3.80887 0.0799103 8.69262 0.0799103C13.5233 0.0799103 16.2483 1.24776 16.2483 4.41512H11.6476C11.6476 3.76041 10.586 3.61885 8.33872 3.61885C6.17997 3.61885 5.7376 3.72502 5.7376 4.20278C5.7376 4.68054 6.17997 4.66284 8.86956 4.76901C13.7533 4.96365 16.7791 5.29985 16.7791 8.53799C16.7791 11.9531 13.9479 12.8201 8.86956 12.8201C3.79118 12.8201 0.960022 11.9531 0.960022 8.27257Z" fill="currentColor"/>
</svg>`;

  // -------------------------------------------------------------------------
  // Pill UI
  // -------------------------------------------------------------------------

  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: '999999',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    fontFamily: '"Inter", sans-serif',
  });

  const modal = document.createElement('div');
  Object.assign(modal.style, {
    padding: '6px 6px 6px 24px',
    border: '1px solid hsla(0, 0%, 54%, 0.4)',
    borderRadius: '9999px',
    background: 'hsla(0, 0%, 0%, 0.7)',
    backdropFilter: 'blur(24px)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  });

  const logo = document.createElement('div');
  logo.innerHTML = ENVOY_LOGO;
  Object.assign(logo.style, { color: 'white', display: 'flex', height: 'auto', width: 'auto' });

  // File dropdown (populated from the Figma file list the background fetched).
  const fileSelect = document.createElement('select');
  fileSelect.title = 'Figma file to place the capture in';
  Object.assign(fileSelect.style, {
    maxWidth: '180px',
    background: 'hsla(0, 0%, 100%, 0.1)',
    color: 'white',
    border: '1px solid hsla(0, 0%, 100%, 0.25)',
    borderRadius: '999px',
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
  });

  const connectBtn = document.createElement('button');
  connectBtn.innerText = 'Connect Figma';
  Object.assign(connectBtn.style, {
    background: 'transparent',
    border: '1px solid hsla(0, 0%, 100%, 0.35)',
    color: 'white',
    borderRadius: '999px',
    padding: '8px 14px',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
  });
  connectBtn.onclick = () => chrome.runtime.sendMessage({ action: 'open-options' });

  const refreshBtn = document.createElement('button');
  refreshBtn.innerText = '↻';
  refreshBtn.title = 'Refresh file list from Figma';
  Object.assign(refreshBtn.style, {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px',
  });
  refreshBtn.onclick = async () => {
    refreshBtn.disabled = true;
    refreshBtn.innerText = '…';
    const res = await chrome.runtime.sendMessage({ action: 'refresh-files' });
    refreshBtn.disabled = false;
    refreshBtn.innerText = '↻';
    if (res && res.ok) {
      await populateFigmaControls();
      setStatus('File list refreshed.');
    } else {
      setStatus((res && res.error) || 'Could not refresh the file list.', true);
    }
  };

  const button = document.createElement('button');
  button.id = 'start-capture';
  button.innerText = 'Capture Page';
  Object.assign(button.style, {
    background: '#ffffff',
    fontFamily: '"Inter", sans-serif',
    border: 'none',
    color: 'rgb(54 54 54)',
    fontWeight: '600',
    fontSize: '14px',
    borderRadius: '999px',
    cursor: 'pointer',
    padding: '14px 24px',
  });
  button.onmouseenter = () => (button.style.background = '#f5f5f5');
  button.onmouseleave = () => (button.style.background = '#ffffff');

  const status = document.createElement('div');
  Object.assign(status.style, {
    display: 'none',
    padding: '8px 16px',
    borderRadius: '12px',
    background: 'hsla(0, 0%, 0%, 0.7)',
    backdropFilter: 'blur(24px)',
    color: 'white',
    fontSize: '12px',
    maxWidth: '320px',
  });

  function setStatus(text, isError) {
    status.innerText = text;
    status.style.display = text ? 'block' : 'none';
    status.style.color = isError ? '#ff9c9c' : 'white';
  }

  modal.appendChild(logo);
  modal.appendChild(fileSelect);
  modal.appendChild(connectBtn);
  modal.appendChild(refreshBtn);
  modal.appendChild(button);
  container.appendChild(modal);
  container.appendChild(status);
  document.body.appendChild(container);

  window.__envoySplitShot = {
    show() {
      container.style.display = 'flex';
      modal.style.display = 'flex';
    },
  };

  // -------------------------------------------------------------------------
  // Figma file dropdown
  // -------------------------------------------------------------------------

  async function populateFigmaControls() {
    const { figmaToken, figmaTeamId, fileList, lastUsedFileKey } = await chrome.storage.local.get([
      'figmaToken',
      'figmaTeamId',
      'fileList',
      'lastUsedFileKey',
    ]);
    const configured = !!(figmaToken && figmaTeamId);
    connectBtn.style.display = configured ? 'none' : 'inline-block';
    fileSelect.style.display = configured ? 'inline-block' : 'none';
    refreshBtn.style.display = configured ? 'inline-block' : 'none';
    if (!configured) return;

    fileSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.innerText = 'Choose a Figma file…';
    fileSelect.appendChild(placeholder);

    for (const project of (fileList && fileList.projects) || []) {
      const group = document.createElement('optgroup');
      group.label = project.name;
      for (const file of project.files) {
        const opt = document.createElement('option');
        opt.value = file.key;
        opt.innerText = file.name;
        group.appendChild(opt);
      }
      fileSelect.appendChild(group);
    }
    if (lastUsedFileKey && fileSelect.querySelector(`option[value="${lastUsedFileKey}"]`)) {
      fileSelect.value = lastUsedFileKey;
    }
  }

  fileSelect.onchange = () => {
    if (fileSelect.value) chrome.storage.local.set({ lastUsedFileKey: fileSelect.value });
  };

  populateFigmaControls();

  // Background confirms placement asynchronously (after the plugin places it).
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === 'capture-status' && msg.status === 'placed') {
      setStatus("Placed on 'Split Shot Inspo' in Figma ✓");
    }
  });

  // -------------------------------------------------------------------------
  // Capture
  // -------------------------------------------------------------------------

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function captureSlices() {
    // Try to stop GSAP + ScrollTrigger animations
    try {
      if (window.gsap) {
        gsap.globalTimeline.clear();
        if (window.ScrollTrigger) {
          ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        }
      }
    } catch (e) {
      console.log('❌ Error stopping GSAP:', e);
    }

    // Pause all videos (remember which ones were playing so we can resume).
    const pausedVideos = [];
    try {
      document.querySelectorAll('video').forEach((video) => {
        if (!video.paused) pausedVideos.push(video);
        video.pause();
        video.autoplay = false;
      });
    } catch (e) {
      console.log('❌ Error pausing videos:', e);
    }

    // Freeze CSS-based animations, transitions, transforms
    const freezeStyle = document.createElement('style');
    freezeStyle.id = 'splitshot-animation-freeze';
    freezeStyle.textContent = `
      * {
        animation: none !important;
        transition: none !important;
        will-change: auto !important;
      }
    `;
    document.head.appendChild(freezeStyle);

    // Hide scrollbar without breaking layout
    const scrollbarStyle = document.createElement('style');
    scrollbarStyle.id = 'splitshot-scrollbar-style';
    scrollbarStyle.innerHTML = `
      ::-webkit-scrollbar {
        opacity: 0 !important;
        width: 0 !important;
      }
      body {
        scrollbar-width: none !important; /* For Firefox */
      }
    `;
    document.head.appendChild(scrollbarStyle);

    const origY = window.scrollY;
    let totalHeight = document.documentElement.scrollHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = window.devicePixelRatio || 1;

    // Pre-scroll to trigger lazy load
    for (let y = 0; y < totalHeight; y += vh / 4) {
      window.scrollTo(0, y);
      await sleep(500);
    }
    window.scrollTo(0, totalHeight - vh);
    await sleep(1000);
    for (let y = totalHeight - vh; y >= 0; y -= vh / 4) {
      window.scrollTo(0, y);
      await sleep(300);
    }
    window.scrollTo(0, 0);
    await sleep(500);

    totalHeight = document.documentElement.scrollHeight;

    const sliceCount = Math.ceil(totalHeight / vh);
    const slices = [];
    let sumHeights = 0;
    let navRemoved = false;
    const hiddenNavEls = [];

    for (let i = 0; i < sliceCount; i++) {
      const y = Math.min(i * vh, totalHeight - vh);
      window.scrollTo(0, y);
      await sleep(500);

      // After the first slice, hide fixed/sticky bars so they don't repeat.
      if (i === 1 && !navRemoved) {
        document.querySelectorAll('*').forEach((el) => {
          const pos = getComputedStyle(el).position;
          const rect = el.getBoundingClientRect();
          if ((pos === 'fixed' || pos === 'sticky') && rect.height < 300) {
            el.dataset._originalOpacity = el.style.opacity || '';
            el.style.opacity = '0';
            hiddenNavEls.push(el);
          }
        });
        await sleep(600);
        navRemoved = true;
      }

      const dataUrl = await chrome.runtime.sendMessage({ action: 'capture' });

      let uniqueHeight = vh;
      let shiftUp = 0;
      if (i === sliceCount - 1) {
        const remainingHeight = totalHeight - sumHeights;
        shiftUp = vh - remainingHeight;
      }

      slices.push({
        filename: `slice-${String(i + 1).padStart(2, '0')}.png`,
        y,
        base64: dataUrl.split(',')[1],
        uniqueHeight,
        shiftUp,
      });
      sumHeights += uniqueHeight;
    }

    // Restore the page.
    hiddenNavEls.forEach((el) => {
      el.style.opacity = el.dataset._originalOpacity;
      delete el.dataset._originalOpacity;
    });
    window.scrollTo(0, origY);
    scrollbarStyle.remove();
    freezeStyle.remove();
    try {
      pausedVideos.forEach((video) => video.play());
    } catch (e) {
      console.log('❌ Error resuming videos:', e);
    }

    return { slices, vw, vh, scale, totalHeight };
  }

  // -------------------------------------------------------------------------
  // Output paths: direct to Figma, or the classic zip download
  // -------------------------------------------------------------------------

  async function sendToFigma(capture, fileKey) {
    const { slices, vw, vh, scale, totalHeight } = capture;
    const begun = await chrome.runtime.sendMessage({ action: 'begin-capture', fileKey });
    if (!begun || !begun.ok) throw new Error((begun && begun.error) || 'Could not start the Figma hand-off.');

    for (let i = 0; i < slices.length; i++) {
      const s = slices[i];
      const added = await chrome.runtime.sendMessage({
        action: 'add-slice',
        captureId: begun.captureId,
        index: i,
        slice: { name: s.filename, y: s.y, cssWidth: vw, cssHeight: vh, base64: s.base64 },
      });
      if (!added || !added.ok) throw new Error('Could not stage a slice for Figma.');
    }

    const finished = await chrome.runtime.sendMessage({
      action: 'finish-capture',
      captureId: begun.captureId,
      meta: {
        pageName: document.title,
        scale,
        cssWidth: vw,
        totalCssHeight: totalHeight,
        sliceCount: slices.length,
      },
    });
    if (!finished || !finished.ok) throw new Error((finished && finished.error) || 'Could not finish the Figma hand-off.');
    return finished.delivery;
  }

  async function downloadZip(capture) {
    const { slices, vw, scale, totalHeight } = capture;
    const zip = new JSZip();

    // Stitched master for reference, drawn at native pixel ratio.
    const canvas = document.createElement('canvas');
    canvas.width = vw * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext('2d');

    for (const s of slices) {
      const img = await new Promise((res) => {
        const im = new Image();
        im.onload = () => res(im);
        im.src = `data:image/png;base64,${s.base64}`;
      });
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, s.y * scale, img.naturalWidth, img.naturalHeight);
      const bin = atob(s.base64);
      const arr = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
      zip.file(s.filename, arr);
    }

    zip.file(
      'meta.json',
      JSON.stringify(
        {
          pageName: document.title,
          scale,
          viewportWidth: vw,
          slices: slices.map((s) => ({
            filename: s.filename,
            viewportWidth: vw,
            uniqueHeight: s.uniqueHeight,
            shiftUp: s.shiftUp,
          })),
        },
        null,
        2
      )
    );

    const masterUrl = canvas.toDataURL('image/png');
    const masterBin = atob(masterUrl.split(',')[1]);
    const masterArr = new Uint8Array(masterBin.length);
    for (let i = 0; i < masterBin.length; i++) masterArr[i] = masterBin.charCodeAt(i);
    zip.file('stitched.png', masterArr);

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'page-capture.zip';
    link.click();
  }

  button.onclick = async () => {
    // Keep the pill out of the screenshots.
    container.style.display = 'none';

    let capture;
    try {
      capture = await captureSlices();
    } catch (e) {
      container.style.display = 'flex';
      setStatus(`Capture failed: ${e.message}`, true);
      return;
    }

    container.style.display = 'flex';
    const fileKey = fileSelect.style.display !== 'none' ? fileSelect.value : '';

    if (fileKey) {
      setStatus('Sending to Figma…');
      try {
        const delivery = await sendToFigma(capture, fileKey);
        if (delivery === 'plugin-live') {
          setStatus('Sent — placing in Figma…');
        } else if (delivery === 'opened-tab') {
          setStatus('Opened the Figma file — run the Envoy Split Shot plugin there to place the capture.');
        } else {
          setStatus('Capture ready — run the Envoy Split Shot plugin in the Figma tab to place it.');
        }
      } catch (e) {
        setStatus(`${e.message} Downloading the zip instead.`, true);
        await downloadZip(capture);
      }
    } else {
      await downloadZip(capture);
      setStatus('Capture downloaded as page-capture.zip.');
    }
  };
})();
