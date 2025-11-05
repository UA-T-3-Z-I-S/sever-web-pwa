const notificationsContainer = document.getElementById("notifications-container");

// Datos de prueba
const notifications = [
  { id: 1, hora: 14, minutos: 23, segundos: 15, milliseconds: 500 },
  { id: 2, hora: 16, minutos: 10, segundos: 0, milliseconds: 0 },
  { id: 3, hora: 9,  minutos: 5,  segundos: 30, milliseconds: 250 },
];

// Estado de formularios pendientes
const pendingForms = {};

function createNotificationCard(notification) {
  const card = document.createElement("div");
  card.className = "notification-card";
  card.dataset.id = notification.id;

  card.innerHTML = `
    <h3>¡Alerta de Caída!</h3>
    <p>Hora: ${notification.hora.toString().padStart(2,'0')}:${notification.minutos.toString().padStart(2,'0')}</p>
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

  // Evento Recibida
  receivedBtn.addEventListener("click", () => {
    receivedButtons.style.display = "none";
    confirmButtons.style.display = "flex";
    title.textContent = "Confirmar: ¿Es una caída?";
  });

  // Evento Sí
  card.querySelector(".yes-btn").addEventListener("click", () => {
    import("./form.js").then(module => module.openForm(notification));
    confirmButtons.style.display = "none";
    pendingForms[notification.id] = true; // marca como pendiente
    pendingMsg.style.display = "block";
    title.textContent = "Es una caída ✔️";
  });

  // Evento No
  card.querySelector(".no-btn").addEventListener("click", () => {
    confirmButtons.style.display = "none";
    title.textContent = "No es caída ❌";
  });

  // Evento Cancelar
  cancelBtn.addEventListener("click", () => {
    confirmButtons.style.display = "none";
    receivedButtons.style.display = "flex";
    title.textContent = "¡Alerta de Caída!";
  });

  // Evento Continuar (si formulario pendiente)
  continueBtn.addEventListener("click", () => {
    if (pendingForms[notification.id]) {
      import("./form.js").then(module => module.openForm(notification));
    }
  });

  return card;
}

// Renderizar todas las notificaciones
notifications.forEach(n => {
  const card = createNotificationCard(n);
  notificationsContainer.appendChild(card);
});
