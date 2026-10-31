'use strict';
/* Popping Lollipop VJ · main.js: vòng lặp vẽ và khởi động */
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
      drawOutput(); rcTick(now); syncXF();
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
      Object.values(S.fx).forEach(f => { f.on = false; }); S.freeze = false; S.text.on = false; errCount = 0;
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
  if (ROLE === 'display') setupDisplay();
  else { buildUI(); rcList(); rcStart(); }
  last = performance.now(); schedule();
}
async function restore() {
  const ms = (await idbAll('media')).sort((a, b) => a.t - b.t);
  for (const r of ms) { await addMedia(new File([r.blob], r.name, { type: r.type }), { id: r.id, t: r.t, persist: false }); if (ROLE === 'control' && S.media.length % 4 === 0) renderMediaPads(); }
  if (ROLE === 'control') { await reloadFolder(false); firstLoad(); renderMediaPads(); renderDecks(); renderFocus(); mediaInfo(); }
}
let restoreP = Promise.resolve();
restoreP = new Promise(res => { setTimeout(() => { restore().catch(e => console.warn(e)).then(res); }, 0); });
boot();
window.__plv = { S, R, D, mic, tap, setBpm, ROLE, loadMedia, take, setX };
