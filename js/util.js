'use strict';
/* Popping Lollipop VJ · util.js */
/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const fr = x => x - Math.floor(x);
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function mulberry32(a) { return function () { let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };
let toastT = 0;
function toast(msg, ms = 3500) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms); }

/* role: controller (default) or display (#man-chieu) */
const HASH_RE = /man-?chieu(?:[=-](\d{4}))?/i;
const hm = (location.hash + ' ' + location.search).match(HASH_RE);
const ROLE = hm ? 'display' : 'control';
const HASH_CODE = hm && hm[1] ? hm[1] : '';
window.addEventListener('hashchange', () => { const now = HASH_RE.test(location.hash) ? 'display' : 'control'; if (now !== ROLE) location.reload(); });
