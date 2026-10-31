'use strict';
/* Popping Lollipop VJ · remote.js */
/* =====================================================================
   REMOTE: controller hosts a code, displays connect (PeerJS / WebRTC)
   ===================================================================== */
const PREFIX = 'popping-lollipop-vj-';
function peerOpts() {
  const q = new URLSearchParams(location.search), o = { debug: 0 };
  if (q.get('peerhost')) { o.host = q.get('peerhost'); o.port = +(q.get('peerport') || 9000); o.path = q.get('peerpath') || '/'; o.secure = q.get('peersecure') === '1'; }
  return o;
}
const newCode = () => String(Math.floor(1000 + Math.random() * 9000));
const CHUNK = 16000;
const R = { peer: null, code: null, conns: new Map(), tries: 0, lastJson: '', lastSend: 0, lastClock: 0, lastEpoch: -1 };
function displayURL() { return location.origin + location.pathname + location.search + '#man-chieu=' + (R.code || ''); }
function rcStatus(msg) { const el = $('#rcStat'); if (el) el.textContent = msg; }
function rcRenderCode() {
  $('#rcCode').textContent = R.code || '----';
  const url = displayURL(); $('#rcUrl').textContent = url;
  const box = $('#qr'); box.innerHTML = '';
  if (typeof qrcode === 'function' && /^https?:/.test(location.protocol)) {
    try { const q = qrcode(0, 'M'); q.addData(url); q.make(); box.innerHTML = q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); } catch (e) { box.hidden = true; }
  } else box.hidden = true;
}
function rcStart() {
  if (ROLE !== 'control') return;
  if (typeof Peer === 'undefined') { rcStatus('Không tải được phần kết nối từ xa. Cần internet, tải lại trang khi có mạng.'); return; }
  if (!R.code) { R.code = lsGet('plv-control-code') || newCode(); lsSet('plv-control-code', R.code); }
  rcRenderCode();
  if (R.peer) { const old = R.peer; R.peer = null; try { old.destroy(); } catch (e) { /* ignore */ } }
  let p; try { p = new Peer(PREFIX + R.code, peerOpts()); } catch (e) { rcStatus('Không mở được kết nối: ' + e.message); return; }
  R.peer = p; rcStatus('Đang mở kết nối...');
  p.on('open', () => { if (R.peer !== p) return; R.tries = 0; rcStatus('Sẵn sàng. Mở màn chiếu và nhập mã ' + R.code + '.'); rcList(); });
  p.on('connection', c => { if (R.peer === p) rcSetup(c); });
  p.on('disconnected', () => {
    if (R.peer !== p || p.destroyed) return;
    rcStatus('Mất kết nối máy chủ ghép mã, đang nối lại. Màn chiếu đã nối vẫn chạy bình thường.');
    setTimeout(() => { if (R.peer === p && !p.destroyed && p.disconnected) try { p.reconnect(); } catch (e) { /* ignore */ } }, 2500);
  });
  p.on('error', e => {
    if (R.peer !== p) return;
    if (e.type === 'unavailable-id') {
      R.tries++;
      if (R.tries > 12) { R.code = newCode(); lsSet('plv-control-code', R.code); R.tries = 0; rcStatus('Mã cũ vẫn bận, đã đổi sang mã mới ' + R.code + '.'); }
      else rcStatus('Mã ' + R.code + ' đang được giải phóng, thử lại sau vài giây (' + R.tries + ')...');
      setTimeout(() => { if (R.peer === p) rcStart(); }, 4000);
    } else if (['network', 'server-error', 'socket-error', 'socket-closed', 'browser-incompatible'].includes(e.type)) {
      rcStatus('Không nối được máy chủ ghép mã (cần internet). Đang thử lại...');
      setTimeout(() => { if (R.peer === p) rcStart(); }, 5000);
    } else console.warn('peer', e.type, e);
  });
}
function rcSetup(conn) {
  const d = { conn, id: conn.connectionId || conn.peer, open: false, fps: 0, ar: null, name: 'Màn chiếu', have: new Set(), queue: [], sending: false, prog: null };
  R.conns.set(d.id, d);
  const done = () => { d.open = false; R.conns.delete(d.id); rcList(); };
  conn.on('open', () => { d.open = true; rcList(); });
  if (conn.open) d.open = true;
  conn.on('data', m => rcOnData(d, m));
  conn.on('close', done); conn.on('error', done);
}
function rcSend(d, msg) { if (!d.open) return; try { d.conn.send(msg); } catch (e) { /* closing */ } }
function rcAll(msg) { R.conns.forEach(d => rcSend(d, msg)); }
function rcOnData(d, m) {
  if (!m || typeof m !== 'object') return;
  if (m.type === 'hello') {
    d.open = true; d.have = new Set(m.have || []); d.ar = m.ar; d.name = m.name || 'Màn chiếu';
    if (m.ar && (!S.screenARset || R.conns.size === 1)) { S.screenAR = m.ar; S.screenARset = true; if (S.aspect === 'screen') alloc(); }
    rcSend(d, { type: 'state', json: JSON.stringify(snapshot()) }); rcSendClock(d);
    S.media.forEach(it => { if (!d.have.has(it.id)) d.queue.push({ kind: 'media', id: it.id }); });
    rcPump(d); rcList(); toast(d.name + ' đã kết nối.');
  } else if (m.type === 'status') {
    d.fps = m.fps; d.ar = m.ar; d.info = m.info || '';
    if (m.ar && R.conns.size === 1 && Math.abs((S.screenAR || 0) - m.ar) > 0.01) { S.screenAR = m.ar; if (S.aspect === 'screen') alloc(); }
    rcList();
  } else if (m.type === 'ping') rcSend(d, { type: 'pong', t: m.t });
  else if (m.type === 'got') { d.have.add(m.id); }
}
function rcPrioritize(id) { R.conns.forEach(d => { const k = d.queue.findIndex(q => q.id === id); if (k > 0) d.queue.unshift(d.queue.splice(k, 1)[0]); else if (k < 0 && !d.have.has(id) && d.open) { d.queue.unshift({ kind: 'media', id }); rcPump(d); } }); }
function rcOffer(kind, id) { R.conns.forEach(d => { if (!d.have.has(id) && !d.queue.some(q => q.id === id)) { d.queue.push({ kind, id }); rcPump(d); } }); }
async function rcPump(d) {
  if (d.sending) return; d.sending = true;
  try {
    while (d.queue.length && d.open) {
      const it = d.queue.shift();
      const src = S.media.find(x => x.id === it.id);
      if (!src || !src.blob || d.have.has(it.id)) continue;
      const buf = await src.blob.arrayBuffer(), n = Math.ceil(buf.byteLength / CHUNK) || 1;
      rcSend(d, { type: 'bs', id: it.id, kind: it.kind, name: src.name || 'file', mime: src.blob.type || '', size: buf.byteLength, n });
      for (let i = 0; i < n && d.open; i++) {
        const dc = d.conn.dataChannel;
        while (d.open && dc && dc.bufferedAmount > 1.5e6) await sleep(20);
        rcSend(d, { type: 'bc', id: it.id, i, data: buf.slice(i * CHUNK, (i + 1) * CHUNK) });
        d.prog = { name: src.name, i: i + 1, n, left: d.queue.length };
        if (i % 40 === 0) { rcList(); await sleep(0); }
      }
      rcSend(d, { type: 'be', id: it.id });
    }
  } catch (e) { console.warn('send', e); }
  d.sending = false; d.prog = null; rcList();
}
function rcSendClock(d) { const msg = { type: 'clock', beats: S.beats, bpm: S.bpm, epoch: S.epoch }; if (d) rcSend(d, msg); else rcAll(msg); }
function rcTick(now) {
  if (!R.conns.size) return;
  if (now - R.lastSend > 66) {
    const json = JSON.stringify(snapshot());
    if (json !== R.lastJson || now - R.lastSend > 1000) { rcAll({ type: 'state', json }); R.lastJson = json; }
    R.lastSend = now;
  }
  if (now - R.lastClock > 250 || S.epoch !== R.lastEpoch) { rcSendClock(); R.lastClock = now; R.lastEpoch = S.epoch; }
}
function rcList() {
  const n = Array.from(R.conns.values()).filter(d => d.open).length;
  const badge = $('#remoteBadge'); badge.classList.toggle('on', n > 0); $('span', badge).textContent = 'Màn chiếu: ' + (n ? n + ' đã nối' : 'chưa nối');
  const ul = $('#rcList'); if (!ul) return;
  ul.innerHTML = Array.from(R.conns.values()).map(d => {
    const ar = d.ar ? (d.ar > 1.6 ? '16:9' : d.ar > 1.45 ? '16:10' : d.ar > 1.2 ? '4:3' : d.ar.toFixed(2)) : '';
    const prog = d.prog ? ' · đang gửi "' + esc(d.prog.name) + '" ' + Math.round(d.prog.i / d.prog.n * 100) + '%' + (d.prog.left ? ' (còn ' + d.prog.left + ' file)' : '') : '';
    return '<li><b>' + esc(d.name) + '</b><span>' + (d.open ? 'đã nối' : 'đang nối...') + (d.fps ? ' · ' + d.fps + ' FPS' : '') + (ar ? ' · màn ' + ar : '') + prog + '</span></li>';
  }).join('');
}
function snapshot() {
  return {
    bpm: S.bpm, div: S.div, aspect: S.aspect, custom: S.custom, res: S.res, screenAR: S.screenAR, outFit: S.outFit, mediaFit: S.mediaFit,
    black: S.black, guides: S.guides, limit: S.limit, dim: S.dim, freeze: S.freeze, drop: S.drop, lat: S.lat,
    fx: Object.fromEntries(Object.entries(S.fx).map(([k, f]) => [k, { on: f.on, p: f.p }])),
    deck: { a: S.deck.a, b: S.deck.b, x: Math.round(S.deck.x * 1000) / 1000, blend: S.deck.blend, cut: S.deck.cut }, xfAnim: S.xfAnim,
    mp: Object.fromEntries(S.media.map(x => [x.id, { speed: x.speed, reverse: x.reverse, trimA: x.trimA, trimB: x.trimB }])),
    text: S.text
  };
}

