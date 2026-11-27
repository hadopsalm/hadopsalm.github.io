// Renders brand SVGs to PNG icons with Playwright's Chromium.   npm run assets
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('..', import.meta.url).pathname;
const MARK = (inner = '') => `<g>${inner}<path d="M4 9.5h24M4 14.5h24M4 27.5h24" stroke="#7c8891" stroke-opacity=".35" stroke-width=".8"/><path d="M16 2.5v14.6" stroke="#7c8891" stroke-width="1"/><circle cx="16" cy="20.5" r="4.4" fill="#e6e3da"/><circle cx="24.4" cy="12" r="1.2" fill="#c9cfd2"/><circle cx="7.6" cy="23.4" r=".9" fill="#7c8891"/></g>`;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x=".5" y=".5" width="31" height="31" rx="8" fill="#0d1013" stroke="#e6e3da" stroke-opacity=".22"/>${MARK()}</svg>`;
const icon = (scale, bg = '#08090b') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bg}"/><g transform="translate(${256 - 16 * scale} ${256 - 16 * scale}) scale(${scale})">${MARK()}</g></svg>`;
const banner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 640"><defs><radialGradient id="g" cx="50%" cy="78%" r="60%"><stop offset="0" stop-color="#1a2127"/><stop offset="1" stop-color="#08090b"/></radialGradient></defs><rect width="1280" height="640" fill="url(#g)"/>
<g stroke="#7c8891" stroke-opacity=".18">${[150, 270, 390, 510].map((y) => `<path d="M0 ${y}H1280"/>`).join('')}</g>
<g font-family="ui-monospace,Menlo,monospace" font-size="13" letter-spacing="3" fill="#818c92"><text x="64" y="144">EPIPELAGIC · DRIFT</text><text x="64" y="264">TWILIGHT · KEEPERS</text><text x="64" y="384">MIDNIGHT · BRINE</text><text x="64" y="504">HADAL · RELAY</text></g>
<path d="M640 0V330" stroke="#c9cfd2" stroke-width="1.5"/><circle cx="640" cy="372" r="34" fill="#e6e3da"/><circle cx="640" cy="372" r="62" fill="none" stroke="#e6e3da" stroke-opacity=".12"/><circle cx="640" cy="372" r="98" fill="none" stroke="#e6e3da" stroke-opacity=".06"/>
<text x="640" y="500" text-anchor="middle" font-family="Georgia,'Cormorant Garamond',serif" font-style="italic" font-size="84" fill="#e6e3da">Hadopsalm</text>
<text x="640" y="548" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="15" letter-spacing="6" fill="#818c92">HYMNS FROM THE HADAL DARK</text></svg>`;
mkdirSync(`${root}docs/assets`, { recursive: true });
writeFileSync(`${root}favicon.svg`, favicon); writeFileSync(`${root}docs/assets/banner.svg`, banner);
const b = await chromium.launch();
async function png(svg, size, out, w = size, h = size) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${w}" height="${h}" `)}</body>`);
  await p.screenshot({ path: root + out, omitBackground: false }); await p.close();
}
await png(favicon, 32, 'favicon-32.png');
await png(icon(11.2), 180, 'apple-touch-icon.png');
await png(icon(11.2), 192, 'icon-192.png');
await png(icon(11.2), 512, 'icon-512.png');
await png(icon(8), 512, 'icon-maskable-512.png'); // smaller mark: stays inside the maskable safe zone
await png(banner, 0, 'docs/assets/banner.png', 1280, 640);
await png(banner, 0, 'og.png', 1280, 640);
await b.close(); console.log('assets written');
