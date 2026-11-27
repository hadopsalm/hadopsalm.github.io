import { h } from './core/h.js';
import { icon, logo } from './core/icons.js';
import { get as save, update, subscribe } from './core/store.js';
import { setHaptics } from './core/haptics.js';
import { trackViewport } from './core/viewport.js';
import { mountRail } from './ui/rail.js';
import { mountHome, mountIntro } from './screens/home.js';
import { mountStrata } from './screens/strata.js';
import { mountBench } from './screens/benchscreen.js';
import { mountRecord } from './screens/record.js';
import { mountLevel } from './screens/level.js';
import { rankOf } from './levels/index.js';
import { closeSheet } from './ui/sheet.js';

const TABS = [['home', 'Descent', 'home', '#/'], ['strata', 'Strata', 'strata', '#/strata'], ['bench', 'Bench', 'bench', '#/bench'], ['record', 'Record', 'record', '#/record']];
const TITLE = { home: 'Hadopsalm · Hymns from the hadal dark', strata: 'Strata · Hadopsalm', bench: 'Bench · Hadopsalm', record: 'Record · Hadopsalm' };
const nav = (hash) => { location.hash = hash; };

const app = document.getElementById('app');
let cleanup = () => {};

function route() {
  cleanup(); closeSheet(); cleanup = () => {};
  const [, a, b] = (location.hash || '#/').split('/'), s = save();
  const shell = h('main.shell');
  const view = h('div.view');
  if (!s.seenIntro) {
    shell.dataset.view = 'start'; shell.append(view); app.replaceChildren(shell);
    cleanup = mountIntro(view, () => { update((x) => { x.seenIntro = true; }); nav('#/'); route(); });
    return;
  }
  if (a === 'play' && b) { app.replaceChildren(h('div.play-root', view)); view.className = 'view-play'; cleanup = mountLevel(view, b, nav); return; }
  const tab = ['strata', 'bench', 'record'].includes(a) ? a : 'home';
  shell.dataset.view = tab;
  const r = rankOf(s.solved);
  shell.append(
    h('header.topbar', h('a.brand', { href: '#/' }, logo(28), h('span', 'HADOPSALM')), h('div.chips', h('span.chip', { 'aria-label': `Rank ${r.name}` }, icon('flame', 14), r.name), h('span.chip', { 'aria-label': `${r.deepest} metres` }, icon('strata', 14), `${r.deepest} m`))),
    view,
    h('nav.tabbar', { 'aria-label': 'Main' }, TABS.map(([id, label, ic, href]) => h('a.tab', { href, 'aria-current': id === tab ? 'page' : null }, icon(ic, 22), h('span', label)))));
  app.replaceChildren(shell);
  document.title = TITLE[tab];
  window.scrollTo(0, 0);
  cleanup = tab === 'strata' ? mountStrata(view, b) : tab === 'bench' ? mountBench(view) : tab === 'record' ? mountRecord(view, nav) : mountHome(view);
}

setHaptics(save().settings.haptics);
document.documentElement.style.setProperty('--fs', save().settings.fontSize + 'px');
trackViewport();
mountRail();
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && document.querySelector('meta[name=build]')?.content === 'prod') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => { /* non-fatal */ }));
}
