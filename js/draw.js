'use strict';
/* Popping Lollipop VJ · draw.js */
/* ---------- canvases ---------- */
const cv = $('#cv'), cvx = cv.getContext('2d'), stage = $('#stage');
const mk = () => { const c = document.createElement('canvas'); return { cv: c, ctx: c.getContext('2d', { willReadFrequently: false }) }; };
const A = mk(), B = mk(), CC = mk(), FB = mk(), SN = mk(), TUN = mk(), PX = mk(), BASE = mk(), XF = mk();
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
  [A, B, CC, FB, SN, TUN, BASE, XF].forEach(o => { o.cv.width = W; o.cv.height = H; });
  stage.style.setProperty('--ar', (W / H).toFixed(4));
  infoFrame();
}
function infoFrame() {
  const lbl = S.aspect === 'custom' ? S.custom.join(':') : S.aspect === 'screen' ? 'Theo màn chiếu' : S.aspect;
  const el = $('#frameInfo'); if (el) el.textContent = lbl + ' ' + W + 'x' + H;
}

/* ---------- drawing primitives ---------- */
function lum(hex) { const h = hex.replace('#', ''); if (h.length < 6) return 0.5; const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function rr(ctx, x, y, w, h, k) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, k); else { ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k); ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath(); } }
function shapePath(ctx, shape, r) {
  ctx.beginPath();
  switch (shape) {
    case 'circle': case 'bubble': ctx.arc(0, 0, r, 0, TAU); break;
    case 'ring': ctx.arc(0, 0, r * 0.82, 0, TAU); break;
    case 'square': { const s = r * 0.86; rr(ctx, -s, -s, s * 2, s * 2, r * 0.32); break; }
    case 'sparkle': { const q = r * 0.16; ctx.moveTo(0, -r); ctx.quadraticCurveTo(q, -q, r, 0); ctx.quadraticCurveTo(q, q, 0, r); ctx.quadraticCurveTo(-q, q, -r, 0); ctx.quadraticCurveTo(-q, -q, 0, -r); ctx.closePath(); break; }
    case 'heart': ctx.moveTo(0, r * 0.9); ctx.bezierCurveTo(-r * 1.35, r * 0.1, -r * 0.95, -r * 0.95, 0, -r * 0.32); ctx.bezierCurveTo(r * 0.95, -r * 0.95, r * 1.35, r * 0.1, 0, r * 0.9); ctx.closePath(); break;
    case 'spade': ctx.moveTo(0, -r * 0.95); ctx.bezierCurveTo(r * 1.3, -r * 0.05, r * 0.85, r * 0.85, 0, r * 0.3); ctx.bezierCurveTo(-r * 0.85, r * 0.85, -r * 1.3, -r * 0.05, 0, -r * 0.95); ctx.closePath();
      ctx.moveTo(0, r * 0.2); ctx.lineTo(r * 0.3, r * 0.95); ctx.lineTo(-r * 0.3, r * 0.95); ctx.closePath(); break;
    case 'diamond': ctx.moveTo(0, -r); ctx.lineTo(r * 0.72, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.72, 0); ctx.closePath(); break;
    case 'club': ctx.arc(0, -r * 0.45, r * 0.4, 0, TAU); ctx.moveTo(r * 0.85, r * 0.15); ctx.arc(r * 0.45, r * 0.15, r * 0.4, 0, TAU); ctx.moveTo(-r * 0.05, r * 0.15); ctx.arc(-r * 0.45, r * 0.15, r * 0.4, 0, TAU);
      ctx.moveTo(0, 0); ctx.lineTo(r * 0.28, r * 0.95); ctx.lineTo(-r * 0.28, r * 0.95); ctx.closePath(); break;
  }
}
const SUITS = ['heart', 'spade', 'diamond', 'club'];
function drawSuit(ctx, i, r) { const s = SUITS[((i % 4) + 4) % 4]; shapePath(ctx, s, r); ctx.fillStyle = (s === 'heart' || s === 'diamond') ? '#E8173A' : '#141014'; ctx.fill(); }
function drawShape(ctx, shape, r, color, i = 0) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const lw = Math.max(1.5, r * 0.09), a0 = ctx.globalAlpha;
  if (shape === 'ring') { shapePath(ctx, shape, r); ctx.lineWidth = r * 0.3; ctx.strokeStyle = color; ctx.stroke(); }
  else if (shape === 'bubble') {
    shapePath(ctx, shape, r);
    ctx.globalAlpha = a0 * 0.4; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = a0;
    ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.34, r * 0.5, Math.PI * 1.05, Math.PI * 1.55); ctx.lineWidth = Math.max(2, r * 0.12); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke();
  } else if (shape === 'card') {
    const w = r * 1.36, h = r * 1.9;
    rr(ctx, -w / 2, -h / 2, w, h, r * 0.16); ctx.fillStyle = '#FBF7F0'; ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.08); ctx.strokeStyle = lum(color) > 0.8 ? '#141014' : color; ctx.stroke();
    ctx.save(); drawSuit(ctx, i, r * 0.48); ctx.restore();
    ctx.save(); ctx.translate(-w * 0.32, -h * 0.34); drawSuit(ctx, i, r * 0.15); ctx.restore();
    ctx.save(); ctx.translate(w * 0.32, h * 0.34); ctx.rotate(Math.PI); drawSuit(ctx, i, r * 0.15); ctx.restore();
  } else if (shape === 'clock') {
    ctx.beginPath(); ctx.arc(0, -r * 0.98, r * 0.14, 0, TAU); ctx.fillStyle = color; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, TAU); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, TAU); ctx.fillStyle = '#FFF8EC'; ctx.fill();
    ctx.strokeStyle = '#2B2447'; ctx.lineWidth = Math.max(1, r * 0.05);
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); ctx.lineTo(Math.cos(a) * r * 0.68, Math.sin(a) * r * 0.68); ctx.stroke(); }
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.32, r * 0.12); ctx.stroke();
  } else if (shape === 'rabbit') {
    ctx.fillStyle = color; ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = lw;
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(s * r * 0.27, -r * 0.42, r * 0.17, r * 0.5, s * 0.18, 0, TAU); ctx.fill(); ctx.stroke(); });
    ctx.beginPath(); ctx.arc(0, r * 0.28, r * 0.56, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = lum(color) > 0.6 ? '#2B2447' : '#FFFFFF';
    ctx.beginPath(); ctx.arc(-r * 0.2, r * 0.2, r * 0.07, 0, TAU); ctx.arc(r * 0.2, r * 0.2, r * 0.07, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FF8FB8'; ctx.beginPath(); ctx.arc(0, r * 0.38, r * 0.07, 0, TAU); ctx.fill();
  } else if (shape === 'key') {
    ctx.strokeStyle = color; ctx.lineWidth = r * 0.2;
    ctx.beginPath(); ctx.arc(-r * 0.55, 0, r * 0.3, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.25, 0); ctx.lineTo(r * 0.95, 0); ctx.moveTo(r * 0.75, 0); ctx.lineTo(r * 0.75, r * 0.32); ctx.moveTo(r * 0.45, 0); ctx.lineTo(r * 0.45, r * 0.26); ctx.stroke();
  } else { shapePath(ctx, shape, r); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.stroke(); }
  ctx.restore();
}
const FONT_POP = '"Baloo 2","Trebuchet MS",system-ui,sans-serif';
const FONT_ROYAL = '"Playfair Display",Georgia,"Times New Roman",serif';
function drawKind(ctx, kind, r) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(40,20,90,.35)'; ctx.shadowBlur = r * 0.18; ctx.shadowOffsetY = r * 0.07;
  const lw = Math.max(2, r * 0.13);
  const outline = () => { ctx.lineWidth = lw; ctx.strokeStyle = '#fff'; ctx.stroke(); };
  const noShadow = () => { ctx.shadowColor = 'transparent'; };
  switch (kind) {
    case 'sparkle': shapePath(ctx, 'sparkle', r); ctx.fillStyle = '#FF4FA3'; ctx.fill(); outline(); break;
    case 'heart':
      shapePath(ctx, 'heart', r * 0.95); ctx.fillStyle = '#FF5D8F'; ctx.fill(); outline();
      noShadow(); ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.32, r * 0.16, r * 0.1, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill(); break;
    case 'smile':
      ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, TAU); ctx.fillStyle = '#FFD447'; ctx.fill(); outline(); noShadow();
      ctx.fillStyle = '#2B2447';
      ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.18, r * 0.1, r * 0.15, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.3, -r * 0.18, r * 0.1, r * 0.15, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(0, r * 0.05, r * 0.52, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = r * 0.11; ctx.strokeStyle = '#2B2447'; ctx.stroke(); break;
    case 'wow': {
      const n = 12; ctx.beginPath();
      for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU - Math.PI / 2, rad = i % 2 ? r * 0.74 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
      ctx.closePath(); ctx.fillStyle = '#FFE14D'; ctx.fill(); outline(); noShadow();
      ctx.rotate(-0.12); ctx.fillStyle = '#FF4FA3'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 ' + Math.round(r * 0.6) + 'px ' + FONT_POP; ctx.fillText('WOW!', 0, r * 0.04); break;
    }
    case 'cd': {
      ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, TAU); ctx.arc(0, 0, r * 0.17, 0, TAU, true);
      const gr = ctx.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.25, '#B9F3FF'); gr.addColorStop(0.5, '#FFC6E6'); gr.addColorStop(0.75, '#D5C6FF'); gr.addColorStop(1, '#FFFFFF');
      ctx.fillStyle = gr; ctx.fill('evenodd'); outline(); noShadow();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.36, 0, TAU); ctx.arc(0, 0, r * 0.3, 0, TAU, true); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill('evenodd'); break;
    }
    case 'lolli':
      ctx.beginPath(); ctx.rect(-r * 0.07, r * 0.2, r * 0.14, r * 0.8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = lw * 0.5; ctx.strokeStyle = '#D9CFF5'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -r * 0.28, r * 0.66, 0, TAU); ctx.fillStyle = '#FF4FA3'; ctx.fill(); outline(); noShadow();
      ctx.beginPath(); for (let a = 0; a <= TAU * 2.6; a += 0.15) { const rad = a / (TAU * 2.6) * r * 0.58; ctx.lineTo(Math.cos(a) * rad, -r * 0.28 + Math.sin(a) * rad); }
      ctx.lineWidth = r * 0.13; ctx.strokeStyle = '#fff'; ctx.stroke(); break;
    case 'bubble':
      ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, TAU); ctx.fillStyle = 'rgba(56,214,238,.4)'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke(); noShadow();
      ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.3, r * 0.5, Math.PI * 1.05, Math.PI * 1.55); ctx.lineWidth = r * 0.13; ctx.strokeStyle = '#fff'; ctx.stroke(); break;
    case 'rabbit': {
      ctx.fillStyle = '#FFFFFF';
      [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(s * r * 0.26, -r * 0.45, r * 0.17, r * 0.5, s * 0.16, 0, TAU); ctx.fill(); ctx.lineWidth = lw * 0.6; ctx.strokeStyle = '#2B2447'; ctx.stroke(); });
      ctx.beginPath(); ctx.arc(0, r * 0.28, r * 0.58, 0, TAU); ctx.fill(); ctx.stroke(); noShadow();
      ctx.fillStyle = '#FF8FB8'; [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(s * r * 0.26, -r * 0.45, r * 0.07, r * 0.34, s * 0.16, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#E8173A'; ctx.beginPath(); ctx.arc(-r * 0.21, r * 0.18, r * 0.08, 0, TAU); ctx.arc(r * 0.21, r * 0.18, r * 0.08, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FF6F9E'; ctx.beginPath(); ctx.arc(0, r * 0.36, r * 0.07, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2B2447'; ctx.lineWidth = Math.max(1, r * 0.025);
      [-1, 1].forEach(s => { [-0.06, 0.04].forEach(dy => { ctx.beginPath(); ctx.moveTo(s * r * 0.12, r * (0.4 + dy)); ctx.lineTo(s * r * 0.55, r * (0.36 + dy * 2)); ctx.stroke(); }); });
      ctx.fillStyle = '#E8173A'; ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.82); ctx.lineTo(0, r * 0.9); ctx.lineTo(r * 0.3, r * 0.82); ctx.lineTo(r * 0.3, r * 1.0); ctx.lineTo(0, r * 0.92); ctx.lineTo(-r * 0.3, r * 1.0); ctx.closePath(); ctx.fill();
      break;
    }
    case 'clock': {
      ctx.beginPath(); ctx.arc(0, -r * 0.86, r * 0.16, 0, TAU); ctx.lineWidth = r * 0.08; ctx.strokeStyle = '#C9962B'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, TAU); const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#FFE58A'); g.addColorStop(1, '#C9962B'); ctx.fillStyle = g; ctx.fill(); outline(); noShadow();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, TAU); ctx.fillStyle = '#FFF8EC'; ctx.fill();
      ctx.fillStyle = '#2B2447'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 ' + Math.round(r * 0.17) + 'px ' + FONT_ROYAL;
      [12, 3, 6, 9].forEach((n, k) => { const a = k / 4 * TAU - Math.PI / 2; ctx.fillText(String(n), Math.cos(a) * r * 0.47, Math.sin(a) * r * 0.47); });
      const d = new Date(), mi = d.getMinutes() + d.getSeconds() / 60, ho = (d.getHours() % 12) + mi / 60;
      ctx.strokeStyle = '#2B2447'; ctx.lineWidth = r * 0.06;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ho / 12 * TAU) * r * 0.3, -Math.cos(ho / 12 * TAU) * r * 0.3); ctx.stroke();
      ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(mi / 60 * TAU) * r * 0.46, -Math.cos(mi / 60 * TAU) * r * 0.46); ctx.stroke();
      ctx.strokeStyle = '#E8173A'; ctx.lineWidth = r * 0.02; const se = d.getSeconds() + d.getMilliseconds() / 1000; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(se / 60 * TAU) * r * 0.5, -Math.cos(se / 60 * TAU) * r * 0.5); ctx.stroke();
      break;
    }
    case 'cardh': case 'cards': {
      const w = r * 1.3, h = r * 1.82; ctx.rotate(-0.08);
      rr(ctx, -w / 2, -h / 2, w, h, r * 0.14); ctx.fillStyle = '#FBF7F0'; ctx.fill(); outline(); noShadow();
      rr(ctx, -w / 2 + r * 0.08, -h / 2 + r * 0.08, w - r * 0.16, h - r * 0.16, r * 0.1); ctx.lineWidth = Math.max(1, r * 0.03); ctx.strokeStyle = kind === 'cardh' ? '#E8173A' : '#141014'; ctx.stroke();
      const col = kind === 'cardh' ? '#E8173A' : '#141014', suit = kind === 'cardh' ? 'heart' : 'spade';
      shapePath(ctx, suit, r * 0.45); ctx.fillStyle = col; ctx.fill();
      ctx.font = '900 ' + Math.round(r * 0.32) + 'px ' + FONT_ROYAL; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col;
      ctx.fillText('Q', -w * 0.3, -h * 0.32); ctx.save(); ctx.rotate(Math.PI); ctx.fillText('Q', -w * 0.3, -h * 0.32); ctx.restore();
      break;
    }
    case 'teacup': {
      ctx.beginPath(); ctx.ellipse(0, r * 0.62, r * 0.95, r * 0.2, 0, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = lw * 0.6; ctx.strokeStyle = '#7FB7A5'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.68, -r * 0.1); ctx.lineTo(r * 0.68, -r * 0.1); ctx.bezierCurveTo(r * 0.66, r * 0.42, r * 0.36, r * 0.6, 0, r * 0.6); ctx.bezierCurveTo(-r * 0.36, r * 0.6, -r * 0.66, r * 0.42, -r * 0.68, -r * 0.1); ctx.closePath();
      ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.stroke(); noShadow();
      ctx.beginPath(); ctx.arc(r * 0.76, r * 0.12, r * 0.2, -Math.PI / 2, Math.PI / 2); ctx.lineWidth = r * 0.09; ctx.strokeStyle = '#7FB7A5'; ctx.stroke();
      ctx.fillStyle = '#E07A9A'; [-0.35, 0, 0.35].forEach(x => { ctx.beginPath(); ctx.arc(r * x, r * 0.2, r * 0.08, 0, TAU); ctx.fill(); });
      ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.68, r * 0.12, 0, 0, TAU); ctx.fillStyle = '#B5793F'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = r * 0.07;
      [-0.25, 0.1, 0.42].forEach((x, k) => { ctx.beginPath(); ctx.moveTo(r * x, -r * 0.3); ctx.bezierCurveTo(r * (x + 0.15), -r * 0.5, r * (x - 0.15), -r * 0.65, r * x, -r * (0.85 + k * 0.03)); ctx.stroke(); });
      break;
    }
    case 'key': {
      ctx.rotate(-0.5); ctx.strokeStyle = '#E2B53E'; ctx.lineWidth = r * 0.17;
      ctx.beginPath(); ctx.arc(-r * 0.55, 0, r * 0.3, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.25, 0); ctx.lineTo(r * 0.95, 0); ctx.moveTo(r * 0.78, 0); ctx.lineTo(r * 0.78, r * 0.32); ctx.moveTo(r * 0.5, 0); ctx.lineTo(r * 0.5, r * 0.26); ctx.stroke();
      noShadow(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.arc(-r * 0.55, 0, r * 0.3, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
      ctx.fillStyle = '#E8173A'; ctx.beginPath(); ctx.arc(-r * 0.55, 0, r * 0.09, 0, TAU); ctx.fill();
      break;
    }
    case 'crown': {
      ctx.beginPath(); ctx.moveTo(-r * 0.85, r * 0.45); ctx.lineTo(-r * 0.95, -r * 0.45); ctx.lineTo(-r * 0.45, 0); ctx.lineTo(0, -r * 0.7); ctx.lineTo(r * 0.45, 0); ctx.lineTo(r * 0.95, -r * 0.45); ctx.lineTo(r * 0.85, r * 0.45); ctx.closePath();
      const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#FFE58A'); g.addColorStop(1, '#D4A02F'); ctx.fillStyle = g; ctx.fill(); outline(); noShadow();
      rr(ctx, -r * 0.88, r * 0.38, r * 1.76, r * 0.26, r * 0.08); ctx.fillStyle = '#E8173A'; ctx.fill();
      [[-0.95, -0.45], [0, -0.7], [0.95, -0.45]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(r * x, r * y, r * 0.11, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill(); });
      [-0.45, 0, 0.45].forEach(x => { shapePath(ctx, 'heart', r * 0.12); ctx.save(); ctx.translate(r * x, r * 0.51); shapePath(ctx, 'heart', r * 0.11); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore(); });
      break;
    }
    case 'drinkme': {
      ctx.rotate(0.12);
      ctx.beginPath(); ctx.moveTo(-r * 0.95, -r * 0.42); ctx.lineTo(r * 0.7, -r * 0.42); ctx.lineTo(r * 0.98, 0); ctx.lineTo(r * 0.7, r * 0.42); ctx.lineTo(-r * 0.95, r * 0.42); ctx.closePath();
      ctx.fillStyle = '#F4E3C3'; ctx.fill(); ctx.lineWidth = lw * 0.7; ctx.strokeStyle = '#8A5A2B'; ctx.stroke(); noShadow();
      ctx.beginPath(); ctx.arc(r * 0.68, 0, r * 0.07, 0, TAU); ctx.fillStyle = '#8A5A2B'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(r * 0.68, 0); ctx.bezierCurveTo(r * 1.1, -r * 0.3, r * 1.1, -r * 0.7, r * 0.8, -r * 0.9); ctx.lineWidth = r * 0.03; ctx.strokeStyle = '#E8173A'; ctx.stroke();
      ctx.fillStyle = '#3A1D10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'italic 900 ' + Math.round(r * 0.36) + 'px ' + FONT_ROYAL; ctx.fillText('Drink Me', -r * 0.12, r * 0.02);
      break;
    }
  }
  ctx.restore();
}

