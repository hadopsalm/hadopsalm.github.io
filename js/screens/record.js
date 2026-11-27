import { h, copy } from '../core/h.js';
import { icon } from '../core/icons.js';
import { get as save, update, exportSave, importSave, reset } from '../core/store.js';
import { rankOf, LEVELS } from '../levels/index.js';
import { toast } from '../ui/sheet.js';

export function mountRecord(root, nav) {
  const draw = () => {
    const s = save(), r = rankOf(s.solved), hints = Object.values(s.solved).reduce((a, x) => a + (x.hints || 0), 0), clean = Object.values(s.solved).filter((x) => !x.hints).length;
    const area = h('textarea.fld', { rows: '3', placeholder: 'Paste a backup here to restore', 'aria-label': 'Backup', autocapitalize: 'off', spellcheck: 'false' });
    const setting = (label, sub, control) => h('div.setting', h('div', h('b', label), sub && h('small', sub)), control);
    root.replaceChildren(h('div.record',
      h('div.page-title', h('div.eyebrow', 'Record'), h('h1', r.name), h('p', `Deepest ${r.deepest} m`)),
      h('div.stats',
        [['Descents', `${r.solved}/${r.total}`], ['Clean', clean], ['Hints used', hints], ['Deepest', `${r.deepest} m`]].map(([a, b]) => h('div.stat', h('small', a), h('b', String(b))))),
      h('section.section', h('div.eyebrow', 'Settings'), h('div.card',
        setting('Haptics', 'A short tick on taps and results', h('button.switch', { role: 'switch', 'aria-label': 'Haptics', 'aria-checked': String(s.settings.haptics), onClick: () => { update((x) => { x.settings.haptics = !x.settings.haptics; }); draw(); } })),
        setting('Text size', 'For code and pages', h('div.seg', [15, 16, 18].map((n, i) => h('button', { 'aria-pressed': String(s.settings.fontSize === n), onClick: () => { update((x) => { x.settings.fontSize = n; }); draw(); } }, ['S', 'M', 'L'][i])))))),
      h('section.section', h('div.eyebrow', 'Backup'), h('div.card.backup',
        h('p.muted.small', 'Progress lives only in this browser. Copy a backup before clearing site data or changing phones. A restore keeps your install’s keys.'),
        h('div.row', h('button.btn.small', { onClick: async () => toast((await copy(exportSave())) ? 'Backup copied' : 'Copy failed') }, icon('copy', 14), 'Copy backup'),
          h('button.btn.small.ghost', { onClick: () => { try { importSave(area.value); toast('Restored'); draw(); } catch (e) { toast(e.message || 'Could not restore'); } } }, 'Restore')), area)),
      h('section.section', h('div.eyebrow', 'Ethics'), h('div.card.pad', h('p.muted.small', 'Hadopsalm teaches how web systems fail so you can defend them. Every site here is simulated and runs on your device; nothing touches the internet. Practise only on systems you own or have written permission to test.'))),
      h('section.section', h('button.btn.danger.wide', { onClick: () => { if (confirm('Erase all progress, notes and keys on this device?')) { reset(); nav('#/'); location.reload(); } } }, icon('trash', 16), 'Erase everything')),
      h('p.muted.small.foot', `Hadopsalm · ${LEVELS.length} levels · seed ${s.seed.slice(0, 4)}…`)));
  };
  draw();
  return () => {};
}
