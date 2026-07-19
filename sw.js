const CACHE_NAME = 'plan-calendar-v10';
const APP_SHELL = [
  './',
  './index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('plan-calendar-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isInstallAsset = url.origin === self.location.origin
    && /\/(?:manifest\.webmanifest|icon(?:-maskable)?(?:-\d+)?\.(?:png|svg))$/.test(url.pathname);

  if (isInstallAsset) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const copy = response.clone();
          return caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, copy))
            .catch(() => undefined)
            .then(() => response);
        })
        .catch(() => caches.match(event.request).then(cached => cached || Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => (
      cached || fetch(event.request).catch(() => (
        event.request.mode === 'navigate'
          ? caches.match('./index.html')
          : Response.error()
      ))
    ))
  );
});
