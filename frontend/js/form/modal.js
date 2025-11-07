import { addDynamicField } from './fields.js';
import { restoreFormData } from './storage.js';
import { sendForm } from './save.js'; 

export function buildModal(notification, allProfessionals, allResidents, userSession, onFormSent) {
  const modal = document.createElement("div");
  modal.id = "fall-modal";

  modal.innerHTML = `
    <div id="fall-modal-content">
      <h3>Formulario de Caída</h3>

      <div class="fall-section" id="section-time">
        <label>Hora de intervención:</label>
        <div class="fall-time-group">
          <input type="time" id="fall-intervention-time" disabled step="60">
          <button id="fall-edit-time">✏️</button>
        </div>
        <p class="field-error" style="color:red; display:none;">Debe ingresar la hora de intervención.</p>
      </div>

      <div class="fall-section" id="section-professionals">
        <label>Personal interviniente</label>
        <div id="fall-professionals-container"></div>
        <button type="button" class="fall-add-btn" id="fall-add-prof">Agregar personal</button>
        <p class="field-error" style="color:red; display:none;">Debe seleccionar al menos un profesional interviniente.</p>
      </div>

      <div class="fall-section" id="section-residents">
        <label>Residente(s)</label>
        <div id="fall-residents-container"></div>
        <button type="button" class="fall-add-btn" id="fall-add-res">Agregar residente</button>
        <p class="field-error" style="color:red; display:none;">Debe seleccionar al menos un residente.</p>
      </div>

      <div class="fall-section" id="section-severity">
        <label>Severidad de la lesión</label>
        <div class="fall-severity">
          <input type="radio" id="fall-leve" name="fall-severity" value="leve">
          <label for="fall-leve">Leve</label>
          <input type="radio" id="fall-moderada" name="fall-severity" value="moderada">
          <label for="fall-moderada">Moderada</label>
          <input type="radio" id="fall-grave" name="fall-severity" value="grave">
          <label for="fall-grave">Grave</label>
        </div>
        <p class="field-error" style="color:red; display:none;">Debe seleccionar la severidad de la lesión.</p>
      </div>

      <div class="fall-section">
        <label>Comentarios (opcional)</label>
        <textarea id="fall-comments" placeholder="Describe la situación..." maxlength="300"></textarea>
      </div>

      <div class="fall-section">
        <button id="fall-submit">Enviar</button>
        <button id="fall-close">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const timeInput = modal.querySelector("#fall-intervention-time");
  const profContainer = modal.querySelector("#fall-professionals-container");
  const resContainer = modal.querySelector("#fall-residents-container");
  const severityInputs = modal.querySelectorAll("input[name='fall-severity']");

  const timeError = modal.querySelector("#section-time .field-error");
  const profError = modal.querySelector("#section-professionals .field-error");
  const resError = modal.querySelector("#section-residents .field-error");
  const severityError = modal.querySelector("#section-severity .field-error");

  // Función shake rápida
  const shakeField = (el) => {
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 500);
  };

  timeInput.value = setNow();
  modal.querySelector("#fall-edit-time").addEventListener("click", () => {
    timeInput.disabled = false;
    timeInput.focus();
  });

  if (userSession) addDynamicField("fall-professionals-container", allProfessionals, userSession, true);

  modal.querySelector("#fall-add-prof").addEventListener("click", () =>
    addDynamicField("fall-professionals-container", allProfessionals)
  );
  modal.querySelector("#fall-add-res").addEventListener("click", () =>
    addDynamicField("fall-residents-container", allResidents)
  );

  modal.querySelector("#fall-submit").addEventListener("click", async e => {
    e.preventDefault();

    // reset errores
    [timeError, profError, resError, severityError].forEach(e => e.style.display = "none");
    modal.querySelectorAll("input, textarea").forEach(f => f.style.border = "");

    const professionals = Array.from(profContainer.querySelectorAll("input"))
      .map(i => i.dataset.id)
      .filter(Boolean);

    const residents = Array.from(resContainer.querySelectorAll("input"))
      .map(i => i.dataset.id)
      .filter(Boolean);

    const severity = Array.from(severityInputs).find(r => r.checked)?.value;
    const comments = modal.querySelector("#fall-comments").value || "";
    const interventionTime = timeInput.value;

    let hasError = false;

    if (!interventionTime) {
      timeError.style.display = "block";
      timeInput.style.border = "1px solid red";
      shakeField(timeInput);
      hasError = true;
    }
    if (professionals.length === 0) {
      profError.style.display = "block";
      shakeField(profContainer);
      hasError = true;
    }
    if (residents.length === 0) {
      resError.style.display = "block";
      shakeField(resContainer);
      hasError = true;
    }
    if (!severity) {
      severityError.style.display = "block";
      shakeField(modal.querySelector(".fall-severity"));
      hasError = true;
    }

    if (hasError) return; // ❌ no cerrar modal hasta completar campos

    // enviar formulario
    const payload = {
      notificationId: notification._id,
      interventionTime: new Date().toISOString(),
      professionals,
      residents,
      severity,
      comments,
      caida: true
    };

    const result = await sendForm(payload);

    if (!result.ok) {
      console.error("Error guardando formulario:", result.error);
      alert("Error al enviar el formulario, intente nuevamente.");
      return;
    }

    if (typeof onFormSent === "function") onFormSent();
    modal.style.display = "none";
  });

  modal.querySelector("#fall-close").addEventListener("click", () => {
    modal.style.display = "none";
  });

  return modal;
}

function setNow() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}
