'use strict';
/* Popping Lollipop VJ · draw.js: khung hình và các canvas dùng để vẽ */
/* ---------- canvases ---------- */
const cv = $('#cv'), cvx = cv.getContext('2d'), stage = $('#stage');
const mk = () => { const c = document.createElement('canvas'); return { cv: c, ctx: c.getContext('2d', { willReadFrequently: false }) }; };
const A = mk(), B = mk(), CC = mk(), FB = mk(), SN = mk(), TUN = mk(), PX = mk(), DA = mk(), DB = mk();
const DUO = { cv: document.createElement('canvas') }; DUO.ctx = DUO.cv.getContext('2d', { willReadFrequently: true });
let cur = A, alt = B, W = 0, H = 0;
function frameAR() {
  if (S.aspect === 'screen') return clamp(S.screenAR || 16 / 9, 0.4, 3.5);
  const [aw, ah] = S.aspect === 'custom' ? S.custom : ASPECTS[S.aspect] || [16, 9];
  return aw / ah;
}
function frameSize() {
  const r = frameAR(), long = S.res;
  let w, h; if (r >= 1) { w = long; h = Math.round(long / r); } else { h = long; w = Math.round(long * r); }
  return [Math.max(64, w & ~1), Math.max(64, h & ~1)];
}
function alloc() {
  const [nw, nh] = frameSize();
  if (nw === W && nh === H && A.cv.width === nw) { infoFrame(); return; }
  W = nw; H = nh;
  cv.width = W; cv.height = H;
  [A, B, CC, FB, SN, TUN, DA, DB].forEach(o => { o.cv.width = W; o.cv.height = H; });
  stage.style.setProperty('--ar', (W / H).toFixed(4));
  infoFrame();
}
function infoFrame() {
  const lbl = S.aspect === 'custom' ? S.custom.join(':') : S.aspect === 'screen' ? 'Theo màn chiếu' : S.aspect;
  const el = $('#frameInfo'); if (el) el.textContent = lbl + ' ' + W + 'x' + H;
}

function rr(ctx, x, y, w, h, k) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, k); else { ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k); ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath(); } }
const FONT_POP = '"Baloo 2","Trebuchet MS",system-ui,sans-serif';
const FONT_ROYAL = '"Playfair Display",Georgia,"Times New Roman",serif';
