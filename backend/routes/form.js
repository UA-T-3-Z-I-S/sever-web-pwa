import express from "express";
import connectDB from "../src/db.js";

const router = express.Router();

/**
 * POST /form
 * Recibe un formulario de caída y lo guarda en MongoDB
 * body:
 *   {
 *     notificationId: string,
 *     interventionTime?: ISOString,
 *     professionals?: Array<string>,
 *     residents?: Array<string>,
 *     severity?: string,
 *     comments?: string,
 *     caida: boolean,
 *     userId: string
 *   }
 */
router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    const caidasCollection = db.collection("registro_caidas_albergue");

    const {
      notificationId,
      interventionTime,
      professionals,
      residents,
      severity,
      comments,
      caida,
      userId
    } = req.body;

    if (!notificationId || !userId || typeof caida !== "boolean") {
      return res.status(400).json({ ok: false, error: "Campos obligatorios faltantes" });
    }

    const doc = {
      notificationId,
      userId,
      caida,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (caida) {
      // Solo si es caída real añadimos los campos completos
      doc.interventionTime = interventionTime || new Date().toISOString();
      doc.professionals = Array.isArray(professionals) ? professionals : [];
      doc.residents = Array.isArray(residents) ? residents : [];
      doc.severity = severity || "leve";
      doc.comments = comments || "";
    }

    const result = await caidasCollection.insertOne(doc);

    return res.json({ ok: true, insertedId: result.insertedId });
  } catch (err) {
    console.error("❌ Error guardando formulario de caída:", err.message);
    return res.status(500).json({ ok: false, error: "Error en el servidor" });
  }
});

export default router;
