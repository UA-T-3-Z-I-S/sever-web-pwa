import express from "express";
import cors from "cors";
import connectDB from "./src/db.js";
import loginRouter from "./routes/login.js";

const app = express();

// ✅ CORS: permite requests desde el frontend
app.use(cors({
  origin: "http://localhost:3000", // <- aquí va la URL del frontend en desarrollo
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ✅ Healthcheck
app.get("/status", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});

// ✅ Rutas
app.use("/login", loginRouter);

// Iniciar servidor
const PORT = process.env.PORT || 3001;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en puerto ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("❌ Error conectando a MongoDB:", err);
});
