import { getSession, clearSession } from "./session.js";

const logoutBtn = document.getElementById("logout-btn");
const mainContent = document.getElementById("main-content");
const notificationsContainer = document.getElementById("notifications-container");
const usernameEl = document.getElementById("username");

// Ocultar contenido inicialmente
if (mainContent) mainContent.style.display = "none";

// ---- FUNCIÓN PARA OBTENER NOTIFICACIONES DEL SERVIDOR ----
async function fetchNotifications() {
  try {
    const res = await fetch("/pwa/notifications/latest");
    if (!res.ok) throw new Error("Error obteniendo notificaciones");

    const data = await res.json();
    renderNotifications(data);
  } catch (err) {
    console.error("❌ Error cargando notificaciones:", err);
  }
}

// ---- RENDER ----
function renderNotifications(list) {
  if (!notificationsContainer) return;

  notificationsContainer.innerHTML = "";

  list.forEach(n => {
    const div = document.createElement("div");
    div.className = "notification-card";

    div.innerHTML = `
      <h3>${n.titulo || "Sin título"}</h3>
      <p>${n.mensaje || ""}</p>
      <small>${new Date(n.fecha).toLocaleString()}</small>
    `;

    notificationsContainer.appendChild(div);
  });
}

// ---- DASHBOARD INIT ----
async function initDashboard() {
  try {
    const session = await getSession();

    if (!session) {
      window.location.href = "/";
      return;
    }

    if (mainContent) mainContent.style.display = "block";

    if (usernameEl) {
      usernameEl.textContent = `${session.nombre} ${session.apellido}`;
    }

    // cargar notificaciones al inicio
    await fetchNotifications();

  } catch (err) {
    console.error("Error cargando sesión:", err);
    window.location.href = "/";
  }
}

initDashboard();

// ---- LOGOUT ----
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await clearSession();
    window.location.href = "/";
  });
}

// ---------------------------------------------------------
// 🔥 ESCUCHAR MENSAJES DEL SERVICE WORKER
// Cuando llega un push → el SW manda un mensaje → actualizamos dashboard
// ---------------------------------------------------------
if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data;

    if (data && data.type === "PUSH_RECEIVED") {
      console.log("📩 Dashboard recibió push:", data.payload);

      // Refrescar notificaciones cuando llega un push
      fetchNotifications();
    }
  });
}
