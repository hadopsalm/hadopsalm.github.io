// Virtual network: a tiny in-memory HTTP world. Each level owns a `site(req, ctx, st)` handler.
// DOM free, so scripts/verify-levels.mjs can prove every level is solvable in Node.
import { doc, esc, notFound } from './page.js';

export const UA_DEFAULT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

export function parseTarget(t) {
  let hash = '', s = String(t || '/');
  const hi = s.indexOf('#'); if (hi >= 0) { hash = s.slice(hi); s = s.slice(0, hi); }
  const qi = s.indexOf('?'); let path = qi >= 0 ? s.slice(0, qi) : s; const qs = qi >= 0 ? s.slice(qi + 1) : '';
  if (!path.startsWith('/')) path = '/' + path;
  const query = {}; for (const [k, v] of new URLSearchParams(qs)) query[k] = v;
  return { path, query, hash, qs };
}
export const formatQuery = (q) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries(q || {})) u.append(k, v); return u.toString(); };
export const formatTarget = ({ path, query, hash }) => { const q = formatQuery(query); return path + (q ? '?' + q : '') + (hash || ''); };

function normRes(r, path) {
  if (r == null) return { ...notFound(path), headers: { 'content-type': 'text/html; charset=utf-8' }, cookies: {} };
  if (typeof r === 'string') r = { body: r };
  const headers = Object.fromEntries(Object.entries(r.headers || {}).map(([k, v]) => [k.toLowerCase(), String(v)]));
  headers['content-type'] ||= r.type || 'text/html; charset=utf-8';
  return { status: r.status || 200, headers, cookies: r.cookies || {}, body: r.body ?? '' };
}

/** Turn any response into an HTML document the iframe can show. */
export function renderDoc(res) {
  const type = res.headers['content-type'] || '';
  if (/html/.test(type)) return res.body;
  if (/^image\//.test(type)) return doc({ title: 'image', body: `<p class="eyebrow">${esc(type)}</p><h2>Binary image</h2><p class="dim">${res.body.length || 82} bytes. Nothing readable here.</p>` });
  return doc({ title: 'plain text', body: `<pre>${esc(res.body)}</pre>` });
}

export function createNet(level, ctx) {
  const host = level.host;
  const jar = new Map();
  let st = level.init ? level.init(ctx) : {};
  const log = [];
  let id = 0;

  async function once(req) {
    const cookies = Object.fromEntries(jar);
    const headers = { host, 'user-agent': UA_DEFAULT, accept: 'text/html,*/*', ...Object.fromEntries(Object.entries(req.headers || {}).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k.toLowerCase(), String(v)])) };
    const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookieStr) headers.cookie = cookieStr;
    const r = { method: (req.method || 'GET').toUpperCase(), path: req.path, query: req.query || {}, form: req.form || {}, headers, cookies, host };
    r.url = formatTarget({ path: r.path, query: r.query });
    let raw;
    try { raw = await level.site(r, ctx, st); } catch (e) { raw = { status: 500, body: doc({ title: '500', body: `<h1>The Keeper stumbled.</h1><pre>${esc(e && e.message)}</pre>` }) }; }
    const res = normRes(raw, r.path);
    for (const [k, v] of Object.entries(res.cookies)) { if (v === null) jar.delete(k); else jar.set(k, String(v)); }
    const entry = { id: ++id, t: Date.now(), req: r, res: { status: res.status, headers: res.headers, size: res.body.length } };
    log.push(entry); if (log.length > 60) log.shift();
    return { req: r, res, entry };
  }

  /** Perform a request, following redirects. spec: {method, target|path+query, form, headers} */
  async function fetch(spec) {
    const t = spec.target != null ? parseTarget(spec.target) : { path: spec.path, query: spec.query || {}, hash: spec.hash || '' };
    let cur = { method: spec.method || 'GET', path: t.path, query: t.query, form: spec.form || {}, headers: spec.headers || {} };
    const hops = [];
    for (let i = 0; i < 10; i++) {
      const h = await once(cur); hops.push(h);
      const loc = h.res.headers.location;
      if (h.res.status >= 300 && h.res.status < 400 && loc) {
        const u = new URL(loc, `https://${host}${cur.path}`); const n = parseTarget(u.pathname + u.search);
        const m = [307, 308].includes(h.res.status) ? cur.method : 'GET';
        cur = { method: m, path: n.path, query: n.query, form: m === 'GET' ? {} : cur.form, headers: { ...cur.headers } };
        continue;
      }
      break;
    }
    const final = hops[hops.length - 1];
    return { final, hops, hash: t.hash, url: { path: final.req.path, query: final.req.query, hash: t.hash } };
  }
  const get = (target, opts = {}) => fetch({ method: 'GET', target, ...opts });
  const post = (target, form, opts = {}) => fetch({ method: 'POST', target, form, ...opts });
  return {
    host, origin: `https://${host}`, jar, log, fetch, get, post,
    get state() { return st; },
    reset() { jar.clear(); log.length = 0; st = level.init ? level.init(ctx) : {}; },
  };
}
