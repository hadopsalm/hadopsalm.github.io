import { h } from '../core/h.js';
import { icon } from '../core/icons.js';
import { parseTarget, formatTarget, renderDoc } from '../net/vnet.js';
import { inject } from '../net/runtime.js';
import { tap } from '../core/haptics.js';
import { toast } from './sheet.js';

const statusClass = (s) => (s >= 500 || s >= 400 ? 'bad' : s >= 300 ? 'warn' : 'ok');

/** The in-app browser: address bar, title tab line, sandboxed iframe, Lens (zoom, filters, lantern), Hold. */
export function createBrowser({ level, net, onAlert, onLoad, onHold }) {
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const S = { hist: [], idx: -1, lens: { invert: false, b: 1, c: 1, zoom: 1, lantern: false }, hold: false, last: null, title: '', url: null, loading: false };

  const addr = h('input.addr', { type: 'text', inputmode: 'url', autocapitalize: 'off', autocorrect: 'off', autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'go', 'aria-label': 'Address' });
  const status = h('span.status-pill');
  const tabline = h('div.tabline');
  const iframe = h('iframe.vframe', { sandbox: 'allow-scripts allow-forms', title: 'Page', referrerpolicy: 'no-referrer' });
  const lensPanel = h('div.lens', { hidden: true });
  const backBtn = h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back() }, icon('back', 20));
  const reloadBtn = h('button.icon-btn', { 'aria-label': 'Reload', onClick: () => reload() }, icon('reload', 20));
  const lensBtn = h('button.icon-btn', { 'aria-label': 'Lens', 'aria-expanded': 'false', onClick: () => toggleLens() }, icon('lens', 20));
  const holdBadge = h('span.hold-badge', { hidden: true }, icon('pause', 12), 'HOLD');
  const view = h('div.vview', iframe, lensPanel);
  const el = h('div.vbrowser',
    h('div.vbar', backBtn, h('form.addr-wrap', { onSubmit: (e) => { e.preventDefault(); go(addr.value); addr.blur(); } }, icon('lock', 13), addr, status), holdBadge, reloadBtn, lensBtn),
    tabline, view);

  const spec = () => S.hist[S.idx];
  const full = (t) => `https://${net.host}${formatTarget(t)}`;
  function paintBar() {
    const u = S.url; if (!u) return;
    addr.value = formatTarget(u);
    status.textContent = S.last ? String(S.last.res.status) : ''; status.className = 'status-pill ' + (S.last ? statusClass(S.last.res.status) : '');
    backBtn.disabled = S.idx <= 0;
    tabline.replaceChildren(h('i'), h('span.eyebrow', 'TAB'), h('span.tab-title', S.title || '…'), h('span.tab-host', net.host));
  }
  function paintHold() { holdBadge.hidden = !S.hold; }

  async function exec(sp, { push = true } = {}) {
    S.loading = true; el.classList.add('loading');
    const r = await net.fetch(sp);
    S.last = r.final; S.url = r.url;
    if (push) { S.hist = S.hist.slice(0, S.idx + 1); S.hist.push({ ...sp, shown: r.url }); S.idx = S.hist.length - 1; }
    S.title = ''; paintBar();
    iframe.srcdoc = inject(renderDoc(r.final.res), { nonce, vloc: { path: r.url.path, query: r.url.query, hash: r.url.hash || '', host: net.host, href: full(r.url) } });
    onLoad?.(r);
    return r;
  }
  /** Navigate by a user action. Held requests are handed to the Request sheet first. */
  async function nav(sp, opts = {}) {
    if (S.hold && opts.hold !== false) { onHold?.(sp, (edited) => exec(edited)); return; }
    return exec(sp, opts);
  }
  function go(text, extra = {}) {
    const t = parseTarget(text.trim() || '/');
    const cur = S.url;
    if (cur && t.path === cur.path && formatTarget({ ...t, hash: '' }) === formatTarget({ ...cur, hash: '' }) && t.hash !== (cur.hash || '') && !extra.method) { return hashOnly(t.hash); }
    return nav({ method: 'GET', target: text.trim() || '/', ...extra });
  }
  function hashOnly(hash) {
    S.url = { ...S.url, hash }; const sp = spec(); if (sp) sp.shown = S.url; paintBar();
    iframe.contentWindow?.postMessage({ n: nonce, t: 'hash', v: hash }, '*');
  }
  const back = () => { if (S.idx > 0) { S.idx--; const sp = S.hist[S.idx]; exec({ ...sp }, { push: false }); } };
  const reload = () => { const sp = spec(); if (sp) exec({ ...sp }, { push: false }); };

  function onMessage(e) {
    if (e.source !== iframe.contentWindow) return;
    const m = e.data; if (!m || m.n !== nonce) return;
    if (m.t === 'ready') { S.title = m.d.title || ''; paintBar(); el.classList.remove('loading'); applyLantern(); applyLens(); }
    else if (m.t === 'alert') onAlert?.(m.d);
    else if (m.t === 'nav') {
      const d = m.d; let u;
      try { u = new URL(d.href || '', full(S.url || { path: '/', query: {} })); } catch { return; }
      if (u.host !== net.host) { toast('External links are disabled in the sandbox'); return; }
      const t = parseTarget(u.pathname + u.search + u.hash); const referer = full(S.url || { path: '/', query: {} });
      tap();
      if (!d.method || d.method === 'GET') {
        if (!d.form || !Object.keys(d.form).length) {
          if (u.pathname === S.url.path && u.search === (formatTarget({ ...S.url, hash: '' }).slice(S.url.path.length)) && u.hash) return hashOnly(u.hash);
          return nav({ method: 'GET', target: u.pathname + u.search + u.hash, headers: { referer } });
        }
        const q = new URLSearchParams(d.form).toString(); return nav({ method: 'GET', target: u.pathname + '?' + q, headers: { referer } });
      }
      nav({ method: d.method, target: u.pathname + u.search, form: d.form || {}, headers: { referer } });
    }
  }
  window.addEventListener('message', onMessage);

  // lens
  function applyLens() {
    const L = S.lens, z = L.zoom;
    iframe.contentWindow?.postMessage({ n: nonce, t: 'zoom', v: z }, '*');
    iframe.style.filter = (L.invert || L.b !== 1 || L.c !== 1) ? `${L.invert ? 'invert(1) ' : ''}brightness(${L.b}) contrast(${L.c})` : '';
    lensBtn.classList.toggle('on', L.invert || L.b !== 1 || L.c !== 1 || z !== 1 || L.lantern);
  }
  function applyLantern() { iframe.contentWindow?.postMessage({ n: nonce, t: 'lantern', v: S.lens.lantern }, '*'); }
  function setLens(p) { Object.assign(S.lens, p); applyLens(); if ('lantern' in p) applyLantern(); paintLens(); }
  function paintLens() {
    const L = S.lens;
    const slider = (label, key, min, max, step, fmt) => h('label.lens-row', h('span', label), h('input', { type: 'range', min, max, step, value: L[key], 'aria-label': label, onInput: (e) => setLensQuiet({ [key]: +e.target.value }, e.target.nextSibling) }), h('output', fmt(L[key])));
    const sw = (label, key) => h('button.lens-tog', { 'aria-pressed': String(L[key]), onClick: () => { tap(); setLens({ [key]: !L[key] }); } }, label);
    lensPanel.replaceChildren(
      h('div.lens-top', sw('Lantern', 'lantern'), sw('Invert', 'invert'),
        h('div.zoom', h('button.icon-btn', { 'aria-label': 'Zoom out', onClick: () => setLens({ zoom: Math.max(0.5, +(L.zoom - 0.25).toFixed(2)) }) }, icon('minus', 16)), h('output', `${Math.round(L.zoom * 100)}%`), h('button.icon-btn', { 'aria-label': 'Zoom in', onClick: () => setLens({ zoom: Math.min(4, +(L.zoom + 0.25).toFixed(2)) }) }, icon('plus', 16)))),
      slider('Brightness', 'b', 0.2, 8, 0.1, (v) => v.toFixed(1)), slider('Contrast', 'c', 0.2, 30, 0.5, (v) => v.toFixed(1)),
      h('button.btn.small.ghost', { onClick: () => setLens({ invert: false, b: 1, c: 1, zoom: 1, lantern: false }) }, 'Reset lens'));
  }
  function setLensQuiet(p, out) { Object.assign(S.lens, p); applyLens(); if (out) out.textContent = (+Object.values(p)[0]).toFixed(1); }
  function toggleLens(force) {
    const open = force ?? lensPanel.hidden; lensPanel.hidden = !open; lensBtn.setAttribute('aria-expanded', String(open)); if (open) paintLens();
  }
  applyLens();

  return {
    el, go, nav, reload, back, hashOnly,
    navigate: (sp, o) => nav(sp, o), exec,
    setHold(v) { S.hold = !!v; paintHold(); }, get hold() { return S.hold; },
    get last() { return S.last; }, get url() { return S.url; }, get title() { return S.title; },
    toggleLens, focusAddr: () => addr.focus(),
    destroy() { window.removeEventListener('message', onMessage); iframe.srcdoc = ''; },
  };
}
