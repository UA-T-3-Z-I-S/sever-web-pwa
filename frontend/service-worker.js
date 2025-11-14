console.log("🔥 [SW] Service Worker cargado y ejecutándose");

// =======================================================
// 🔄 FORZAR ACTUALIZACIÓN INMEDIATA DEL SERVICE WORKER
// =======================================================
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));

// =======================================================
// FUNCION PARA ENVIAR LOGS AL BACKEND
// =======================================================
function swLog(msg, extra = {}) {
  try {
    fetch("/sw-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg,
        extra,
        ts: Date.now()
      })
    });
  } catch (err) {
    console.log("❌ [SW] Error en swLog:", err);
  }
}

// =======================================================
// CONFIG CACHE (🔥 IMPORTANTE: rutas con /frontend/)
// =======================================================
const CACHE_NAME = 'pwa-cache-v6';

const STATIC_ASSETS = [
  '/frontend/',
  '/frontend/index.html',
  '/frontend/dashboard.html',

  '/frontend/js/app.js',
  '/frontend/js/login.js',
  '/frontend/js/session.js',

  '/frontend/styles/main.css',
  '/frontend/styles/dashboard.css',

  '/frontend/icons/icon-192.png',
  '/frontend/icons/icon-512.png',
  '/frontend/icons/favicon.ico'
];

// =======================================================
// INSTALL
// =======================================================
self.addEventListener('install', (e) => {
  console.log("📦 [SW] Instalando Service Worker…");
  swLog("SW install");

  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("📁 [SW] Cacheando assets estáticos…");
        swLog("Cacheando assets", { CACHE_NAME, STATIC_ASSETS });
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// =======================================================
// ACTIVATE
// =======================================================
self.addEventListener('activate', (e) => {
  console.log("🚀 [SW] Activando Service Worker…");
  swLog("SW activate");

  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`🗑️ [SW] Borrando cache viejo: ${key}`);
            swLog("Borrando cache viejo", { oldKey: key });
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// =======================================================
// FETCH (🔥 AJUSTADO AL SCOPE /frontend/)
// =======================================================
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Prevenir bucle infinito
  if (url.pathname.endsWith("service-worker.js")) return;

  const isHTML =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/frontend/';

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then((res) =>
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, res.clone());
            return res;
          })
        )
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});

// =======================================================
// PUSH EVENT
// =======================================================
self.addEventListener("push", (event) => {
  console.log("📩 [SW] PUSH EVENT DISPARADO");
  swLog("Push recibido RAW", { text: event.data?.text() || null });

  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (err) {
    swLog("Error parseando push JSON", { error: err.toString() });
  }

  const title = data.title || "Nueva alerta";
  const body = data.body || "Tienes una nueva notificación";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/frontend/icons/icon-192.png",
      badge: "/frontend/icons/favicon.ico",
      vibrate: [200, 100, 200],
      actions: [{ action: "open", title: "Abrir 📲" }],
      data: {
        url: data.url || "/frontend/dashboard.html",
        extra: data.data || {}
      }
    })
  );
});

// =======================================================
// NOTIFICATION CLICK
// =======================================================
self.addEventListener("notificationclick", (event) => {
  console.log("👉 [SW] CLICK en la notificación:", event.notification);
  swLog("Click en notificación", event.notification.data);

  event.notification.close();
  const url = event.notification.data?.url || "/frontend/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            client.postMessage({
              tipo: "notificacion",
              data: event.notification.data?.extra
            });
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