/* ---------- generator ---------- */
function drawGen(ctx, g, b, t) {
  const pal = PALS[g.pal] || PALS[0];
  const gr = ctx.createLinearGradient(0, 0, W, H); gr.addColorStop(0, pal.bg[0]); gr.addColorStop(1, pal.bg[1]);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  const free = g.ctl === 'free', per = free ? 1 : parseFloat(g.ctl) || 1;
  const ph = free ? fr(t / 1000 * (0.1 + g.speed * 0.5)) : fr(b / per);
  const kick = Math.pow(1 - ph, 3);
  const m = Math.min(W, H), cnt = Math.max(2, Math.round(g.count)), items = [];
  if (g.multi === 'grid') {
    const cols = cnt, rows = Math.max(1, Math.round(cnt * H / W)), cw = W / cols, ch = H / rows, r = Math.min(cw, ch) * 0.5 * (0.35 + g.size * 0.75);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) items.push({ x: (x + 0.5) * cw, y: (y + 0.5) * ch, r, i: y * cols + x, a: 1 });
  } else if (g.multi === 'circle') {
    const n = cnt * 2, R = m * 0.3, r = m * 0.11 * (0.35 + g.size * 0.85);
    for (let i = 0; i < n; i++) { const a = i / n * TAU + ph * TAU * 0.15; items.push({ x: W / 2 + Math.cos(a) * R, y: H / 2 + Math.sin(a) * R, r, i, a: 1 }); }
    items.push({ x: W / 2, y: H / 2, r: r * 1.7, i: n, a: 1 });
  } else if (g.multi === 'tunnel') {
    const n = cnt + 2;
    for (let i = 0; i < n; i++) { const k = fr((i + ph) / n); items.push({ x: W / 2, y: H / 2, r: m * 0.62 * g.size * Math.pow(k, 1.7) + m * 0.01, i, a: Math.min(1, k * 2.2) }); }
    items.sort((p, q) => q.r - p.r);
  } else {
    const rg = mulberry32(4242);
    for (let i = 0; i < cnt; i++) {
      const x = W * (0.08 + rg() * 0.4), y = H * (0.1 + rg() * 0.4), r = m * 0.11 * (0.3 + g.size * 0.9) * (0.6 + rg() * 0.8);
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([fx, fy]) => items.push({ x: fx ? W - x : x, y: fy ? H - y : y, r, i, a: 1 }));
    }
  }
  const cols = pal.c;
  for (const it of items) {
    let dx = 0, dy = 0, rot = 0, sc = 1; const i = it.i;
    switch (g.motion) {
      case 'rotate': rot = ph * TAU * (i % 2 ? -1 : 1); break;
      case 'pulse': sc = 0.7 + 0.6 * kick * (1 - 0.1 * (i % 3)); break;
      case 'orbit': { const a = ph * TAU + i * 0.7; dx = Math.cos(a) * it.r * 0.9; dy = Math.sin(a) * it.r * 0.9; break; }
      case 'bounce': dy = -Math.abs(Math.sin(Math.PI * fr(ph + i * 0.07))) * it.r * 1.4; break;
      case 'wave': dx = Math.sin(ph * TAU + i * 0.6) * it.r * 0.7; dy = Math.cos(ph * TAU + i * 0.6) * it.r * 0.5; rot = Math.sin(ph * TAU + i) * 0.4; break;
      case 'spiral': rot = ph * TAU + i * 0.5; sc = 0.75 + 0.25 * Math.sin(ph * TAU + i * 0.8); dx = Math.cos(rot) * it.r * 0.5; dy = Math.sin(rot) * it.r * 0.5; break;
    }
    ctx.save(); ctx.globalAlpha = it.a; ctx.translate(it.x + dx, it.y + dy); ctx.rotate(rot); ctx.scale(sc, sc);
    drawShape(ctx, g.shape, it.r, cols[i % cols.length], i); ctx.restore();
  }
}
