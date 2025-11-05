const CACHE_NAME = 'pwa-cache-v1'; // Cambia el número si actualizas el PWA

// Assets estáticos que sí se pueden cachear (incluyendo HTML)
const STATIC_ASSETS = [
  '/',                   // raíz (index.html)
  '/index.html',
  '/dashboard.html',
  '/js/app.js',
  '/js/login.js',
  '/js/session.js',
  '/styles/main.css',
  '/styles/dashboard.css',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Instalación: cacheamos assets estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches antiguos si existieran
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first para HTML, cache-first para el resto
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML: network-first
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, res.clone());
            return res;
          });
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Otros assets: cache-first
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
