'use strict';
/* Popping Lollipop VJ · ui.js: giao diện bàn điều khiển (media, bàn trộn, effect, cài đặt) */
/* ---------- UI: knobs ---------- */
function makeKnob(def, onInput) {
  const { label, min, max, val } = def, step = def.step || (max - min) / 100;
  const el = document.createElement('div'); el.className = 'knob-wrap';
  el.innerHTML = '<div class="knob" tabindex="0" role="slider" aria-label="' + esc(label) + '" aria-valuemin="' + min + '" aria-valuemax="' + max + '"><div class="knob-cap"><i></i></div></div><div class="knob-label">' + esc(label) + '</div><div class="knob-val"></div>';
  const knob = $('.knob', el), cap = $('.knob-cap', el), valEl = $('.knob-val', el);
  let v = val;
  const fmt = def.fmt || (step >= 1 ? (x => String(Math.round(x))) : (max <= 1 && min >= 0 ? pct : (x => x.toFixed(1))));
  const paint = () => { cap.style.setProperty('--a', (-135 + 270 * (v - min) / (max - min)) + 'deg'); knob.setAttribute('aria-valuenow', v); valEl.textContent = fmt(v); };
  const set = nv => { v = clamp(Math.round(nv / step) * step, min, max); v = Math.round(v * 1000) / 1000; paint(); onInput(v); };
  let sy = 0, sv = 0, drag = false;
  knob.addEventListener('pointerdown', e => { drag = true; sy = e.clientY; sv = v; knob.setPointerCapture(e.pointerId); e.preventDefault(); });
  knob.addEventListener('pointermove', e => { if (drag) set(sv + (sy - e.clientY) / 160 * (max - min)); });
  const end = () => { drag = false; };
  knob.addEventListener('pointerup', end); knob.addEventListener('pointercancel', end);
  knob.addEventListener('wheel', e => { e.preventDefault(); set(v - Math.sign(e.deltaY) * Math.max(step, (max - min) * 0.03)); }, { passive: false });
  knob.addEventListener('keydown', e => { const k = e.key, d = step * (e.shiftKey ? 5 : 1); if (k === 'ArrowUp' || k === 'ArrowRight') { set(v + d); e.preventDefault(); e.stopPropagation(); } else if (k === 'ArrowDown' || k === 'ArrowLeft') { set(v - d); e.preventDefault(); e.stopPropagation(); } });
  paint(); return el;
}

/* ---------- helpers ---------- */
function setSwitch(sel, on) { const el = $(sel); if (el) el.setAttribute('aria-checked', String(!!on)); }
function pressChips(sel, val) { $$(sel + ' [aria-pressed]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(val)))); }
function chipsHTML(list, cur) { return list.map(([v, n]) => '<button type="button" class="chip" data-v="' + v + '" aria-pressed="' + (String(v) === String(cur)) + '">' + esc(n) + '</button>').join(''); }
function onChip(sel, fn) { $(sel).addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) fn(b.dataset.v, b); }); }

