const CACHE_NAME = 'pathfinder-1.3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './app-catalog.js',
  './data-foundation.js',
  './history-snapshots.js',
  './navigation.js',
  './today-flow.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('pathfinder-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isSameOriginRequest(request) {
  try { return new URL(request.url).origin === self.location.origin; }
  catch { return false; }
}

async function networkFirst(request, fallbackUrl = './index.html') {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cachedExact = await caches.match(request);
    if (cachedExact) return cachedExact;
    const cachedIgnore = await caches.match(request, { ignoreSearch: true });
    if (cachedIgnore) return cachedIgnore;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }
    throw new Error('Pathfinder offline cache miss');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok && isSameOriginRequest(request)) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate';
  const isAppFile = isSameOriginRequest(event.request) && ASSETS.some(asset => {
    const assetUrl = new URL(asset, self.registration.scope);
    return assetUrl.pathname === requestUrl.pathname;
  });

  if (isNavigation || isAppFile) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
