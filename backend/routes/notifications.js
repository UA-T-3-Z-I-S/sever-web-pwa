import express from "express";
import connectDB from "../src/db.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// GET /nots → devuelve notificaciones de las últimas 6 horas no registradas
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const notisCollection = db.collection("notificaciones_albergue");
    const caidasCollection = db.collection("registro_caidas_albergue");

    // Últimas 6 horas
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    // IDs de notificaciones ya registradas (guardadas como string)
    const caidas = await caidasCollection.find({}, { projection: { notificationId: 1 } }).toArray();
    const caidasIds = caidas
      .map(c => {
        try { return new ObjectId(c.notificationId); } // convertir string a ObjectId
        catch { return null; }
      })
      .filter(Boolean);

    // Solo notificaciones de las últimas 6 horas que NO tengan registro en caidas
    const notifications = await notisCollection
      .find({
        timestamp: { $gte: sixHoursAgo.toISOString() },
        _id: { $nin: caidasIds }
      })
      .sort({ timestamp: -1 })
      .toArray();

    return res.json({ ok: true, notifications });
  } catch (err) {
    console.error("❌ Error obteniendo notificaciones:", err.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
