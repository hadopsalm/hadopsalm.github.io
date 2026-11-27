import { setHaptics } from './haptics.js';

export const SAVE_KEY = 'hadopsalm.save.v1';
const subs = new Set();
let state;

const randSeed = () => { const a = new Uint32Array(3); (crypto || window.crypto).getRandomValues(a); return [...a].map((x) => x.toString(36)).join(''); };
export const fresh = () => ({
  v: 1, seed: randSeed(), created: Date.now(), solved: {}, hints: {}, notes: { _: '' }, pocket: [],
  seenIntro: false, seenTour: false, settings: { haptics: true, fontSize: 16 },
});

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && s.v === 1 && s.seed) { const f = fresh(); return { ...f, ...s, settings: { ...f.settings, ...s.settings }, notes: { ...f.notes, ...s.notes } }; }
  } catch { /* corrupt or blocked: start fresh */ }
  return fresh();
}
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* private mode or quota */ } };

export const get = () => (state ||= load());
export function update(fn) { fn(get()); persist(); setHaptics(state.settings.haptics); document.documentElement.style.setProperty('--fs', state.settings.fontSize + 'px'); subs.forEach((f) => f(state)); }
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
export const isSolved = (id) => !!get().solved[id];

export function markSolved(id, extra = {}) {
  update((s) => { if (!s.solved[id]) s.solved[id] = { at: Date.now(), hints: s.hints[id] || 0, ...extra }; });
}
export function pocketAdd(text) {
  const t = String(text).trim(); if (!t) return;
  update((s) => { s.pocket = [t, ...s.pocket.filter((x) => x !== t)].slice(0, 24); });
}
export const exportSave = () => btoa(unescape(encodeURIComponent(JSON.stringify(get()))));
export function importSave(text) {
  const s = JSON.parse(decodeURIComponent(escape(atob(text.trim()))));
  if (!s || s.v !== 1 || !s.seed || typeof s.solved !== 'object') throw new Error('Not a Hadopsalm backup');
  state = { ...fresh(), ...s }; persist(); subs.forEach((f) => f(state));
}
export function reset() { state = fresh(); persist(); subs.forEach((f) => f(state)); }
