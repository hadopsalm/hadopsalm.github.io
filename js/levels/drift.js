// Chapter I · Drift. Lateral riddles that live in the address, the tab, the pocket and the wire.
import { doc, esc } from '../net/page.js';
import { rot13 } from '../core/ciphers.js';

const host = 'drift.hadopsalm.invalid';
const page = (title, body, head = '') => doc({ title, theme: 'drift', body, head });
const L = (o) => ({ chapter: 'drift', host, start: '/', goal: 'Find the three word key.', ...o });

export default [
  L({
    id: 'drift-1', title: 'First Light', depth: 8,
    site: (req, ctx) => page('The Surface', `<p class="eyebrow">Surface · 8 m</p><h1>The descent begins.</h1>
<p>You hold the lantern, but the first word is written in ink the dark has already swallowed.</p>
<p style="color:#0d1013;background:#0d1013">The key is <b>${ctx.key}</b></p><p class="dim small">Some ink only shows when you light it. Look for the eye in the browser bar.</p>`),
    hints: ['Words can be written in the same colour as the water.', 'The eye icon in the browser bar opens the Lens. It has a lantern.', 'Switch the Lantern on, read the amber line, then offer the three words.'],
    debrief: { title: 'Hidden ink', text: 'Text can be present and invisible: same colour as the background, zero opacity, tiny size. Anything the page contains, the page gives to anyone who asks. Never hide secrets in styling.' },
    proof: async (net, ctx) => (await net.get('/')).final.res.body.match(/The key is <b>([^<]+)</)[1],
  }),
  L({
    id: 'drift-2', title: 'Numbered Doors', depth: 20, start: '/door/3',
    site: (req, ctx) => {
      const m = /^\/door\/(\d+)$/.exec(req.path); if (!m) return null;
      const n = +m[1];
      if (n === 3) return page('Door 3', `<p class="eyebrow">Door 3</p><h1>A brass plate.</h1><p>“Go to the door numbered by this number multiplied by itself.”</p><p class="dim small">Doors are only addresses. Edit the address.</p>`);
      if (n === 9) return page('Door 9', `<p class="eyebrow">Door 9</p><h1>Another plate.</h1><p>“Go to the door whose number, multiplied by itself, makes 144.”</p>`);
      if (n === 12) return page('Door 12', `<p class="eyebrow">Door 12</p><h1>It opens.</h1><p>The key is <b>${ctx.key}</b></p>`);
      return page('A wall', `<h1>A wall.</h1><p class="dim">Door ${n} does not open.</p>`);
    },
    hints: ['The address bar is editable. Tap the path.', 'Door 3 points to 3 × 3.', 'Door 9 points to the square root of 144. Offer what door 12 shows.'],
    debrief: { title: 'Predictable paths', text: 'URLs are just text you can edit. Hidden-by-obscurity pages and sequential ids are found by changing a number. Real systems must check permission on every request.' },
    proof: async (net, ctx) => (await net.get('/door/12')).final.res.body.match(/<b>([^<]+)</)[1],
  }),
  L({
    id: 'drift-3', title: 'Tab Name', depth: 34,
    site: (req, ctx) => page(`The key is ${ctx.key}`, `<p class="eyebrow">34 m</p><h1>Nothing is written here.</h1><p>The page face is empty. Perhaps the answer is on the lid, not the face.</p><p class="dim small">Under the address bar there is a small TAB line.</p>`),
    hints: ['Read what is not in the page body.', 'Every page has a title. It is shown in the TAB line under the address bar.', 'The TAB line is the key.'],
    debrief: { title: 'The title element', text: 'The <title> is metadata shown in tabs, history and search results. Anything you place in it is public, and on phones almost nobody looks, which is why riddles like to hide there.' },
    proof: async (net, ctx) => (await net.get('/')).final.res.body.match(/<title>The key is ([^<]+)</)[1],
  }),
  L({
    id: 'drift-4', title: 'Hull Scratch', depth: 52,
    site: (req, ctx) => page('Hull', `<p class="eyebrow">52 m</p><h1>Scratched in the hull.</h1><p>A sailor left a message. It looks like words, but the letters are half an alphabet away from where they belong.</p><pre>${esc(rot13('the key is ' + ctx.key))}</pre>`),
    hints: ['Half an alphabet is thirteen letters.', 'Open the Bench (flask). Paste the scratch, ROT13 is listed first.', 'The decoded line ends with the key.'],
    debrief: { title: 'Substitution ciphers', text: 'ROT13 is a Caesar shift by 13. It is encoding, not encryption: it hides text from a glance, never from a tool. The Bench tries every common transform at once.' },
    proof: async (net, ctx) => rot13((await net.get('/')).final.res.body.match(/<pre>([^<]+)</)[1]).replace('the key is ', ''),
  }),
  L({
    id: 'drift-5', title: 'Pocket Residue', depth: 70,
    site: (req, ctx) => ({
      cookies: { lantern_oil: ctx.key },
      body: page('The Boathouse', `<p class="eyebrow">70 m</p><h1>You leave with something.</h1><p>The page says nothing, but you feel the weight of something dropped into your pocket on the way in.</p><p class="dim small">Browsers keep small notes called cookies. See the Jar.</p>`),
    }),
    hints: ['The server can hand your browser a note without telling the page.', 'Open the Jar (cookie icon).', 'The cookie named lantern_oil holds the key.'],
    debrief: { title: 'Cookies', text: 'Servers set cookies in a response header. Cookies are stored by, and visible to, the client. Anything sensitive in a cookie can be read, copied and edited by its owner.' },
    proof: async (net, ctx) => { await net.get('/'); return net.jar.get('lantern_oil'); },
  }),
  L({
    id: 'drift-6', title: 'Small Print', depth: 90,
    site: (req, ctx) => page('The Chart Room', `<p class="eyebrow">90 m</p><h1>A very busy chart.</h1>
<p>Soundings, currents, a hundred crossing lines. In the lower margin, set smaller than anyone would read, is a note.</p>
<svg viewBox="0 0 300 120" width="100%" role="img" aria-label="chart"><g stroke="#2f373d" fill="none">${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 10} Q150 ${(i * 37) % 120} 300 ${120 - i * 9}"/>`).join('')}</g></svg>
<p style="font-size:3px;line-height:1.2;color:#454e55;margin:0;text-align:left">key: ${ctx.key}</p>`),
    hints: ['Text can be set too small to read.', 'The Lens has a zoom control. Use + several times.', 'Zoom until the grey line under the chart is readable. Lantern helps with the colour.'],
    debrief: { title: 'Zoom and legibility', text: 'Content can be present but not human-readable at normal size. Source and zoom tools exist because the rendered page is only one view of the data.' },
    proof: async (net, ctx) => (await net.get('/')).final.res.body.match(/key: ([a-z-]+)</)[1],
  }),
  L({
    id: 'drift-7', title: 'Pressure', depth: 110,
    init: () => ({ t0: null }),
    site: (req, ctx, st) => {
      if (req.path === '/hatch') {
        const left = 10000 - (Date.now() - (st.t0 ?? Date.now()));
        if (left > 0) return page('Sealed', `<h1>Sealed.</h1><p>The pressure has not equalised. About <b>${Math.ceil(left / 1000)}</b> seconds remain.</p><a class="btn" href="/hatch">Try again</a>`);
        return page('Open', `<h1>The hatch opens.</h1><p>The key is <b>${ctx.key}</b></p>`);
      }
      st.t0 ??= Date.now();
      return page('Airlock', `<p class="eyebrow">110 m</p><h1>Airlock.</h1><p>The chamber is equalising. The clock started the moment you arrived. The server remembers, and it cannot be hurried.</p><a class="btn" href="/hatch">Open the hatch</a>`);
    },
    hints: ['Some secrets are guarded by time, not by words.', 'The server timed your arrival. Wait, then try the hatch again.', 'Ten seconds after arriving, the hatch gives up the key.'],
    debrief: { title: 'Server side state', text: 'The wait is enforced by the server, not the page, so no amount of editing the page skips it. Rate limits and cooldowns work this way in real systems.' },
    proof: async (net, ctx) => { await net.get('/'); net.state.t0 -= 11000; return (await net.get('/hatch')).final.res.body.match(/<b>([^<]+)</)[1]; },
  }),
  L({
    id: 'drift-8', title: 'Long Way Down', depth: 135, start: '/',
    site: (req, ctx) => {
      if (req.path === '/') return { status: 302, headers: { location: '/s1', 'x-depth': '120m' } };
      if (req.path === '/s1') return { status: 302, headers: { location: '/s2', 'x-depth': '128m' } };
      if (req.path === '/s2') return { status: 302, headers: { location: '/arrived', 'x-depth': '135m', 'x-whisper': ctx.key } };
      if (req.path === '/arrived') return page('Arrived', `<p class="eyebrow">135 m</p><h1>Arrived.</h1><p>You came a long way. The final room is empty, and it feels as if you passed something on the way.</p><p class="dim small">The browser followed three redirects without showing them. The Wire does.</p>`);
      return null;
    },
    hints: ['The page you see is the last of several.', 'Open the Wire (pulse icon). Each hop is listed.', 'Open the second redirect and read its response headers. One is named x-whisper.'],
    debrief: { title: 'Redirect chains', text: 'Browsers follow redirects silently, so headers on the intermediate hops are invisible unless you look at the network log. Secrets in headers leak the same way.' },
    proof: async (net, ctx) => (await net.get('/')).hops.find((h) => h.res.headers['x-whisper']).res.headers['x-whisper'],
  }),
];
