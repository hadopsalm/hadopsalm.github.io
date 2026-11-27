// Chapter III · Brine. Cross-site scripting in a sealed sandbox. Goal: make the page call alert().
// Pages run in an iframe with an opaque origin, no network and a strict CSP. Nothing can leave your phone.
import { doc, esc } from '../net/page.js';

const host = 'brine.hadopsalm.invalid';
const app = (title, body, head = '') => doc({ title, head, body: `<p class="eyebrow">Brine Labs · ${esc(title)}</p>${body}` });
const B = (n, o) => ({ chapter: 'brine', id: `brine-${n}`, host, start: '/', goal: 'Make the page call alert().', ...o });

export default [
  B(1, {
    title: 'Echo Chamber', depth: 1100, inject: { kind: 'query', path: '/search', name: 'q', label: 'Search term' },
    site: (req) => {
      if (req.path === '/') return app('Echo', `<h1>Search the reef.</h1><form action="/search"><input name="q" placeholder="coral, kelp…"><button>Search</button></form>`);
      if (req.path === '/search') return app('Echo', `<h1>Results</h1><p>Sorry, no results for <b>${req.query.q ?? ''}</b>.</p><p><a href="/">New search</a></p>`);
      return null;
    },
    payload: '<script>alert(1)</script>',
    hints: ['Whatever you search is written back into the page.', 'Is it escaped? Try a search for <b>bold</b> and see.', 'If HTML is accepted, a script element is HTML too.'],
    debrief: { title: 'Reflected XSS', text: 'The search term is concatenated into HTML without escaping, so markup you send becomes part of the page. This is the most common XSS shape.', fix: 'Escape on output: replace & < > " \' with entities, or build the node with textContent.' },
  }),
  B(2, {
    title: 'Guestbook', depth: 1400, inject: { kind: 'form', path: '/sign', name: 'msg', label: 'Your message' },
    init: () => ({ entries: ['Lovely lanterns!', 'First!'] }),
    site: (req, ctx, st) => {
      if (req.path === '/sign' && req.method === 'POST') { if (req.form.msg) st.entries.push(req.form.msg); return { status: 303, headers: { location: '/' } }; }
      if (req.path !== '/') return null;
      const data = JSON.stringify(st.entries).replace(/</g, '\\u003c');
      return app('Guestbook', `<h1>Guestbook</h1><ul id="l"></ul><form method="post" action="/sign"><input name="msg" placeholder="Leave a message"><button>Sign</button></form>
<script>var E=${data};var l=document.getElementById('l');E.forEach(function(e){l.innerHTML+='<li>'+e+'</li>'});<\/script>`);
    },
    payload: '<img src=x onerror=alert(1)>',
    hints: ['This time the page builds its list in the browser with a script.', 'The server is careful, but the script uses innerHTML. Script tags inserted that way do not run.', 'Some elements run code through an event attribute when they fail to load.'],
    debrief: { title: 'DOM based XSS via innerHTML', text: 'Elements inserted with innerHTML do not execute <script>, but event handlers such as onerror still fire. Server side care is wasted if client code re-parses the text as HTML.', fix: 'Use element.textContent = value, or createElement + appendChild.' },
  }),
  B(3, {
    title: 'Fragment of Light', depth: 1900, inject: { kind: 'hash', label: 'Fragment after #' },
    site: (req) => {
      if (req.path !== '/') return null;
      return app('Gallery', `<h1>Lamp gallery</h1><div id="stage" class="card dim">…</div><p><a href="#1">Lamp 1</a> · <a href="#2">Lamp 2</a> · <a href="#3">Lamp 3</a></p>
<script>function render(){var n=(vloc.hash||'#1').substr(1);var html="<img src='/img/lamp"+n+".jpg' width='120' alt='lamp "+n+"'>";document.getElementById('stage').innerHTML=html}
window.addEventListener('hashchange',render);render();<\/script>`);
    },
    payload: "' onerror='alert(1)' x='",
    hints: ['Nothing is sent to the server this time. Look at the address after the #.', 'The script puts the fragment inside a single-quoted attribute of an img tag.', 'Close the quote, add an attribute that runs code when the image fails.'],
    debrief: { title: 'DOM XSS from location.hash', text: 'Data in the URL fragment never reaches the server, yet scripts read it all the time. Putting it inside an attribute lets you break out of the quotes and add your own handler.', fix: 'Validate against an allowlist (digits only) and set img.src with the DOM API, never by string concatenation.' },
  }),
  B(4, {
    title: 'Signup Hatch', depth: 2400, inject: { kind: 'query', path: '/signup', name: 'next', label: 'next= address' },
    site: (req) => {
      if (req.path === '/') return app('Signup', `<h1>Join the crew</h1><p><a class="btn" href="/signup?next=/welcome">Sign up</a></p>`);
      if (req.path === '/signup') return app('Signup', `<h1>Almost there.</h1><p>Your account is ready.</p><p><a class="btn" href="${req.query.next ?? '/'}">Continue</a></p>`);
      if (req.path === '/welcome') return app('Welcome', `<h1>Welcome aboard.</h1>`);
      return null;
    },
    payload: 'javascript:alert(1)',
    hints: ['The Continue link goes wherever next= says.', 'A link does not have to lead to a page. Its scheme can be something else.', 'Set next to javascript: followed by code, run, then tap Continue in the page.'],
    debrief: { title: 'javascript: URLs', text: 'A redirect or link target taken from user input can use the javascript: scheme, which runs code when tapped. The user, not the attacker, pulls the trigger, which is why it still works.', fix: 'Only accept relative paths or an allowlist of http(s) origins for next=.' },
  }),
  B(5, {
    title: 'Loose Quote', depth: 3000, inject: { kind: 'query', path: '/lookup', name: 'q', label: 'Lookup term' },
    site: (req) => {
      if (req.path === '/') return app('Lookup', `<h1>Lookup</h1><form action="/lookup"><input name="q"><button>Find</button></form>`);
      if (req.path === '/lookup') return app('Lookup', `<h1>Lookup</h1><form action="/lookup"><input name="q" value="${req.query.q ?? ''}"><button>Find</button></form><p class="dim small">Your term is kept in the box so you can refine it.</p>`);
      return null;
    },
    payload: '"><img src=x onerror=alert(1)>',
    hints: ['Your search term comes back, but not in the page text.', 'Open the Source and find where it lands: inside value="…".', 'Close the quote and the tag, then start your own element. Or add an event attribute.'],
    debrief: { title: 'Attribute context', text: 'Escaping for HTML text is not the same as escaping for an attribute. A bare double quote ends the value and lets you add attributes or close the tag entirely.', fix: 'Encode " and \' as well, and always quote attributes. Prefer a templating library that escapes by context.' },
  }),
  B(6, {
    title: 'Thin Veil', depth: 3700, inject: { kind: 'query', path: '/search', name: 'q', label: 'Search term' },
    site: (req) => {
      if (req.path === '/') return app('Veil', `<h1>Search (now filtered)</h1><form action="/search"><input name="q"><button>Search</button></form>`);
      if (req.path === '/search') { const safe = String(req.query.q ?? '').replace(/<script/gi, ''); return app('Veil', `<h1>Results</h1><p>No results for <b>${safe}</b>.</p>`); }
      return null;
    },
    payload: '<img src=x onerror=alert(1)>',
    hints: ['A filter now removes something. Find out what by testing.', 'It strips the text <b>&lt;script</b> once and does not look again. There are also other tags.', 'Either rebuild the word after it is stripped, or use a different element entirely.'],
    debrief: { title: 'Blocklists fail', text: 'Removing known-bad strings is a losing game: there are endless alternatives, and a single pass can be defeated by nesting. Filters also fight legitimate input.', fix: 'Do not filter, encode. Context-aware output escaping plus a Content-Security-Policy that forbids inline scripts.' },
  }),
];
