import { addDynamicField } from './fields.js';

let formState = {};

// Guarda todos los datos del formulario (ya actualizado en tiempo real)
export function saveFormData(notificationId) {
  if (!notificationId) return;

  // Esto asegura que los campos dinámicos se guarden justo antes de cerrar/enviar
  formState[notificationId] = {
    professionals: Array.from(document.querySelectorAll("#fall-professionals-container input")).map(i => ({
      _id: i.dataset.id || "",
      id: i.dataset.uuid || "",
      name: i.value || ""
    })),
    residents: Array.from(document.querySelectorAll("#fall-residents-container input")).map(i => ({
      _id: i.dataset.id || "",
      id: i.dataset.uuid || "",
      name: i.value || ""
    })),
    severity: document.querySelector("input[name='fall-severity']:checked")?.value || "leve",
    comments: document.getElementById("fall-comments").value || "",
    interventionTime: document.getElementById("fall-intervention-time").value || ""
  };
}

// Restaura los datos del formulario, inicializando listeners para mantener formState actualizado
export function restoreFormData(notification, userSession, allProfessionals, allResidents) {
  const nId = notification?._id;
  
  // Inicializa si no existe
  if (!formState[nId]) {
    formState[nId] = {
      professionals: [],
      residents: [],
      severity: "leve",
      comments: "",
      interventionTime: setNow()
    };
  }

  const data = formState[nId];

  // ----------------------
  // Personal
  const profC = document.getElementById("fall-professionals-container");
  profC.innerHTML = "";
  if (userSession) addDynamicField("fall-professionals-container", allProfessionals, userSession, true);

  if (data.professionals.length) {
    data.professionals.forEach(p => {
      if (userSession && p._id === userSession._id) return;
      const parts = p.name.split(" ");
      const nombre = parts.slice(0, -1).join(" ") || parts[0];
      const apellido = parts.slice(-1).join(" ") || "";
      addDynamicField("fall-professionals-container", allProfessionals, { _id: p._id, id: p.id, nombre, apellido });
    });
  } else {
    addDynamicField("fall-professionals-container", allProfessionals);
  }

  // ----------------------
  // Residentes
  const resC = document.getElementById("fall-residents-container");
  resC.innerHTML = "";
  if (data.residents.length) {
    data.residents.forEach(r => {
      const parts = r.name.split(" ");
      const nombre = parts.slice(0, -1).join(" ") || parts[0];
      const apellido = parts.slice(-1).join(" ") || "";
      addDynamicField("fall-residents-container", allResidents, { _id: r._id, id: r.id, nombre, apellido });
    });
  } else {
    addDynamicField("fall-residents-container", allResidents);
  }

  // ----------------------
  // Comentarios
  const commentsInput = document.getElementById("fall-comments");
  commentsInput.value = data.comments || "";
  commentsInput.oninput = () => { formState[nId].comments = commentsInput.value; };

  // ----------------------
  // Severidad
  const severityInputs = document.querySelectorAll("input[name='fall-severity']");
  severityInputs.forEach(inp => {
    inp.checked = inp.value === data.severity;
    inp.onchange = () => { formState[nId].severity = inp.value; };
  });

  // ----------------------
  // Hora intervención
  const timeInput = document.getElementById("fall-intervention-time");
  timeInput.value = data.interventionTime || setNow();
  timeInput.oninput = () => { formState[nId].interventionTime = timeInput.value; };

  // ----------------------
  // Escucha cambios en campos dinámicos (profesionales y residentes)
  function attachDynamicListeners(containerId, key) {
    const container = document.getElementById(containerId);
    container.oninput = () => {
      formState[nId][key] = Array.from(container.querySelectorAll("input")).map(i => ({
        _id: i.dataset.id || "",
        id: i.dataset.uuid || "",
        name: i.value || ""
      }));
    };
  }

  attachDynamicListeners("fall-professionals-container", "professionals");
  attachDynamicListeners("fall-residents-container", "residents");
}

// ----------------------
function setNow() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}

// Exponer formState para depuración
export function getFormState() {
  return formState;
}
