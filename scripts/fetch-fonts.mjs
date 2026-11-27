// Downloads the three open-licence font families (SIL OFL) from the Fontsource mirror into /fonts.   npm run fonts
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
const FILES = [
  ['cormorant-garamond', 'cormorant-garamond-latin-400-italic.woff2'],
  ['jost', 'jost-latin-400-normal.woff2'], ['jost', 'jost-latin-500-normal.woff2'],
  ['jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2'], ['jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2'],
];
const dir = new URL('../fonts/', import.meta.url);
mkdirSync(dir, { recursive: true });
let failed = 0;
for (const [pkg, file] of FILES) {
  if (existsSync(new URL(file, dir))) continue;
  const url = `https://cdn.jsdelivr.net/npm/@fontsource/${pkg}/files/${file}`;
  try { const r = await fetch(url); if (!r.ok) throw new Error(r.status); writeFileSync(new URL(file, dir), Buffer.from(await r.arrayBuffer())); console.log('fetched', file); }
  catch (e) { failed++; console.error('failed', file, String(e.message || e)); }
}
process.exit(failed ? 1 : 0);
