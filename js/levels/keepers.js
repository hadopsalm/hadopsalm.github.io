// Chapter II · Keepers. A ladder of web vaults. Each keeper guards the key to the next; every install has different keys.
import { doc, esc } from '../net/page.js';
import { b64e, hexe, rev } from '../core/ciphers.js';

const hostOf = (n) => `k${n}.keepers.hadopsalm.invalid`;
const kp = (n, body, title) => doc({ title: title || `Keeper ${n}`, theme: 'keepers', body: `<p class="eyebrow">keeper ${n}</p><h1>Keeper ${n}</h1>${body}` });
const K = (n, o) => ({ chapter: 'keepers', id: `keepers-${n}`, host: hostOf(n), start: '/', goal: 'Take the key this keeper guards.', ...o });
const SRC_NOTE = 'The vault pages are served from your phone. Nothing leaves the device.';

export default [
  K(0, {
    title: 'The Open Hand', depth: 220,
    site: (req, ctx) => req.path === '/' ? kp(0, `<p>Nothing to see here. The Keeper holds out an empty hand.</p><p class="dim small">${SRC_NOTE}</p><!-- the key for keeper 1 is ${ctx.key} -->`) : null,
    hints: ['Pages contain more than they show.', 'Open the Source tool (the code icon) and read the whole response.', 'There is an HTML comment. Tap a line to copy it.'],
    debrief: { title: 'Comments ship to the client', text: 'HTML comments are part of the response. Developers leave notes, credentials and TODOs in them and forget that every visitor receives them.' },
    proof: async (net) => (await net.get('/')).final.res.body.match(/key for keeper 1 is ([a-z-]+) /)[1],
  }),
  K(1, {
    title: 'The Sealed Page', depth: 260,
    site: (req, ctx) => req.path === '/' ? kp(1, `<p>This keeper has sealed the page. Long-press, right-click and text selection are all disabled.</p><script>document.oncontextmenu=function(){return false};document.onselectstart=function(){return false}<\/script><style>body{-webkit-user-select:none;user-select:none}</style><!-- the key for keeper 2 is ${ctx.key} -->`) : null,
    hints: ['A page can switch off its own menus. It cannot switch off yours.', 'The Source tool does not run the page’s scripts.', 'Same place as before.'],
    debrief: { title: 'Client side locks are decoration', text: 'JavaScript that blocks right click or selection only affects one UI surface. The data is already in your hands, so nothing was protected.' },
    proof: async (net) => (await net.get('/')).final.res.body.match(/keeper 2 is ([a-z-]+) /)[1],
  }),
  K(2, {
    title: 'Open Shelves', depth: 300,
    site: (req, ctx) => {
      if (req.path === '/') return kp(2, `<p>There is nothing on this page.</p><img src="/files/pixel.png" alt="1px" width="1" height="1">`);
      if (req.path === '/files/' || req.path === '/files') return doc({ title: 'Index of /files', theme: 'keepers', body: `<h1>Index of /files</h1><table><tr><td><a href="/files/pixel.png">pixel.png</a></td><td>82 B</td></tr><tr><td><a href="/files/users.txt">users.txt</a></td><td>${(`# usernames and keys\nkeeper1:x\nkeeper3:${ctx.key}\n`).length} B</td></tr></table>` });
      if (req.path === '/files/pixel.png') return { type: 'image/png', body: 'PNG' };
      if (req.path === '/files/users.txt') return { type: 'text/plain', body: `# usernames and keys\nkeeper1:x\nkeeper3:${ctx.key}\n` };
      return null;
    },
    hints: ['Where does that image come from?', 'The source shows /files/pixel.png. What is in the folder around it?', 'Edit the address to /files/ and open the text file.'],
    debrief: { title: 'Directory listing', text: 'If a server lists a folder, every file in it is public, even the ones no page links to. Disable auto-indexing and keep secrets out of web roots.' },
    proof: async (net) => (await net.get('/files/users.txt')).final.res.body.match(/keeper3:([a-z-]+)/)[1],
  }),
  K(3, {
    title: 'Polite Request', depth: 340,
    site: (req, ctx) => {
      if (req.path === '/') return kp(3, `<p>There is nothing on this page either. Not even search engines can find anything.</p>`);
      if (req.path === '/robots.txt') return { type: 'text/plain', body: 'User-agent: *\nDisallow: /s3cr3t/\n' };
      if (req.path === '/s3cr3t/') return doc({ title: 'Index of /s3cr3t', theme: 'keepers', body: `<h1>Index of /s3cr3t</h1><p><a href="/s3cr3t/users.txt">users.txt</a></p>` });
      if (req.path === '/s3cr3t/users.txt') return { type: 'text/plain', body: `keeper4:${ctx.key}\n` };
      return null;
    },
    hints: ['Search engines are asked to stay away from some places. By whom?', 'Every site may publish /robots.txt.', 'It names a folder. Open it, then its users.txt.'],
    debrief: { title: 'robots.txt is a signpost', text: 'robots.txt asks crawlers to skip paths. It is public and polite, not a lock. Listing a secret folder in it announces exactly where to look.' },
    proof: async (net) => { const r = (await net.get('/robots.txt')).final.res.body.match(/Disallow: (\S+)/)[1]; return (await net.get(r + 'users.txt')).final.res.body.match(/keeper4:([a-z-]+)/)[1]; },
  }),
  K(4, {
    title: 'The Right Door', depth: 385,
    site: (req, ctx) => {
      if (req.path !== '/') return null;
      const from = req.headers.referer || '';
      const ok = 'https://k5.keepers.hadopsalm.invalid/';
      if (from.startsWith(ok)) return kp(4, `<p class="ok">Access granted. The key is <b>${ctx.key}</b></p>`);
      return kp(4, `<p class="bad">Access disallowed. You are visiting from <code>${esc(from || 'nowhere')}</code> while authorised users should come only from <code>${ok}</code></p>`);
    },
    hints: ['The server checks where you came from.', 'Browsers announce the previous page in a header called Referer.', 'Wire → Craft request. Add the header Referer with the address shown. Send.'],
    debrief: { title: 'Trusting the Referer', text: 'The Referer header is supplied by the client and can be set to anything. Never use it as proof of identity or permission.' },
    proof: async (net, ctx) => (await net.get('/', { headers: { referer: 'https://k5.keepers.hadopsalm.invalid/' } })).final.res.body.match(/<b>([^<]+)</)[1],
  }),
  K(5, {
    title: 'Logged In', depth: 430,
    site: (req, ctx) => {
      if (req.path !== '/') return null;
      if (req.cookies.loggedin === '1') return kp(5, `<p class="ok">Access granted. The key is <b>${ctx.key}</b></p>`);
      return { cookies: { loggedin: '0' }, body: kp(5, `<p class="bad">Access disallowed. You are not logged in.</p>`) };
    },
    hints: ['The server remembers a yes or no about you.', 'Open the Jar (cookie icon).', 'Change loggedin from 0 to 1 and reload.'],
    debrief: { title: 'Trusting client state', text: 'If a cookie says whether you are logged in, you can say so too. Authorisation must live on the server, ideally in a signed session identifier.' },
    proof: async (net) => { await net.get('/'); net.jar.set('loggedin', '1'); return (await net.get('/')).final.res.body.match(/<b>([^<]+)</)[1]; },
  }),
  K(6, {
    title: 'Forgotten Include', depth: 480,
    site: (req, ctx) => {
      if (req.path === '/source') return { type: 'text/plain', body: `<?php\ninclude "includes/secret.inc";\nif (array_key_exists("submit", $_POST)) {\n  if ($secret == $_POST['secret']) { print "Access granted. Key: <KEY>"; }\n  else { print "Wrong secret"; }\n}\n?>` };
      if (req.path === '/includes/secret.inc') return { type: 'text/plain', body: `<?php $secret = "${ctx.aux}"; ?>` };
      if (req.path !== '/') return null;
      let msg = '';
      if (req.method === 'POST') msg = req.form.secret === ctx.aux ? `<p class="ok">Access granted. The key is <b>${ctx.key}</b></p>` : '<p class="bad">Wrong secret.</p>';
      return kp(6, `<p>Input secret:</p><form method="post"><input name="secret" autocomplete="off" autocapitalize="off"><button name="submit" value="1">Submit</button></form>${msg}<p><a href="/source">View sourcecode</a></p>`);
    },
    hints: ['The source link shows how the check works.', 'It includes a file by path. Request that path directly.', 'Open /includes/secret.inc, copy the secret, submit it in the form.'],
    debrief: { title: 'Includes served as text', text: 'Server-side include files must never be reachable by URL. If they are, the server hands out source and any secrets inside it.' },
    proof: async (net, ctx) => { const sec = (await net.get('/includes/secret.inc')).final.res.body.match(/"([^"]+)"/)[1]; return (await net.post('/', { secret: sec })).final.res.body.match(/<b>([^<]+)</)[1]; },
  }),
  K(7, {
    title: 'Scrambled Secret', depth: 540,
    site: (req, ctx) => {
      const enc = hexe(rev(b64e(ctx.aux)));
      if (req.path === '/source') return { type: 'text/plain', body: `<?php\n$encodedSecret = "${enc}";\n\nfunction encodeSecret($secret) {\n  return bin2hex(strrev(base64_encode($secret)));\n}\n\nif (array_key_exists("submit", $_POST)) {\n  if (encodeSecret($_POST['secret']) == $encodedSecret) { print "Access granted."; }\n}\n?>` };
      if (req.path !== '/') return null;
      let msg = '';
      if (req.method === 'POST') msg = req.form.secret === ctx.aux ? `<p class="ok">Access granted. The key is <b>${ctx.key}</b></p>` : '<p class="bad">Wrong secret.</p>';
      return kp(7, `<p>Input secret:</p><form method="post"><input name="secret" autocomplete="off" autocapitalize="off"><button name="submit" value="1">Submit</button></form>${msg}<p><a href="/source">View sourcecode</a></p>`);
    },
    hints: ['The source stores the secret, but scrambled.', 'The function applies base64, then reverse, then hex. Undo them in the opposite order.', 'Bench: paste the hex, Use the Hex result, Use the Reverse result, then Base64. Submit that.'],
    debrief: { title: 'Encoding is not encryption', text: 'Chained encodings look like a lock but are fully reversible. If the program can check it, an attacker can reverse the steps from the same source.' },
    proof: async (net, ctx) => {
      const enc = (await net.get('/source')).final.res.body.match(/encodedSecret = "([0-9a-f]+)"/)[1];
      const { hexd, rev, b64d } = await import('../core/ciphers.js');
      const sec = b64d(rev(hexd(enc)));
      return (await net.post('/', { secret: sec })).final.res.body.match(/<b>([^<]+)</)[1];
    },
  }),
  K(8, {
    title: 'The Right Browser', depth: 600,
    site: (req, ctx) => {
      if (req.path !== '/') return null;
      const ua = req.headers['user-agent'] || '';
      if (ua.includes('HadalBot/1.0')) return kp(8, `<p class="ok">Welcome, HadalBot. The key is <b>${ctx.key}</b></p>`);
      return kp(8, `<p class="bad">Only the official <code>HadalBot/1.0</code> client may enter.</p><p class="dim small">Your browser says:</p><pre>${esc(ua)}</pre>`);
    },
    hints: ['The server reads how you introduce yourself.', 'That is the User-Agent header.', 'Wire → Craft request. Set User-Agent to HadalBot/1.0 and send.'],
    debrief: { title: 'User-Agent is a claim', text: 'Clients describe themselves in a header they fully control. Treat it as a hint for analytics, never as authentication.' },
    proof: async (net) => (await net.get('/', { headers: { 'user-agent': 'HadalBot/1.0' } })).final.res.body.match(/<b>([^<]+)</)[1],
  }),
];
