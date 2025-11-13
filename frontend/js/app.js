// frontend/js/app.js
import { saveSession, getSession, clearSession } from "./session.js";
import { registerPush } from "./pwa_register.js";

const API_BASE_URL = window.location.origin;

// ====================
// REDIRECCIÓN SEGÚN SESIÓN
// ====================
async function redirectIfLogged() {
  const session = await getSession();
  const path = window.location.pathname;

  // Login page: si hay sesión, ir a dashboard
  const isLoginPage = path === "/" || path.endsWith("index.html");
  if (session && isLoginPage) {
    window.location.href = "/dashboard";
    return;
  }

  // Dashboard page: si no hay sesión, volver a login
  const isDashboardPage = path === "/dashboard";
  if (!session && isDashboardPage) {
    window.location.href = "/";
    return;
  }
}

// ====================
// CONFIGURAR LOGIN
// ====================
function setupLogin() {
  const path = window.location.pathname;
  const isLoginPage = path === "/" || path.endsWith("index.html");
  if (!isLoginPage) return; // solo correr en login

  document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");
    const dniInput = document.getElementById("dni-input");
    const loginError = document.getElementById("login-error");

    if (!loginBtn || !dniInput || !loginError) {
      console.warn("Elementos de login no encontrados en DOM, abortando setupLogin");
      return;
    }

    loginBtn.addEventListener("click", async () => {
      const dni = dniInput.value.trim();
      if (!dni) {
        loginError.textContent = "Ingrese DNI";
        return;
      }

      loginBtn.disabled = true;
      loginBtn.textContent = "Validando...";

      try {
        const res = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dni })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error de login");

        // Guardar sesión local
        await saveSession(data.user);

        // Redirigir al dashboard
        window.location.href = "/dashboard";
      } catch (err) {
        loginError.textContent = err.message;
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Ingresar";
      }
    });
  });
}

// ====================
// SERVICE WORKER + REGISTRO PWA
// ====================
let pwaRegistered = false; // 🧩 bandera global para evitar múltiples registros

async function setupServiceWorker() {
  if ("serviceWorker" in navigator && !pwaRegistered) {
    pwaRegistered = true; // evita duplicar registro SW o llamadas a /subscribe

    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("✅ Service Worker registrado");

      // Si hay sesión activa, registrar PWA
      const session = await getSession();
      if (session) {
        console.log("🟢 Usuario activo, registrando PWA...");
        await registerPush(session._id, session.id, registration);
      }
    } catch (err) {
      console.warn("SW error:", err);
    }
  }
}

// ====================
// INICIALIZACIÓN
// ====================
redirectIfLogged();
setupLogin();
setupServiceWorker();

export { API_BASE_URL, saveSession, getSession, clearSession };
