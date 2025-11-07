// src/form/save.js

import { getSession } from "../app.js"; // para obtener datos del usuario actual

/**
 * Envía el formulario al backend
 * @param {Object} payload - Objeto con los datos del formulario
 *   {
 *     notificationId: string,
 *     interventionTime: ISOString,
 *     professionals: Array<string>, // ids
 *     residents: Array<string>, // ids
 *     severity: string,
 *     comments: string,
 *     caida: boolean
 *   }
 */
export async function sendForm(payload) {
  try {
    const session = await getSession();
    if (!session?._id) throw new Error("No hay usuario en sesión");

    // Si es NO, solo enviamos _id del usuario y _id de notificación, caida false
    let dataToSend;
    if (payload.caida === false) {
      dataToSend = {
        notificationId: payload.notificationId,
        userId: session._id,
        caida: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else {
      dataToSend = {
        notificationId: payload.notificationId,
        interventionTime: payload.interventionTime || new Date().toISOString(),
        professionals: payload.professionals || [],
        residents: payload.residents || [],
        severity: payload.severity || "leve",
        comments: payload.comments || "",
        caida: true,
        userId: session._id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const res = await fetch("/form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dataToSend)
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Error enviando formulario:", result);
      return { ok: false, error: result };
    }

    return { ok: true, data: result };
  } catch (err) {
    console.error("Error en sendForm:", err);
    return { ok: false, error: err.message };
  }
}
