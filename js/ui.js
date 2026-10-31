'use strict';
/* Popping Lollipop VJ · ui.js */
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

/* ---------- UI: effect panel ---------- */
let fxKnobKey = '';
function renderFxPanel(force) {
  const f = FXD[S.selFx] || FX[0];
  $('#fxName').textContent = f.name + (S.fx[f.id].on ? ' · đang bật' : ''); $('#fxDesc').textContent = f.desc;
  $('#fxPick').innerHTML = FX.map(x => '<button type="button" class="chip" data-id="' + x.id + '" aria-pressed="' + (x.id === f.id) + '">' + esc(x.name) + (S.fx[x.id].on ? ' ●' : '') + '</button>').join('');
  const key = f.id + S.mode; if (key === fxKnobKey && !force) return; fxKnobKey = key;
  const box = $('#fxKnobs'); box.innerHTML = '';
  const n = S.mode === 'pro' ? 3 : 2;
  f.params.slice(0, n).forEach(p => box.appendChild(makeKnob({ ...p, val: S.fx[f.id].p[p.k] }, v => { S.fx[f.id].p[p.k] = v; save(); })));
}

/* ---------- UI: generator panel ---------- */
function chipRow(title, key, opts, curv, extra) {
  return '<div class="group"><span class="lbl">' + title + '</span><div class="chips" data-key="' + key + '">' + opts.map(o => '<button type="button" class="chip" data-val="' + o.id + '" aria-pressed="' + (String(curv) === String(o.id)) + '">' + (extra ? extra(o) : '') + esc(o.name) + '</button>').join('') + '</div></div>';
}
function renderGenPanel() {
  const g = S.gen, body = $('#genBody');
  const pal = PALS.map((p, i) => ({ id: i, name: p.name, c: p.c }));
  body.innerHTML =
    chipRow('Hình', 'shape', SHAPES, g.shape, o => '<canvas width="48" height="48" data-shape="' + o.id + '"></canvas>') +
    chipRow('Chuyển động', 'motion', MOTIONS, g.motion) +
    chipRow('Nhân bản', 'multi', MULTIS, g.multi) +
    chipRow('Màu', 'pal', pal, g.pal, o => '<span class="sw">' + o.c.slice(0, 3).map(c => '<i style="background:' + c + '"></i>').join('') + '</span>') +
    chipRow('Nguồn điều khiển', 'ctl', CTLS, g.ctl) +
    '<div class="knobs" id="genKnobs"></div>' +
    '<div class="group"><span class="lbl">Lưu công thức vào pad (bàn Cảnh)</span><div class="chips" id="saveChips">' + S.gens.map((x, i) => '<button type="button" class="chip" data-slot="' + i + '">' + KEYS[i].toUpperCase() + ' · ' + esc(x.name) + '</button>').join('') + '</div></div>';
  $$('canvas[data-shape]', body).forEach(c => { const x = c.getContext('2d'); x.translate(24, 24); drawShape(x, c.dataset.shape, 15, '#FF4FA3', 0); });
  const kn = $('#genKnobs');
  [{ k: 'size', label: 'Kích thước', min: 0.2, max: 1, val: g.size }, { k: 'count', label: 'Số lượng', min: 2, max: 10, step: 1, val: g.count, fmt: v => v }, { k: 'speed', label: 'Tốc độ trôi', min: 0.1, max: 1, val: g.speed }]
    .forEach(d => kn.appendChild(makeKnob(d, v => { S.gen[d.k] = v; S.source = 'gen'; syncPads(); save(); })));
}
function dice(quiet) {
  S.gen = { shape: pick(SHAPES).id, motion: pick(MOTIONS).id, multi: pick(MULTIS).id, pal: Math.floor(rnd(0, PALS.length)), size: rnd(0.45, 0.95), count: Math.floor(rnd(3, 9)), speed: rnd(0.3, 0.9), ctl: pick(['0.5', '1', '1', '2', 'free']) };
  if (S.source === 'media') selectMedia(-1);
  S.source = 'gen'; S.genSlot = -1; if (S.tab === 'gen') renderGenPanel(); syncPads(); if (!quiet) beep(660); save();
}
function setGenSlot(i, quiet) { if (S.source === 'media') selectMedia(-1); S.source = 'gen'; S.genSlot = i; S.gen = { ...S.gens[i].g }; if (S.tab === 'gen') renderGenPanel(); if (!quiet) save(); }

