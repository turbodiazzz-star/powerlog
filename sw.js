/* Auto-generated offline shell for Powerlog */
const CACHE = 'powerlog-shell-mwxeas62';
const PRECACHE = [
  "./",
  "./.nojekyll",
  "./apple-touch-icon.png",
  "./assets/index-BEsv8Ev0.css",
  "./assets/index-C49rMLjV.js",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icons.svg",
  "./index.html",
  "./manifest.json"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isCloudRequest(url) {
  return (
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('githubusercontent.com') ||
    url.pathname.includes('/api/')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (isCloudRequest(url)) return;

  // App navigation: network first, offline → cached shell
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(async () => {
          return (
            (await caches.match('./index.html')) ||
            (await caches.match(PRECACHE.find((p) => p.endsWith('index.html')) || './index.html')) ||
            new Response('Офлайн. Откройте приложение ещё раз после сети.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          );
        })
    );
    return;
  }

  // Static assets: cache first, then network and store
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            void caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
