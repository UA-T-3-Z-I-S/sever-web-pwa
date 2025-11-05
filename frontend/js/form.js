let modal;
let formState = {}; // guarda temporalmente lo que escribió el usuario
let currentNotificationId = null;

const allProfessionals = ["Cuidador 1", "Cuidador 2", "Cuidador 3"];
const allResidents = ["Residente 1", "Residente 2", "Residente 3"];

export function openForm(notification, userSession = { nombre: "Cuidador", apellido: "1" }) {
  currentNotificationId = notification.id;

  // Crear modal si no existe
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "fall-modal";
    modal.innerHTML = `
      <div id="fall-modal-content">
        <h3>Formulario de Caída</h3>

        <!-- Hora de intervención -->
        <div class="fall-section">
          <label>Hora de intervención:</label>
          <div class="fall-time-group">
            <input type="time" id="fall-intervention-time" disabled step="60">
            <button id="fall-edit-time">✏️</button>
          </div>
        </div>

        <!-- Profesionales -->
        <div class="fall-section">
          <label>Profesional(es)</label>
          <div id="fall-professionals-container">
            <div class="field-group">
              <input type="text" disabled>
            </div>
          </div>
          <button type="button" class="fall-add-btn" id="fall-add-prof">Agregar profesional</button>
        </div>

        <!-- Residentes -->
        <div class="fall-section">
          <label>Residente(s)</label>
          <div id="fall-residents-container"></div>
          <button type="button" class="fall-add-btn" id="fall-add-res">Agregar residente</button>
        </div>

        <!-- Severidad -->
        <div class="fall-section">
          <label>Severidad de la lesión</label>
          <div class="fall-severity">
            <input type="radio" id="fall-leve" name="fall-severity" value="leve" required><label for="fall-leve">Leve</label>
            <input type="radio" id="fall-moderada" name="fall-severity" value="moderada"><label for="fall-moderada">Moderada</label>
            <input type="radio" id="fall-grave" name="fall-severity" value="grave"><label for="fall-grave">Grave</label>
          </div>
        </div>

        <!-- Comentarios -->
        <div class="fall-section">
          <label>Comentarios</label>
          <textarea id="fall-comments" placeholder="Describe la situación..." maxlength="300"></textarea>
        </div>

        <!-- Botones -->
        <div class="fall-section">
          <button id="fall-submit">Enviar</button>
          <button id="fall-close">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const timeInput = document.getElementById("fall-intervention-time");

    // Editar hora
    document.getElementById("fall-edit-time").addEventListener("click", () => {
      timeInput.disabled = false;
      timeInput.focus();
    });

    // Agregar dinámico
    document.getElementById("fall-add-prof").addEventListener("click", () => addDynamicField("fall-professionals-container", allProfessionals));
    document.getElementById("fall-add-res").addEventListener("click", () => addDynamicField("fall-residents-container", allResidents));

    // Submit
    document.getElementById("fall-submit").addEventListener("click", e => {
      e.preventDefault();
      saveFormData(currentNotificationId, notification);
      modal.style.display = "none";
      console.log("Datos enviados:", formState[currentNotificationId]);
    });

    // Cerrar
    document.getElementById("fall-close").addEventListener("click", () => {
      saveFormData(currentNotificationId, notification);
      modal.style.display = "none";
    });
  }

  // Restaurar datos
  restoreFormData(notification, userSession);

  // Mostrar modal
  modal.style.display = "flex";
}

// ================== FUNCIONES AUXILIARES ==================
function addDynamicField(containerId, options) {
  const container = document.getElementById(containerId);
  const selectedValues = Array.from(container.querySelectorAll("input")).map(i => i.value);
  const filteredOptions = options.filter(o => !selectedValues.includes(o));
  if (!filteredOptions.length) return;

  const group = document.createElement("div");
  group.className = "field-group";
  group.innerHTML = `
    <input type="text" placeholder="Selecciona...">
    <div class="dropdown-list"></div>
    <div class="field-error" style="color:red; font-size:0.8rem; display:none;">No existe</div>
    <button class="remove-btn">❌</button>
  `;
  container.appendChild(group);

  const input = group.querySelector("input");
  const dropdown = group.querySelector(".dropdown-list");
  const errorMsg = group.querySelector(".field-error");

  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    dropdown.innerHTML = "";
    const matches = filteredOptions.filter(opt => opt.toLowerCase().includes(val));
    if (matches.length) {
      matches.forEach(opt => {
        const item = document.createElement("div");
        item.className = "dropdown-item";
        item.textContent = opt;
        item.addEventListener("click", () => {
          input.value = opt;
          dropdown.style.display = "none";
          errorMsg.style.display = "none";
        });
        dropdown.appendChild(item);
      });
      dropdown.style.display = "block";
      errorMsg.style.display = "none";
    } else {
      dropdown.style.display = "none";
      errorMsg.style.display = "block";
    }
  });

  input.addEventListener("blur", () => setTimeout(() => dropdown.style.display = "none", 150));
  group.querySelector(".remove-btn").addEventListener("click", () => group.remove());
}

function saveFormData(notificationId, notification) {
  formState[notificationId] = {
    professionals: Array.from(document.querySelectorAll("#fall-professionals-container input")).map(i => i.value),
    residents: Array.from(document.querySelectorAll("#fall-residents-container input")).map(i => i.value),
    severity: document.querySelector("input[name='fall-severity']:checked")?.value || null,
    comments: document.getElementById("fall-comments").value,
    interventionTime: document.getElementById("fall-intervention-time").value,
    seconds: notification.segundos || 0,
    milliseconds: notification.milliseconds || 0
  };
}

function restoreFormData(notification, userSession) {
  const notificationId = notification.id;
  const data = formState[notificationId];

  // PROFESIONALES
  const profContainer = document.getElementById("fall-professionals-container");
  profContainer.innerHTML = `<div class="field-group"><input type="text" value="${userSession.nombre} ${userSession.apellido}" disabled></div>`;

  if (data?.professionals?.length > 1) {
    data.professionals.slice(1).forEach(p => addDynamicField("fall-professionals-container", [p, ...allProfessionals]));
  }

  // RESIDENTES
  const resContainer = document.getElementById("fall-residents-container");
  resContainer.innerHTML = "";
  if (data?.residents?.length) {
    data.residents.forEach(r => addDynamicField("fall-residents-container", [r, ...allResidents]));
  }

  // COMENTARIOS
  document.getElementById("fall-comments").value = data?.comments || "";

  // SEVERIDAD
  if (data?.severity) {
    document.querySelector(`input[name='fall-severity'][value='${data.severity}']`).checked = true;
  }

  // HORA DE INTERVENCIÓN
  const timeInput = document.getElementById("fall-intervention-time");
  if (data?.interventionTime) {
    timeInput.value = data.interventionTime;
  } else {
    // Si no hay hora guardada, usamos la hora actual (cuando se marca "Sí hubo caída")
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    timeInput.value = `${hh}:${mm}`;
  }
}