/* ---------- media column ---------- */
function mediaPages() { return Math.max(1, Math.ceil((S.media.length + 1) / 16)); }
function renderMediaPads() {
  if (ROLE !== 'control') return;
  S.mpage = clamp(S.mpage, 0, mediaPages() - 1);
  $('#mpLbl').textContent = (S.mpage + 1) + '/' + mediaPages();
  const live = liveSide(), start = S.mpage * 16, out = [];
  for (let i = start; i < start + 16; i++) {
    const m = S.media[i];
    if (!m) { if (i === S.media.length) out.push('<button type="button" class="mt empty-slot" data-add="1" aria-label="Thêm media">+</button>'); continue; }
    const isA = S.deck.a === m.id, isB = S.deck.b === m.id, isLive = (isA && live === 'a') || (isB && live === 'b');
    const tags = (isA ? '<b class="' + (live === 'a' ? 'live' : '') + '">A</b>' : '') + (isB ? '<b class="' + (live === 'b' ? 'live' : '') + '">B</b>' : '');
    out.push('<button type="button" class="mt' + (isA ? ' isa' : '') + (isB ? ' isb' : '') + (isLive ? ' live' : '') + (S.focus === m.id ? ' focus' : '') + '" data-id="' + esc(m.id) + '" style="background-image:url(' + m.thumb + ')" title="' + esc(m.path || m.name) + '"><span class="tag">' + tags + '</span>' + (m.type === 'video' ? '<span class="vid">▶</span>' : '') + '<span class="nm">' + esc(m.name.replace(/\.[^.]+$/, '')) + '</span></button>');
  }
  $('#mgrid').innerHTML = out.join('');
  $('#stageHint').hidden = !!(S.deck.a || S.deck.b);
}
function renderFocus() {
  if (ROLE !== 'control') return;
  const box = $('#focusBox'), m = mediaById(S.focus);
  if (!m) { box.innerHTML = '<p class="note">Bấm một media để chiếu. Giữ Shift khi bấm để thay ngay vào deck đang chiếu.</p>'; return; }
  box.innerHTML = '<div class="title">' + esc(m.path || m.name) + '</div><div class="knobs" id="focusKnobs"></div><div class="row" id="focusRow"></div>';
  const k = $('#focusKnobs', box), row = $('#focusRow', box);
  if (m.type === 'video') {
    k.appendChild(makeKnob({ label: 'Tốc độ', min: 0.25, max: 2, val: m.speed, fmt: v => v.toFixed(2) + 'x' }, v => { m.speed = v; metaSave(m); }));
    const ka = makeKnob({ label: 'Bắt đầu', min: 0, max: 0.95, val: m.trimA, fmt: pct }, v => { m.trimA = Math.min(v, m.trimB - 0.05); metaSave(m); }); ka.classList.add('pro-only'); k.appendChild(ka);
    const kb = makeKnob({ label: 'Kết thúc', min: 0.05, max: 1, val: m.trimB, fmt: pct }, v => { m.trimB = Math.max(v, m.trimA + 0.05); metaSave(m); }); kb.classList.add('pro-only'); k.appendChild(kb);
    const rev = document.createElement('button'); rev.type = 'button'; rev.className = 'switch'; rev.setAttribute('role', 'switch'); rev.setAttribute('aria-checked', String(m.reverse));
    rev.innerHTML = '<span class="track"><span class="thumb"></span></span><span>Chạy ngược</span>';
    rev.addEventListener('click', () => { m.reverse = !m.reverse; rev.setAttribute('aria-checked', String(m.reverse)); metaSave(m); }); row.appendChild(rev);
  }
  const del = document.createElement('button'); del.type = 'button'; del.className = 'gel gel-sm'; del.textContent = m.folder ? 'Bỏ khỏi danh sách' : 'Xoá media';
  del.title = m.folder ? 'File trong thư mục vẫn còn' : 'Xoá khỏi trình duyệt';
  del.addEventListener('click', () => removeMedia(m.id)); row.appendChild(del);
}
function mediaInfo() {
  const el = $('#medInfo'); if (!el) return;
  const up = S.media.filter(m => !m.folder).length, fo = S.media.filter(m => m.folder).length;
  const t = (fo ? fo + ' file từ thư mục "' + S.folderName + '". ' : '') + up + ' file up lẻ, lưu trong trình duyệt này. Đặt tên file 01, 02, 03... để xếp thứ tự.';
  el.textContent = t;
  if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { if (e && e.usage > 1048576) el.textContent = t + ' Đang dùng ' + Math.round(e.usage / 1048576) + ' MB.'; }).catch(() => {});
}

