import { h } from '../core/h.js';
import { icon, logo } from '../core/icons.js';
import { get as save } from '../core/store.js';
import { CHAPTERS, LEVELS, RANKS, firstOpen, rankOf } from '../levels/index.js';

const meter = (f) => h('div.meter', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(f * 100)) }, h('i', { style: { width: `${Math.max(0, Math.min(1, f)) * 100}%` } }));

export function mountHome(root) {
  const s = save(), r = rankOf(s.solved), next = firstOpen(s.solved);
  const hints = Object.values(s.solved).reduce((a, x) => a + (x.hints || 0), 0);
  root.replaceChildren(h('div.home',
    h('section.rank', { 'aria-label': 'Your depth' },
      h('div.eyebrow', 'Depth'), h('h1.rank-name', r.name),
      h('div.rank-sub', 'DEEPEST ', h('b', `${r.deepest} m`), ` · ${r.solved} of ${r.total} descents`),
      h('div.sp14', meter(r.frac)),
      h('div.rank-foot', h('span', RANKS[r.index].name), h('span', r.next ? `next: ${r.next}` : 'Deepest rank'))),
    next ? h('a.descent', { href: `#/play/${next.id}` },
      h('div.eyebrow', r.solved ? 'Continue' : 'Begin'), h('h2', r.solved ? 'Keep descending' : 'Light the lantern'),
      h('p', `${next.chapterName} · ${String(next.n).padStart(2, '0')} · ${next.title}`),
      h('div.descent-row', h('span.descent-meta', h('span', `${next.depth} m`), h('span', next.goal.replace(/\.$/, ''))), h('span.descent-go', icon('arrow', 20))))
      : h('div.descent', h('div.eyebrow', 'Complete'), h('h2', 'You reached the trench.'), h('p', 'Every descent is solved. Replay any level from Strata.')),
    h('section.section', h('div.eyebrow', h('span', 'Four descents')),
      h('div.card', CHAPTERS.map((c) => { const done = c.levels.filter((l) => s.solved[l.id]).length; return h('a.rec', { href: `#/strata/${c.id}` }, h('span.rec-kind', c.n), h('span.rec-body', h('b', c.name), h('span', c.zone + ' · ' + c.range)), h('span.muted.mono', `${done}/${c.levels.length}`), icon('chevron', 18)); }))),
    h('section.section', h('div.eyebrow', h('span', 'Built for the thumb')),
      h('div.card.pad.feat', [['lens', 'Lens', 'Zoom, brighten and light hidden ink.'], ['wire', 'Hold and edit', 'Pause any request and rewrite it by touch.'], ['bench', 'Bench', 'Every common decoding at once, chainable.'], ['pin', 'Pocket', 'Tap a line in Source to keep it.']].map(([i, t, d]) => h('div.tour-row', icon(i, 22), h('div', h('b', t), h('span', d)))))),
    h('p.muted.small.foot', `Offline once loaded. Progress stays on this device.${hints ? ` ${hints} hints used so far.` : ''}`)));
  return () => {};
}

export function mountIntro(root, done) {
  root.replaceChildren(h('div.start-card',
    logo(46), h('div.eyebrow.sp22', 'Hadopsalm'), h('h1', 'Hymns from the hadal dark.'),
    h('p', 'Web riddles and wargames, rebuilt for your thumb. Four descents, thirty levels, a pocket full of real tools. Everything runs in a sandbox on your phone.'),
    h('div.eyebrow.sp28', 'How it works'),
    h('div.card.pad', [['strata', 'Descend', 'Each level is a tiny website. Find the key hidden in it.'], ['wire', 'Use the real tools', 'Source, requests, cookies and ciphers, designed for touch.'], ['shield', 'Safe by design', 'No network, no accounts. Keys differ on every install, so there are no spoilers to look up.']].map(([i, t, d]) => h('div.tour-row', icon(i, 22), h('div', h('b', t), h('span', d))))),
    h('button.btn.primary.wide', { onClick: done }, 'Begin the descent', icon('arrow', 16))));
  return () => {};
}
