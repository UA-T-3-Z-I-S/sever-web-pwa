import { getSession } from "./app.js";
import { sendForm } from "./form/save.js";

const notificationsContainer = document.getElementById("notifications-container");
const pendingForms = {};

function createNotificationCard(notification, userSession) {
  const card = document.createElement("div");
  card.className = "notification-card";
  card.dataset.id = notification._id || notification.id;

  const ts = new Date(notification.timestamp);
  const hora = ts.getHours();
  const minutos = ts.getMinutes();

  card.innerHTML = `
    <h3>¡Alerta de Caída!</h3>
    <p>Ubicación: ${notification.camara || "Desconocida"}</p>
    <p>Hora: ${hora.toString().padStart(2,'0')}:${minutos.toString().padStart(2,'0')}</p>
    <div class="buttons received-buttons">
      <button class="received-btn">Recibida</button>
    </div>
    <div class="buttons confirm-buttons" style="display:none;">
      <button class="yes-btn">Sí</button>
      <button class="no-btn">No</button>
      <button class="cancel-btn">Cancelar</button>
    </div>
    <div class="pending-msg" style="display:none; color:orange;">
      Formulario pendiente 
      <button class="continue-btn" style="margin-left:10px;">Continuar</button>
    </div>
  `;

  const receivedBtn = card.querySelector(".received-btn");
  const receivedButtons = card.querySelector(".received-buttons");
  const confirmButtons = card.querySelector(".confirm-buttons");
  const cancelBtn = card.querySelector(".cancel-btn");
  const pendingMsg = card.querySelector(".pending-msg");
  const continueBtn = card.querySelector(".continue-btn");
  const title = card.querySelector("h3");

  receivedBtn.addEventListener("click", () => {
    receivedButtons.style.display = "none";
    confirmButtons.style.display = "flex";
    title.textContent = "Confirmar: ¿Es una caída?";
  });

  card.querySelector(".yes-btn").addEventListener("click", async () => {
    confirmButtons.style.display = "none";
    pendingForms[notification._id || notification.id] = true;
    pendingMsg.style.display = "block";
    title.textContent = "Es una caída ✔️";

    import("./form/form.js").then(module =>
      module.openForm(notification, userSession, () => {
        pendingMsg.style.display = "block";
        pendingMsg.textContent = "Formulario enviado ✔️";
        continueBtn.style.display = "none";
        delete pendingForms[notification._id || notification.id];
      })
    );
  });

  card.querySelector(".no-btn").addEventListener("click", async () => {
    confirmButtons.style.display = "none";
    title.textContent = "No es caída ❌";

    const session = await getSession();
    if (!session?._id) return console.error("No hay usuario en sesión");

    const payload = {
      notificationId: notification._id || notification.id,
      userId: session._id,
      caida: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const res = await sendForm(payload);
      if (!res.ok) console.error("Error enviando No:", res.error);

      pendingMsg.style.display = "block";
      pendingMsg.textContent = "Formulario enviado ✔️";
      continueBtn.style.display = "none";
      delete pendingForms[notification._id || notification.id];

    } catch (err) {
      console.error("Error enviando No:", err);
    }
  });

  cancelBtn.addEventListener("click", () => {
    confirmButtons.style.display = "none";
    receivedButtons.style.display = "flex";
    title.textContent = "¡Alerta de Caída!";
  });

  continueBtn.addEventListener("click", () => {
    if (pendingForms[notification._id || notification.id]) {
      import("./form/form.js").then(module => 
        module.openForm(notification, userSession, () => {
          pendingMsg.style.display = "block";
          pendingMsg.textContent = "Formulario enviado ✔️";
          continueBtn.style.display = "none";
          delete pendingForms[notification._id || notification.id];
        })
      );
    }
  });

  return card;
}

async function loadNotifications() {
  const session = await getSession();
  const response = await fetch(`/nots?_ts=${Date.now()}`);
  const data = await response.json();

  if (!data.ok) return console.error("Error cargando notificaciones");

  const filteredNotifications = data.notifications.filter(n => {
    return session.test ? n.estado === 0 : n.estado === 1;
  });

  notificationsContainer.innerHTML = "";
  filteredNotifications.forEach(n => {
    const card = createNotificationCard(n, session);
    notificationsContainer.appendChild(card);
  });
}

loadNotifications();