/* ---------- UI: stickers ---------- */
function drawTray() {
  const tray = $('#tray'); tray.innerHTML = '';
  const kinds = [...STICKERS.map(s => ({ id: s.id, name: s.name })), ...S.customStickers.map(c => ({ id: 'img:' + c.id, name: c.name }))];
  kinds.forEach(k => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Dán ' + k.name); b.title = k.name;
    const c = document.createElement('canvas'); c.width = 112; c.height = 112; const x = c.getContext('2d'); x.translate(56, 56);
    if (k.id.startsWith('img:')) { const cs = S.customStickers.find(z => 'img:' + z.id === k.id); if (cs && cs.img.naturalWidth) { const s = 96 / Math.max(cs.img.naturalWidth, cs.img.naturalHeight); x.drawImage(cs.img, -cs.img.naturalWidth * s / 2, -cs.img.naturalHeight * s / 2, cs.img.naturalWidth * s, cs.img.naturalHeight * s); } }
    else drawKind(x, k.id, 42);
    b.appendChild(c); b.addEventListener('click', () => { addSticker(k.id, { x: rnd(0.3, 0.7), y: rnd(0.3, 0.7) }); beep(990); }); tray.appendChild(b);
  });
}
function renderStickerSel() {
  const box = $('#stkSel'); const st = S.stickers[S.selSticker];
  if (!st) { box.innerHTML = '<div class="empty">Chọn một sticker trên khung xem thử để đổi kích thước, chuyển động hoặc xóa.</div>'; return; }
  box.innerHTML = '<div class="group"><span class="lbl">Sticker đang chọn</span><div class="chips" id="smChips">' + SMOTIONS.map(m => '<button type="button" class="chip" data-m="' + m.id + '" aria-pressed="' + (st.motion === m.id) + '">' + m.name + '</button>').join('') + '</div></div><div class="row" id="stkRow"></div>';
  const row = $('#stkRow', box);
  row.appendChild(makeKnob({ label: 'Kích thước', min: 0.06, max: 0.45, val: st.size, fmt: pct }, v => { st.size = v; save(); }));
  const del = document.createElement('button'); del.type = 'button'; del.className = 'gel gel-sm'; del.textContent = 'Xóa sticker này'; del.addEventListener('click', () => { S.stickers.splice(S.selSticker, 1); S.selSticker = -1; renderStickerSel(); save(); }); row.appendChild(del);
  $$('#smChips .chip', box).forEach(c => c.addEventListener('click', () => { st.motion = c.dataset.m; renderStickerSel(); save(); }));
}

/* ---------- UI: text ---------- */
function renderTextPanel() {
  const T = S.text;
  $('#txtPreset').innerHTML = '<button type="button" class="chip" data-v="off" aria-pressed="' + !T.on + '">Tắt chữ</button>' + TXT_PRESETS.map(p => '<button type="button" class="chip" data-v="' + p.id + '" aria-pressed="' + (T.on && T.preset === p.id) + '">' + p.name + '</button>').join('');
  $('#txtStyle').innerHTML = TXT_STYLES.map(p => '<button type="button" class="chip" data-v="' + p.id + '" aria-pressed="' + (T.style === p.id) + '">' + p.name + '</button>').join('');
  $('#txtMotion').innerHTML = TXT_MOTIONS.map(p => '<button type="button" class="chip" data-v="' + p.id + '" aria-pressed="' + (T.motion === p.id) + '">' + p.name + '</button>').join('');
  $('#txtPos').innerHTML = TXT_POS.map(p => '<button type="button" class="chip" data-v="' + p.id + '" aria-pressed="' + (T.pos === p.id) + '">' + p.name + '</button>').join('');
  if (document.activeElement !== $('#txtCustom')) $('#txtCustom').value = T.custom;
  if (document.activeElement !== $('#txtLabel')) $('#txtLabel').value = T.label;
  $('#txtTarget').value = T.target;
  const k = $('#txtKnobs'); k.innerHTML = ''; k.appendChild(makeKnob({ label: 'Cỡ chữ', min: 0, max: 1, val: T.size }, v => { T.size = v; save(); }));
}
function setText(preset) { if (preset === 'off') S.text.on = false; else if (S.text.on && S.text.preset === preset) S.text.on = false; else { S.text.on = true; S.text.preset = preset; } renderTextPanel(); syncPads(); save(); }

