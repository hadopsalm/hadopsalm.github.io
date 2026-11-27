// Proves every key level is solvable through the virtual network alone, for several different install seeds.
import { LEVELS, ctxFor, answerOf } from '../js/levels/index.js';
import { createNet } from '../js/net/vnet.js';
import { norm } from '../js/core/keys.js';

let fail = 0, n = 0;
const ids = new Set();
for (const seed of ['alpha', 'beta7', 'x9k2']) {
  for (const l of LEVELS) {
    if (seed === 'alpha') { if (ids.has(l.id)) { console.error('duplicate id', l.id); fail++; } ids.add(l.id); if (!l.hints || l.hints.length !== 3) { console.error('needs 3 hints', l.id); fail++; } if (!l.debrief) { console.error('needs debrief', l.id); fail++; } }
    if (l.chapter === 'brine') { if (seed === 'alpha' && !l.payload) { console.error('brine needs payload', l.id); fail++; } continue; }
    const ctx = ctxFor(seed, l.id), net = createNet(l, ctx);
    try {
      const got = await l.proof(net, ctx);
      n++;
      if (norm(got) !== norm(answerOf(l, ctx))) { console.error(`FAIL ${l.id} (${seed}): got ${got}`); fail++; }
    } catch (e) { console.error(`ERROR ${l.id} (${seed})`, e.message); fail++; }
  }
}
console.log(fail ? `${fail} problem(s)` : `ok: ${n} proofs across ${LEVELS.length} levels (brine levels are verified by the e2e test)`);
process.exit(fail ? 1 : 0);
