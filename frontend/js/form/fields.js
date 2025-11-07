export function addDynamicField(containerId, options = [], prefillObj = null, fixed = false) {
  const container = document.getElementById(containerId);
  const group = document.createElement("div");
  group.className = "field-group";
  group.style.position = "relative"; // dropdown absoluto dentro del grupo

  const nombre = prefillObj?.nombre || prefillObj?.name || "";
  const apellido = prefillObj?.apellido || "";
  const value = (nombre + " " + apellido).trim();
  const idValue = prefillObj?._id || prefillObj?.id || "";
  const uuidValue = prefillObj?.id || "";

  group.innerHTML = `
    <input type="text" placeholder="Selecciona..." value="${value}" data-id="${idValue}" data-uuid="${uuidValue}" ${fixed ? "readonly" : ""}>
    <div class="dropdown-list" style="display:none; position:absolute; background:white; border:1px solid #ccc; max-height:150px; overflow-y:auto; width:100%; z-index:1000;"></div>
    ${fixed ? "" : '<button class="remove-btn">❌</button>'}
  `;
  container.appendChild(group);

  const input = group.querySelector("input");
  const dropdown = group.querySelector(".dropdown-list");

  function showDropdown(val = "") {
    dropdown.innerHTML = "";

    // IDs ya seleccionados en este container
    const selectedIds = Array.from(container.querySelectorAll("input"))
      .map(i => i.dataset.id)
      .filter(Boolean);

    const matches = options.filter(o => {
      const fullName = `${o.nombre} ${o.apellido}`.toLowerCase();
      const id = o._id || o.id;
      return fullName.includes(val.toLowerCase()) && !selectedIds.includes(id);
    });

    if (matches.length === 0) {
      const emptyItem = document.createElement("div");
      emptyItem.className = "dropdown-item";
      emptyItem.textContent = "No hay coincidencias";
      emptyItem.style.color = "#999";
      emptyItem.style.padding = "5px";
      dropdown.appendChild(emptyItem);
    } else {
      matches.forEach(o => {
        const item = document.createElement("div");
        item.className = "dropdown-item";
        item.textContent = `${o.nombre} ${o.apellido}`;
        item.style.padding = "5px";
        item.style.cursor = "pointer";
        item.addEventListener("click", () => {
          input.value = `${o.nombre} ${o.apellido}`;
          input.dataset.id = o._id || "";
          input.dataset.uuid = o.id || "";
          dropdown.style.display = "none";
        });
        item.addEventListener("mouseenter", () => item.style.background = "#eee");
        item.addEventListener("mouseleave", () => item.style.background = "white");
        dropdown.appendChild(item);
      });
    }

    dropdown.style.display = "block";
  }

  // Foco muestra todas las opciones
  input.addEventListener("focus", () => {
    if (!fixed) showDropdown("");
  });

  // Filtrar al escribir
  input.addEventListener("input", () => {
    if (!fixed) showDropdown(input.value);
  });

  // Botón eliminar
  if (!fixed) {
    const removeBtn = group.querySelector(".remove-btn");
    if (removeBtn) removeBtn.addEventListener("click", () => group.remove());
  }

  // Cerrar dropdown si clic fuera
  document.addEventListener("click", e => {
    if (!group.contains(e.target)) dropdown.style.display = "none";
  });
}
