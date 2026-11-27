const P = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  strata: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5',
  record: 'M4 19V9M10 19V5M16 19v-8M22 19H2',
  bench: 'M9 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4A1.5 1.5 0 0 0 20 19l-5-10V3M8 3h8M7 15h10',
  back: 'm15 5-7 7 7 7', chevron: 'm9 5 7 7-7 7', down: 'm6 9 6 6 6-6', up: 'm6 15 6-6 6 6',
  reload: 'M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5',
  source: 'm8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14',
  wire: 'M3 12h4l2-6 4 12 2-6h6',
  jar: 'M7 4h10v3H7zM6 7h12v13H6zM10 12h.01M14 15h.01M11 17h.01',
  notes: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  lens: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  send: 'M12 19V5M6 11l6-6 6 6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z',
  check: 'm5 12.5 4.5 4.5L19 7.5', x: 'M6 6l12 12M18 6 6 18',
  copy: 'M8 8h11v12H8zM5 16V4h11',
  plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  pause: 'M8 5v14M16 5v14',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  pin: 'M7 4h10v16l-5-4-5 4z',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2 0-3-1-5 1-8z',
  swap: 'M4 8h13l-3-3M20 16H7l3 3',
};
export const ico = (name, size = 20, stroke = 1.6) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="flex:none"><path d="${P[name] || P.sparkle}"/></svg>`;
export function icon(name, size, stroke) {
  const t = document.createElement('template'); t.innerHTML = ico(name, size, stroke); return t.content.firstChild;
}
/** The Hadopsalm mark: a cord descending through three strata to one lit cell. */
export const logoSvg = (size = 28) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" style="display:block;flex:none"><rect x=".5" y=".5" width="31" height="31" rx="8" fill="#0d1013" stroke="#e6e3da" stroke-opacity=".22"/><path d="M4 9.5h24M4 14.5h24M4 27.5h24" stroke="#7c8891" stroke-opacity=".35" stroke-width=".8"/><path d="M16 2.5v14.6" stroke="#7c8891" stroke-width="1"/><circle cx="16" cy="20.5" r="4.4" fill="#e6e3da"/><circle cx="24.4" cy="12" r="1.2" fill="#c9cfd2"/><circle cx="7.6" cy="23.4" r=".9" fill="#7c8891"/></svg>`;
export const logo = (size) => { const t = document.createElement('template'); t.innerHTML = logoSvg(size); return t.content.firstChild; };
