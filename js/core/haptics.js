// Haptics. Android/Chromium: navigator.vibrate. iPhone Safari has NO Vibration API, so we use the iOS 17.4+ trick:
// a native <input type="checkbox" switch> makes the Taptic Engine tick when a finger *directly* taps it.
// Since iOS 26.5 programmatic label.click() no longer ticks, so every tappable control gets an invisible switch
// laid over it; the tap lands on the switch (haptic) and is forwarded to the real control.
let on = true;
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
export const isIOS = /iP(hone|od|ad)/.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let fallback = null;

export const setHaptics = (v) => { on = !!v; if (typeof document !== 'undefined') document.documentElement.classList.toggle('haptics-off', !on); };

function iosFallback() {
  // Works on iOS 17.4 to 26.4 for non-tap moments (results, errors). Ignored by newer iOS, which is fine.
  if (!fallback) {
    const id = 'hx-fallback';
    const input = Object.assign(document.createElement('input'), { type: 'checkbox', id, tabIndex: -1 }); input.setAttribute('switch', ''); input.setAttribute('aria-hidden', 'true');
    const label = Object.assign(document.createElement('label'), { htmlFor: id }); label.setAttribute('aria-hidden', 'true');
    label.style.cssText = input.style.cssText = 'position:fixed;left:-99px;top:-99px;opacity:0;pointer-events:none;width:1px;height:1px';
    document.body.append(input, label); fallback = label;
  }
  fallback.click();
}
export const tap = (ms = 6) => {
  if (!on) return;
  try { if (navigator.vibrate) navigator.vibrate(ms); else if (isIOS) iosFallback(); } catch { /* unsupported */ }
};
export const buzz = (p = [12, 40, 18]) => {
  if (!on) return;
  try { if (navigator.vibrate) navigator.vibrate(p); else if (isIOS) { iosFallback(); setTimeout(iosFallback, 90); } } catch { /* unsupported */ }
};

const HOSTS = 'button, a.tab, a.descent, a.rec, a.chapter-head, a.concept, a.icon-btn, a.brand';
const SKIP = '.rail, .sheet-grip, [data-nohx], .lens input';
/** iPhone only: overlay an invisible switch on every control so a real tap produces a Taptic tick. */
export function mountIosHaptics() {
  if (!isIOS || navigator.vibrate) return;
  let queued = false;
  const decorate = () => {
    queued = false;
    for (const host of document.querySelectorAll(HOSTS)) {
      if (host.querySelector(':scope > .hx') || host.closest(SKIP) || host.matches('.locked, [aria-disabled=true]')) continue;
      host.classList.add('hx-host');
      const sw = document.createElement('input'); sw.type = 'checkbox'; sw.className = 'hx'; sw.tabIndex = -1;
      sw.setAttribute('switch', ''); sw.setAttribute('aria-hidden', 'true');
      sw.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (!host.disabled) host.click(); });
      host.append(sw);
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(decorate); } };
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
  decorate();
}
