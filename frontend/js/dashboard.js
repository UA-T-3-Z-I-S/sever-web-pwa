import { getSession, clearSession } from "./session.js";

const logoutBtn = document.getElementById("logout-btn");
const mainContent = document.getElementById("main-content");
const usernameEl = document.getElementById("username");

// Ocultar contenido inmediatamente
if (mainContent) mainContent.style.display = "none";

// Función para inicializar dashboard
async function initDashboard() {
  try {
    const session = await getSession();

    // Si no hay sesión válida, redirigir al login ("/")
    if (!session) {
      window.location.href = "/";
      return;
    }

    // Mostrar contenido del dashboard
    if (mainContent) mainContent.style.display = "block";

    // Mostrar nombre del usuario si existe el elemento
    if (usernameEl) {
      usernameEl.textContent = `${session.nombre} ${session.apellido}`;
    }

    console.log("Sesión cargada:", session);
  } catch (err) {
    console.error("Error cargando sesión:", err);
    // Redirige al login si algo falla
    window.location.href = "/";
  }
}

// Ejecutar la inicialización
initDashboard();

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await clearSession();
    window.location.href = "/";
  });
}
