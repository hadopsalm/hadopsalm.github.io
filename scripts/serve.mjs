// Zero-dependency static server for development: npm run dev  ->  http://localhost:5173
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname, PORT = +process.env.PORT || 5173;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
export function serve(root = ROOT, port = PORT) {
  return new Promise((res) => {
    const s = createServer(async (req, rsp) => {
      let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
      if (p.endsWith('/')) p += 'index.html';
      try { const f = join(root, p); if ((await stat(f)).isDirectory()) throw 0; rsp.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); rsp.end(await readFile(f)); }
      catch { rsp.writeHead(404); rsp.end('not found'); }
    }).listen(port, () => res(s));
  });
}
if (import.meta.url === `file://${process.argv[1]}`) { await serve(); console.log(`Hadopsalm dev server: http://localhost:${PORT}`); }
