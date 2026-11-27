import { h, copy } from '../core/h.js';
import { icon } from '../core/icons.js';
import { runAll, caesarSweep, LIKELY } from '../core/ciphers.js';
import { get as save } from '../core/store.js';
import { toast } from './sheet.js';
import { tap } from '../core/haptics.js';

/** The Bench: paste anything, see every plausible transform at once. Tap Use to chain results. */
export function createBench({ initial = '' } = {}) {
  let mode = 'decode', timer = 0, sweepOpen = false;
  const input = h('textarea.bench-in', { rows: '3', placeholder: 'Paste or type here…', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Bench input', value: initial });
  const results = h('div.bench-out');
  const pocket = h('div.chips-row');
  const seg = h('div.seg', { role: 'group', 'aria-label': 'Mode' });
  const setMode = (m) => { mode = m; draw(); };
  const segBtn = (m, label) => h('button', { 'aria-pressed': String(mode === m), onClick: () => setMode(m) }, label);

  function result(r) {
    const likely = r.score >= LIKELY;
    return h('div.res' + (likely ? '.likely' : ''),
      h('div.res-top', h('span.eyebrow', r.label), likely && h('span.badge', 'likely')),
      h('pre.res-text', r.text),
      h('div.row', h('button.btn.small.ghost', { onClick: async () => { tap(); toast((await copy(r.text)) ? 'Copied' : 'Copy failed'); } }, icon('copy', 14), 'Copy'),
        h('button.btn.small.ghost', { onClick: () => { tap(); input.value = r.text; draw(); input.scrollIntoView({ block: 'nearest' }); } }, icon('swap', 14), 'Use as input')));
  }
  function draw() {
    seg.replaceChildren(segBtn('decode', 'Decode'), segBtn('encode', 'Encode'));
    pocket.replaceChildren(...save().pocket.slice(0, 8).map((p) => h('button.chip-btn', { title: p, onClick: () => { input.value = p; draw(); } }, p.length > 26 ? p.slice(0, 25) + '…' : p)));
    const t = input.value; results.replaceChildren();
    if (!t.trim()) { results.append(h('p.muted.small', 'Results appear here. Try pasting a line from the Source tool.')); return; }
    const list = runAll(t, mode);
    if (mode === 'decode') {
      const sweep = caesarSweep(t), best = [...sweep].sort((a, b) => b.score - a.score)[0];
      results.append(...list.map(result));
      results.append(h('div.res', h('button.sweep-head', { 'aria-expanded': String(sweepOpen), onClick: () => { sweepOpen = !sweepOpen; draw(); } },
        h('span.eyebrow', 'Caesar sweep · 25 shifts'), best.score >= LIKELY && h('span.badge', `likely +${best.n}`), icon(sweepOpen ? 'up' : 'down', 16)),
        sweepOpen && h('div.sweep', sweep.map((s) => h('button.sweep-row' + (s.score >= LIKELY ? '.likely' : ''), { onClick: () => { tap(); input.value = s.text; draw(); } }, h('b', `+${s.n}`), h('span', s.text))))));
    } else results.append(...list.map(result));
    if (mode === 'decode' && !list.length) results.prepend(h('p.muted.small', 'Nothing decodes cleanly. Try the Caesar sweep, or Encode.'));
  }
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(draw, 120); });
  const el = h('div.bench', h('div.row.between', seg, h('button.icon-btn', { 'aria-label': 'Clear', onClick: () => { input.value = ''; draw(); input.focus(); } }, icon('trash', 18))), input, pocket, results);
  draw();
  return { el, set(v) { input.value = v; draw(); }, refresh: draw };
}
