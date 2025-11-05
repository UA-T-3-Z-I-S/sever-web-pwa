import express from "express";
import connectDB from "../src/db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { dni } = req.body;

    if (!dni) {
      return res.status(400).json({ error: "El DNI es requerido" });
    }

    const db = await connectDB();
    const staffCollection = db.collection("personal_albergue");

    const user = await staffCollection.findOne({ dni });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!user.estado) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    return res.json({
      ok: true,
      user: {
        _id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.dni,
        tipo: user.tipo
      },
      message: "Login correcto"
    });

  } catch (error) {
    console.error("❌ Error en login:", error.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
