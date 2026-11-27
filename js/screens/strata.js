import { h } from '../core/h.js';
import { icon } from '../core/icons.js';
import { get as save } from '../core/store.js';
import { CHAPTERS, isUnlocked } from '../levels/index.js';

export function mountStrata(root, open) {
  const s = save();
  root.replaceChildren(h('div.strata',
    h('div.page-title', h('div.eyebrow', 'Strata'), h('h1', 'Four descents.'), h('p', 'Open any chapter. Within a chapter, each level unlocks the next.')),
    CHAPTERS.map((c) => {
      const done = c.levels.filter((l) => s.solved[l.id]).length, isOpen = open === c.id || (!open && done < c.levels.length && c === CHAPTERS.find((x) => x.levels.some((l) => !s.solved[l.id])));
      return h('section.chapter', { 'aria-label': c.name },
        h('a.chapter-head', { href: isOpen ? '#/strata' : `#/strata/${c.id}`, 'aria-expanded': String(isOpen) },
          h('span.rec-kind', c.n), h('span.rec-body', h('b.serif', c.name), h('span', c.zone + ' · ' + c.range)), h('span.muted.mono', `${done}/${c.levels.length}`), icon(isOpen ? 'up' : 'down', 18)),
        isOpen && h('div.chapter-body',
          h('p.muted', c.blurb), h('p.eyebrow.sp', 'Tools · ' + c.tools),
          h('div.card', c.levels.map((l) => {
            const ok = !!s.solved[l.id], un = isUnlocked(l.id, s.solved);
            return h(un ? 'a.concept' : 'div.concept.locked', { href: un ? `#/play/${l.id}` : null, 'aria-disabled': un ? null : 'true' },
              h('span.lvl-n', String(l.n).padStart(2, '0')), h('span.c-main', h('b', un || ok ? l.title : 'Sealed'), h('small', `${l.depth} m`)),
              h('span.c-tag' + (ok ? '.ok' : ''), ok ? icon('check', 16, 2.2) : un ? 'open' : icon('lock', 15)));
          }))));
    })));
  return () => {};
}
