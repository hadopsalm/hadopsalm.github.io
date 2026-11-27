// Pure text transforms for the Bench. Each returns a string or throws when the input is not valid for it.
const te = new TextEncoder();
const td = new TextDecoder('utf-8', { fatal: true });
const bytesToBin = (b) => { let s = ''; for (const x of b) s += String.fromCharCode(x); return s; };
const MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
const UNMORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
const shift = (s, n) => s.replace(/[a-z]/gi, (c) => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0) - b + n + 26) % 26) + b); });
const bad = () => { throw new Error('invalid'); };

export const b64e = (s) => btoa(bytesToBin(te.encode(s)));
export const b64d = (s) => {
  s = s.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
  if (!s || !/^[A-Za-z0-9+/]+={0,2}$/.test(s)) bad();
  return td.decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
};
export const hexe = (s) => [...te.encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
export const hexd = (s) => {
  s = s.replace(/0x|[\s,:]/gi, ''); if (!s || s.length % 2 || /[^0-9a-f]/i.test(s)) bad();
  return td.decode(Uint8Array.from(s.match(/../g), (x) => parseInt(x, 16)));
};
export const bine = (s) => [...te.encode(s)].map((b) => b.toString(2).padStart(8, '0')).join(' ');
export const bind = (s) => {
  s = s.replace(/\s+/g, ''); if (!s || s.length % 8 || /[^01]/.test(s)) bad();
  return td.decode(Uint8Array.from(s.match(/.{8}/g), (x) => parseInt(x, 2)));
};
export const urle = (s) => encodeURIComponent(s);
export const urld = (s) => { if (!/%[0-9a-f]{2}|\+/i.test(s)) bad(); return decodeURIComponent(s.replace(/\+/g, ' ')); };
export const rot13 = (s) => shift(s, 13);
export const rot47 = (s) => s.replace(/[!-~]/g, (c) => String.fromCharCode(33 + ((c.charCodeAt(0) - 33 + 47) % 94)));
export const atbash = (s) => s.replace(/[a-z]/gi, (c) => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode(b + 25 - (c.charCodeAt(0) - b)); });
export const rev = (s) => [...s].reverse().join('');
export const morsed = (s) => {
  if (/[^.\-/\s]/.test(s) || !/[.-]/.test(s)) bad();
  return s.trim().split(/\s*\/\s*|\s{3,}/).map((w) => w.split(/\s+/).map((t) => UNMORSE[t] ?? bad()).join('')).join(' ');
};
export const morsee = (s) => s.toLowerCase().split(/\s+/).map((w) => [...w].map((c) => MORSE[c] ?? bad()).join(' ')).join(' / ');
export const codesd = (s) => {
  // Tolerant: pulls the longest run of numbers out of surrounding code, e.g. "var _s=[101,109,98];".
  const runs = s.match(/\d+(?:\s*[,;\s]\s*\d+)+/g); if (!runs) bad();
  const run = runs.sort((x, y) => y.length - x.length)[0].match(/\d+/g);
  return run.map((x) => { const v = +x; if (v < 1 || v > 0x10ffff) bad(); return String.fromCodePoint(v); }).join('');
};
export const codese = (s) => [...s].map((c) => c.codePointAt(0)).join(' ');
export const caesar = (s, n) => shift(s, n);

export const DECODERS = [
  { id: 'b64', label: 'Base64', run: b64d }, { id: 'hex', label: 'Hex', run: hexd }, { id: 'bin', label: 'Binary', run: bind },
  { id: 'url', label: 'URL escape', run: urld }, { id: 'rot13', label: 'ROT13', run: rot13 }, { id: 'rot47', label: 'ROT47', run: rot47 },
  { id: 'atbash', label: 'Atbash', run: atbash }, { id: 'rev', label: 'Reverse', run: rev }, { id: 'morse', label: 'Morse', run: morsed },
  { id: 'codes', label: 'Char codes', run: codesd },
];
export const ENCODERS = [
  { id: 'b64', label: 'Base64', run: b64e }, { id: 'hex', label: 'Hex', run: hexe }, { id: 'bin', label: 'Binary', run: bine },
  { id: 'url', label: 'URL escape', run: urle }, { id: 'rot13', label: 'ROT13', run: rot13 }, { id: 'rot47', label: 'ROT47', run: rot47 },
  { id: 'atbash', label: 'Atbash', run: atbash }, { id: 'rev', label: 'Reverse', run: rev }, { id: 'morse', label: 'Morse', run: morsee },
  { id: 'codes', label: 'Char codes', run: codese },
];

const EN = { a: 8.2, b: 1.5, c: 2.8, d: 4.3, e: 12.7, f: 2.2, g: 2, h: 6.1, i: 7, j: 0.15, k: 0.77, l: 4, m: 2.4, n: 6.7, o: 7.5, p: 1.9, q: 0.1, r: 6, s: 6.3, t: 9.1, u: 2.8, v: 0.98, w: 2.4, x: 0.15, y: 2, z: 0.07 };
const WORDS_EN = /\b(the|key|is|of|and|to|you|your|code|here|this|that|with|for|seal|crate|relay|hatch|nets|rope|user|role|guest|officer|welcome)\b/i;
/** Chi-squared distance between the letters of t and English. Lower is more English. */
function chi(t) {
  const L = t.toLowerCase().replace(/[^a-z]/g, ''); if (L.length < 4) return Infinity;
  const c = {}; for (const ch of L) c[ch] = (c[ch] || 0) + 1;
  let x = 0; for (const k in EN) { const e = Math.max(0.4, (L.length * EN[k]) / 100); x += ((c[k] || 0) - e) ** 2 / e; }
  return x / L.length * 10;
}
export const LIKELY = 0.25;
/** 0..1: how much a string looks like readable English. Used to float likely results to the top. */
export function readable(t) {
  if (!t) return 0;
  const chars = [...t];
  if (chars.filter((c) => /[\x20-\x7e\n]/.test(c)).length / chars.length < 0.95) return 0;
  const x = chi(t); if (x === Infinity) return WORDS_EN.test(t) ? 0.5 : 0.1;
  let s = Math.max(0, 1 - x / 12) * 0.7;
  if (WORDS_EN.test(t)) s += 0.3;
  return Math.min(1, s);
}
export function runAll(input, mode = 'decode') {
  const out = [];
  for (const d of mode === 'decode' ? DECODERS : ENCODERS) {
    try { const r = d.run(input); if (r !== '' && r !== input) out.push({ id: d.id, label: d.label, text: r, score: readable(r) }); } catch { /* not valid for this transform */ }
  }
  return out.sort((a, b) => b.score - a.score);
}
export const caesarSweep = (input) => Array.from({ length: 25 }, (_, i) => { const text = caesar(input, i + 1); return { n: i + 1, text, score: readable(text) }; });