/* ---------- UI: media ---------- */
function renderMedia() {
  const lib = $('#mlib');
  if (!S.media.length) lib.innerHTML = '<div class="empty" style="grid-column:1/-1">Chưa có media. Thêm ảnh hoặc video ngắn, hoặc kéo thả vào trang. Generator Studio vẫn chạy khi chưa có gì.</div>';
  else lib.innerHTML = S.media.map((m, i) => '<button type="button" class="mitem" data-i="' + i + '" aria-pressed="' + (S.source === 'media' && S.mediaSel === i) + '" style="background-image:url(' + m.thumb + ')" aria-label="' + esc(m.name) + '">' + ('<em>' + (Math.floor(i / 16) + 1) + '·' + KEYS[i % 16].toUpperCase() + '</em>') + '<span>' + esc(m.name) + '</span></button>').join('');
  $$('.mitem', lib).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i; if (S.source === 'media' && S.mediaSel === i) { selectMedia(-1); } else selectMedia(i); renderMedia(); syncPads(); }));
  const box = $('#medSel'), m = S.media[S.mediaSel];
  if (!m) { box.innerHTML = ''; mediaInfo(); return; }
  box.innerHTML = '<div class="group"><span class="lbl">Cách đặt hình vào khung</span><div class="chips" id="mfChips">' + FITS.map(f => '<button type="button" class="chip" data-f="' + f.id + '" aria-pressed="' + (S.mediaFit === f.id) + '">' + f.name + '</button>').join('') + '</div></div><div class="knobs" id="medKnobs"></div>';
  $$('#mfChips .chip', box).forEach(c => c.addEventListener('click', () => { S.mediaFit = c.dataset.f; renderMedia(); save(); }));
  const k = $('#medKnobs', box);
  if (m.type === 'video') {
    k.appendChild(makeKnob({ label: 'Tốc độ', min: 0.25, max: 2, val: m.speed, fmt: v => v.toFixed(2) + 'x' }, v => { m.speed = v; metaSave(m); }));
    const rev = document.createElement('div'); rev.className = 'knob-wrap'; rev.style.width = '110px';
    rev.innerHTML = '<button type="button" class="switch" role="switch" aria-checked="' + m.reverse + '"><span class="track"><span class="thumb"></span></span><span>Chạy ngược</span></button>';
    $('.switch', rev).addEventListener('click', e => { m.reverse = !m.reverse; e.currentTarget.setAttribute('aria-checked', m.reverse); metaSave(m); }); k.appendChild(rev);
    const ka = makeKnob({ label: 'Bắt đầu', min: 0, max: 0.95, val: m.trimA, fmt: pct }, v => { m.trimA = Math.min(v, m.trimB - 0.05); metaSave(m); }); ka.classList.add('pro-only'); k.appendChild(ka);
    const kb = makeKnob({ label: 'Kết thúc', min: 0.05, max: 1, val: m.trimB, fmt: pct }, v => { m.trimB = Math.max(v, m.trimA + 0.05); metaSave(m); }); kb.classList.add('pro-only'); k.appendChild(kb);
  }
  const del = document.createElement('button'); del.type = 'button'; del.className = 'gel gel-sm'; del.textContent = m.folder ? 'Bỏ khỏi danh sách (file trong thư mục vẫn còn)' : 'Xóa media này'; del.addEventListener('click', () => removeMedia(S.mediaSel)); box.appendChild(del);
  mediaInfo();
}

