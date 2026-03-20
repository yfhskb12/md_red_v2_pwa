const CACHE_NAME = 'markdown-redactor-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './pwa-192x192.png',
  './pwa-512x512.png'
];

const RUNTIME_HOSTS = new Set([
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'esm.sh'
]);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map((name) => name === CACHE_NAME ? Promise.resolve() : caches.delete(name)));
    await self.clients.claim();
  })());
});

const putInCache = async (request, response) => {
  if (!response) return response;
  const cache = await caches.open(CACHE_NAME);
  if (response.status === 200 || response.type === 'opaque') {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => putInCache(request, response))
    .catch(() => undefined);
  return cached || networkPromise || Response.error();
};

const networkFirstHtml = async (request) => {
  try {
    const response = await fetch(request);
    await putInCache(request, response.clone());
    return response;
  } catch {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(request)) || (await cache.match('./index.html')) || Response.error();
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!/^https?:$/.test(url.protocol)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstHtml(request));
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const runtimeAllowed = RUNTIME_HOSTS.has(url.hostname);

  if (sameOrigin || runtimeAllowed) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
