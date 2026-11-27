// Assembles dist/ (static, no bundler): copies the site, stamps the service worker with a content hash and precache list.
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
const root = new URL('..', import.meta.url).pathname, out = join(root, 'dist');
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'og.png', 'sw.js']) cpSync(join(root, f), join(out, f));
for (const d of ['css', 'js', 'fonts']) if (existsSync(join(root, d))) cpSync(join(root, d), join(out, d), { recursive: true });
if (!existsSync(join(root, 'fonts')) || !readdirSync(join(root, 'fonts')).some((f) => f.endsWith('.woff2'))) console.warn('warning: no fonts in /fonts. Run `npm run fonts` first for the intended typography (system fallbacks are used otherwise).');
writeFileSync(join(out, '.nojekyll'), '');
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(out).map((p) => relative(out, p)).filter((p) => !['sw.js', '.nojekyll', 'og.png'].includes(p)).sort();
const hash = createHash('sha256'); for (const f of files) { hash.update(f); hash.update(readFileSync(join(out, f))); }
const version = hash.digest('hex').slice(0, 10);
let sw = readFileSync(join(out, 'sw.js'), 'utf8').replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(['./', ...files]));
writeFileSync(join(out, 'sw.js'), sw);
let html = readFileSync(join(out, 'index.html'), 'utf8').replace('<meta name="build" content="dev" />', '<meta name="build" content="prod" />');
writeFileSync(join(out, 'index.html'), html);
console.log(`dist/ ready: ${files.length} files precached, version ${version}`);
