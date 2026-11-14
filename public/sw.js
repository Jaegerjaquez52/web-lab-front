const CACHE_NAME = 'task-manager-shell-v1';
const APP_SHELL = ['/offline.html', '/manifest.webmanifest', '/favicon.svg', '/pwa-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shellUrl = new URL('./', self.registration.scope).href;
    const shellResponse = await fetch(shellUrl);
    if (!shellResponse.ok) throw new Error('Unable to precache the application shell');
    const html = await shellResponse.clone().text();
    const assetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map(([, assetUrl]) => new URL(assetUrl, shellUrl))
      .filter((assetUrl) => assetUrl.origin === self.location.origin && assetUrl.pathname.startsWith('/assets/'))
      .map((assetUrl) => assetUrl.href);
    const cache = await caches.open(CACHE_NAME);
    await cache.put(shellUrl, shellResponse);
    await cache.addAll([...APP_SHELL, ...assetUrls]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('task-manager-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const shellUrl = new URL('./', self.registration.scope).href;
        return await caches.match(request) || await caches.match(shellUrl) || await caches.match('/offline.html');
      })
    );
    return;
  }

  if (!url.pathname.startsWith('/assets/')) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
  );
});
