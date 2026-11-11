const SHELL = 'vai-shell-v2';
const MAPS = 'vai-maps-v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(['/', '/manifest.webmanifest', '/infosp-192.png', '/infosp-512.png'])));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('vai-') && key !== SHELL && key !== MAPS).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.includes('auth')) return;
  if (url.pathname === '/rede-oficial.png' || url.pathname === '/rede-oficial.pdf') {
    event.respondWith(caches.open(MAPS).then(async cache => (await cache.match(event.request)) || fetch(event.request)));
    return;
  }
  if (event.request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(fetch(event.request).then(async response => {
      if (response.ok && !response.redirected) { const cache = await caches.open(SHELL); await cache.put('/', response.clone()); }
      return response;
    }).catch(async () => (await caches.match('/')) || new Response('Abra o infosp com internet uma vez para preparar o acesso offline.', {status: 503})));
    return;
  }
  if (/\.(?:js|css|png|woff2)$/.test(url.pathname)) {
    event.respondWith(caches.open(SHELL).then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok && !response.redirected) await cache.put(event.request, response.clone());
      return response;
    }));
  }
});
