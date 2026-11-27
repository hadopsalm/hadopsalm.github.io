// Chapter IV · Relay. Missions from a fictional hadal relay station: forms, scripts, ciphers, ink, injection, forged cookies.
import { doc, esc } from '../net/page.js';
import { b64e, b64d, hexe, caesar } from '../core/ciphers.js';

const host = 'relay.hadopsalm.invalid';
const rp = (title, body, head = '') => doc({ title, theme: 'relay', head, body: `<h1>Hadal Relay · ${esc(title)}</h1>${body}` });
const R = (n, o) => ({ chapter: 'relay', id: `relay-${n}`, host, start: '/', goal: 'Complete the mission and report the key.', ...o });

// A deliberately tiny SQL WHERE evaluator so the injection mission behaves like the real thing, with no real database.
const ROWS = (ctx) => [{ user: 'deckhand', pass: 'barnacle' }, { user: 'admin', pass: ctx.aux }];
function tokenize(s) {
  const t = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'") { let j = i + 1, v = ''; for (; ;) { if (j >= s.length) throw new Error('unterminated string'); if (s[j] === "'") { if (s[j + 1] === "'") { v += "'"; j += 2; continue; } break; } v += s[j++]; } t.push({ k: 's', v }); i = j + 1; continue; }
    const m = /^(<>|!=|=|\(|\)|\d+|[A-Za-z_]+)/.exec(s.slice(i)); if (!m) throw new Error(`near "${s.slice(i, i + 6)}"`);
    const v = m[1]; t.push(/^\d+$/.test(v) ? { k: 'n', v: +v } : /^(and|or|not)$/i.test(v) ? { k: 'op', v: v.toLowerCase() } : /^(=|<>|!=)$/.test(v) ? { k: 'cmp', v } : /^[()]$/.test(v) ? { k: v } : { k: 'id', v }); i += v.length;
  }
  return t;
}
function evalWhere(where, row) {
  const t = tokenize(where); let p = 0;
  const val = () => { const x = t[p++]; if (!x) throw new Error('unexpected end'); if (x.k === 's' || x.k === 'n') return x.v; if (x.k === 'id') return row[x.v.toLowerCase()] ?? null; throw new Error(`near "${x.v ?? x.k}"`); };
  const cmp = () => { if (t[p]?.k === '(') { p++; const v = or(); if (t[p++]?.k !== ')') throw new Error('missing )'); return v; } if (t[p]?.v === 'not') { p++; return !cmp(); } const a = val(); const o = t[p++]; if (!o || o.k !== 'cmp') throw new Error('expected comparison'); const b = val(); return o.v === '=' ? a == b : a != b; };
  const and = () => { let v = cmp(); while (t[p]?.v === 'and') { p++; const r = cmp(); v = v && r; } return v; };
  const or = () => { let v = and(); while (t[p]?.v === 'or') { p++; const r = and(); v = v || r; } return v; };
  const r = or(); if (p < t.length) throw new Error(`near "${t[p].v ?? t[p].k}"`); return r;
}
export function sqlLogin(user, pass, ctx) {
  const sql = `SELECT * FROM staff WHERE user = '${user}' AND pass = '${pass}'`;
  const cut = sql.replace(/(--|#).*$/s, '');
  const where = cut.slice(cut.indexOf('WHERE') + 5);
  try { const hit = ROWS(ctx).find((r) => evalWhere(where, r)); return { sql, hit }; } catch (e) { return { sql, error: e.message }; }
}

export default [
  R(1, {
    title: 'Forgotten Hatch', depth: 4200,
    site: (req, ctx) => {
      if (req.path === '/' ) return rp('Hatch', `<p>Lost your hatch code? Enter your callsign. We mail the code to the address on file.</p><form method="post" action="/reset"><input name="callsign" value="deckhand"><input type="hidden" name="mailto" value="deckhand@relay.hadopsalm.invalid"><button>Send my code</button></form>`);
      if (req.path === '/reset' && req.method === 'POST') {
        const to = req.form.mailto || '';
        if (to === 'deckhand@relay.hadopsalm.invalid') return rp('Hatch', `<p class="ok">Code sent to the address on file. Check your mail.</p>`);
        return rp('Mail queued', `<p class="ok">Mail sent to <b>${esc(to)}</b>.</p><pre>To: ${esc(to)}\nSubject: Your hatch code\n\nThe key is ${ctx.key}</pre>`);
      }
      return null;
    },
    hints: ['The form has a field you cannot see.', 'Wire has a Hold switch. With Hold on, forms stop for you to edit before sending.', 'Turn Hold on, submit, change the hidden mailto value to any other address, send.'],
    debrief: { title: 'Hidden fields are not secret or safe', text: 'Hidden inputs are just inputs you cannot see. The recipient lived in the form, so a client could redirect the mail. The server must decide recipients itself.' },
    proof: async (net, ctx) => (await net.post('/reset', { callsign: 'deckhand', mailto: 'me@example.invalid' })).final.res.body.match(/key is ([a-z-]+)/)[1],
  }),
  R(2, {
    title: 'Brass Lock', depth: 4900,
    site: (req, ctx) => {
      if (req.path !== '/') return null;
      const codes = [...ctx.key].map((c) => c.charCodeAt(0));
      return rp('Brass Lock', `<p>Enter the lock code. The check runs in your browser, which is convenient for us.</p><input id="c" autocomplete="off" autocapitalize="off"><button onclick="go()">Unlock</button><p id="r" class="dim"></p>
<script>var _s=[${codes.join(',')}];function go(){var v=document.getElementById('c').value;var k=String.fromCharCode.apply(null,_s);document.getElementById('r').textContent=(v===k)?'Unlocked.':'The lock stays shut.'}<\/script>`);
    },
    hints: ['The code is checked by a script on the page.', 'In the Source, find var _s. Numbers are letters.', 'Bench has a Char codes decoder. Paste the list. Hyphens are char code 45.'],
    debrief: { title: 'Client side checks', text: 'A secret compared in JavaScript is shipped to everyone. Obfuscation with char codes only slows a glance. Verify on the server.' },
    proof: async (net) => { const a = (await net.get('/')).final.res.body.match(/var _s=\[([\d,]+)\]/)[1]; return String.fromCharCode(...a.split(',').map(Number)); },
  }),
  R(3, {
    title: 'Caesar’s Tide', depth: 5600,
    site: (req, ctx) => req.path === '/' ? rp('Intercept', `<p>A radio operator relayed this line. The alphabet has slipped by an unknown number of places.</p><pre>${esc(caesar('relay key: ' + ctx.key, 9))}</pre>`) : null,
    hints: ['A Caesar cipher shifts every letter by the same amount.', 'You do not know the amount, so try them all. The Bench has a Caesar sweep.', 'Open the sweep and find the row that reads as English.'],
    debrief: { title: 'Brute forcing a small keyspace', text: 'A Caesar cipher has only 25 keys, so trying all of them takes no time. Modern ciphers are safe only because their key spaces are astronomically larger.' },
    proof: async (net) => { const c = (await net.get('/')).final.res.body.match(/<pre>([^<]+)</)[1]; return caesar(c, 26 - 9).replace('relay key: ', ''); },
  }),
  R(4, {
    title: 'Faint Ink', depth: 6300,
    site: (req, ctx) => req.path === '/' ? rp('Dim Panel', `<p>A status panel, powered down. Something is written on it in almost no light.</p>
<div style="background:rgb(22,22,22);padding:26px 14px;border-radius:12px;font:700 22px ui-monospace,monospace;line-height:1.8">
<div style="color:rgb(28,28,28)">nothing to report</div><div style="color:rgb(28,28,28)">key: ${ctx.key}</div><div style="color:rgb(28,28,28)">no key here</div></div>
<p class="dim small">Brightness lifts everything. Contrast pulls apart what is almost the same. The Lens has both.</p>`) : null,
    hints: ['The text and its background are almost the same grey.', 'In the Lens, raise Brightness so the greys sit around the middle, then raise Contrast.', 'Try about 5 for brightness and 10 or more for contrast. Lantern will not help.'],
    debrief: { title: 'Low contrast hiding', text: 'Information hidden by a tiny colour difference survives screenshots and compression. Image analysts routinely stretch contrast to recover it, which is the basis of simple steganography.' },
    proof: async (net, ctx) => (await net.get('/')).final.res.body.match(/key: ([a-z-]+)</)[1],
  }),
  R(5, {
    title: 'Gull & Pike', depth: 7100,
    site: (req, ctx) => {
      if (req.path === '/' ) return rp('Staff Ledger', `<p>Gull &amp; Pike Chandlery. Staff only. Only the admin sees the ledger key.</p><form method="post" action="/login"><input name="user" placeholder="user" autocapitalize="off" autocomplete="off"><input name="pass" placeholder="password" autocapitalize="off" autocomplete="off"><button>Sign in</button></form>`);
      if (req.path === '/login' && req.method === 'POST') {
        const { sql, hit, error } = sqlLogin(req.form.user || '', req.form.pass || '', ctx);
        const dbg = `<p class="dim small">debug query:</p><pre>${esc(sql)}</pre>`;
        if (error) return rp('Staff Ledger', `<p class="bad">Database error: ${esc(error)}</p>${dbg}`);
        if (!hit) return rp('Staff Ledger', `<p class="bad">Wrong user or password.</p>${dbg}`);
        if (hit.user !== 'admin') return rp('Staff Ledger', `<p class="warn">Welcome, ${esc(hit.user)}. The ledger key is for the admin only.</p>${dbg}`);
        return rp('Staff Ledger', `<p class="ok">Welcome, admin. The ledger key is <b>${ctx.key}</b></p>${dbg}`);
      }
      return null;
    },
    hints: ['The page prints the database query it builds. Read it.', 'Your input sits inside single quotes. A quote of your own ends the string early.', 'Sign in as the user admin with a password of nothing, and comment out the rest: admin\'-- (then a space).'],
    debrief: { title: 'SQL injection', text: 'Building a query by pasting text into it lets input change the query’s logic. Here a quote closes the string and -- comments out the password check. Two lines of defence are missing.', fix: 'Use parameterised queries (placeholders), never string concatenation, and never print queries to users.' },
    proof: async (net) => (await net.post('/login', { user: "admin' -- ", pass: 'x' })).final.res.body.match(/<b>([^<]+)</)[1],
    payload: "admin' -- ",
  }),
  R(6, {
    title: 'Hex Ledger', depth: 7900,
    site: (req, ctx) => {
      if (req.path !== '/') return null;
      const rows = [['C-101', hexe('nets and rope')], ['C-102', b64e('rope, mostly rope')], ['C-103', hexe('crate seal: ' + ctx.key)], ['C-104', hexe('empty, do not open')]];
      return rp('Freight Manifest', `<p>Cargo descriptions arrive from the dock encoded. One crate carries a seal that is the key.</p><table><tr><th>Crate</th><th>Contents</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`);
    },
    hints: ['Four crates, different encodings. Try them.', 'Tap a table line in Source to put it in your Pocket, then load it into the Bench.', 'The third crate’s contents decode as hex into the seal.'],
    debrief: { title: 'Recognising encodings', text: 'Hex has only 0-9 and a-f, base64 ends with = and mixes cases. Learning to recognise them by eye is half of analysis.' },
    proof: async (net) => { const { hexd } = await import('../core/ciphers.js'); const m = (await net.get('/')).final.res.body.match(/C-103<\/td><td>([0-9a-f]+)</)[1]; return hexd(m).replace('crate seal: ', ''); },
  }),
  R(7, {
    title: 'Unsigned Passage', depth: 8800,
    site: (req, ctx) => {
      if (req.path !== '/') return null;
      const c = req.cookies.pass;
      if (!c) return { cookies: { pass: b64e(JSON.stringify({ user: 'deckhand', role: 'guest' })) }, body: rp('Passage', `<p>Pass issued. Welcome, deckhand. Officers only beyond this point.</p>`) };
      let p; try { p = JSON.parse(b64d(c)); } catch { return rp('Passage', `<p class="bad">Your pass is damaged.</p>`); }
      if (p.role === 'officer') return rp('Passage', `<p class="ok">Welcome, officer ${esc(p.user)}. The key is <b>${ctx.key}</b></p>`);
      return rp('Passage', `<p class="warn">Welcome, ${esc(p.user)}. Role: ${esc(p.role)}. Officers only beyond this point.</p>`);
    },
    hints: ['Your pass is a cookie. Read it.', 'It is base64 of a small JSON note. Decode it in the Bench.', 'Change role to officer, switch the Bench to Encode, Base64, put the result in the Jar, reload.'],
    debrief: { title: 'Unsigned tokens', text: 'The server trusted a token that the client can rewrite. Real session tokens are random ids or are cryptographically signed (JWT with HMAC) so that edits are detected.' },
    proof: async (net) => { await net.get('/'); net.jar.set('pass', b64e(JSON.stringify({ user: 'deckhand', role: 'officer' }))); return (await net.get('/')).final.res.body.match(/<b>([^<]+)</)[1]; },
  }),
];
