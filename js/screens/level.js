import { h } from '../core/h.js';
import { icon } from '../core/icons.js';
import { get as save, update, markSolved } from '../core/store.js';
import { BY_ID, chapterOf, ctxFor, checkKey, isUnlocked, nextOf, rankOf } from '../levels/index.js';
import { createNet } from '../net/vnet.js';
import { createBrowser } from '../ui/browser.js';
import { openSheet, toast, closeSheet } from '../ui/sheet.js';
import { openSource, openWire, openJar, openBench, openNotes, openHints, openRequest } from '../ui/tools.js';
import { tap, buzz } from '../core/haptics.js';

const TOOLS = [['source', 'Source', openSource], ['wire', 'Wire', openWire], ['jar', 'Jar', openJar], ['bench', 'Bench', openBench], ['notes', 'Notes', openNotes], ['hint', 'Hints', openHints]];

export function mountLevel(root, id, nav) {
  const level = BY_ID[id], s0 = save();
  if (!level || !isUnlocked(id, s0.solved)) { nav('#/strata'); return () => {}; }
  const ctx = ctxFor(s0.seed, id), net = createNet(level, ctx), ch = chapterOf(id);
  const isAlert = level.chapter === 'brine';
  let done = false;

  const browser = createBrowser({
    level, net,
    onAlert: (msg) => { if (isAlert && !done) { done = true; complete(`alert(${JSON.stringify(msg).slice(0, 40)})`); } },
    onHold: (sp, send) => openRequest(browser, net, sp, send, { held: true }),
  });

  const offer = h('input#offer', { type: 'text', placeholder: isAlert ? (level.inject?.label || 'Payload') : 'Offer the key', autocapitalize: 'off', autocorrect: 'off', autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'send', 'aria-label': isAlert ? 'Payload' : 'Key' });
  const form = h('form.offer', { onSubmit: (e) => { e.preventDefault(); isAlert ? inject() : submit(); } }, offer, h('button.send', { type: 'submit', 'aria-label': isAlert ? 'Run payload' : 'Offer key' }, icon(isAlert ? 'arrow' : 'send', 20)));

  function submit() {
    const v = offer.value.trim(); if (!v) return;
    if (checkKey(level, ctx, v)) { if (!done) { done = true; complete('key'); } else resultSheet(); }
    else { buzz([30, 40, 30]); form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); toast('The dark does not answer.'); }
  }
  function inject() {
    const v = offer.value, spec = level.inject; if (!spec) return;
    tap(8);
    if (spec.kind === 'query') browser.nav({ method: 'GET', target: spec.path + '?' + new URLSearchParams({ [spec.name]: v }).toString() });
    else if (spec.kind === 'hash') browser.go('/#' + v);
    else if (spec.kind === 'form') browser.nav({ method: 'POST', target: spec.path, form: { [spec.name]: v } });
    offer.blur();
    toast(level.id === 'brine-4' ? 'Loaded. Now tap Continue in the page.' : 'Loaded');
  }

  function complete() {
    const rankBefore = rankOf(save().solved).index;
    const first = !save().solved[id];
    markSolved(id);
    buzz([14, 50, 14, 50, 24]);
    resultSheet({ first, rankUp: first && rankOf(save().solved).index > rankBefore });
  }
  function resultSheet({ first = false, rankUp = false } = {}) {
    const nxt = nextOf(id), s = save(), r = rankOf(s.solved), hints = s.hints[id] || 0;
    const d = level.debrief;
    openSheet({
      eyebrow: `${ch.name} · ${level.depth} m`, title: isAlert ? 'The brine burns.' : 'Key accepted.', size: 'full',
      body: h('div.result',
        first && h('p.lead.ok', hints ? `Descended with ${hints} hint${hints > 1 ? 's' : ''}.` : 'A clean descent. No hints.'),
        rankUp && h('p.rankup', icon('sparkle', 14), `New rank: ${r.name}`),
        h('div.card.pad', h('div.eyebrow', 'What this taught'), h('h3.serif.sm', d.title), h('p.lead', d.text), d.fix && h('div.fix', h('b', 'The fix. '), d.fix)),
        h('p.muted.small', 'Everything here ran in a sandbox on your device. Practise only on systems you own or are explicitly allowed to test.'),
        h('div.sticky-actions', nxt ? h('button.btn.primary', { onClick: () => { closeSheet(); nav(`#/play/${nxt.id}`); } }, 'Next descent', icon('arrow', 16)) : h('button.btn.primary', { onClick: () => { closeSheet(); nav('#/strata'); } }, `${ch.name} complete`, icon('check', 16)),
          h('button.btn.ghost', { onClick: () => closeSheet() }, 'Stay here'))),
    });
  }

  const lvlBar = h('header.lvl-bar',
    h('a.icon-btn.back', { href: '#/strata', 'aria-label': 'Back to strata' }, icon('back', 22)),
    h('div.lvl-title', h('div.eyebrow', `${ch.name} · ${String(level.n).padStart(2, '0')} · ${level.depth} m`), h('h1', level.title)),
    h('button.icon-btn', { 'aria-label': 'Hints', onClick: () => openHints(level) }, icon('hint', 22)));
  const goal = h('div.goal-strip', h('span.eyebrow', 'Goal'), h('span', level.goal));
  const tools = h('div.tools', TOOLS.map(([ic, label, fn]) => h('button.tool', { 'aria-label': label, onClick: () => { tap(6); fn === openSource ? openSource(browser) : fn === openWire ? openWire(browser, net, level) : fn === openJar ? openJar(browser, net) : fn === openNotes ? openNotes(id) : fn === openHints ? openHints(level) : openBench(); } }, icon(ic, 22), h('span', label))));
  const dock = h('div.dock', tools, form);
  const el = h('div.lvl', lvlBar, goal, browser.el, dock);
  root.replaceChildren(el);
  document.title = `${level.title} · Hadopsalm`;
  browser.go(level.start || '/');

  if (!s0.seenTour) {
    update((s) => { s.seenTour = true; });
    openSheet({
      eyebrow: 'Your lantern kit', title: 'Six tools, one thumb', size: 'full',
      body: h('div.tour',
        [['lens', 'Lens', 'Top right of the browser. Zoom, brighten, invert, and light hidden ink.'], ['source', 'Source', 'Read what the page really said. Tap any line to keep it.'], ['wire', 'Wire', 'See every request. Hold and edit them before they leave.'], ['jar', 'Jar', 'Cookies the server gave you. Edit, then reload.'], ['bench', 'Bench', 'Paste anything. Every common decoding at once.'], ['notes', 'Notes', 'Your thinking, saved on this device.']]
          .map(([i, t, d]) => h('div.tour-row', icon(i, 22), h('div', h('b', t), h('span', d)))),
        h('div.sticky-actions', h('button.btn.primary', { onClick: () => closeSheet() }, 'Descend'))),
    });
  }
  return () => { browser.destroy(); closeSheet(); };
}