/* ---------- mixer ---------- */
function renderDecks() {
  if (ROLE !== 'control') return;
  const live = liveSide();
  ['a', 'b'].forEach(s => {
    const el = $(s === 'a' ? '#deckA' : '#deckB'), m = mediaById(S.deck[s]);
    el.classList.toggle('live', live === s && !!m);
    $('.th', el).style.backgroundImage = m ? 'url(' + m.thumb + ')' : '';
    $('span', el).textContent = m ? m.name.replace(/\.[^.]+$/, '') : 'Trống';
  });
  syncXF();
  renderMediaPads();
}
let lastLive = 'a';
function syncXF() {
  const xf = $('#xf'); if (document.activeElement !== xf || S.xfAnim) xf.value = Math.round(S.deck.x * 1000);
  const x = S.deck.x; $('#xfVal').textContent = x < 0.02 ? 'đang chiếu A' : x > 0.98 ? 'đang chiếu B' : Math.round((1 - x) * 100) + ' : ' + Math.round(x * 100);
  const l = liveSide(); if (l !== lastLive) { lastLive = l; renderDecks(); }
}

/* ---------- effect pads ---------- */
const padEls = [];
const held = new Map();
function buildPads() {
  const grid = $('#padGrid'); grid.innerHTML = '';
  FX.forEach((f, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pad' + (f.ink ? ' dark-ink' : ''); b.dataset.i = i;
    b.style.setProperty('--c', 'var(' + f.c + ')');
    b.innerHTML = '<span class="k">' + KEYS[i] + '</span><span class="led"></span><span class="n">' + esc(f.name) + '</span>';
    b.setAttribute('aria-label', f.name + ' (phím ' + KEYS[i].toUpperCase() + ')');
    let down = false;
    b.addEventListener('pointerdown', e => { down = true; e.preventDefault(); padDown(i); });
    const up = () => { if (down) { down = false; padUp(i); } };
    b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    b.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.repeat) { e.preventDefault(); e.stopPropagation(); padDown(i); } });
    b.addEventListener('keyup', e => { if (e.key === 'Enter') { e.stopPropagation(); padUp(i); } });
    grid.appendChild(b); padEls.push(b);
  });
}
function syncPads() {
  if (ROLE !== 'control') return;
  FX.forEach((f, i) => { const on = fxActive(f.id); padEls[i].classList.toggle('on', on); padEls[i].setAttribute('aria-pressed', String(on)); });
  renderFxPanel();
}
function padDown(i) {
  const f = FX[i], st = S.fx[f.id]; padEls[i].classList.add('down'); beep(760);
  S.selFx = f.id;
  if (S.padMode === 'hold') { st.on = true; st.held = true; held.set(i, f.id); } else st.on = !st.on;
  syncPads();
}
function padUp(i) {
  padEls[i].classList.remove('down');
  const id = held.get(i); held.delete(i);
  if (id && S.fx[id].held) { S.fx[id].held = false; S.fx[id].on = false; syncPads(); }
}
let fxKnobKey = '';
function renderFxPanel(force) {
  const f = FXD[S.selFx] || FX[0];
  $('#fxName').textContent = 'Chỉnh: ' + f.name + (S.fx[f.id].on ? ' (đang bật)' : '');
  $('#fxDesc').textContent = f.desc;
  const key = f.id + S.mode; if (key === fxKnobKey && !force) return; fxKnobKey = key;
  const box = $('#fxKnobs'); box.innerHTML = '';
  f.params.slice(0, S.mode === 'pro' ? 3 : 2).forEach(p => box.appendChild(makeKnob({ ...p, val: S.fx[f.id].p[p.k] }, v => { S.fx[f.id].p[p.k] = v; save(); })));
}

