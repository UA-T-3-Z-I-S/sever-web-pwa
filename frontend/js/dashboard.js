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
    const res = await fetch("/nots?_ts=" + Date.now());
    if (!res.ok) throw new Error("Error obteniendo notificaciones");

    const data = await res.json();
    renderNotifications(data.notifications || []);
  } catch (err) {
    console.error("❌ Error cargando notificaciones:", err);
  }
}

// ---- RENDER COMPATIBLE CON /nots ----
function renderNotifications(list) {
  if (!notificationsContainer) return;

  notificationsContainer.innerHTML = "";

  list.forEach(n => {
    const div = document.createElement("div");
    div.className = "notification-card";

    const fecha = n.timestamp ? new Date(n.timestamp) : null;

    div.innerHTML = `
      <h3>¡Alerta de Caída!</h3>
      <p>Ubicación: ${n.camara || "Desconocida"}</p>
      <p>Estado: ${n.estado}</p>
      <small>${fecha ? fecha.toLocaleString() : "---"}</small>
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

// ---- ESCUCHAR PUSH PARA ACTUALIZAR DASHBOARD ----
if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data;

    if (data && data.type === "PUSH_RECEIVED") {
      console.log("📩 Dashboard recibió push:", data.payload);
      fetchNotifications();
    }
  });
}
