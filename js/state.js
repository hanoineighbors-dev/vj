'use strict';
/* Popping Lollipop VJ · state.js */
/* ---------- state ---------- */
const S = {
  mode: 'play', tab: 'fx', sound: true, bank: 'fx',
  bpm: 124, div: 1, beats: 0, epoch: 0, manualLock: false,
  aspect: '16:9', custom: [21, 9], res: 1280, screenAR: 16 / 9, outFit: 'contain', mediaFit: 'cover', guides: false,
  mpage: 0, mediaMeta: {}, folderName: '',
  padMode: 'toggle', black: false, limit: true, dim: 1, freeze: false, drop: false, lat: 0, xfade: true,
  auto: { on: false, every: 8, last: -1, fx: null },
  fx: {}, selFx: 'zoom',
  gens: JSON.parse(JSON.stringify(DEFAULT_GENS)),
  genSlot: SAFE_GEN, gen: null, source: 'gen',
  media: [], mediaSel: -1,
  stickers: [], selSticker: -1, stickerFx: false, customStickers: [],
  text: { on: false, preset: 'title', custom: '', target: '00:00', label: 'TRAO GIẢI SAU', style: 'royal', motion: 'pulse', pos: 'center', size: 0.6 }
};
FX.forEach(f => { S.fx[f.id] = { on: false, held: false, p: Object.fromEntries(f.params.map(p => [p.k, p.val])) }; });
S.fx.zoom.on = true;
S.gen = { ...S.gens[SAFE_GEN].g };
let sid = 1;
const newSticker = (kind, o = {}) => ({ id: sid++, kind, x: rnd(0.12, 0.88), y: rnd(0.14, 0.86), size: rnd(0.14, 0.22), rot: rnd(-0.25, 0.25), motion: 'bounce', phase: Math.random(), ...o });
S.stickers = [newSticker('rabbit', { x: 0.12, y: 0.24, size: 0.2, motion: 'bounce' }), newSticker('clock', { x: 0.87, y: 0.22, size: 0.18, motion: 'pulse' }), newSticker('drinkme', { x: 0.86, y: 0.8, size: 0.2, motion: 'shake' })];

/* persistence (settings only; media go to IndexedDB) */
const LS_KEY = 'plv-state-v2';
let saveT = 0;
function save() {
  if (ROLE !== 'control') return;
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    lsSet(LS_KEY, JSON.stringify({
      mode: S.mode, sound: S.sound, bank: S.bank, bpm: S.bpm, div: S.div, aspect: S.aspect, custom: S.custom, res: S.res, outFit: S.outFit, mediaFit: S.mediaFit,
      mediaMeta: S.mediaMeta, mpage: S.mpage,
      padMode: S.padMode, limit: S.limit, lat: S.lat, xfade: S.xfade, gens: S.gens, gen: S.gen, genSlot: S.genSlot, stickers: S.stickers, stickerFx: S.stickerFx, text: S.text,
      fxp: Object.fromEntries(Object.entries(S.fx).map(([k, v]) => [k, v.p]))
    }));
  }, 400);
}
function load() {
  if (ROLE !== 'control') return;
  try {
    const raw = lsGet(LS_KEY); if (!raw) return;
    const d = JSON.parse(raw);
    ['mode', 'sound', 'bank', 'bpm', 'div', 'aspect', 'custom', 'res', 'outFit', 'mediaFit', 'padMode', 'limit', 'lat', 'xfade', 'genSlot', 'stickerFx'].forEach(k => { if (d[k] !== undefined && d[k] !== null) S[k] = d[k]; });
    if (Array.isArray(d.gens)) S.gens = DEFAULT_GENS.map((def, i) => (d.gens[i] && d.gens[i].g && d.gens[i].name) ? d.gens[i] : JSON.parse(JSON.stringify(def)));
    if (d.gen && d.gen.shape) S.gen = { ...S.gen, ...d.gen };
    if (Array.isArray(d.stickers)) S.stickers = d.stickers.filter(s => s && s.kind);
    if (d.text) Object.assign(S.text, d.text, { on: false });
    if (d.mediaMeta && typeof d.mediaMeta === 'object') S.mediaMeta = d.mediaMeta;
    if (typeof d.mpage === 'number') S.mpage = d.mpage;
    if (!['fx', 'scene', 'media'].includes(S.bank)) S.bank = 'fx';
    if (d.fxp) Object.entries(d.fxp).forEach(([k, p]) => { if (S.fx[k]) Object.assign(S.fx[k].p, p); });
    if (!ASPECTS[S.aspect] && S.aspect !== 'custom' && S.aspect !== 'screen') S.aspect = '16:9';
    S.stickers.forEach(s => { sid = Math.max(sid, (s.id | 0) + 1); });
  } catch (e) { console.warn('Bỏ qua dữ liệu lưu hỏng', e); }
}
load();

/* IndexedDB for media and custom stickers */
let dbP = null;
function idb() {
  if (!dbP) dbP = new Promise((res, rej) => {
    const r = indexedDB.open('plv-media', 2);
    r.onupgradeneeded = () => { const db = r.result; ['media', 'stickers', 'handles'].forEach(n => { if (!db.objectStoreNames.contains(n)) db.createObjectStore(n, { keyPath: 'id' }); }); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  return dbP;
}
async function idbPut(store, val) { try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).put(val); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch (e) { /* ignore */ } }
async function idbDel(store, id) { try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).delete(id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch (e) { /* ignore */ } }
async function idbGet(store, id) { try { const db = await idb(); return await new Promise((res, rej) => { const rq = db.transaction(store).objectStore(store).get(id); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => rej(rq.error); }); } catch (e) { return null; } }
async function idbAll(store) { try { const db = await idb(); return await new Promise((res, rej) => { const rq = db.transaction(store).objectStore(store).getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error); }); } catch (e) { return []; } }
