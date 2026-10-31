'use strict';
/* Popping Lollipop VJ · output.js */
/* ---------- Output window (same machine) ---------- */
let outWin = null, outCv = null, outCtx = null;
function setOutStatus(msg, tag) { $('#outNote').textContent = msg; if (tag) $('#outTag').textContent = tag; }
async function placeOnSecondScreen(w) {
  try {
    if (!('getScreenDetails' in window)) return;
    const d = await window.getScreenDetails(); const s = d.screens.find(x => x !== d.currentScreen && !x.isPrimary) || d.screens.find(x => x !== d.currentScreen);
    if (s) { w.moveTo(s.availLeft + 40, s.availTop + 40); w.resizeTo(Math.min(1280, s.availWidth - 80), Math.min(720, s.availHeight - 80)); }
  } catch (e) { /* permission denied or unsupported */ }
}
function openOutput() {
  if (outWin && !outWin.closed) { outWin.focus(); return; }
  let w = null; try { w = window.open('', 'plv-output', 'popup=yes,width=960,height=540'); } catch (e) { w = null; }
  if (!w) { setOutStatus('Trình duyệt chặn cửa sổ Output. Cho phép cửa sổ bật lên (biểu tượng cạnh thanh địa chỉ) rồi bấm lại.', 'Output: bị chặn'); return; }
  w.document.open();
  w.document.write('<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Lollipop VJ Output</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden;cursor:none}canvas{display:block;width:100vw;height:100vh}.h{position:fixed;left:0;right:0;bottom:6vh;text-align:center;font:700 18px system-ui,sans-serif;color:#fff;text-shadow:0 2px 6px #000;transition:opacity 1.2s}</style></head><body><canvas id="o"></canvas><div class="h" id="h">Nhấp đúp để bật toàn màn hình. Kéo cửa sổ này sang màn hình thứ hai trước.</div></body></html>');
  w.document.close();
  outWin = w; outCv = w.document.getElementById('o'); outCtx = outCv.getContext('2d');
  const toggle = () => { const de = w.document.documentElement; if (w.document.fullscreenElement) w.document.exitFullscreen(); else if (de.requestFullscreen) de.requestFullscreen().catch(() => {}); };
  w.document.addEventListener('dblclick', toggle);
  w.document.addEventListener('keydown', e => { if (e.key === 'f' || e.key === 'F') toggle(); });
  setTimeout(() => { try { const h = w.document.getElementById('h'); if (h) h.style.opacity = 0; } catch (e) { /* closed */ } }, 6000);
  setOutStatus('Output đang chạy. Kéo cửa sổ sang màn hình thứ hai, nhấp đúp để toàn màn hình. Đừng thu nhỏ cửa sổ điều khiển.', 'Output: đang chạy');
  placeOnSecondScreen(w); keepAwake(true);
}
function drawOutput() {
  if (!outWin) return;
  if (outWin.closed) { outWin = null; setOutStatus('Cửa sổ Output đã đóng. Bấm Mở cửa sổ Output để mở lại.', 'Output: chưa mở'); return; }
  const dpr = outWin.devicePixelRatio || 1, ow = Math.max(2, Math.round(outWin.innerWidth * dpr)), oh = Math.max(2, Math.round(outWin.innerHeight * dpr));
  if (outCv.width !== ow || outCv.height !== oh) { outCv.width = ow; outCv.height = oh; }
  outCtx.fillStyle = '#000'; outCtx.fillRect(0, 0, ow, oh);
  const [x, y, w, h] = fitRect(W, H, ow, oh, S.outFit); outCtx.drawImage(cv, x, y, w, h);
}
function fsEl(el) { const f = el.requestFullscreen || el.webkitRequestFullscreen; if (!f) return Promise.reject(new Error('no-fs')); try { const r = f.call(el); return r && r.then ? r : Promise.resolve(); } catch (e) { return Promise.reject(e); } }
function fsActive() { return document.fullscreenElement || document.webkitFullscreenElement; }
function fsExit() { const f = document.exitFullscreen || document.webkitExitFullscreen; if (f) try { f.call(document); } catch (e) { /* ignore */ } }
function fullscreenStage() {
  if (fsActive()) { fsExit(); return; }
  fsEl(stage).catch(() => toast('Trình duyệt này không cho toàn màn hình ở đây.'));
}

/* wake lock */
let wake = null, wantWake = false;
async function keepAwake(on) {
  if (on !== undefined) wantWake = on;
  if (!wantWake || wake || document.hidden) return;
  try { if ('wakeLock' in navigator) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { /* not allowed now */ }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) keepAwake(); });

/* ---------- audio beep ---------- */
let actx = null;
function beep(f = 880) {
  if (!S.sound || ROLE !== 'control') return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
    const o = actx.createOscillator(), g = actx.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.value = 0.0001; o.connect(g); g.connect(actx.destination);
    const t = actx.currentTime; g.gain.exponentialRampToValueAtTime(0.05, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.start(t); o.stop(t + 0.1);
  } catch (e) { /* ignore */ }
}
