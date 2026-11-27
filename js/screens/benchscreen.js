import { h } from '../core/h.js';
import { createBench } from '../ui/bench.js';
import { get as save, update } from '../core/store.js';

export function mountBench(root) {
  const b = createBench();
  const notes = h('textarea.notes', { rows: '5', placeholder: 'Scratchpad. Saved on this device.', 'aria-label': 'Scratchpad', value: save().notes._ || '' });
  notes.addEventListener('input', () => update((s) => { s.notes._ = notes.value; }));
  root.replaceChildren(h('div.benchpage',
    h('div.page-title', h('div.eyebrow', 'Bench'), h('h1', 'Decode anything.'), h('p', 'Every common encoding at once. Tap Use as input to chain steps, like undoing base64 then reverse then hex.')),
    b.el, h('section.section', h('div.eyebrow', 'Scratchpad'), notes)));
  return () => {};
}
