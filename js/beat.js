'use strict';
/* Popping Lollipop VJ · beat.js */
/* ---------- beat clock ---------- */
const taps = [];
function setBpm(v, fromUser) {
  if (!isFinite(v)) return;
  S.bpm = clamp(Math.round(v * 10) / 10, 40, 220);
  if (fromUser && mic.on) S.manualLock = true;
  uiBpm(true); updateMicUI(); save();
}
function tap() {
  const now = performance.now();
  if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
  taps.push(now); if (taps.length > 8) taps.shift();
  if (taps.length >= 2) { const iv = []; for (let i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]); iv.sort((a, b) => a - b); const med = iv[Math.floor(iv.length / 2)]; const good = iv.filter(x => Math.abs(x - med) < med * 0.25); const avg = good.reduce((a, b) => a + b, 0) / good.length; setBpm(60000 / avg, true); }
  else if (mic.on) { S.manualLock = true; updateMicUI(); }
  S.beats = Math.round(S.beats); S.epoch++;
  const btn = $('#btnTap'); btn.classList.add('hit'); setTimeout(() => btn.classList.remove('hit'), 90);
  beep(1320);
}

/* mic */
const mic = { on: false, ctx: null, an: null, buf: null, stream: null, avg: 0, lastOn: 0, armed: true, iois: [], est: 0, conf: 0, level: 0 };
async function micStart() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-mic-api');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    const src = ctx.createMediaStreamSource(stream), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.Q.value = 0.7;
    const an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(lp); lp.connect(an);
    Object.assign(mic, { on: true, ctx, an, stream, buf: new Float32Array(an.fftSize), avg: 0, lastOn: 0, armed: true, iois: [], est: 0, conf: 0, level: 0 });
    S.manualLock = false; setSwitch('#micSw', true); updateMicUI();
  } catch (e) {
    mic.on = false; setSwitch('#micSw', false);
    $('#micText').textContent = 'Mic không dùng được. Cho phép mic trong trình duyệt (biểu tượng ổ khoá cạnh địa chỉ), hoặc dùng Tap.';
    $('#btnUseMic').hidden = true;
  }
}
function micStop() {
  try { mic.stream && mic.stream.getTracks().forEach(t => t.stop()); mic.ctx && mic.ctx.close(); } catch (e) { /* ignore */ }
  mic.on = false; mic.an = null; mic.conf = 0; mic.level = 0; setSwitch('#micSw', false); updateMicUI();
}
function micOnset(now) {
  if (mic.lastOn > 0) { const d = now - mic.lastOn; if (d > 250 && d < 2000) mic.iois.push({ d, t: now }); }
  mic.lastOn = now;
  mic.iois = mic.iois.filter(o => now - o.t < 12000).slice(-40);
  const bins = new Float32Array(101); let total = 0;
  for (const o of mic.iois) {
    let bpm = 60000 / o.d; while (bpm < 70) bpm *= 2; while (bpm >= 170) bpm /= 2;
    const c = Math.round(bpm - 70);
    for (let k = -2; k <= 2; k++) { const idx = c + k; if (idx >= 0 && idx <= 100) { const w = Math.exp(-(k * k) / 2); bins[idx] += w; total += w; } }
  }
  if (!total) return;
  let best = 0; for (let i = 1; i <= 100; i++) if (bins[i] > bins[best]) best = i;
  let near = 0, wsum = 0; for (let k = -3; k <= 3; k++) { const idx = best + k; if (idx >= 0 && idx <= 100) { near += bins[idx]; wsum += bins[idx] * (idx + 70); } }
  mic.est = wsum / near; mic.conf = clamp(near / total * Math.min(1, mic.iois.length / 8), 0, 1);
  if (!S.manualLock && mic.conf > 0.5) { const diff = Math.round(S.beats) - S.beats; if (Math.abs(diff) < 0.35) S.beats += diff * 0.2; }
}
function micStep(now) {
  if (!mic.on || !mic.an) return;
  mic.an.getFloatTimeDomainData(mic.buf);
  let s = 0; for (let i = 0; i < mic.buf.length; i++) s += mic.buf[i] * mic.buf[i];
  const rms = Math.sqrt(s / mic.buf.length);
  mic.level = lerp(mic.level, rms, 0.4); mic.avg = mic.avg * 0.96 + rms * 0.04;
  const thr = Math.max(0.012, mic.avg * 1.55);
  if (rms > thr && mic.armed && now - mic.lastOn > 280) { mic.armed = false; micOnset(now); }
  if (rms < thr * 0.85) mic.armed = true;
  if (now - mic.lastOn > 3000) mic.conf *= 0.985;
  if (!S.manualLock && mic.conf > 0.5 && mic.est) S.bpm += (mic.est - S.bpm) * 0.02;
}

/* auto mode */
function autoStep() {
  if (!S.auto.on || ROLE !== 'control') return;
  const slot = Math.floor(S.beats / S.auto.every); if (slot === S.auto.last) return;
  const first = S.auto.last === -1; S.auto.last = slot; if (first) return;
  const r = Math.random();
  if (r < 0.5) {
    if (S.auto.fx) S.fx[S.auto.fx].on = false;
    const pool = FX.map(f => f.id).filter(id => id !== S.auto.fx && id !== 'flash' && id !== 'invert'); const id = pick(pool); S.fx[id].on = true; S.auto.fx = id;
  } else if (S.media.length > 1) stepFocus(1);
  syncPads();
}
