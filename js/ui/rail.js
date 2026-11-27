import { h } from '../core/h.js';
import { tap } from '../core/haptics.js';

const GLYPHS = ['<', '>', '/', '"', "'", '=', '(', ')', ';', ':', '{', '}', '[', ']', '#', '?', '&', '%', '-', '_', '.', ',', '\\', '|', '`', '*', '+', '@', '!', '$', '~', '^'];
const TEXTY = /^(text|search|url|email|tel|password|)$/;

/** A strip of punctuation that floats just above the on-screen keyboard. Phone keyboards bury these characters. */
export function mountRail() {
  let target = null;
  const rail = h('div.rail', { hidden: true, role: 'toolbar', 'aria-label': 'Symbols' },
    h('div.rail-scroll', GLYPHS.map((g) => h('button', { type: 'button', 'aria-label': `insert ${g}`, onPointerdown: (e) => { e.preventDefault(); }, onClick: () => insert(g) }, g))));
  function insert(g) {
    if (!target) return; tap(4);
    const s = target.selectionStart ?? target.value.length, e = target.selectionEnd ?? s;
    target.setRangeText(g, s, e, 'end'); target.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const isText = (el) => el && ((el.tagName === 'INPUT' && TEXTY.test(el.type) && !el.readOnly) || (el.tagName === 'TEXTAREA' && !el.readOnly));
  const show = (e) => { const el = e.target; if (isText(el) && !el.closest('.no-rail')) { target = el; rail.hidden = false; } };
  const hide = () => setTimeout(() => { if (!isText(document.activeElement)) { rail.hidden = true; target = null; } }, 60);
  document.addEventListener('focusin', show); document.addEventListener('focusout', hide);
  document.body.append(rail);
  return () => { document.removeEventListener('focusin', show); document.removeEventListener('focusout', hide); rail.remove(); };
}
