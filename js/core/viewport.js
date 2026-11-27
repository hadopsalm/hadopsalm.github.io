/** Tracks the visual viewport so fixed bars follow the on-screen keyboard instead of hiding under it. */
export function trackViewport() {
  const root = document.documentElement, vv = window.visualViewport;
  const apply = () => {
    root.style.setProperty('--vv-h', `${Math.round(vv ? vv.height : window.innerHeight)}px`);
    root.style.setProperty('--vv-top', `${Math.round(vv ? vv.offsetTop : 0)}px`);
    root.classList.toggle('kb', !!vv && window.innerHeight - vv.height > 120);
  };
  apply();
  vv?.addEventListener('resize', apply); vv?.addEventListener('scroll', apply); window.addEventListener('resize', apply);
}
