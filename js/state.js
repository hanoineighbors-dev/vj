'use strict';
/* Popping Lollipop VJ · state.js: trạng thái app, lưu cài đặt, kho media trong trình duyệt */
const S = {
  mode: 'play', sound: true,
  bpm: 124, div: 1, beats: 0, epoch: 0, manualLock: false,
  aspect: '16:9', custom: [21, 9], res: 1280, screenAR: 16 / 9, outFit: 'contain', mediaFit: 'cover', guides: false,
  mpage: 0, mediaMeta: {}, folderName: '', focus: null,
  padMode: 'toggle', black: false, limit: true, dim: 1, freeze: false, drop: false, lat: 0,
  auto: { on: false, every: 8, last: -1, fx: null },
  fx: {}, selFx: 'zoom',
  media: [],
  /* bàn trộn: a, b là id media; x là vị trí thanh trượt (0 = A, 1 = B) */
  deck: { a: null, b: null, x: 0, blend: 'normal', cut: 0, autoTake: true, len: 2 },
  xfAnim: null,
  text: { on: false, preset: 'title', custom: '', target: '00:00', label: 'TRAO GIẢI SAU', style: 'royal', motion: 'pulse', pos: 'center', size: 0.6 }
};
FX.forEach(f => { S.fx[f.id] = { on: false, held: false, p: Object.fromEntries(f.params.map(p => [p.k, p.val])) }; });

const LS_KEY = 'plv-state-v3';
let saveT = 0;
function save() {
  if (ROLE !== 'control') return;
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    lsSet(LS_KEY, JSON.stringify({
      mode: S.mode, sound: S.sound, bpm: S.bpm, div: S.div, aspect: S.aspect, custom: S.custom, res: S.res, outFit: S.outFit, mediaFit: S.mediaFit,
      mediaMeta: S.mediaMeta, mpage: S.mpage, padMode: S.padMode, limit: S.limit, lat: S.lat, text: S.text,
      deck: { a: S.deck.a, b: S.deck.b, x: S.deck.x, blend: S.deck.blend, cut: S.deck.cut, autoTake: S.deck.autoTake, len: S.deck.len },
      fxp: Object.fromEntries(Object.entries(S.fx).map(([k, v]) => [k, v.p]))
    }));
  }, 400);
}
function load() {
  if (ROLE !== 'control') return;
  try {
    const raw = lsGet(LS_KEY) || lsGet('plv-state-v2'); if (!raw) return;
    const d = JSON.parse(raw);
    ['mode', 'sound', 'bpm', 'div', 'aspect', 'custom', 'res', 'outFit', 'mediaFit', 'padMode', 'limit', 'lat', 'mpage'].forEach(k => { if (d[k] !== undefined && d[k] !== null) S[k] = d[k]; });
    if (d.mediaMeta && typeof d.mediaMeta === 'object') S.mediaMeta = d.mediaMeta;
    if (d.deck && typeof d.deck === 'object') Object.assign(S.deck, d.deck);
    if (!BLEND_OP[S.deck.blend]) S.deck.blend = 'normal';
    if (d.text) Object.assign(S.text, d.text, { on: false });
    if (d.fxp) Object.entries(d.fxp).forEach(([k, p]) => { if (S.fx[k]) Object.assign(S.fx[k].p, p); });
    if (!ASPECTS[S.aspect] && S.aspect !== 'custom' && S.aspect !== 'screen') S.aspect = '16:9';
  } catch (e) { console.warn('Bỏ qua dữ liệu lưu hỏng', e); }
}
load();

/* IndexedDB: media đã up và thư mục media */
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
