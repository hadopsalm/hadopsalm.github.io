// Hadopsalm service worker. build.mjs stamps VERSION and PRECACHE. Scope-relative, so it works under any base path.
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const CACHE = `hadopsalm-${VERSION}`;
const scope = self.registration.scope;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE.map((p) => new URL(p, scope).href))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('hadopsalm-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).catch(() => caches.match(new URL('./', scope).href)));
    return;
  }
  e.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(request, c)); } return r; })));
});
