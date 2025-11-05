// ====================
// CONFIG GLOBAL
// ====================
const API_BASE_URL = window.location.origin; // usa la misma URL donde se sirve el frontend

import { saveSession, getSession, clearSession } from "./session.js";

// ====================
// REDIRECCION SI YA HAY SESION
// ====================
async function redirectToDashboardIfLogged() {
  const session = await getSession();
  if (session && window.location.pathname.includes("index.html")) {
    window.location.href = "./dashboard.html";
  }
}

redirectToDashboardIfLogged();

// ====================
// PWA SERVICE WORKER
// ====================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js")
    .then(() => console.log("✅ Service Worker registrado"))
    .catch(err => console.warn("SW error:", err));
}

export { API_BASE_URL, saveSession, getSession, clearSession };
