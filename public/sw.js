// Minimal service worker whose only job is defeating stale caches.
//
// GitHub Pages serves the page with max-age=600, and an iOS home-screen app
// will happily sit on that copy for far longer. Since the page references
// content-hashed asset files, one stale page means an entirely stale app.
//
// Every navigation therefore goes to the network with the HTTP cache bypassed.
// There is deliberately no offline caching: the app needs the network for its
// data anyway, so pretending otherwise would only add ways to serve stale code.

self.addEventListener('install', () => {
  // Take over immediately rather than waiting for every tab to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop anything cached by an earlier version of this worker.
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request, { cache: 'reload' }).catch(() => fetch(event.request))
  );
});
