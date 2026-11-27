import { h } from '../core/h.js';
import { icon } from '../core/icons.js';

let current = null;
export function closeSheet() { current?.close(); }

/** Bottom sheet. size: 'half' | 'full'. Drag the grip down to dismiss, up (or tap it) to expand. */
export function openSheet({ eyebrow = '', title = '', body, size = 'half', onClose, actions } = {}) {
  closeSheet(); document.querySelector('.toast')?.remove();
  const prev = document.activeElement;
  const bodyEl = h('div.sheet-body', body);
  const sheet = h('div.sheet', { tabindex: '-1', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, 'data-size': size },
    h('div.sheet-grip', { 'aria-hidden': 'true' }),
    h('header', h('div', eyebrow && h('div.eyebrow', eyebrow), h('h2', title)), h('div.row', actions, h('button.icon-btn', { 'aria-label': 'Close', onClick: () => api.close() }, icon('x', 18)))),
    bodyEl);
  const wrap = h('div.sheet-wrap', { onClick: (e) => { if (e.target === wrap) api.close(); } }, sheet);
  let closed = false;
  const api = {
    el: sheet, body: bodyEl, wrap,
    setSize(s) { sheet.dataset.size = s; },
    close() { if (closed) return; closed = true; wrap.remove(); document.body.classList.remove('no-scroll'); document.removeEventListener('keydown', key); current = null; try { prev?.focus?.({ preventScroll: true }); } catch { /* gone */ } onClose?.(); },
  };
  const key = (e) => { if (e.key === 'Escape') api.close(); };
  document.addEventListener('keydown', key);
  // drag
  const grip = sheet.firstChild, head = sheet.querySelector('header');
  let y0 = null, dy = 0;
  const down = (e) => { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; sheet.style.transition = 'none'; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const move = (e) => { if (y0 == null) return; dy = e.clientY - y0; sheet.style.transform = `translateY(${Math.max(dy, -40)}px)`; };
  const up = () => {
    if (y0 == null) return; sheet.style.transition = ''; sheet.style.transform = ''; const d = dy; y0 = null;
    if (d > 90) api.close(); else if (d < -50) api.setSize('full'); else if (Math.abs(d) < 6) api.setSize(sheet.dataset.size === 'full' ? 'half' : 'full');
  };
  for (const el of [grip, head]) { el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); }
  document.body.append(wrap);
  document.body.classList.add('no-scroll');
  sheet.focus({ preventScroll: true });
  current = api;
  return api;
}

let toastTimer = 0;
export function toast(text, { action, onAction, ms = 2400 } = {}) {
  document.querySelector('.toast')?.remove(); clearTimeout(toastTimer);
  const el = h('div.toast', { role: 'status' }, h('span', text), action && h('button', { onClick: () => { onAction?.(); el.remove(); } }, action));
  document.body.append(el);
  toastTimer = setTimeout(() => el.remove(), ms);
}
