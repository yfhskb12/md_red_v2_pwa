
const CACHE_NAME = 'markdown-redactor-v1';

// Use relative paths to ensure it works on GitHub Pages subpaths.
// The service worker scope will automatically be the directory it is served from.
const urlsToCache = [
  './',
  './index.html',
  // App shell assets will be cached on the first fetch via the dynamic cache logic below.
];

// Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Serve cached content and implement stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  // For external resources (like from esm.sh), use a cache-first then network strategy.
  if (event.request.url.startsWith('https://esm.sh')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // For app-owned resources, use a stale-while-revalidate strategy.
  // We strictly check request.scheme to avoid caching unsupported schemes (like chrome-extension://)
  if (event.request.url.startsWith('http')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // If we have a cached response, return it immediately
        if (response) {
          // And then go to the network to update the cache for next time
          fetch(event.request).then((networkResponse) => {
            if(networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => { /* mute network errors in offline mode */ });
          return response;
        }
        // If it's not in the cache, fetch from the network
        return fetch(event.request).then(networkResponse => {
          // And cache the new response
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});
