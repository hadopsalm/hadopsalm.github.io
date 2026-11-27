// End to end: plays every level through the real UI in a phone sized Chromium.  npm run test:e2e   (needs Playwright)
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { serve } from './serve.mjs';
import { LEVELS, ctxFor, chapterOf } from '../js/levels/index.js';
import { b64e, b64d, hexe, rot13 } from '../js/core/ciphers.js';

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const SEED = 'e2eseed', PORT = 5197, SHOTS = process.env.SHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const srv = await serve(undefined, PORT);
const browser = await chromium.launch();
let fails = 0; const errors = [];
const ok = (c, m) => { if (!c) { fails++; console.error('  ✗', m); } };

async function play(level) {
  const ctx = ctxFor(SEED, level.id), ch = chapterOf(level.id);
  const solved = Object.fromEntries(ch.levels.slice(0, level.n - 1).map((l) => [l.id, { at: 1, hints: 0 }]));
  const bc = await browser.newContext({ ...devices['iPhone 13'] });
  await bc.addInitScript(({ seed, solved }) => { try { if (!localStorage.getItem('hadopsalm.save.v1')) localStorage.setItem('hadopsalm.save.v1', JSON.stringify({ v: 1, seed, created: 1, solved, hints: {}, notes: { _: '' }, pocket: [], seenIntro: true, seenTour: true, settings: { haptics: false, fontSize: 16 } })); } catch { /* sandboxed frame */ } }, { seed: SEED, solved });
  const p = await bc.newPage();
  p.on('pageerror', (e) => errors.push(`${level.id}: ${e.message}`));
  await p.goto(`http://localhost:${PORT}/#/play/${level.id}`);
  await p.waitForSelector('iframe.vframe');
  const fr = p.frameLocator('iframe.vframe');
  const body = () => fr.locator('body');
  const settle = () => p.waitForTimeout(350);
  await settle();
  const shot = (n) => SHOTS && p.screenshot({ path: `${SHOTS}/${level.id}${n ? '-' + n : ''}.png` });
  const sheet = (t) => p.locator('.sheet').filter({ hasText: t });
  const closeSheet = async () => { await p.locator('.sheet [aria-label=Close]').click(); };
  const tool = (name) => p.locator(`.tool[aria-label=${name}]`).click();
  const address = async (t) => { await p.fill('.addr', t); await p.press('.addr', 'Enter'); await settle(); };
  const bodyHas = async (s, m) => ok((await body().innerText()).includes(s), m);
  const key = ctx.key;

  switch (level.id) {
    case 'drift-1': await p.click('[aria-label=Lens]'); await p.click('.lens-tog:has-text("Lantern")'); await settle(); await shot('lantern');
      ok(await fr.locator('b').first().evaluate((e) => getComputedStyle(e).color) === 'rgb(240, 201, 135)', 'lantern lights hidden ink'); break;
    case 'drift-2': await address('/door/9'); await address('/door/12'); await bodyHas(key, 'door 12 shows key'); break;
    case 'drift-3': ok((await p.locator('.tab-title').innerText()).includes(key), 'tab line shows key'); break;
    case 'drift-5': await tool('Jar'); ok((await p.locator('.sheet input.v').first().inputValue()) === key, 'jar shows key'); await closeSheet(); break;
    case 'drift-6': for (let i = 0; i < 6; i++) { if (i === 0) await p.click('[aria-label=Lens]'); await p.click('[aria-label="Zoom in"]'); } await settle(); await shot('zoom'); break;
    case 'drift-7': await p.waitForTimeout(10600); await fr.locator('a.btn').click(); await settle(); await bodyHas(key, 'hatch opens after waiting'); break;
    case 'drift-8': await tool('Wire'); await p.locator('.wire-head').filter({ hasText: '→ /arrived' }).click(); ok((await p.locator('.wire-detail:visible').innerText()).includes(key), 'wire shows x-whisper'); await shot('wire'); await closeSheet(); break;
    case 'keepers-0': await tool('Source'); await p.fill('.search', 'key for'); ok((await p.locator('.src').innerText()).includes(key), 'source search finds key'); await shot('source'); await closeSheet(); break;
    case 'keepers-1': await tool('Source'); ok((await p.locator('.src').innerText()).includes(key), 'source ignores the lock'); await closeSheet(); break;
    case 'keepers-2': await address('/files/'); await address('/files/users.txt'); await bodyHas(key, 'users.txt shows key'); break;
    case 'keepers-3': await address('/robots.txt'); await address('/s3cr3t/users.txt'); await bodyHas(key, 'secret folder shows key'); break;
    case 'keepers-4': case 'keepers-8': {
      const ua = level.id === 'keepers-8'; await tool('Wire'); await p.click('text=Craft request'); await p.click(`.chip-btn:has-text("${ua ? 'User-Agent' : 'Referer'}")`);
      await p.locator('.kv .v').last().fill(ua ? 'HadalBot/1.0' : 'https://k5.keepers.hadopsalm.invalid/'); await p.click('.sticky-actions .btn'); await settle(); await bodyHas(key, 'crafted request unlocks'); break; }
    case 'keepers-5': await tool('Jar'); await p.locator('.sheet input.v').first().fill('1'); await p.locator('.sheet input.v').first().dispatchEvent('change'); await p.click('.sticky-actions .btn'); await settle(); await bodyHas(key, 'cookie edit unlocks'); break;
    case 'keepers-6': await address('/includes/secret.inc'); await address('/'); await fr.locator('input[name=secret]').fill(ctx.aux); await fr.locator('button').click(); await settle(); await bodyHas(key, 'secret form unlocks'); break;
    case 'keepers-7': {
      await address('/source'); const src = await body().innerText(); const enc = /"([0-9a-f]+)"/.exec(src)[1];
      await tool('Bench'); await p.fill('.bench-in', enc); await p.waitForTimeout(300);
      await p.locator('.res').filter({ hasText: 'Hex' }).first().locator('text=Use as input').click(); await p.waitForTimeout(250);
      await p.locator('.res').filter({ hasText: 'Reverse' }).first().locator('text=Use as input').click(); await p.waitForTimeout(250);
      const b = p.locator('.res').filter({ hasText: 'Base64' }).first(); ok((await b.innerText()).includes(ctx.aux), 'bench chain decodes secret'); await shot('bench'); await closeSheet();
      await address('/'); await fr.locator('input[name=secret]').fill(ctx.aux); await fr.locator('button').click(); await settle(); await bodyHas(key, 'decoded secret unlocks'); break; }
    case 'brine-1': case 'brine-2': case 'brine-3': case 'brine-5': case 'brine-6': case 'brine-4': {
      await p.fill('#offer', level.payload); await p.press('#offer', 'Enter'); await settle();
      if (level.id === 'brine-4') { await fr.locator('a.btn').click(); } break; }
    case 'relay-1': await tool('Wire'); await p.click('.sheet .switch'); await closeSheet(); await fr.locator('button').click(); await p.waitForSelector('.sheet .req');
      await p.locator('.req .kv .v').last().fill('me@example.invalid'); await p.click('.sticky-actions .btn'); await settle(); await bodyHas(key, 'held form edit sends mail to me'); break;
    case 'relay-2': await tool('Source'); await p.fill('.search', 'var _s'); await p.locator('.line').first().click(); await closeSheet(); await tool('Bench'); await p.locator('.chip-btn').first().click(); await p.waitForTimeout(300);
      ok((await p.locator('.res-text').allInnerTexts()).some((t) => t.includes(key)), 'pocket + bench decodes char codes'); await closeSheet(); break;
    case 'relay-3': await address('/'); await tool('Bench'); await p.fill('.bench-in', await fr.locator('pre').innerText()); await p.click('.sweep-head'); ok((await p.locator('.sweep-row.likely').first().innerText()).includes(key), 'caesar sweep finds key'); await closeSheet(); break;
    case 'relay-4': await p.click('[aria-label=Lens]'); for (const [i, v] of [[0, '5'], [1, '12']]) await p.locator('.lens-row input').nth(i).evaluate((e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v); await settle(); await shot('contrast'); break;
    case 'relay-5': await fr.locator('input[name=user]').fill("admin' -- "); await fr.locator('input[name=pass]').fill('x'); await fr.locator('button').click(); await settle(); await bodyHas(key, 'injection logs in as admin'); break;
    case 'relay-6': await tool('Source'); await p.fill('.search', 'C-103'); await p.locator('.line').first().click(); await closeSheet(); break;
    case 'relay-7': {
      await tool('Jar'); const cv = await p.locator('.sheet input.v').first().inputValue(); ok(b64d(cv).includes('guest'), 'pass cookie decodes to guest');
      await p.locator('.sheet input.v').first().fill(b64e(JSON.stringify({ user: 'deckhand', role: 'officer' }))); await p.locator('.sheet input.v').first().dispatchEvent('change'); await p.click('.sticky-actions .btn'); await settle(); await bodyHas(key, 'forged cookie unlocks'); break; }
  }
  await shot();
  if (level.chapter === 'brine') { await p.waitForSelector('.sheet:has-text("The brine burns")', { timeout: 4000 }).catch(() => ok(false, 'alert did not fire')); }
  else {
    await p.fill('#offer', 'wrong-key-here'); await p.press('#offer', 'Enter'); ok(!(await p.locator('.sheet:has-text("Key accepted")').count()), 'wrong key rejected');
    await p.fill('#offer', key.toUpperCase().replace(/-/g, ' ')); await p.press('#offer', 'Enter');
    await p.waitForSelector('.sheet:has-text("Key accepted")', { timeout: 3000 }).catch(() => ok(false, 'correct key not accepted'));
  }
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('hadopsalm.save.v1')).solved);
  ok(!!saved[level.id], 'progress saved');
  await bc.close();
}

const only = process.env.ONLY;
for (const l of LEVELS) { if (only && !l.id.includes(only)) continue; const f0 = fails; await play(l); console.log(fails === f0 ? '✓' : '✗', l.id, l.title); }
for (const e of errors) { console.error('page error:', e); fails++; }
await browser.close(); srv.close();
console.log(fails ? `${fails} failure(s)` : 'all levels solved through the UI');
process.exit(fails ? 1 : 0);
