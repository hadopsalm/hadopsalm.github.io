// Page templating for the virtual sites. DOM free so the level proofs can run in Node.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CSS = `:root{color-scheme:dark}*{box-sizing:border-box}
html{background:#0d1013;color:#e6e3da;font:16px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-text-size-adjust:100%}
body{margin:0 auto;padding:22px 18px 44px;max-width:640px}
h1,h2,h3{font:italic 400 30px/1.15 'Cormorant Garamond',Georgia,serif;margin:.2em 0 .5em;letter-spacing:-.005em}h2{font-size:24px}h3{font-size:20px}
a{color:#c9cfd2;text-underline-offset:3px}p{margin:.6em 0}
code,pre,input,textarea,button,select,table{font-family:ui-monospace,Menlo,Consolas,monospace}
pre{white-space:pre-wrap;word-break:break-word;background:#12161a;padding:12px;border-radius:10px;border:1px solid #232a30;font-size:13px;line-height:1.55}
input,textarea,select{width:100%;background:#08090b;color:#e6e3da;border:1px solid #2f373d;border-radius:10px;padding:12px;font-size:16px;margin:6px 0 10px}
button,.btn{display:inline-block;background:#e6e3da;color:#08090b;border:0;border-radius:10px;padding:12px 18px;font-size:15px;font-weight:600;text-decoration:none}
.card{border:1px solid #232a30;border-radius:14px;padding:16px;background:#12161a;margin:14px 0}
.dim{color:#818c92}.small{font-size:13px}.eyebrow{font:500 11px ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:#818c92}
.ok{color:#9ab8a4}.warn{color:#c9b48c}.bad{color:#c08379}
table{width:100%;border-collapse:collapse;font-size:13px}td,th{border-bottom:1px solid #232a30;padding:8px 6px;text-align:left;vertical-align:top;word-break:break-all}
body[data-t=keepers]{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px}body[data-t=keepers] h1{font:600 18px ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase}
body[data-t=drift]{text-align:center;padding-top:44px}body[data-t=drift] h1{font-size:38px}
body[data-t=relay] h1{font:600 15px ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;border-bottom:1px solid #232a30;padding-bottom:10px}`;

export function doc({ title = 'Untitled', body = '', head = '', theme = 'plain' } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style>${head}</head><body data-t="${theme}">${body}</body></html>`;
}
export const notFound = (path) => ({ status: 404, body: doc({ title: '404 · nothing here', theme: 'plain', body: `<p class="eyebrow">404</p><h1>Only the sea.</h1><p class="dim">No page lives at <code>${esc(path)}</code>.</p>` }) });
