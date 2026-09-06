self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Always fetch fresh from network. Never pass an undefined cache match to
  // respondWith: browsers treat that as a service-worker failure.
  event.respondWith(
    fetch(event.request)
      .catch(() => new Response('', { status: 503, statusText: 'Offline' }))
  );
});
