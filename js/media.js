'use strict';
/* Popping Lollipop VJ · media.js */
/* ---------- media ---------- */
function fitRect(iw, ih, w, h, mode) {
  if (mode === 'stretch') return [0, 0, w, h];
  const s = mode === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
  return [(w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s];
}
function drawMedia(ctx, m) {
  const el = m.video || m.img; if (!el) return false;
  const iw = el.videoWidth || el.naturalWidth, ih = el.videoHeight || el.naturalHeight; if (!iw || !ih) return false;
  ctx.fillStyle = '#0d0a1a'; ctx.fillRect(0, 0, W, H);
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
  const cur = S.media[S.mediaSel], keep = new Set();
  toast('Đang nạp ' + list.length + ' file từ thư mục "' + folderName + '"...', 6000);
  let added = 0;
  for (let k = 0; k < list.length; k++) {
    const { file, path } = list[k], id = 'f' + hashId(path + '|' + file.size + '|' + file.lastModified); keep.add(id);
    if (!S.media.some(m => m.id === id)) { await addMedia(file, { id, persist: false, folder: true, path }); added++; if (added % 4 === 0) { renderMedia(); syncPads(); } }
  }
  S.media.filter(m => m.folder && !keep.has(m.id)).forEach(m => { if (m.video) { m.video.pause(); m.video.remove(); } URL.revokeObjectURL(m.url); });
  const order = new Map(list.map((x, i) => [x.path, i]));
  S.media = S.media.filter(m => !m.folder || keep.has(m.id));
  S.media.sort((a, b) => (a.folder === b.folder) ? (a.folder ? order.get(a.path) - order.get(b.path) : a.t - b.t) : (a.folder ? -1 : 1));
  S.mediaSel = cur ? S.media.indexOf(cur) : -1; if (S.mediaSel < 0 && S.source === 'media') S.source = 'gen';
  S.folderName = folderName;
  S.media.forEach(m => rcOffer('media', m.id));
  renderMedia(); syncPads(); setBank('media');
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
    if (perm !== 'granted') { if (!interactive) toast('Bấm "Nạp lại ' + rec.name + '" ở tab Media để mở lại thư mục media.', 6000); return false; }
    await readFolderHandle(rec.h); return true;
  } catch (e) { toast('Không đọc được thư mục "' + rec.name + '". Chọn lại thư mục.', 5000); return false; }
}
function selectMedia(i) {
  S.media.forEach((m, j) => { if (m.video && j !== i) m.video.pause(); });
  S.mediaSel = i; S.source = i >= 0 ? 'media' : 'gen';
  const m = S.media[i]; if (m && m.video && m.video.preload !== 'auto') m.video.preload = 'auto';
  if (m && ROLE === 'control') rcPrioritize(m.id);
}
async function handleFiles(files) {
  const list = Array.from(files).filter(f => /^(image|video)\//.test(f.type));
  if (!list.length) return;
  let first = -1;
  for (const f of list) { if (f.size > 120e6) { toast('"' + f.name + '" lớn hơn 120 MB, nên cắt ngắn trước.'); continue; } const it = await addMedia(f); if (first < 0) first = S.media.length - 1; rcOffer('media', it.id); }
  if (first >= 0) selectMedia(first);
  renderMedia(); syncPads();
}
function removeMedia(i) {
  const m = S.media[i]; if (!m) return;
  if (m.video) { m.video.pause(); m.video.remove(); } URL.revokeObjectURL(m.url); if (!m.folder) idbDel('media', m.id);
  S.media.splice(i, 1);
  if (S.mediaSel === i) { S.mediaSel = -1; S.source = 'gen'; } else if (S.mediaSel > i) S.mediaSel--;
  renderMedia(); syncPads();
}

/* ---------- stickers ---------- */
function drawSticker(ctx, st, b) {
  const m = Math.min(W, H), base = st.size * m, bb = b + st.phase;
  let x = st.x * W, y = st.y * H, rot = st.rot, sc = 1;
  switch (st.motion) {
    case 'bounce': y -= Math.abs(Math.sin(Math.PI * fr(bb))) * base * 0.3; break;
    case 'shake': rot += Math.sin(bb * TAU) * 0.22; break;
    case 'spin': rot += bb * 0.9; break;
    case 'pulse': sc = 1 + 0.28 * Math.pow(1 - fr(bb), 3); break;
  }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  if (st.kind.startsWith('img:')) {
    const cs = S.customStickers.find(c => 'img:' + c.id === st.kind);
    if (cs && cs.img && cs.img.naturalWidth) { const s = base / Math.max(cs.img.naturalWidth, cs.img.naturalHeight), w = cs.img.naturalWidth * s, h = cs.img.naturalHeight * s; ctx.drawImage(cs.img, -w / 2, -h / 2, w, h); }
  } else drawKind(ctx, st.kind, base / 2);
  ctx.restore();
}
function drawStickers(ctx, b) { for (const st of S.stickers) drawSticker(ctx, st, b); }
function addSticker(kind, o) {
  S.stickers.push(newSticker(kind, o)); if (S.stickers.length > 30) S.stickers.shift();
  S.selSticker = S.stickers.length - 1; renderStickerSel(); save();
}
function scatter(n) {
  const all = [...STICKERS.map(s => s.id), ...S.customStickers.map(c => 'img:' + c.id)];
  for (let i = 0; i < n; i++) S.stickers.push(newSticker(pick(all), { motion: pick(['bounce', 'shake', 'spin', 'pulse']) }));
  while (S.stickers.length > 30) S.stickers.shift();
  S.selSticker = -1; renderStickerSel(); save();
}
async function addCustomSticker(file, opt = {}) {
  if (opt.id && S.customStickers.some(c => c.id === opt.id)) return opt.id;
  const id = opt.id || 's' + Date.now() + Math.random().toString(36).slice(2, 5), url = URL.createObjectURL(file), img = new Image(); img.src = url; await img.decode().catch(() => {});
  S.customStickers.push({ id, img, url, name: file.name, blob: file });
  if (opt.persist !== false) idbPut('stickers', { id, t: Date.now(), name: file.name, type: file.type, blob: file });
  return id;
}
