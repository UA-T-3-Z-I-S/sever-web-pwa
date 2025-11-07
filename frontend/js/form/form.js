import { loadUsers } from './api.js';
import { buildModal } from './modal.js';
import { restoreFormData, saveFormData } from './storage.js';

let modal;
let allProfessionals = [];
let allResidents = [];

export async function openForm(notification, userSession, onFormSent) {
  if (!notification?._id) return console.error("⚠️ Notification inválida");

  if (!allProfessionals.length || !allResidents.length) {
    const users = await loadUsers();
    allProfessionals = users.allProfessionals;
    allResidents = users.allResidents;
  }

  if (!modal) modal = buildModal(notification, allProfessionals, allResidents, userSession, onFormSent);

  restoreFormData(notification, userSession, allProfessionals, allResidents);

  modal.style.display = "flex";

  const submitBtn = modal.querySelector("#fall-submit");
  // ⚠ Aquí registramos correctamente el callback cada vez que se abre
  submitBtn.onclick = async (e) => {
    e.preventDefault();

    try {
      const ok = await saveFormData(notification._id);
      if (ok) {
        // ✅ Llama al callback que actualiza la tarjeta
        if (typeof onFormSent === "function") onFormSent();
      }
      modal.style.display = "none";
    } catch (err) {
      console.error("Error enviando formulario:", err);
    }
  };

  const closeBtn = modal.querySelector("#fall-close");
  closeBtn.onclick = () => {
    saveFormData(notification._id); // opcional: guardar borrador
    modal.style.display = "none";
  };
}

