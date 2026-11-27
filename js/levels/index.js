import drift from './drift.js';
import keepers from './keepers.js';
import brine from './brine.js';
import relay from './relay.js';
import { makeCtx, norm } from '../core/keys.js';

export const CHAPTERS = [
  { id: 'drift', n: 'I', name: 'Drift', zone: 'Sunlit to twilight', range: '0 – 200 m', blurb: 'Lateral riddles that hide in the address, the tab, your pocket and the wire. A hunt with no map.', tools: 'Lens · Source · Wire · Jar', levels: drift },
  { id: 'keepers', n: 'II', name: 'Keepers', zone: 'Twilight', range: '200 – 1000 m', blurb: 'A ladder of web vaults. Each keeper guards the key to the next. Read, request, forge.', tools: 'Source · Wire · Jar · Bench', levels: keepers },
  { id: 'brine', n: 'III', name: 'Brine', zone: 'Midnight', range: '1000 – 4000 m', blurb: 'Cross-site scripting in a sealed sandbox. Break out of quotes, make the page call alert().', tools: 'Source · Payload · Glyph rail', levels: brine },
  { id: 'relay', n: 'IV', name: 'Relay', zone: 'Abyss to hadal', range: '4000 – 11000 m', blurb: 'Missions from a fictional relay station: forms, scripts, ciphers, faint ink, injection and forged cookies.', tools: 'Everything', levels: relay },
];
export const LEVELS = CHAPTERS.flatMap((c) => c.levels.map((l, i) => ({ ...l, n: i + 1, chapterName: c.name })));
export const BY_ID = Object.fromEntries(LEVELS.map((l) => [l.id, l]));
export const chapterOf = (id) => CHAPTERS.find((c) => c.id === BY_ID[id]?.chapter);

export function nextOf(id) {
  const l = BY_ID[id]; if (!l) return null;
  const ch = chapterOf(id); return ch.levels[l.n] || null;
}
export const isUnlocked = (id, solved) => { const l = BY_ID[id]; return !!l && (l.n === 1 || !!solved[chapterOf(id).levels[l.n - 2].id]); };
export const firstOpen = (solved) => LEVELS.find((l) => !solved[l.id] && isUnlocked(l.id, solved)) || null;

export const RANKS = [{ name: 'Shallows', f: 0 }, { name: 'Twilight', f: 0.1 }, { name: 'Midnight', f: 0.3 }, { name: 'Abyss', f: 0.53 }, { name: 'Hadal', f: 0.8 }, { name: 'Trench', f: 1 }];
export function rankOf(solved) {
  const n = LEVELS.filter((l) => solved[l.id]).length, f = n / LEVELS.length;
  let i = 0; RANKS.forEach((r, k) => { if (f >= r.f) i = k; });
  const nxt = RANKS[i + 1], cur = RANKS[i];
  return { name: cur.name, index: i, next: nxt?.name || null, frac: nxt ? (f - cur.f) / (nxt.f - cur.f) : 1, solved: n, total: LEVELS.length,
    deepest: Math.max(0, ...LEVELS.filter((l) => solved[l.id]).map((l) => l.depth)) };
}

export const ctxFor = (seed, id) => makeCtx(seed, id);
export const answerOf = (level, ctx) => (level.answer ? level.answer(ctx) : ctx.key);
export const checkKey = (level, ctx, input) => norm(input) === norm(answerOf(level, ctx));
