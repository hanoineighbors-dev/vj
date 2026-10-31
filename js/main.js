'use strict';
/* Popping Lollipop VJ · main.js */
/* ---------- main loop ---------- */
let last = performance.now(), frameCount = 0, fpsT = performance.now(), ledIdx = -1, uiT = 0, errCount = 0, frameTok = 0, lastTickAt = performance.now();
function schedule() {
  const tok = ++frameTok, cb = () => { if (tok === frameTok) tick(); };
  if (ROLE === 'control' && document.hidden && outWin && !outWin.closed) outWin.requestAnimationFrame(cb); else requestAnimationFrame(cb);
}
function tick() {
  const now = performance.now(); lastTickAt = now;
  const dt = Math.min(100, now - last); last = now;
  S.beats += dt * S.bpm / 60000;
  try {
    if (ROLE === 'control') { micStep(now); autoStep(); }
    render(now, dt);
    if (ROLE === 'control') {
      drawOutput(); rcTick(now);
      const idx = ((Math.floor(S.beats) % 4) + 4) % 4;
      if (idx !== ledIdx) { ledIdx = idx; $$('#leds i').forEach((el, i) => { el.classList.toggle('on', i === idx); el.classList.toggle('first', i === 0); }); }
      if (now - uiT > 100) {
        uiT = now; uiBpm(false);
        $('#mLevel').style.width = Math.round(clamp(mic.level * 6, 0, 1) * 100) + '%'; $('#mConf').style.width = Math.round(mic.conf * 100) + '%';
        if (mic.on) updateMicUI();
      }
    } else dTick(now);
    errCount = 0;
  } catch (e) {
    console.error(e); errCount++;
    if (errCount > 3) {
      Object.values(S.fx).forEach(f => { f.on = false; }); S.source = 'gen'; S.freeze = false; errCount = 0;
      toast('Có lỗi khi vẽ hình, đã tắt effect và quay về hình an toàn.', 5000); syncPads();
    }
  }
  frameCount++;
  if (now - fpsT > 500) { const el = $('#fps'); if (el) el.textContent = 'FPS ' + Math.round(frameCount * 1000 / (now - fpsT)); frameCount = 0; fpsT = now; }
  schedule();
}
setInterval(() => {
  if (performance.now() - lastTickAt < 400) return;
  if (ROLE === 'control' && document.hidden && !(outWin && !outWin.closed)) tick(); else schedule();
}, 250);

/* ---------- boot ---------- */
async function boot() {
  document.body.dataset.mode = S.mode;
  if (document.fonts && document.fonts.load) ['800 64px "Baloo 2"', '900 64px "Playfair Display"', 'italic 900 64px "Playfair Display"'].forEach(f => document.fonts.load(f, 'ĐỎ vs').catch(() => {}));
  alloc();
  if (ROLE === 'display') {
    setupDisplay();
  } else {
    buildChips(); buildPads();
    $('#cw').value = S.custom[0]; $('#ch').value = S.custom[1]; $('#resSel').value = String(S.res);
    setSwitch('#soundSw', S.sound); setSwitch('#stkFxSw', S.stickerFx); setSwitch('#limitSw', S.limit); setSwitch('#xfadeSw', S.xfade); $('#limitWarn').hidden = S.limit;
    $$('#padModeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pm === S.padMode)));
    wire(); setMode(S.mode); setTab('fx');
    renderStickerSel(); drawTray(); renderMedia(); syncPads(); uiBpm(true); setDim(1);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawTray);
    rcList(); rcStart();
  }
  last = performance.now(); schedule();
}
async function restore() {
  /* restore saved media and custom stickers */
  const cs = (await idbAll('stickers')).sort((a, b) => a.t - b.t);
  for (const r of cs) await addCustomSticker(new File([r.blob], r.name, { type: r.type }), { id: r.id, persist: false });
  if (cs.length && ROLE === 'control') drawTray();
  const ms = (await idbAll('media')).sort((a, b) => a.t - b.t);
  for (const r of ms) await addMedia(new File([r.blob], r.name, { type: r.type }), { id: r.id, t: r.t, persist: false });
  if (ms.length && ROLE === 'control') { renderMedia(); syncPads(); }
  if (ROLE === 'control') { await reloadFolder(false); mediaInfo(); }
  if (ROLE === 'display' && D.pendingMedia) { const i = S.media.findIndex(m => m.id === D.pendingMedia); if (i >= 0) { selectMedia(i); D.pendingMedia = null; } }
}
let restoreP = Promise.resolve();
restoreP = new Promise(res => { setTimeout(() => { restore().catch(e => console.warn(e)).then(res); }, 0); });
boot();
window.__plv = { S, R, D, mic, tap, setBpm, ROLE };
