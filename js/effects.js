'use strict';
/* Popping Lollipop VJ · effects.js */
/* ---------- effects ---------- */
let stIdx = -1;
const fxWas = {};
function pass(fn) {
  const c = alt.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = true;
  c.clearRect(0, 0, W, H); fn(c, cur.cv);
  /* trả context về trạng thái gốc, nếu không chữ vẽ sau sẽ bị lệch theo phép phóng/xoay của effect */
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = true;
  const t = cur; cur = alt; alt = t;
}
const kickOf = (b, cyc, pow = 3) => Math.pow(1 - fr(b / cyc), pow);
const FXI = {
  hue(F, b, t, cyc) {
    const p = F.p, hue = (t / 1000 * p.speed * 120 + Math.floor(b / cyc) * p.jump * 97) % 360;
    pass((c, src) => { c.drawImage(src, 0, 0); c.globalCompositeOperation = 'color'; c.globalAlpha = p.mix; c.fillStyle = 'hsl(' + hue.toFixed(0) + ',100%,55%)'; c.fillRect(0, 0, W, H); });
  },
  cards(F, b, t, cyc) {
    const p = F.p, k = lerp(9, 2.5, p.detail), dw = Math.max(16, Math.round(W / k)), dh = Math.max(16, Math.round(H / k));
    if (DUO.cv.width !== dw || DUO.cv.height !== dh) { DUO.cv.width = dw; DUO.cv.height = dh; }
    const d = DUO.ctx; d.drawImage(cur.cv, 0, 0, dw, dh);
    const img = d.getImageData(0, 0, dw, dh), px = img.data;
    const lo = 255 * lerp(0.12, 0.55, p.thr), hi = lo + 255 * 0.3;
    const swap = p.swap >= 0.5 && Math.floor(b / cyc) % 2 === 1;
    const K = swap ? [250, 246, 240] : [16, 10, 14], Wt = swap ? [16, 10, 14] : [250, 246, 240], R = [232, 23, 58];
    for (let i = 0; i < px.length; i += 4) {
      const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      const c = l < lo ? K : l < hi ? R : Wt; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
    }
    d.putImageData(img, 0, 0);
    pass(c => { c.imageSmoothingEnabled = false; c.drawImage(DUO.cv, 0, 0, W, H); });
  },
  invert(F, b, t, cyc) {
    const p = F.p, every = Math.round(p.every), cy = S.limit ? Math.max(cyc * every, S.bpm / 90) : cyc * every;
    if (fr(b / cy) < p.len) pass((c, src) => { c.drawImage(src, 0, 0); c.globalCompositeOperation = 'difference'; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); });
  },
  zoom(F, b, t, cyc, boost) {
    const p = F.p, amt = boost ? Math.max(p.amt, 0.8) : p.amt, k = Math.pow(1 - fr(b / cyc), 1 + p.decay * 8), s = 1 + amt * 0.4 * k;
    pass((c, src) => { c.translate(W / 2, H / 2); c.rotate(Math.sin(b * Math.PI / cyc) * p.rot * 0.12); c.scale(s, s); c.drawImage(src, -W / 2, -H / 2); });
  },
  drink(F, b, t, cyc) {
    const p = F.p, n = Math.floor(b / cyc), f = fr(b / cyc);
    const small = 1 - 0.5 * p.amt, big = 1 + 0.55 * p.amt, tgt = n % 2 ? big : small, prev = n % 2 ? small : big;
    const e = 1 - Math.pow(1 - Math.min(1, f * lerp(1.5, 8, p.speed)), 3), s = lerp(prev, tgt, e);
    pass((c, src) => {
      c.fillStyle = '#07040c'; c.fillRect(0, 0, W, H);
      if (p.bg > 0) { c.globalAlpha = p.bg; c.drawImage(src, 0, 0); c.globalAlpha = 1; }
      c.translate(W / 2, H / 2); c.scale(s, s); c.drawImage(src, -W / 2, -H / 2);
    });
  },
  shake(F, b, t, cyc, boost) {
    const p = F.p, amt = boost ? Math.max(p.amt, 0.7) : p.amt, k = kickOf(b, cyc, 2 + p.decay * 6), r = mulberry32(Math.floor(b / cyc) * 31 + 7);
    const dx = (r() - 0.5) * 2 * amt * W * 0.05 * k, dy = (r() - 0.5) * 2 * amt * H * 0.05 * k, rot = (r() - 0.5) * p.rot * 0.12 * k, s = 1 + amt * 0.08;
    pass((c, src) => { c.translate(W / 2 + dx, H / 2 + dy); c.rotate(rot); c.scale(s, s); c.drawImage(src, -W / 2, -H / 2); });
  },
  mirror(F, b, t, cyc) {
    const p = F.p, mode = Math.round(p.mode), alt2 = p.flip >= 0.5 && Math.floor(b / cyc) % 2 === 1;
    pass((c, src) => {
      if (mode === 1) {
        const x0 = alt2 ? W / 2 : 0;
        c.drawImage(src, x0, 0, W / 2, H, 0, 0, W / 2, H);
        c.save(); c.translate(W, 0); c.scale(-1, 1); c.drawImage(src, x0, 0, W / 2, H, 0, 0, W / 2, H); c.restore();
      } else if (mode === 2) {
        const y0 = alt2 ? H / 2 : 0;
        c.drawImage(src, 0, y0, W, H / 2, 0, 0, W, H / 2);
        c.save(); c.translate(0, H); c.scale(1, -1); c.drawImage(src, 0, y0, W, H / 2, 0, 0, W, H / 2); c.restore();
      } else {
        const x0 = alt2 ? W / 4 : 0, y0 = alt2 ? H / 4 : 0;
        [[1, 1, 0, 0], [-1, 1, W, 0], [1, -1, 0, H], [-1, -1, W, H]].forEach(([sx, sy, tx, ty]) => { c.save(); c.translate(tx, ty); c.scale(sx, sy); c.drawImage(src, x0, y0, W / 2, H / 2, 0, 0, W / 2, H / 2); c.restore(); });
      }
    });
  },
  kaleido(F, b) {
    const p = F.p, n = Math.round(p.seg), R = Math.hypot(W, H) / 2 + 4, spin = b * p.spin * 0.5;
    pass((c, src) => {
      for (let i = 0; i < n; i++) {
        c.save(); c.translate(W / 2, H / 2); c.rotate(i * TAU / n); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, -Math.PI / n - 0.002, Math.PI / n + 0.002); c.closePath(); c.clip();
        if (i % 2) c.scale(1, -1); c.rotate(spin); c.scale(p.zoom, p.zoom); c.drawImage(src, -W / 2, -H / 2); c.restore();
      }
    });
  },
  wave(F, b, t, cyc) {
    const p = F.p, n = 48, sh = H / n, amp = p.amp * W * 0.06 * (0.6 + 0.4 * kickOf(b, cyc)), fq = lerp(1, 7, p.freq), ph = b * TAU * lerp(0.1, 0.8, p.speed);
    pass((c, src) => { c.drawImage(src, 0, 0); for (let i = 0; i < n; i++) { const y = i * sh, dx = Math.sin(i / n * TAU * fq + ph) * amp; c.drawImage(src, 0, y, W, sh + 1, dx, y, W, sh + 1); } });
  },
  tunnel(F, b, t, cyc) {
    const p = F.p, k = kickOf(b, cyc), s = lerp(0.93, 0.72, p.size) * (1 - 0.05 * k), rot = (p.spin * 0.12) * (0.4 + 0.6 * k);
    if (!fxWas.tunnel) { TUN.ctx.clearRect(0, 0, W, H); }
    pass((c, src) => { c.drawImage(src, 0, 0); c.save(); c.translate(W / 2, H / 2); c.rotate(rot); c.scale(s, s); c.globalAlpha = p.depth; c.drawImage(TUN.cv, -W / 2, -H / 2); c.restore(); });
    TUN.ctx.globalAlpha = 1; TUN.ctx.clearRect(0, 0, W, H); TUN.ctx.drawImage(cur.cv, 0, 0);
  },
  pixel(F, b, t, cyc) {
    const p = F.p, k = lerp(5, 48, p.size) * (1 + p.beat * 1.5 * kickOf(b, cyc)), pw = Math.max(4, Math.ceil(W / k)), ph = Math.max(3, Math.ceil(H / k));
    if (PX.cv.width !== pw || PX.cv.height !== ph) { PX.cv.width = pw; PX.cv.height = ph; }
    PX.ctx.imageSmoothingEnabled = true; PX.ctx.drawImage(cur.cv, 0, 0, pw, ph);
    pass(c => { c.imageSmoothingEnabled = false; c.drawImage(PX.cv, 0, 0, W, H); });
  },
  rgb(F, b, t, cyc, boost) {
    const p = F.p, amt = boost ? Math.max(p.amt, 0.7) : p.amt, k = kickOf(b, cyc), off = amt * W * 0.035 * (1 - p.wob + p.wob * k), ang = p.ang * Math.PI / 180, dx = Math.cos(ang) * off, dy = Math.sin(ang) * off;
    pass((c, src) => {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'lighter';
      [['#f00', -1], ['#0f0', 0], ['#00f', 1]].forEach(([col, s]) => {
        const t2 = CC.ctx; t2.globalCompositeOperation = 'source-over'; t2.clearRect(0, 0, W, H); t2.drawImage(src, 0, 0);
        t2.globalCompositeOperation = 'multiply'; t2.fillStyle = col; t2.fillRect(0, 0, W, H); t2.globalCompositeOperation = 'source-over';
        c.drawImage(CC.cv, dx * s, dy * s);
      });
    });
  },
  glitch(F, b, t, cyc) {
    const p = F.p, seed = Math.floor(b * (2 + p.rate * 8)), r = mulberry32(seed * 7919 + 13), k = 0.35 + 0.65 * kickOf(b, cyc, 2), n = Math.round(4 + p.amt * 14);
    pass((c, src) => {
      c.drawImage(src, 0, 0);
      for (let i = 0; i < n; i++) { const h = Math.max(4, (0.03 + r() * p.band * 0.14) * H), y = r() * (H - h), off = (r() - 0.5) * 2 * p.amt * W * 0.18 * k; c.drawImage(src, 0, y, W, h, off, y, W, h); }
      if (r() < p.amt * 0.7 * k) { c.globalAlpha = 0.5; c.fillStyle = ['#ff2d95', '#2de6ff', '#b6f23a'][Math.floor(r() * 3)]; c.fillRect(0, r() * H, W, Math.max(2, H * 0.01 * (1 + r() * 3))); c.globalAlpha = 1; }
    });
  },
  stutter(F, b) {
    const p = F.p, mult = [1, 2, 4, 8][clamp(Math.round(p.rate) - 1, 0, 3)], pos = b * mult, idx = Math.floor(pos), f = pos - idx;
    pass((c, src) => {
      if (idx !== stIdx || !fxWas.stutter) { stIdx = idx; SN.ctx.clearRect(0, 0, W, H); SN.ctx.drawImage(src, 0, 0); }
      if (f < p.len) { const s = 1 + p.scale * (f / p.len); c.translate(W / 2, H / 2); c.scale(s, s); c.drawImage(SN.cv, -W / 2, -H / 2); }
      else c.drawImage(src, 0, 0);
    });
  },
  trails(F) {
    const p = F.p;
    if (!fxWas.trails) FB.ctx.clearRect(0, 0, W, H);
    pass((c, src) => { c.globalAlpha = p.len; c.save(); c.translate(W / 2, H / 2); const s = 1 + p.drift * 0.02; c.scale(s, s); c.drawImage(FB.cv, -W / 2, -H / 2); c.restore(); c.globalAlpha = p.fresh; c.drawImage(src, 0, 0); c.globalAlpha = 1; });
    FB.ctx.globalAlpha = 1; FB.ctx.clearRect(0, 0, W, H); FB.ctx.drawImage(cur.cv, 0, 0);
  },
  flash(F, b, t, cyc, boost) {
    const p = F.p, every = boost ? 1 : Math.round(p.every), cy = S.limit ? Math.max(cyc * every, S.bpm / 180) : cyc * every, e = Math.pow(1 - fr(b / cy), 4), amt = boost ? Math.max(p.amt, 0.6) : p.amt;
    pass((c, src) => { c.drawImage(src, 0, 0); c.globalAlpha = clamp(amt * 0.85 * e, 0, 1); c.fillStyle = 'rgb(255,' + Math.round(255 - p.tint * 215) + ',' + Math.round(255 - p.tint * 190) + ')'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; });
  }
};
function fxActive(id) { return S.fx[id].on || (S.drop && DROP_SET.has(id)); }
function runFx(b, t) {
  const cyc = S.div;
  for (const id of FX_ORDER) {
    const on = fxActive(id);
    if (on) {
      try { FXI[id](S.fx[id], b, t, cyc, S.drop && DROP_SET.has(id) && !S.fx[id].on); }
      catch (e) { console.error(e); S.fx[id].on = false; toast('Effect "' + FXD[id].name + '" bị lỗi trên máy này nên đã tắt.'); syncPads(); }
    }
    fxWas[id] = on;
  }
}
function drawGuides(ctx) {
  ctx.save(); ctx.lineWidth = Math.max(2, W / 640); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 3;
  ctx.beginPath(); for (let i = 1; i < 3; i++) { ctx.moveTo(W * i / 3, 0); ctx.lineTo(W * i / 3, H); ctx.moveTo(0, H * i / 3); ctx.lineTo(W, H * i / 3); } ctx.stroke();
  ctx.setLineDash([12, 8]); ctx.strokeRect(W * 0.05, H * 0.05, W * 0.9, H * 0.9); ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(W / 2 - 24, H / 2); ctx.lineTo(W / 2 + 24, H / 2); ctx.moveTo(W / 2, H / 2 - 24); ctx.lineTo(W / 2, H / 2 + 24); ctx.stroke(); ctx.strokeRect(1, 1, W - 2, H - 2);
  ctx.shadowBlur = 0; const cols = ['#fff', '#ff0', '#0ff', '#0f0', '#f0f', '#f00', '#00f'], bw = W / cols.length, bh = H * 0.07; cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * bw, H - bh, bw, bh); });
  ctx.restore();
}

/* ---------- render ---------- */
function resetCtx(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowColor = 'transparent'; c.shadowBlur = 0; c.imageSmoothingEnabled = true; }
function render(now, dt) {
  mixerStep();
  if (S.freeze) return;
  const b = S.beats + S.lat * S.bpm / 60000;
  drawDecks(cur.ctx, b, dt, now);
  runFx(b, now);
  resetCtx(cur.ctx);
  drawText(cur.ctx, b);
  resetCtx(cur.ctx);
  if (S.guides) drawGuides(cur.ctx);
  if (S.dim < 1) { cur.ctx.globalAlpha = 1 - S.dim; cur.ctx.fillStyle = '#000'; cur.ctx.fillRect(0, 0, W, H); cur.ctx.globalAlpha = 1; }
  if (S.black) { cur.ctx.fillStyle = '#000'; cur.ctx.fillRect(0, 0, W, H); }
  cvx.drawImage(cur.cv, 0, 0);
}