/* display side */
const D = { peer: null, conn: null, code: '', open: false, lastMsg: 0, rtt: 80, epoch: -1, rx: new Map(), retryT: 0, pendingMedia: null, lastStatus: 0, frames: 0, fps: 0, fpsT: 0, barT: 0 };
function devName() { const ua = navigator.userAgent; if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad'; if (/Macintosh/.test(ua)) return 'MacBook'; if (/Android/.test(ua)) return 'Android'; return 'Màn chiếu'; }
function myAR() { return clamp(innerWidth / Math.max(1, innerHeight), 0.4, 3.5); }
function dStat(msg) { $('#dStat').textContent = msg; $('#dBarStat').textContent = msg; }
function dCard(show) { $('#dCard').hidden = !show; if (show) $('#dBar').classList.add('off'); }
function dBar() { if (!$('#dCard').hidden) return; const b = $('#dBar'); b.classList.remove('off'); clearTimeout(D.barT); D.barT = setTimeout(() => b.classList.add('off'), 4000); }
function dConnect() {
  const code = ($('#dCode').value || '').replace(/\D/g, '').slice(0, 4);
  if (code.length !== 4) { dStat('Nhập đủ 4 số của mã kết nối.'); return; }
  if (typeof Peer === 'undefined') { dStat('Không tải được phần kết nối. Cần internet, tải lại trang.'); return; }
  D.code = code; lsSet('plv-display-code', code); keepAwake(true);
  clearTimeout(D.retryT);
  if (!D.peer || D.peer.destroyed) {
    const p = new Peer(peerOpts()); D.peer = p; dStat('Đang mở kết nối...');
    p.on('open', () => { if (D.peer === p) dOpenConn(); });
    p.on('error', e => {
      if (D.peer !== p) return;
      if (e.type === 'peer-unavailable') { dStat('Chưa thấy máy điều khiển mã ' + D.code + '. Mở app trên máy điều khiển. Đang thử lại...'); dRetry(false); }
      else { dStat('Không nối được máy chủ ghép mã (cần internet). Đang thử lại...'); dRetry(true); }
    });
    p.on('disconnected', () => { if (D.peer === p && !p.destroyed) setTimeout(() => { try { if (p.disconnected && !p.destroyed) p.reconnect(); } catch (e) { /* ignore */ } }, 2000); });
  } else if (D.peer.open) dOpenConn();
  else dStat('Đang mở kết nối...');
}
function dOpenConn() {
  if (D.conn) { const o = D.conn; D.conn = null; try { o.close(); } catch (e) { /* ignore */ } }
  const c = D.peer.connect(PREFIX + D.code, { reliable: true }); D.conn = c; D.open = false;
  dStat('Đang kết nối tới mã ' + D.code + '...');
  const to = setTimeout(() => { if (D.conn === c && !D.open) { try { c.close(); } catch (e) { /* ignore */ } dStat('Kết nối chậm, đang thử lại...'); dRetry(false); } }, 10000);
  c.on('open', () => {
    if (D.conn !== c) return; clearTimeout(to); D.open = true; D.lastMsg = performance.now();
    c.send({ type: 'hello', have: S.media.map(m => m.id), ar: myAR(), name: devName() });
    dStat('Đã kết nối với mã ' + D.code + '.'); dCard(false); dBar();
  });
  c.on('data', m => { if (D.conn === c) dOnData(m); });
  const lost = () => { if (D.conn !== c) return; clearTimeout(to); const was = D.open; D.open = false; if (was) { dStat('Mất kết nối, đang thử lại. Hình vẫn chạy tiếp.'); dBar(); } dRetry(false); };
  c.on('close', lost); c.on('error', lost);
}
function dRetry(hard) {
  clearTimeout(D.retryT);
  D.retryT = setTimeout(() => {
    if (hard && D.peer) { try { D.peer.destroy(); } catch (e) { /* ignore */ } D.peer = null; }
    dConnect();
  }, 3000);
}
async function dOnData(m) {
  D.lastMsg = performance.now();
  if (!m || typeof m !== 'object') return;
  switch (m.type) {
    case 'state': try { applyState(JSON.parse(m.json)); } catch (e) { console.warn(e); } break;
    case 'clock': {
      const est = m.beats + (D.rtt / 2) * m.bpm / 60000, err = est - S.beats;
      S.bpm = m.bpm;
      if (m.epoch !== D.epoch || Math.abs(err) > 0.5) { S.beats = est; D.epoch = m.epoch; } else S.beats += err * 0.25;
      break;
    }
    case 'pong': D.rtt = lerp(D.rtt, performance.now() - m.t, 0.3); break;
    case 'bs': D.rx.set(m.id, { meta: m, parts: new Array(m.n), got: 0 }); dStat('Đang nhận "' + m.name + '"...'); break;
    case 'bc': { const r = D.rx.get(m.id); if (r && !r.parts[m.i]) { r.parts[m.i] = m.data; r.got++; if (r.got % 60 === 0) $('#dBarStat').textContent = 'Đang nhận "' + r.meta.name + '" ' + Math.round(r.got / r.meta.n * 100) + '%'; } break; }
    case 'be': {
      const r = D.rx.get(m.id); D.rx.delete(m.id); if (!r || r.got !== r.meta.n) break;
      const file = new File(r.parts, r.meta.name, { type: r.meta.mime });
      if (r.meta.kind === 'media') await addMedia(file, { id: m.id });
      if (D.conn && D.open) D.conn.send({ type: 'got', id: m.id });
      dStat('Đã nhận "' + r.meta.name + '".');
      break;
    }
  }
}
function applyState(st) {
  const frameBefore = [S.aspect, S.custom.join(':'), S.res, S.screenAR].join('|');
  ['bpm', 'div', 'aspect', 'custom', 'res', 'screenAR', 'outFit', 'mediaFit', 'black', 'guides', 'limit', 'dim', 'freeze', 'drop', 'lat', 'text'].forEach(k => { if (st[k] !== undefined) S[k] = st[k]; });
  if (st.fx) Object.entries(st.fx).forEach(([k, f]) => { if (S.fx[k]) { S.fx[k].on = !!f.on; Object.assign(S.fx[k].p, f.p); } });
  if (st.mp) S.media.forEach(m => { if (st.mp[m.id]) Object.assign(m, st.mp[m.id]); });
  if (st.deck) Object.assign(S.deck, st.deck);
  S.xfAnim = st.xfAnim || null;
  if ([S.aspect, S.custom.join(':'), S.res, S.screenAR].join('|') !== frameBefore) alloc();
  cv.className = S.outFit === 'cover' ? 'fit-cover' : S.outFit === 'stretch' ? 'fit-stretch' : '';
}
function dTick(now) {
  D.frames++;
  if (now - D.fpsT > 1000) { D.fps = Math.round(D.frames * 1000 / (now - D.fpsT)); D.frames = 0; D.fpsT = now; }
  if (D.open && D.conn) {
    if (now - D.lastStatus > 2000) { D.lastStatus = now; try { D.conn.send({ type: 'status', fps: D.fps, ar: myAR() }); D.conn.send({ type: 'ping', t: now }); } catch (e) { /* ignore */ } }
    if (now - D.lastMsg > 6000) { D.open = false; dStat('Không nhận được tín hiệu từ máy điều khiển, đang nối lại. Hình vẫn chạy tiếp.'); dBar(); try { D.conn.close(); } catch (e) { /* ignore */ } D.conn = null; dRetry(true); }
  }
}
function setupDisplay() {
  document.body.dataset.role = 'display';
  const disp = $('#disp'); disp.hidden = false; disp.insertBefore(cv, disp.firstChild);
  document.title = 'Màn chiếu · Lollipop VJ';
  const code = HASH_CODE || lsGet('plv-display-code') || ''; $('#dCode').value = code;
  $('#dGo').addEventListener('click', dConnect);
  $('#dCode').addEventListener('keydown', e => { if (e.key === 'Enter') dConnect(); });
  const full = () => { keepAwake(true); if (fsActive()) fsExit(); else fsEl(document.documentElement).catch(() => toast('Trình duyệt này không có toàn màn hình. Trên iPad: Thêm vào Màn hình chính rồi mở từ đó.', 5000)); };
  $('#dFull').addEventListener('click', full); $('#dFull2').addEventListener('click', full);
  $('#dHide').addEventListener('click', () => { dCard(false); dBar(); });
  $('#dShow').addEventListener('click', () => dCard(true));
  $('#dBack').addEventListener('click', e => { e.preventDefault(); history.replaceState(null, '', location.pathname + location.search); location.reload(); });
  cv.addEventListener('click', () => { keepAwake(true); if ($('#dCard').hidden) dBar(); });
  cv.addEventListener('dblclick', full);
  window.addEventListener('keydown', e => { if (e.key === 'f' || e.key === 'F') { if (e.target.tagName !== 'INPUT') full(); } if (e.key === 'Escape') dCard(true); });
  window.addEventListener('resize', () => { if (D.open && D.conn) try { D.conn.send({ type: 'status', fps: D.fps, ar: myAR() }); } catch (e) { /* ignore */ } });
  keepAwake(true);
  dCard(true);
  if (code.length === 4) restoreP.then(dConnect);
}
