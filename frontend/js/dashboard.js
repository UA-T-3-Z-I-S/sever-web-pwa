import { getSession, clearSession } from "./session.js";

const logoutBtn = document.getElementById("logout-btn");
const mainContent = document.getElementById("main-content");
const usernameEl = document.getElementById("username");

// Ocultar contenido inicialmente
if (mainContent) mainContent.style.display = "none";

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

    // NOTA: NO cargamos notificaciones aquí.
    // notifications.js se encargará de dibujarlas
    // y de llamar a loadNotifications()

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

// ---- ESCUCHAR PUSH PARA ACTUALIZAR NOTIFICACIONES ----
if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data;

    if (data && data.type === "PUSH_RECEIVED") {
      console.log("📩 Dashboard recibió push:", data.payload);

      // Llamar a notifications.js para recargar la lista
      if (window.loadNotifications) {
        window.loadNotifications(); // 🔥 recargar tarjetas reales
      }
    }
  });
}