/* ---------- text ---------- */
function renderTextPanel() {
  const T = S.text;
  $('#txtQuick').innerHTML = '<button type="button" class="chip" data-v="off" aria-pressed="' + !T.on + '">Tắt chữ</button>' + TXT_PRESETS.map(p => '<button type="button" class="chip" data-v="' + p.id + '" aria-pressed="' + (T.on && T.preset === p.id) + '">' + p.name + '</button>').join('');
  $('#txtStyle').innerHTML = chipsHTML(TXT_STYLES.map(p => [p.id, p.name]), T.style);
  $('#txtMotion').innerHTML = chipsHTML(TXT_MOTIONS.map(p => [p.id, p.name]), T.motion);
  $('#txtPos').innerHTML = chipsHTML(TXT_POS.map(p => [p.id, p.name]), T.pos);
  if (document.activeElement !== $('#txtCustom')) $('#txtCustom').value = T.custom;
  if (document.activeElement !== $('#txtLabel')) $('#txtLabel').value = T.label;
  $('#txtTarget').value = T.target;
  const k = $('#txtKnobs'); k.innerHTML = ''; k.appendChild(makeKnob({ label: 'Cỡ chữ', min: 0, max: 1, val: T.size }, v => { T.size = v; save(); }));
}
function setText(preset) {
  if (preset === 'off') S.text.on = false; else if (S.text.on && S.text.preset === preset) S.text.on = false; else { S.text.on = true; S.text.preset = preset; }
  if (preset === 'custom' && !S.text.custom) openDrawer('#textBox');
  renderTextPanel(); save();
}

