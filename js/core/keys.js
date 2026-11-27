import { hash32, mulberry32 } from './rng.js';

const WORDS = ('ember lantern silt brine kelp hadal tide coral anchor pearl siren murk fathom trench ink glass salt vesper cinder drift wreck shoal ballast rune echo moth thorn hollow vigil marrow copper quill gloam ridge plume ash nacre velvet lumen orbit psalm cairn bell reef dusk fennel sable mist onyx relic harbor slate ivory thistle wick halo bramble lichen cobalt spire tallow umber whorl zephyr').split(' ');

/** A per-install, per-level three word key. Walkthroughs cannot share answers because every install differs. */
export function keyFor(seed, id, salt = '') {
  const r = mulberry32(hash32(`${seed}|${id}|${salt}`));
  const pool = WORDS.slice(), out = [];
  for (let i = 0; i < 3; i++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out.join('-');
}
export const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const makeCtx = (seed, id) => ({ seed, id, key: keyFor(seed, id), aux: keyFor(seed, id, 'aux') });