/* ---------- UI: pads ---------- */
const padEls = [];
const held = new Map();
function mediaPages() { return Math.max(1, Math.ceil((S.media.length + 1) / 16)); }
function bankDefs() {
  if (S.bank === 'media') { S.mpage = clamp(S.mpage, 0, mediaPages() - 1); return KEYS.map((k, i) => ({ t: 'med', i: S.mpage * 16 + i })); }
  return BANKS[S.bank] || BANKS.fx;
}
function padDef(i) { return bankDefs()[i]; }
function mediaInfo() {
  const el = $('#medInfo'); if (!el) return;
  const up = S.media.filter(m => !m.folder).length, fo = S.media.filter(m => m.folder).length;
  let t = up + ' file đã up được lưu trong trình duyệt này' + (fo ? ', ' + fo + ' file từ thư mục "' + S.folderName + '"' : '') + '. Sắp theo tên file: đặt tên 01, 02, 03... để xếp thứ tự pad.';
  el.textContent = t;
  if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { if (e && e.usage) el.textContent = t + ' Dung lượng đang dùng: ' + Math.round(e.usage / 1048576) + ' MB.'; }).catch(() => {});
}
function buildPads() {
  const grid = $('#padGrid'); grid.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pad'; b.dataset.i = i;
    b.innerHTML = '<span class="k">' + KEYS[i] + '</span><span class="led"></span><span class="n"></span>';
    let down = false;
    b.addEventListener('pointerdown', e => { down = true; e.preventDefault(); padDown(i); });
    const up = () => { if (down) { down = false; padUp(i); } };
    b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    b.addEventListener('keydown', e => { if ((e.key === 'Enter') && !e.repeat) { e.preventDefault(); padDown(i); } });
    b.addEventListener('keyup', e => { if (e.key === 'Enter') padUp(i); });
    grid.appendChild(b); padEls.push(b);
  }
}
const TXT_NAMES = { title: 'Chữ: Rabbit Hole', queens: 'Chữ: Hai nữ hoàng', aura: 'Chữ: Aura Battle', count: 'Chữ: Đếm ngược' };
function syncPads() {
  if (ROLE !== 'control') return;
  $$('#bankSeg button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.bank === S.bank)));
  const mpb = $('#mpageBox'); mpb.hidden = S.bank !== 'media'; $('#mpLbl').textContent = 'Trang ' + (S.mpage + 1) + '/' + mediaPages();
  bankDefs().forEach((p, i) => {
    const el = padEls[i], n = $('.n', el); let on = false, name = '', thumb = '', col = '--lilac', ink = false;
    if (p.t === 'fx') { const f = FXD[p.id]; name = f.name; on = fxActive(p.id); col = f.c; ink = !!f.ink; }
    else if (p.t === 'gen') { name = S.gens[p.i].name; on = S.source === 'gen' && S.genSlot === p.i; col = p.i >= 4 ? '--red' : '--lilac'; ink = p.i >= 4; }
    else if (p.t === 'med') { const m = S.media[p.i]; col = '--aqua'; if (m) { name = m.name.replace(/\.[^.]+$/, ''); thumb = m.thumb; on = S.source === 'media' && S.mediaSel === p.i; } else name = 'Thêm media'; }
    else if (p.t === 'stk') { name = 'Dán bừa sticker'; col = '--sun'; }
    else if (p.t === 'txt') { name = TXT_NAMES[p.id]; on = S.text.on && S.text.preset === p.id; col = '--ivory'; }
    n.textContent = name; el.classList.toggle('on', on);
    el.style.setProperty('--c', 'var(' + col + ')');
    el.classList.toggle('dark-ink', ink);
    el.classList.toggle('media-thumb', !!thumb);
    el.style.backgroundImage = thumb ? 'url(' + thumb + ')' : '';
    let plus = $('.plus', el);
    if (p.t === 'med' && !S.media[p.i]) { if (!plus) { plus = document.createElement('span'); plus.className = 'plus'; plus.textContent = '+'; el.insertBefore(plus, n); } } else if (plus) plus.remove();
    el.setAttribute('aria-pressed', on);
    el.setAttribute('aria-label', name + ' (phím ' + KEYS[i].toUpperCase() + ')');
  });
  if (S.tab === 'fx') renderFxPanel();
}
function padDown(i) {
  const p = padDef(i); padEls[i].classList.add('down'); beep(p.t === 'fx' ? 760 : 920);
  if (p.t === 'fx') {
    const f = S.fx[p.id]; S.selFx = p.id;
    if (S.padMode === 'hold') { f.on = true; f.held = true; held.set(i, p); } else f.on = !f.on;
  } else if (p.t === 'gen') { setGenSlot(p.i); }
  else if (p.t === 'med') {
    if (!S.media[p.i]) $('#fileMed').click();
    else if (S.source === 'media' && S.mediaSel === p.i) { selectMedia(-1); renderMedia(); }
    else { selectMedia(p.i); renderMedia(); }
  } else if (p.t === 'stk') { scatter(6); }
  else if (p.t === 'txt') setText(p.id);
  syncPads();
}
function padUp(i) {
  padEls[i].classList.remove('down');
  const p = held.get(i); held.delete(i);
  if (p && p.t === 'fx' && S.fx[p.id].held) { S.fx[p.id].held = false; S.fx[p.id].on = false; syncPads(); }
}
function setBank(b) { S.bank = b; held.clear(); syncPads(); save(); }
function cycleBank() { const order = ['fx', 'scene', 'media']; setBank(order[(order.indexOf(S.bank) + 1) % 3]); }
function setPage(d) { S.mpage = clamp(S.mpage + d, 0, mediaPages() - 1); syncPads(); save(); }

/* ---------- UI: misc wiring ---------- */
function setSwitch(sel, on) { const el = $(sel); if (el) el.setAttribute('aria-checked', String(!!on)); }
function pressChips(sel, val) { $$(sel + ' [aria-pressed]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(val)))); }
function uiBpm(force) { const el = $('#bpm'); if (force || document.activeElement !== el) el.value = String(Math.round(S.bpm * 10) / 10); }
function updateMicUI() {
  const t = $('#micText'), use = $('#btnUseMic');
  if (!mic.on) { t.textContent = 'Mic đang tắt. Gõ BPM hoặc bấm Tap.'; use.hidden = true; return; }
  if (S.manualLock) { t.textContent = mic.est && mic.conf > 0.4 ? 'Đang giữ BPM bạn gõ. Mic nghe được khoảng ' + Math.round(mic.est) + ' BPM.' : 'Đang giữ BPM bạn gõ. Mic vẫn nghe ở nền.'; use.hidden = !(mic.est && mic.conf > 0.4); }
  else { t.textContent = mic.conf > 0.5 ? 'Mic đã khớp nhịp, khoảng ' + Math.round(mic.est) + ' BPM. Bấm Tap 4 lần đúng phách 1 để khớp pha.' : 'Mic đang nghe, chưa đủ chắc để đổi BPM. Đặt mic gần loa hoặc dùng Tap.'; use.hidden = true; }
}
function buildChips() {
  $('#divChips').innerHTML = DIVS.map(d => '<button type="button" class="chip" data-v="' + d[0] + '" aria-pressed="' + (S.div === d[0]) + '">' + d[1] + '</button>').join('');
  $('#autoChips').innerHTML = [8, 16].map(n => '<button type="button" class="chip" data-v="' + n + '" aria-pressed="' + (S.auto.every === n) + '">' + n + ' nhịp</button>').join('');
  $('#aspChips').innerHTML = [...Object.keys(ASPECTS), 'screen', 'custom'].map(a => '<button type="button" class="chip' + (a === 'custom' ? ' pro-only' : '') + '" data-v="' + a + '" aria-pressed="' + (S.aspect === a) + '">' + (a === 'custom' ? 'Tùy chỉnh' : a === 'screen' ? 'Theo màn chiếu' : a) + '</button>').join('');
  $('#fitChips').innerHTML = FITS.map(f => '<button type="button" class="chip" data-v="' + f.id + '" aria-pressed="' + (S.outFit === f.id) + '">' + f.name + '</button>').join('');
  const ok = $('#outKnobs'); ok.innerHTML = '';
  ok.appendChild(makeKnob({ label: 'Bù trễ màn chiếu', min: -100, max: 300, step: 10, val: S.lat, fmt: v => (v > 0 ? '+' : '') + v + ' ms' }, v => { S.lat = v; save(); }));
}
function setMode(m) {
  S.mode = m; document.body.dataset.mode = m;
  $$('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  renderFxPanel(); renderMedia(); save();
}
function setTab(t) {
  S.tab = t;
  $$('#tabs .tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  ['fx', 'gen', 'stk', 'txt', 'med', 'out'].forEach(k => { $('#tp-' + k).hidden = k !== t; });
  if (t === 'fx') renderFxPanel(); else if (t === 'gen') renderGenPanel(); else if (t === 'txt') renderTextPanel();
}
function safeView() {
  Object.values(S.fx).forEach(f => { f.on = false; f.held = false; });
  S.auto.on = false; S.auto.fx = null; setSwitch('#autoSw', false); S.black = false; $('#btnBlack').setAttribute('aria-pressed', 'false'); S.guides = false; setSwitch('#guideSw', false);
  S.drop = false; S.freeze = false; $('#btnFreeze').setAttribute('aria-pressed', 'false'); S.text.on = false; setDim(1);
  setGenSlot(SAFE_GEN); syncPads(); renderFxPanel(); if (S.tab === 'txt') renderTextPanel(); beep(520);
}
function toggleBlack() { S.black = !S.black; $('#btnBlack').setAttribute('aria-pressed', String(S.black)); beep(S.black ? 300 : 500); }
function toggleFreeze() { S.freeze = !S.freeze; $('#btnFreeze').setAttribute('aria-pressed', String(S.freeze)); beep(S.freeze ? 400 : 600); }
function setDim(v) { S.dim = clamp(v, 0, 1); $('#dim').value = Math.round(S.dim * 100); $('#dimVal').textContent = Math.round(S.dim * 100) + '%'; }
function setDrop(on) { if (S.drop === on) return; S.drop = on; $('#btnDrop').classList.toggle('hit', on); syncPads(); }
function phaseShift(d) { S.beats += d; S.epoch++; }

function wire() {
  $('#modeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });
  $('#bankSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setBank(b.dataset.bank); });
  $('#soundSw').addEventListener('click', () => { S.sound = !S.sound; setSwitch('#soundSw', S.sound); if (S.sound) beep(); save(); });
  $('#btnSafe').addEventListener('click', safeView);
  $('#btnBlack').addEventListener('click', toggleBlack);
  $('#btnFreeze').addEventListener('click', toggleFreeze);
  $('#dim').addEventListener('input', e => setDim(e.target.value / 100));
  const drop = $('#btnDrop');
  drop.addEventListener('pointerdown', e => { e.preventDefault(); drop.setPointerCapture(e.pointerId); setDrop(true); beep(1500); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => drop.addEventListener(ev, () => setDrop(false)));
  $('#btnOut').addEventListener('click', openOutput); $('#btnOut2').addEventListener('click', openOutput);
  $('#btnFull').addEventListener('click', fullscreenStage);
  $('#remoteBadge').addEventListener('click', () => { setTab('out'); $('#remoteBox').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) { setTab(b.dataset.tab); beep(700); } });
  $('#padModeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.padMode = b.dataset.pm; $$('#padModeSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); save(); });
  /* beat deck */
  const bpmEl = $('#bpm');
  const commit = () => { const v = parseFloat(bpmEl.value.replace(',', '.')); if (isFinite(v)) setBpm(v, true); else uiBpm(true); };
  bpmEl.addEventListener('change', commit); bpmEl.addEventListener('keydown', e => { if (e.key === 'Enter') { commit(); bpmEl.blur(); } });
  $('#bpmDown').addEventListener('click', () => setBpm(S.bpm - 1, true)); $('#bpmUp').addEventListener('click', () => setBpm(S.bpm + 1, true));
  $('#btnTap').addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
  $('#btnTap').addEventListener('keydown', e => { if ((e.key === 'Enter') && !e.repeat) { e.preventDefault(); tap(); } });
  $('#btnX2').addEventListener('click', () => setBpm(S.bpm * 2 > 220 ? S.bpm : S.bpm * 2, true));
  $('#btnHalf').addEventListener('click', () => setBpm(S.bpm / 2 < 40 ? S.bpm : S.bpm / 2, true));
  $('#nudgeL').addEventListener('click', () => phaseShift(-0.06)); $('#nudgeR').addEventListener('click', () => phaseShift(0.06));
  $('#btnDown1').addEventListener('click', () => { S.beats = Math.round(S.beats / 4) * 4; S.epoch++; });
  $('#divChips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; S.div = parseFloat(b.dataset.v); pressChips('#divChips', S.div); save(); });
  $('#autoChips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; S.auto.every = +b.dataset.v; S.auto.last = -1; pressChips('#autoChips', S.auto.every); });
  $('#autoSw').addEventListener('click', () => { S.auto.on = !S.auto.on; S.auto.last = -1; setSwitch('#autoSw', S.auto.on); });
  $('#micSw').addEventListener('click', () => { if (mic.on) micStop(); else micStart(); });
  $('#btnUseMic').addEventListener('click', () => { S.manualLock = false; updateMicUI(); });
  /* effect panel */
  $('#btnFxOff').addEventListener('click', () => { Object.values(S.fx).forEach(f => { f.on = false; f.held = false; }); S.auto.fx = null; syncPads(); });
  $('#fxPick').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; S.selFx = b.dataset.id; renderFxPanel(); });
  /* generator */
  $('#btnDice').addEventListener('click', () => dice());
  $('#genBody').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    if (chip.dataset.slot !== undefined) {
      const i = +chip.dataset.slot, sh = SHAPES.find(s => s.id === S.gen.shape), mo = MOTIONS.find(m => m.id === S.gen.motion);
      S.gens[i] = { name: sh.name + ' ' + mo.name.toLowerCase(), g: { ...S.gen } }; S.genSlot = i; S.source = 'gen'; renderGenPanel(); syncPads(); save(); beep(1100); toast('Đã lưu vào pad ' + KEYS[i].toUpperCase() + ' ở bàn Cảnh.'); return;
    }
    const key = chip.parentElement.dataset.key; if (!key) return;
    const raw = chip.dataset.val; S.gen[key] = key === 'pal' ? +raw : raw; if (S.source === 'media') selectMedia(-1); S.source = 'gen'; S.genSlot = -1;
    $$('.chip', chip.parentElement).forEach(c => c.setAttribute('aria-pressed', String(c === chip))); syncPads(); save();
  });
  /* stickers */
  $('#btnScatter').addEventListener('click', () => { scatter(8); beep(1000); }); $('#btnClearStk').addEventListener('click', () => { S.stickers = []; S.selSticker = -1; renderStickerSel(); save(); });
  $('#btnUpStk').addEventListener('click', () => $('#fileStk').click());
  $('#fileStk').addEventListener('change', async e => { for (const f of e.target.files) { const id = await addCustomSticker(f); drawTray(); addSticker('img:' + id, { x: 0.5, y: 0.5, size: 0.2 }); rcOffer('sticker', id); } e.target.value = ''; });
  $('#stkFxSw').addEventListener('click', () => { S.stickerFx = !S.stickerFx; setSwitch('#stkFxSw', S.stickerFx); save(); });
  /* text */
  $('#txtPreset').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) setText(b.dataset.v); });
  const chipSet = (sel, key) => $(sel).addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; S.text[key] = b.dataset.v; renderTextPanel(); save(); });
  chipSet('#txtStyle', 'style'); chipSet('#txtMotion', 'motion'); chipSet('#txtPos', 'pos');
  $('#txtCustom').addEventListener('input', e => { S.text.custom = e.target.value; if (!S.text.on || S.text.preset !== 'custom') { S.text.on = true; S.text.preset = 'custom'; renderTextPanel(); syncPads(); } save(); });
  $('#txtLabel').addEventListener('input', e => { S.text.label = e.target.value; save(); });
  $('#txtTarget').addEventListener('change', e => { S.text.target = e.target.value || '00:00'; save(); });
  /* media */
  $('#btnUpMed').addEventListener('click', () => $('#fileMed').click());
  $('#btnFolder').addEventListener('click', pickFolder);
  $('#btnFolderReload').addEventListener('click', () => reloadFolder(true));
  $('#fileDir').addEventListener('change', e => { const list = Array.from(e.target.files).map(f => ({ file: f, path: f.webkitRelativePath ? f.webkitRelativePath.split('/').slice(1).join('/') : f.name })); const nm = (e.target.files[0] && e.target.files[0].webkitRelativePath || '').split('/')[0] || 'thư mục'; loadFolderFiles(list, nm); e.target.value = ''; toast('Trình duyệt này không nhớ thư mục, lần sau mở app cần chọn lại.', 5000); });
  $('#mpPrev').addEventListener('click', () => setPage(-1)); $('#mpNext').addEventListener('click', () => setPage(1));
  $('#fileMed').addEventListener('change', e => { handleFiles(e.target.files); e.target.value = ''; });
  let dragN = 0; const veil = $('#dropveil');
  window.addEventListener('dragenter', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) { dragN++; veil.classList.add('on'); } });
  window.addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) veil.classList.remove('on'); });
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => { e.preventDefault(); dragN = 0; veil.classList.remove('on'); if (e.dataTransfer && e.dataTransfer.files.length) { setTab('med'); handleFiles(e.dataTransfer.files); } });
  /* output tab */
  $('#aspChips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; S.aspect = b.dataset.v; pressChips('#aspChips', S.aspect); alloc(); save(); });
  $('#fitChips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; S.outFit = b.dataset.v; pressChips('#fitChips', S.outFit); save(); });
  const applyCustom = () => { const w = clamp(parseInt($('#cw').value, 10) || 21, 1, 64), h = clamp(parseInt($('#ch').value, 10) || 9, 1, 64); S.custom = [w, h]; $('#cw').value = w; $('#ch').value = h; S.aspect = 'custom'; pressChips('#aspChips', 'custom'); alloc(); save(); };
  $('#cw').addEventListener('change', applyCustom); $('#ch').addEventListener('change', applyCustom);
  $('#resSel').addEventListener('change', e => { S.res = +e.target.value; alloc(); save(); });
  $('#guideSw').addEventListener('click', () => { S.guides = !S.guides; setSwitch('#guideSw', S.guides); });
  $('#xfadeSw').addEventListener('click', () => { S.xfade = !S.xfade; setSwitch('#xfadeSw', S.xfade); save(); });
  $('#limitSw').addEventListener('click', () => { S.limit = !S.limit; setSwitch('#limitSw', S.limit); $('#limitWarn').hidden = S.limit; save(); });
  $('#rcRestart').addEventListener('click', () => { R.tries = 0; rcStart(); });
  $('#rcNew').addEventListener('click', () => { R.code = newCode(); lsSet('plv-control-code', R.code); R.tries = 0; rcStart(); toast('Mã mới: ' + R.code + '. Màn chiếu cần nhập lại mã.'); });
  $('#rcCopy').addEventListener('click', () => { const u = displayURL(); if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => toast('Đã chép địa chỉ màn chiếu.'), () => toast(u, 6000)); else toast(u, 6000); });
  /* sticker dragging on preview */
  let dragSt = null;
  const toFrame = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  cv.addEventListener('pointerdown', e => {
    const [fx, fy] = toFrame(e), m = Math.min(W, H);
    for (let i = S.stickers.length - 1; i >= 0; i--) {
      const s = S.stickers[i], d = Math.hypot((fx - s.x) * W, (fy - s.y) * H);
      if (d < s.size * m * 0.6) { dragSt = { s, dx: s.x - fx, dy: s.y - fy }; S.selSticker = i; cv.setPointerCapture(e.pointerId); renderStickerSel(); setTab('stk'); return; }
    }
  });
  cv.addEventListener('pointermove', e => { if (!dragSt) return; const [fx, fy] = toFrame(e); dragSt.s.x = clamp(fx + dragSt.dx, 0, 1); dragSt.s.y = clamp(fy + dragSt.dy, 0, 1); });
  const endDrag = () => { if (dragSt) { dragSt = null; save(); } };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  /* keyboard */
  const keyIdx = Object.fromEntries(KEYS.map((k, i) => [k, i]));
  const typing = e => { const tg = e.target && e.target.tagName; return tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA'; };
  window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); if (!e.repeat) setDrop(true); return; }
    if (e.repeat) return;
    if (k in keyIdx) padDown(keyIdx[k]);
    else if (k === '`' || k === '~') cycleBank();
    else if (k === '[' || k === ',') { if (S.bank === 'media') setPage(-1); }
    else if (k === ']' || k === '.') { if (S.bank === 'media') setPage(1); }
    else if (k === 't') tap();
    else if (k === 'b') toggleBlack();
    else if (k === 'h') safeView();
    else if (k === 'p') toggleFreeze();
  });
  window.addEventListener('keyup', e => {
    if (typing(e)) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); setDrop(false); return; }
    if (k in keyIdx) padUp(keyIdx[k]);
  });
  window.addEventListener('blur', () => { setDrop(false); held.forEach((p, i) => padUp(i)); });
  document.addEventListener('fullscreenchange', () => { $('#btnFull').textContent = fsActive() ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'; });
}
