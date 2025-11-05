import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/db.js";
import loginRouter from "./routes/login.js";

const app = express();

// ========================
// CONFIG
// ========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta donde está el frontend
const FRONTEND_DIR = path.join(__dirname, "../../Frontend");

// Detecta si estamos corriendo en local o en Render
const FRONTEND_URL = process.env.PORT
  ? "https://server-web-pwa.onrender.com"
  : "http://localhost:3000";

// CORS
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ========================
// API
// ========================
app.use("/login", loginRouter);

// Healthcheck
app.get("/status", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});

// ========================
// SERVIR FRONTEND
// ========================
app.use(express.static(FRONTEND_DIR));

// SPA fallback (Dashboard, Index, etc.)
app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// ========================
// INICIO DEL SERVIDOR
// ========================
const PORT = process.env.PORT || 3001;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Backend corriendo en puerto ${PORT}`);
      console.log(`🌐 Frontend servido desde: ${FRONTEND_DIR}`);
      console.log(`🌐 URL pública: ${FRONTEND_URL}`);
    });
  })
  .catch(err => console.error("❌ Error conectando a MongoDB:", err));
