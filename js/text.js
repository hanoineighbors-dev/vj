'use strict';
/* Popping Lollipop VJ · text.js */
/* ---------- text layer ---------- */
function countdownLines() {
  const T = S.text, [hh, mm] = (T.target || '00:00').split(':').map(n => parseInt(n, 10) || 0);
  const now = new Date(), tgt = new Date(now); tgt.setHours(hh, mm, 0, 0);
  let diff = tgt - now; if (diff < -12 * 3600e3) diff += 24 * 3600e3; if (diff > 12 * 3600e3) diff -= 24 * 3600e3;
  if (diff <= 0) return ['00:00', (T.label || '').replace(/\s*SAU\s*$/i, '') + '!'];
  const s = Math.ceil(diff / 1000), h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60;
  const two = n => String(n).padStart(2, '0');
  return [T.label || '', (h ? h + ':' + two(mi) : two(mi)) + ':' + two(se)];
}
function textLines() {
  const T = S.text;
  switch (T.preset) {
    case 'title': return ['BACK TO THE', 'RABBIT HOLE'];
    case 'queens': return ['NỮ HOÀNG ĐỎ', 'vs', 'NỮ HOÀNG TRẮNG'];
    case 'aura': return ['AURA', 'BATTLE'];
    case 'count': return countdownLines();
    default: return (T.custom || 'Happy Halloween').split('/').map(s => s.trim()).filter(Boolean).slice(0, 4);
  }
}
function drawText(ctx, b) {
  const T = S.text; if (!T.on) return;
  const lines = textLines(); if (!lines.length) return;
  const royal = T.style === 'royal', fam = royal ? FONT_ROYAL : FONT_POP, weight = royal ? '900' : '800';
  const kick = Math.pow(1 - fr(b), 3), beatN = Math.floor(b);
  const scroll = T.motion === 'scroll';
  const maxW = W * (scroll ? 10 : 0.9);
  let size = Math.round(Math.min(W, H) * lerp(0.08, 0.24, T.size));
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const rows = scroll ? [lines.join('  ✦  ')] : lines;
  const sizes = rows.map(l => {
    let s = l === 'vs' ? size * 0.6 : size; ctx.font = (royal && l === 'vs' ? 'italic ' : '') + weight + ' ' + s + 'px ' + fam;
    const w = ctx.measureText(l).width; if (w > maxW) s = Math.floor(s * maxW / w); return s;
  });
  const lh = sizes.reduce((a, s) => a + s * 1.08, 0);
  let y0 = T.pos === 'top' ? H * 0.07 : T.pos === 'bottom' ? H * 0.93 - lh : H / 2 - lh / 2;
  let sc = 1; if (T.motion === 'pulse') sc = 1 + 0.07 * kick;
  const cx = W / 2;
  ctx.translate(cx, y0 + lh / 2); ctx.scale(sc, sc); ctx.translate(-cx, -(y0 + lh / 2));
  let y = y0;
  rows.forEach((l, i) => {
    const s = sizes[i]; y += s * 0.54;
    ctx.font = (royal && l === 'vs' ? 'italic ' : '') + weight + ' ' + s + 'px ' + fam;
    let fill = '#FFFFFF';
    if (T.preset === 'queens') fill = l === 'vs' ? '#FFD447' : (i === 0 ? '#F0284A' : '#FFFFFF');
    else if (royal) fill = i % 2 ? '#F0284A' : '#FFFFFF';
    if (T.motion === 'swap' && l !== 'vs') { const red = (i + beatN) % 2 === 0; fill = red ? '#F0284A' : '#FFFFFF'; }
    let x = cx;
    if (scroll) { const w = ctx.measureText(l).width; const span = W + w; x = W + w / 2 - fr(b / 16) * span; }
    ctx.lineWidth = Math.max(4, s * 0.12); ctx.strokeStyle = '#14060A';
    ctx.shadowColor = royal ? 'rgba(240,40,74,.75)' : 'rgba(255,79,163,.8)'; ctx.shadowBlur = s * 0.35;
    ctx.strokeText(l, x, y); ctx.shadowBlur = 0; ctx.fillStyle = fill; ctx.fillText(l, x, y);
    y += s * 0.54;
  });
  ctx.restore();
}
