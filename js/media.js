'use strict';
/* Popping Lollipop VJ · media.js: ảnh, video, thư mục media, bàn trộn 2 deck A/B */
function fitRect(iw, ih, w, h, mode) {
  if (mode === 'stretch') return [0, 0, w, h];
  const s = mode === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
  return [(w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s];
}
function drawMedia(ctx, m) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (!m) return false;
  const el = m.video || m.img; if (!el) return false;
  const iw = el.videoWidth || el.naturalWidth, ih = el.videoHeight || el.naturalHeight; if (!iw || !ih) return false;
  const [x, y, w, h] = fitRect(iw, ih, W, H, S.mediaFit);
  ctx.drawImage(el, x, y, w, h); return true;
}
function videoStep(m, dt) {
  const v = m.video; if (!v) return; const dur = v.duration || 0; if (!dur || !isFinite(dur)) { if (v.paused) v.play().catch(() => {}); return; }
  const a = m.trimA * dur, bnd = Math.max(a + 0.2, m.trimB * dur);
  const rate = clamp(m.speed || 1, 0.25, 3); if (v.playbackRate !== rate) v.playbackRate = rate;
  if (m.reverse) {
    if (!v.paused) v.pause();
    if (!v.seeking) { let t = v.currentTime - dt / 1000 * rate; if (t < a) t = bnd; v.currentTime = t; }
  } else {
    if (v.paused) v.play().catch(() => {});
    if (v.currentTime > bnd || v.currentTime < a - 0.05) v.currentTime = a;
  }
}
function snapThumb(el, iw, ih) {
  try { const c = document.createElement('canvas'); const s = 160 / Math.max(iw, ih); c.width = Math.max(1, Math.round(iw * s)); c.height = Math.max(1, Math.round(ih * s)); c.getContext('2d').drawImage(el, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.7); } catch (e) { return ''; }
}
async function addMedia(file, opt = {}) {
  if (S.media.some(m => m.id === opt.id)) return S.media.find(m => m.id === opt.id);
  const mime = file.type || mimeOf(file.name), url = URL.createObjectURL(file), isVid = mime.startsWith('video/');
  const item = { id: opt.id || 'm' + Date.now() + Math.random().toString(36).slice(2, 6), t: opt.t || Date.now(), name: file.name || 'media', path: opt.path || file.name, folder: !!opt.folder, type: isVid ? 'video' : 'image', url, blob: file, speed: 1, reverse: false, trimA: 0, trimB: 1, thumb: '' };
  if (S.mediaMeta[item.id]) Object.assign(item, S.mediaMeta[item.id]);
  if (isVid) {
    const v = document.createElement('video'); v.muted = true; v.defaultMuted = true; v.loop = false; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'metadata'; v.src = url; item.video = v;
    $('#vids').appendChild(v);
    await new Promise(res => { v.addEventListener('loadeddata', res, { once: true }); v.addEventListener('error', res, { once: true }); setTimeout(res, 5000); });
    try { v.currentTime = Math.min(0.1, (v.duration || 1) / 2); await new Promise(res => { v.addEventListener('seeked', res, { once: true }); setTimeout(res, 800); }); } catch (e) { /* ignore */ }
    item.thumb = snapThumb(v, v.videoWidth, v.videoHeight); v.pause();
  } else {
    const img = new Image(); img.src = url; await img.decode().catch(() => {}); item.img = img; item.thumb = snapThumb(img, img.naturalWidth, img.naturalHeight);
  }
  if (opt.at !== undefined) S.media.splice(opt.at, 0, item); else S.media.push(item);
  if (opt.persist !== false) { idbPut('media', { id: item.id, t: item.t, name: item.name, type: mime, blob: file }); askPersist(); }
  return item;
}
const EXT_MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', heic: 'image/heic', mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };
function mimeOf(name) { const e = String(name || '').split('.').pop().toLowerCase(); return EXT_MIME[e] || ''; }
const MEDIA_RE = /\.(jpe?g|png|gif|webp|avif|mp4|m4v|mov|webm)$/i;
let persistAsked = false;
function askPersist() { if (persistAsked || ROLE !== 'control') return; persistAsked = true; try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ } }
function metaSave(m) { S.mediaMeta[m.id] = { speed: m.speed, reverse: m.reverse, trimA: m.trimA, trimB: m.trimB }; save(); }
function hashId(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

function mediaById(id) { if (!id) return null; for (const m of S.media) if (m.id === id) return m; return null; }

/* media folder on the controller Mac (Chrome: remembered; Safari: pick each time) */
async function walkDir(h, prefix, out, depth) {
  for await (const [name, entry] of h.entries()) {
    if (name.startsWith('.')) continue;
    if (entry.kind === 'file' && MEDIA_RE.test(name)) out.push({ file: await entry.getFile(), path: prefix + name });
    else if (entry.kind === 'directory' && depth < 2) await walkDir(entry, prefix + name + '/', out, depth + 1);
  }
}
async function loadFolderFiles(list, folderName) {
  list = list.filter(x => MEDIA_RE.test(x.path) && !x.path.split('/').some(seg => seg.startsWith('.')));
  list.sort((a, b) => a.path.localeCompare(b.path, 'vi', { numeric: true, sensitivity: 'base' }));
  const keep = new Set();
  toast('Đang nạp ' + list.length + ' file từ thư mục "' + folderName + '"...', 6000);
  let added = 0;
  for (let k = 0; k < list.length; k++) {
    const { file, path } = list[k], id = 'f' + hashId(path + '|' + file.size + '|' + file.lastModified); keep.add(id);
    if (!S.media.some(m => m.id === id)) { await addMedia(file, { id, persist: false, folder: true, path }); added++; if (added % 4 === 0) renderMediaPads(); }
  }
  S.media.filter(m => m.folder && !keep.has(m.id)).forEach(m => { if (m.video) { m.video.pause(); m.video.remove(); } URL.revokeObjectURL(m.url); });
  const order = new Map(list.map((x, i) => [x.path, i]));
  S.media = S.media.filter(m => !m.folder || keep.has(m.id));
  S.media.sort((a, b) => (a.folder === b.folder) ? (a.folder ? order.get(a.path) - order.get(b.path) : a.t - b.t) : (a.folder ? -1 : 1));
  S.folderName = folderName;
  S.media.forEach(m => rcOffer('media', m.id));
  firstLoad();
  renderMediaPads(); renderDecks();
  toast('Đã nạp thư mục "' + folderName + '": ' + S.media.filter(m => m.folder).length + ' file (' + added + ' mới).', 5000);
}
async function readFolderHandle(h) { const out = []; await walkDir(h, '', out, 0); await loadFolderFiles(out, h.name); }
async function pickFolder() {
  if (window.showDirectoryPicker) {
    try {
      const h = await window.showDirectoryPicker({ id: 'plv-media', mode: 'read' });
      await idbPut('handles', { id: 'media', h, name: h.name });
      $('#btnFolderReload').hidden = false; $('#btnFolderReload').textContent = 'Nạp lại "' + h.name + '"';
      await readFolderHandle(h);
    } catch (e) { if (e && e.name !== 'AbortError') toast('Không mở được thư mục: ' + e.message, 5000); }
  } else $('#fileDir').click();
}
async function reloadFolder(interactive) {
  const rec = await idbGet('handles', 'media'); if (!rec || !rec.h) return false;
  const btn = $('#btnFolderReload'); btn.hidden = false; btn.textContent = 'Nạp lại "' + rec.name + '"';
  try {
    let perm = await rec.h.queryPermission({ mode: 'read' });
    if (perm !== 'granted' && interactive) perm = await rec.h.requestPermission({ mode: 'read' });
    if (perm !== 'granted') { if (!interactive) toast('Bấm "Nạp lại ' + rec.name + '" ở cột Media để mở lại thư mục media.', 6000); return false; }
    await readFolderHandle(rec.h); return true;
  } catch (e) { toast('Không đọc được thư mục "' + rec.name + '". Chọn lại thư mục.', 5000); return false; }
}
async function handleFiles(files) {
  const list = Array.from(files).filter(f => /^(image|video)\//.test(f.type) || MEDIA_RE.test(f.name));
  if (!list.length) return;
  for (const f of list) { if (f.size > 150e6) { toast('"' + f.name + '" lớn hơn 150 MB, nên cắt ngắn trước.'); continue; } const it = await addMedia(f); rcOffer('media', it.id); renderMediaPads(); }
  firstLoad(); renderMediaPads(); renderDecks();
}
function removeMedia(id) {
  const i = S.media.findIndex(m => m.id === id); if (i < 0) return;
  const m = S.media[i];
  if (m.video) { m.video.pause(); m.video.remove(); } URL.revokeObjectURL(m.url); if (!m.folder) idbDel('media', m.id);
  S.media.splice(i, 1);
  if (S.deck.a === id) S.deck.a = null; if (S.deck.b === id) S.deck.b = null; if (S.focus === id) S.focus = null;
  renderMediaPads(); renderDecks(); save();
}

/* ---------- bàn trộn A/B ---------- */
const liveSide = () => S.deck.x < 0.5 ? 'a' : 'b';
const otherSide = s => s === 'a' ? 'b' : 'a';
/* deck chưa có gì thì media đầu tiên vào thẳng deck A */
function firstLoad() {
  if (ROLE !== 'control') return;
  if (!mediaById(S.deck.a)) S.deck.a = null; if (!mediaById(S.deck.b)) S.deck.b = null;
  if (!S.deck.a && !S.deck.b && S.media.length) { S.deck.a = S.media[0].id; S.deck.x = 0; S.focus = S.deck.a; }
}
/* chọn media: nạp vào deck đang ẩn rồi tự chuyển sang (như DJ đẩy thanh trượt) */
function loadMedia(id, opt = {}) {
  const m = mediaById(id); if (!m) return;
  S.focus = id;
  const live = liveSide();
  if (!S.deck.a && !S.deck.b) { S.deck.a = id; S.deck.x = 0; S.xfAnim = null; }
  else if (opt.live) { S.deck[live] = id; }
  else if (S.deck[live] === id && !S.xfAnim) { /* đang chiếu rồi */ }
  else {
    const hid = otherSide(live);
    if (S.deck[hid] !== id) S.deck[hid] = id;
    if (S.deck.autoTake || opt.take) take();
  }
  if (m.video && m.video.preload !== 'auto') m.video.preload = 'auto';
  if (ROLE === 'control') rcPrioritize(id);
  renderMediaPads(); renderDecks(); renderFocus(); save();
}
function take(len) {
  const live = liveSide(), to = live === 'a' ? 1 : 0;
  if (!S.deck[otherSide(live)]) return;
  const L = len === undefined ? S.deck.len : len;
  if (!L) { S.deck.x = to; S.xfAnim = null; renderDecks(); return; }
  S.xfAnim = { from: S.deck.x, to, start: S.beats, len: L };
}
function setX(v) { S.xfAnim = null; S.deck.x = clamp(v, 0, 1); }
function mixerStep() {
  const a = S.xfAnim; if (!a) return;
  const k = (S.beats - a.start) / a.len;
  if (k >= 1 || k < 0) { S.deck.x = a.to; S.xfAnim = null; if (ROLE === 'control') renderDecks(); return; }
  const e = k * k * (3 - 2 * k); S.deck.x = a.from + (a.to - a.from) * e;
}
function stepFocus(d) {
  if (!S.media.length) return;
  let i = S.media.findIndex(m => m.id === S.focus); i = i < 0 ? 0 : (i + d + S.media.length) % S.media.length;
  loadMedia(S.media[i].id);
  const pg = Math.floor(i / 16); if (pg !== S.mpage) { S.mpage = pg; renderMediaPads(); }
}
/* vẽ 2 deck rồi lồng vào khung hình chính */
let vidT = 0;
function drawDecks(ctx, b, dt, now) {
  const D_ = S.deck, ma = mediaById(D_.a), mb = mediaById(D_.b);
  const cutting = D_.cut > 0 && ma && mb;
  let wa, wb;
  if (cutting) { const showB = Math.floor(b / D_.cut) % 2 === 1; wa = showB ? 0 : 1; wb = showB ? 1 : 0; }
  else if (D_.blend === 'normal') { wa = ma ? (D_.x < 1 ? 1 : 0) : 0; wb = mb ? D_.x : 0; }
  else { wa = ma ? Math.min(1, 2 * (1 - D_.x)) : 0; wb = mb ? Math.min(1, 2 * D_.x) : 0; }
  if (ma && wa > 0) videoStep(ma, dt);
  if (mb && wb > 0 && mb !== ma) videoStep(mb, dt);
  if (now - vidT > 400) { vidT = now; S.media.forEach(m => { if (m.video && !m.video.paused && ((m !== ma || wa <= 0) && (m !== mb || wb <= 0))) m.video.pause(); }); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (wa > 0) { drawMedia(DA.ctx, ma); ctx.globalAlpha = (D_.blend === 'normal' || cutting) ? 1 : wa; ctx.drawImage(DA.cv, 0, 0); }
  if (wb > 0) {
    drawMedia(DB.ctx, mb);
    ctx.globalAlpha = cutting ? 1 : wb;
    ctx.globalCompositeOperation = (cutting || wa <= 0) ? 'source-over' : (BLEND_OP[D_.blend] || 'source-over');
    ctx.drawImage(DB.cv, 0, 0);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
