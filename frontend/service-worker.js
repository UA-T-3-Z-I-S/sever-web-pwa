const CACHE_NAME = 'pwa-cache-v1';
const STATIC_ASSETS = [
  '/',
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

// Instalación
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML: network-first
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then(res => caches.open(CACHE_NAME).then(cache => { cache.put(e.request, res.clone()); return res; }))
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Otros assets: cache-first
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

// 👇 Push notifications
self.addEventListener('push', event => {
  const data = event.data?.json();
  if (!data) return;

  const title = data.title || 'Notificación';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    data: data.data || {}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Opcional: click en la notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
