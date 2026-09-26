/* Army Cadets Digital Training Centre — service worker
   Bump CACHE_VERSION on every deploy or devices will keep serving the old page. */
const CACHE_VERSION = 'acf-dtc-v2';
const APP_SHELL = ['./', './index.html', './register.html', './exam.html', './feedback.html',
                   './manifest.json', './icon-192.png', './icon-512.png', './acf-logo.png'];

// Scenario audio is hosted on the SceneSounds GitHub Pages repo.
const SOUND_HOST = 'mp2ward.github.io';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(APP_SHELL)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Sounds: cache-first so a session keeps working on weak signal in the field.
  if (url.hostname === SOUND_HOST) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  // App shell: network-first, fall back to cache when offline.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  }
});
