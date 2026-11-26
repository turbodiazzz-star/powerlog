import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');
const cacheVersion = `powerlog-shell-${Date.now().toString(36)}`;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'sw.js') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(dist)
  .map(f => './' + relative(dist, f).split('\\').join('/'))
  .filter(f => !f.endsWith('.map'));

const precache = ['./', ...files];
const unique = [...new Set(precache)];

const sw = `/* Auto-generated offline shell for Powerlog */
const CACHE = '${cacheVersion}';
const PRECACHE = ${JSON.stringify(unique, null, 2)};

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
`;

writeFileSync(join(dist, 'sw.js'), sw);
console.log(`[generate-sw] ${unique.length} files → dist/sw.js (${cacheVersion})`);