/* ---------- beat / misc ---------- */
function uiBpm(force) { const el = $('#bpm'); if (force || document.activeElement !== el) el.value = String(Math.round(S.bpm * 10) / 10); }
function updateMicUI() {
  const t = $('#micText'), use = $('#btnUseMic');
  if (!mic.on) { t.textContent = 'Mic đang tắt. Gõ BPM hoặc bấm Tap.'; use.hidden = true; return; }
  if (S.manualLock) { t.textContent = mic.est && mic.conf > 0.4 ? 'Đang giữ BPM bạn gõ. Mic nghe được khoảng ' + Math.round(mic.est) + ' BPM.' : 'Đang giữ BPM bạn gõ. Mic vẫn nghe ở nền.'; use.hidden = !(mic.est && mic.conf > 0.4); }
  else { t.textContent = mic.conf > 0.5 ? 'Mic đã khớp, khoảng ' + Math.round(mic.est) + ' BPM. Tap 4 lần đúng phách 1 để khớp pha.' : 'Mic đang nghe, chưa đủ chắc. Đặt mic gần loa hoặc dùng Tap.'; use.hidden = true; }
}
function setMode(m) { S.mode = m; document.body.dataset.mode = m; $$('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m))); renderFxPanel(true); renderFocus(); save(); }
function safeView() {
  Object.values(S.fx).forEach(f => { f.on = false; f.held = false; });
  S.auto.on = false; S.auto.fx = null; setSwitch('#autoSw', false);
  S.black = false; $('#btnBlack').setAttribute('aria-pressed', 'false'); S.guides = false; setSwitch('#guideSw', false);
  S.drop = false; S.freeze = false; $('#btnFreeze').setAttribute('aria-pressed', 'false'); S.text.on = false; setDim(1);
  syncPads(); renderTextPanel(); beep(520); toast('Đã tắt hết effect, chữ, blackout. Media vẫn giữ nguyên.');
}
function toggleBlack() { S.black = !S.black; $('#btnBlack').setAttribute('aria-pressed', String(S.black)); beep(S.black ? 300 : 500); }
function toggleFreeze() { S.freeze = !S.freeze; $('#btnFreeze').setAttribute('aria-pressed', String(S.freeze)); beep(S.freeze ? 400 : 600); }
function setDim(v) { S.dim = clamp(v, 0, 1); $('#dim').value = Math.round(S.dim * 100); $('#dimVal').textContent = Math.round(S.dim * 100) + '%'; }
function setDrop(on) { if (S.drop === on) return; S.drop = on; $('#btnDrop').classList.toggle('hit', on); syncPads(); }
function phaseShift(d) { S.beats += d; S.epoch++; }
function setPage(d) { S.mpage = clamp(S.mpage + d, 0, mediaPages() - 1); renderMediaPads(); save(); }
function openDrawer(sel) { $('#drawer').classList.add('on'); $('#scrim').classList.add('on'); if (sel) setTimeout(() => $(sel).scrollIntoView({ block: 'start', behavior: 'smooth' }), 50); }
function closeDrawer() { $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); }

/* ---------- build + wiring ---------- */
function buildUI() {
  buildPads();
  $('#lenChips').innerHTML = chipsHTML(XF_LENS, S.deck.len);
  $('#blendChips').innerHTML = chipsHTML(BLENDS.map(b => [b.id, b.name]), S.deck.blend);
  $('#cutChips').innerHTML = chipsHTML(CUT_EVERY.map(([v, n]) => [v, n === 'Tắt' ? n : 'mỗi ' + n + ' nhịp']), S.deck.cut);
  $('#divChips').innerHTML = chipsHTML(DIVS, S.div);
  $('#autoChips').innerHTML = chipsHTML([[8, '8 nhịp'], [16, '16 nhịp']], S.auto.every);
  $('#aspChips').innerHTML = chipsHTML([...Object.keys(ASPECTS).map(a => [a, a]), ['screen', 'Theo màn chiếu'], ['custom', 'Tùy chỉnh']], S.aspect);
  $('#fitChips').innerHTML = chipsHTML(FITS.map(f => [f.id, f.name]), S.outFit);
  $('#mfitChips').innerHTML = chipsHTML(FITS.map(f => [f.id, f.name]), S.mediaFit);
  $('#outKnobs').appendChild(makeKnob({ label: 'Bù trễ màn chiếu', min: -100, max: 300, step: 10, val: S.lat, fmt: v => (v > 0 ? '+' : '') + v + ' ms' }, v => { S.lat = v; save(); }));
  $('#cw').value = S.custom[0]; $('#ch').value = S.custom[1]; $('#resSel').value = String(S.res);
  setSwitch('#soundSw', S.sound); setSwitch('#limitSw', S.limit); setSwitch('#autoTakeSw', S.deck.autoTake); $('#limitWarn').hidden = S.limit;
  $$('#padModeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pm === S.padMode)));
  wire(); setMode(S.mode); renderTextPanel(); syncPads(); uiBpm(true); setDim(1);
  firstLoad(); renderDecks(); renderFocus(); mediaInfo();
}
function wire() {
  $('#btnSettings').addEventListener('click', () => openDrawer());
  $('#btnCloseSet').addEventListener('click', closeDrawer); $('#scrim').addEventListener('click', closeDrawer);
  $('#remoteBadge').addEventListener('click', () => openDrawer('#remoteBox'));
  $('#btnTextSet').addEventListener('click', () => openDrawer('#textBox'));
  $('#modeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });
  $('#soundSw').addEventListener('click', () => { S.sound = !S.sound; setSwitch('#soundSw', S.sound); if (S.sound) beep(); save(); });
  $('#btnSafe').addEventListener('click', safeView);
  $('#btnBlack').addEventListener('click', toggleBlack);
  $('#btnFreeze').addEventListener('click', toggleFreeze);
  $('#dim').addEventListener('input', e => setDim(e.target.value / 100));
  const drop = $('#btnDrop');
  drop.addEventListener('pointerdown', e => { e.preventDefault(); drop.setPointerCapture(e.pointerId); setDrop(true); beep(1500); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => drop.addEventListener(ev, () => setDrop(false)));
  $('#btnOut').addEventListener('click', openOutput);
  $('#btnFull').addEventListener('click', () => { closeDrawer(); fullscreenStage(); });
  $('#padModeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.padMode = b.dataset.pm; $$('#padModeSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); save(); });
  $('#btnFxOff').addEventListener('click', () => { Object.values(S.fx).forEach(f => { f.on = false; f.held = false; }); S.auto.fx = null; syncPads(); });
  /* media */
  $('#mgrid').addEventListener('click', e => {
    const b = e.target.closest('.mt'); if (!b) return;
    if (b.dataset.add) { $('#fileMed').click(); return; }
    beep(920); loadMedia(b.dataset.id, { live: e.shiftKey });
  });
  $('#btnUpMed').addEventListener('click', () => $('#fileMed').click());
  $('#fileMed').addEventListener('change', e => { handleFiles(e.target.files); e.target.value = ''; });
  $('#btnFolder').addEventListener('click', pickFolder);
  $('#btnFolderReload').addEventListener('click', () => reloadFolder(true));
  $('#fileDir').addEventListener('change', e => { const list = Array.from(e.target.files).map(f => ({ file: f, path: f.webkitRelativePath ? f.webkitRelativePath.split('/').slice(1).join('/') : f.name })); const nm = (e.target.files[0] && e.target.files[0].webkitRelativePath || '').split('/')[0] || 'thư mục'; loadFolderFiles(list, nm); e.target.value = ''; toast('Trình duyệt này không nhớ thư mục, lần sau mở app cần chọn lại.', 5000); });
  $('#mpPrev').addEventListener('click', () => setPage(-1)); $('#mpNext').addEventListener('click', () => setPage(1));
  let dragN = 0; const veil = $('#dropveil');
  window.addEventListener('dragenter', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) { dragN++; veil.classList.add('on'); } });
  window.addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) veil.classList.remove('on'); });
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => { e.preventDefault(); dragN = 0; veil.classList.remove('on'); if (e.dataTransfer && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); });
  /* mixer */
  const xf = $('#xf');
  xf.addEventListener('input', () => { setX(xf.value / 1000); syncXF(); });
  xf.addEventListener('change', save);
  $('#btnTake').addEventListener('click', () => { take(); beep(1200); });
  onChip('#lenChips', v => { S.deck.len = +v; pressChips('#lenChips', v); save(); });
  onChip('#blendChips', v => { S.deck.blend = v; pressChips('#blendChips', v); save(); });
  onChip('#cutChips', v => { S.deck.cut = +v; pressChips('#cutChips', v); save(); });
  $('#autoTakeSw').addEventListener('click', () => { S.deck.autoTake = !S.deck.autoTake; setSwitch('#autoTakeSw', S.deck.autoTake); save(); });
  /* beat */
  const bpmEl = $('#bpm');
  const commit = () => { const v = parseFloat(bpmEl.value.replace(',', '.')); if (isFinite(v)) setBpm(v, true); else uiBpm(true); };
  bpmEl.addEventListener('change', commit); bpmEl.addEventListener('keydown', e => { if (e.key === 'Enter') { commit(); bpmEl.blur(); } });
  $('#bpmDown').addEventListener('click', () => setBpm(S.bpm - 1, true)); $('#bpmUp').addEventListener('click', () => setBpm(S.bpm + 1, true));
  $('#btnTap').addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
  $('#btnTap').addEventListener('click', e => { if (e.detail === 0) tap(); });
  $('#btnX2').addEventListener('click', () => setBpm(S.bpm * 2 > 220 ? S.bpm : S.bpm * 2, true));
  $('#btnHalf').addEventListener('click', () => setBpm(S.bpm / 2 < 40 ? S.bpm : S.bpm / 2, true));
  $('#nudgeL').addEventListener('click', () => phaseShift(-0.06)); $('#nudgeR').addEventListener('click', () => phaseShift(0.06));
  $('#btnDown1').addEventListener('click', () => { S.beats = Math.round(S.beats / 4) * 4; S.epoch++; });
  onChip('#divChips', v => { S.div = parseFloat(v); pressChips('#divChips', v); save(); });
  onChip('#autoChips', v => { S.auto.every = +v; S.auto.last = -1; pressChips('#autoChips', v); });
  $('#autoSw').addEventListener('click', () => { S.auto.on = !S.auto.on; S.auto.last = -1; setSwitch('#autoSw', S.auto.on); });
  $('#micSw').addEventListener('click', () => { if (mic.on) micStop(); else micStart(); });
  $('#btnUseMic').addEventListener('click', () => { S.manualLock = false; updateMicUI(); });
  /* text */
  onChip('#txtQuick', v => setText(v));
  onChip('#txtStyle', v => { S.text.style = v; renderTextPanel(); save(); });
  onChip('#txtMotion', v => { S.text.motion = v; renderTextPanel(); save(); });
  onChip('#txtPos', v => { S.text.pos = v; renderTextPanel(); save(); });
  $('#txtCustom').addEventListener('input', e => { S.text.custom = e.target.value; if (!S.text.on || S.text.preset !== 'custom') { S.text.on = true; S.text.preset = 'custom'; renderTextPanel(); } save(); });
  $('#txtLabel').addEventListener('input', e => { S.text.label = e.target.value; save(); });
  $('#txtTarget').addEventListener('change', e => { S.text.target = e.target.value || '00:00'; save(); });
  /* settings */
  onChip('#aspChips', v => { S.aspect = v; pressChips('#aspChips', v); alloc(); save(); });
  onChip('#fitChips', v => { S.outFit = v; pressChips('#fitChips', v); save(); });
  onChip('#mfitChips', v => { S.mediaFit = v; pressChips('#mfitChips', v); save(); });
  const applyCustom = () => { const w = clamp(parseInt($('#cw').value, 10) || 21, 1, 64), h = clamp(parseInt($('#ch').value, 10) || 9, 1, 64); S.custom = [w, h]; $('#cw').value = w; $('#ch').value = h; S.aspect = 'custom'; pressChips('#aspChips', 'custom'); alloc(); save(); };
  $('#cw').addEventListener('change', applyCustom); $('#ch').addEventListener('change', applyCustom);
  $('#resSel').addEventListener('change', e => { S.res = +e.target.value; alloc(); save(); });
  $('#guideSw').addEventListener('click', () => { S.guides = !S.guides; setSwitch('#guideSw', S.guides); });
  $('#limitSw').addEventListener('click', () => { S.limit = !S.limit; setSwitch('#limitSw', S.limit); $('#limitWarn').hidden = S.limit; save(); });
  $('#rcRestart').addEventListener('click', () => { R.tries = 0; rcStart(); });
  $('#rcNew').addEventListener('click', () => { R.code = newCode(); lsSet('plv-control-code', R.code); R.tries = 0; rcStart(); toast('Mã mới: ' + R.code + '. Màn chiếu cần nhập lại mã.'); });
  $('#rcCopy').addEventListener('click', () => { const u = displayURL(); if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => toast('Đã chép địa chỉ màn chiếu.'), () => toast(u, 6000)); else toast(u, 6000); });
  /* keyboard */
  const keyIdx = Object.fromEntries(KEYS.map((k, i) => [k, i]));
  const typing = e => { const tg = e.target && e.target.tagName; return tg === 'INPUT' && e.target.type !== 'range' || tg === 'SELECT' || tg === 'TEXTAREA'; };
  window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); if (!e.repeat) setDrop(true); return; }
    if (k === 'arrowright' || k === 'arrowleft') { e.preventDefault(); stepFocus(k === 'arrowright' ? 1 : -1); return; }
    if (k === 'enter' && !(e.target && e.target.closest && e.target.closest('.pad'))) { e.preventDefault(); if (!e.repeat) { take(); beep(1200); } return; }
    if (k === 'escape') { closeDrawer(); return; }
    if (e.repeat) return;
    if (k in keyIdx) padDown(keyIdx[k]);
    else if (k === 't') tap();
    else if (k === 'b') toggleBlack();
    else if (k === 'h') safeView();
    else if (k === 'p') toggleFreeze();
    else if (k === '[') setPage(-1);
    else if (k === ']') setPage(1);
  });
  window.addEventListener('keyup', e => {
    if (typing(e)) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); setDrop(false); return; }
    if (k in keyIdx) padUp(keyIdx[k]);
  });
  window.addEventListener('blur', () => { setDrop(false); held.forEach((id, i) => padUp(i)); });
  document.addEventListener('fullscreenchange', () => { $('#btnFull').textContent = fsActive() ? 'Thoát toàn màn hình' : 'Xem thử toàn màn hình'; });
}
