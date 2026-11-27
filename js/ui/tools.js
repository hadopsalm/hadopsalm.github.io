// Tool sheets for a level: Source, Wire (+ request builder), Jar, Bench, Notes, Hints.
import { h, copy } from '../core/h.js';
import { icon } from '../core/icons.js';
import { openSheet, toast } from './sheet.js';
import { createBench } from './bench.js';
import { get as save, update, pocketAdd } from '../core/store.js';
import { parseTarget, formatTarget } from '../net/vnet.js';
import { tap } from '../core/haptics.js';

const statusCls = (s) => (s >= 400 ? 'bad' : s >= 300 ? 'warn' : 'ok');

export function openSource(browser) {
  const r = browser.last; if (!r) return toast('Nothing loaded yet');
  const raw = r.res.body, lines = raw.split('\n');
  const q = h('input.search', { type: 'search', placeholder: 'Search the source…', 'aria-label': 'Search source', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false' });
  const count = h('span.muted.small');
  const list = h('div.src');
  let wrap = true, showHead = false;
  const head = h('div.src-head', h('span', { class: 'status-pill ' + statusCls(r.res.status) }, `${r.req.method} ${r.res.status}`), h('span.muted.small', `${r.req.url}`), h('button.chip-btn', { onClick: () => { showHead = !showHead; draw(); } }, 'headers'));
  function draw() {
    const term = q.value.trim().toLowerCase();
    const rows = [];
    if (showHead) for (const [k, v] of Object.entries(r.res.headers)) rows.push(h('div.line.hdr', { onClick: () => pick(`${k}: ${v}`) }, h('i', '‹'), h('code', `${k}: ${v}`)));
    lines.forEach((ln, i) => {
      if (term && !ln.toLowerCase().includes(term)) return;
      let content = ln || ' ';
      const node = h('code'); if (term && ln) { const lo = ln.toLowerCase(); let p = 0, k; while ((k = lo.indexOf(term, p)) >= 0) { node.append(ln.slice(p, k), h('mark', ln.slice(k, k + term.length))); p = k + term.length; } node.append(ln.slice(p)); } else node.textContent = content;
      rows.push(h('div.line', { onClick: () => pick(ln) }, h('i', String(i + 1)), node));
    });
    list.classList.toggle('nowrap', !wrap);
    list.replaceChildren(...(rows.length ? rows : [h('p.muted.small', 'No matches.')]));
    count.textContent = term ? `${rows.length} match${rows.length === 1 ? '' : 'es'}` : `${lines.length} lines`;
  }
  async function pick(text) { if (!text.trim()) return; tap(); pocketAdd(text.trim()); toast((await copy(text.trim())) ? 'Copied and kept in your Pocket' : 'Kept in your Pocket'); }
  q.addEventListener('input', draw);
  const body = h('div', head, h('div.row.between', q, h('button.icon-btn', { 'aria-label': 'Toggle wrap', onClick: () => { wrap = !wrap; draw(); } }, 'Wrap')), count, h('p.hint-line.muted.small', 'Tap any line to copy it and keep it in your Pocket.'), list);
  draw();
  return openSheet({ eyebrow: 'Source', title: 'What the page really said', body, size: 'full' });
}

/** Request builder: used for Craft request, and to edit a held request before it is sent. */
export function openRequest(browser, net, sp, send, { held = false } = {}) {
  const u = browser.url;
  const base = sp || { method: 'GET', target: u ? formatTarget({ ...u, hash: '' }) : '/', headers: {}, form: {} };
  let method = (base.method || 'GET').toUpperCase();
  const t = base.target != null ? base.target : formatTarget({ path: base.path, query: base.query });
  const target = h('input.fld', { value: t, autocapitalize: 'off', autocorrect: 'off', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Path and query' });
  const hdrs = [], form = [];
  const hdrBox = h('div.kv-list'), formBox = h('div.kv-list');
  const row = (arr, box, k = '', v = '', fixedKey = false) => {
    const kk = h('input.fld.k', { value: k, placeholder: 'name', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false', readonly: fixedKey || null, 'aria-label': 'name' });
    const vv = h('input.fld.v', { value: v, placeholder: 'value', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'value' });
    const r = h('div.kv', kk, vv, h('button.icon-btn', { 'aria-label': 'Remove', onClick: () => { arr.splice(arr.indexOf(o), 1); r.remove(); } }, icon('x', 16)));
    const o = { kk, vv }; arr.push(o); box.append(r); return o;
  };
  for (const [k, v] of Object.entries(base.headers || {})) row(hdrs, hdrBox, k, v);
  for (const [k, v] of Object.entries(base.form || {})) row(form, formBox, k, v);
  const presets = h('div.chips-row', ['User-Agent', 'Referer', 'X-Forwarded-For'].map((n) => h('button.chip-btn', { onClick: () => { const ex = hdrs.find((x) => x.kk.value.toLowerCase() === n.toLowerCase()); if (ex) ex.vv.focus(); else row(hdrs, hdrBox, n, '').vv.focus(); } }, '+ ' + n)));
  const seg = h('div.seg'), formWrap = h('div');
  const paint = () => {
    seg.replaceChildren(...['GET', 'POST'].map((m) => h('button', { 'aria-pressed': String(method === m), onClick: () => { method = m; paint(); } }, m)));
    formWrap.replaceChildren(h('div.eyebrow.sp', method === 'POST' ? 'Form body' : 'Form body (POST only)'), formBox, h('button.btn.small.ghost', { onClick: () => row(form, formBox, '', '').kk.focus() }, icon('plus', 14), 'Add field'));
    formWrap.style.opacity = method === 'POST' ? 1 : 0.45;
  };
  paint();
  const collect = () => ({
    method, target: target.value.trim() || '/', headers: Object.fromEntries(hdrs.filter((x) => x.kk.value.trim()).map((x) => [x.kk.value.trim(), x.vv.value])),
    form: method === 'POST' ? Object.fromEntries(form.filter((x) => x.kk.value.trim()).map((x) => [x.kk.value.trim(), x.vv.value])) : {},
  });
  const sheet = openSheet({
    eyebrow: held ? 'Held request' : 'Craft request', title: held ? 'Edit, then send' : 'Send your own',
    body: h('div.req', h('div.row.between', seg), h('div.eyebrow.sp', 'Path and query'), target, h('div.eyebrow.sp', 'Headers'), hdrBox, presets, formWrap,
      h('p.muted.small', 'Cookies live in the Jar. Typing a header here sends it once, with this request.'),
      h('div.sticky-actions', h('button.btn.primary', { onClick: () => { tap(10); const sp2 = collect(); sheet.close(); send(sp2); } }, icon('send', 16), 'Send'))),
    size: 'full',
  });
  return sheet;
}

export function openWire(browser, net, level) {
  const body = h('div');
  const draw = () => {
    const hold = h('button.switch', { role: 'switch', 'aria-checked': String(browser.hold), 'aria-label': 'Hold requests', onClick: () => { browser.setHold(!browser.hold); tap(); draw(); } });
    const rows = [...net.log].reverse().map((e) => {
      const d = h('div.wire-detail', { hidden: true },
        h('div.eyebrow.sp', 'Response headers'), h('pre', Object.entries(e.res.headers).map(([k, v]) => `${k}: ${v}`).join('\n')),
        h('div.eyebrow.sp', 'Request headers'), h('pre', Object.entries(e.req.headers).map(([k, v]) => `${k}: ${v}`).join('\n')),
        Object.keys(e.req.form).length ? [h('div.eyebrow.sp', 'Form'), h('pre', Object.entries(e.req.form).map(([k, v]) => `${k}=${v}`).join('\n'))] : null);
      return h('div.wire-row', h('button.wire-head', { onClick: () => { d.hidden = !d.hidden; tap(4); } }, h('span', { class: 'status-pill ' + statusCls(e.res.status) }, String(e.res.status)), h('b', e.req.method), h('code', e.req.url), h('em', e.res.headers.location ? `→ ${e.res.headers.location}` : '')), d);
    });
    body.replaceChildren(
      h('div.setting', h('div', h('b', 'Hold requests'), h('small', 'Pause forms and links so you can edit them before they leave.')), hold),
      h('button.btn.small.ghost', { onClick: () => openRequest(browser, net, null, (sp) => browser.exec(sp)) }, icon('send', 14), 'Craft request'),
      h('div.eyebrow.sp', `Wire · ${rows.length} request${rows.length === 1 ? '' : 's'}`), ...(rows.length ? rows : [h('p.muted.small', 'No traffic yet.')]));
  };
  draw();
  return openSheet({ eyebrow: 'Wire', title: 'Every request, every hop', body, size: 'full' });
}

export function openJar(browser, net) {
  const body = h('div');
  const draw = () => {
    const rows = [...net.jar].map(([k, v]) => h('div.kv', h('input.fld.k', { value: k, readonly: true, 'aria-label': 'cookie name' }),
      h('input.fld.v', { value: v, autocapitalize: 'off', autocorrect: 'off', autocomplete: 'off', spellcheck: 'false', 'aria-label': `value of ${k}`, onChange: (e) => { net.jar.set(k, e.target.value); toast('Cookie updated'); } }),
      h('button.icon-btn', { 'aria-label': 'Delete cookie', onClick: () => { net.jar.delete(k); draw(); } }, icon('trash', 16))));
    const nk = h('input.fld.k', { placeholder: 'name', autocapitalize: 'off', autocomplete: 'off', 'aria-label': 'new cookie name' }), nv = h('input.fld.v', { placeholder: 'value', autocapitalize: 'off', autocomplete: 'off', 'aria-label': 'new cookie value' });
    body.replaceChildren(h('p.muted.small', 'Cookies the server has given this page. Edit a value, then reload.'),
      ...(rows.length ? rows : [h('p.muted.small', 'The jar is empty.')]),
      h('div.eyebrow.sp', 'Add a cookie'), h('div.kv', nk, nv, h('button.icon-btn', { 'aria-label': 'Add', onClick: () => { if (nk.value.trim()) { net.jar.set(nk.value.trim(), nv.value); draw(); } } }, icon('plus', 16))),
      h('div.sticky-actions', h('button.btn.primary', { onClick: () => { tap(10); sheet.close(); browser.reload(); } }, icon('reload', 16), 'Save and reload')));
  };
  draw();
  const sheet = openSheet({ eyebrow: 'Jar', title: 'Cookies', body, size: 'half' });
  return sheet;
}

export function openBench() {
  const b = createBench({ initial: '' });
  return openSheet({ eyebrow: 'Bench', title: 'Decode, encode, sweep', body: b.el, size: 'full' });
}

export function openNotes(levelId) {
  const s = save();
  let key = levelId;
  const ta = h('textarea.notes', { placeholder: 'Your thinking goes here. It is saved on this device.', 'aria-label': 'Notes', rows: '8', value: s.notes[key] || '' });
  const seg = h('div.seg');
  const paint = () => seg.replaceChildren(h('button', { 'aria-pressed': String(key === levelId), onClick: () => { key = levelId; ta.value = save().notes[key] || ''; paint(); } }, 'This level'), h('button', { 'aria-pressed': String(key === '_'), onClick: () => { key = '_'; ta.value = save().notes._ || ''; paint(); } }, 'Scratchpad'));
  paint();
  ta.addEventListener('input', () => update((st) => { st.notes[key] = ta.value; }));
  return openSheet({ eyebrow: 'Notes', title: 'Notebook', body: h('div', seg, ta), size: 'half' });
}

export function openHints(level) {
  const body = h('div.hints');
  const draw = () => {
    const shown = save().hints[level.id] || 0;
    body.replaceChildren(...level.hints.map((t, i) => {
      const names = ['Whisper', 'Nudge', 'Map'];
      return i < shown ? h('div.hint', h('b', names[i].toUpperCase()), h('span', t))
        : h('button.hint.locked', { disabled: i > shown, onClick: () => { tap(10); update((st) => { st.hints[level.id] = i + 1; }); draw(); } }, h('b', names[i].toUpperCase()), h('span', i === shown ? 'Tap to reveal' : 'Reveal the previous one first'), icon(i === shown ? 'hint' : 'lock', 16));
    }), h('p.muted.small', 'Hints are never penalised. Your Record only notes how many you used.'));
  };
  draw();
  return openSheet({ eyebrow: 'Hints', title: 'Three lanterns', body, size: 'half' });
}
