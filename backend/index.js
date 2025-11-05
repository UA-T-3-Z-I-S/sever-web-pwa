import express from "express";
import cors from "cors";
import path from "path";
import connectDB from "./src/db.js";
import loginRouter from "./routes/login.js";

const app = express();

// Detecta si estamos corriendo en Render o local
const isRender = !!process.env.PORT;
const FRONTEND_URL = isRender
  ? "https://server-web-pwa.onrender.com"
  : "http://localhost:3000";

// CORS para API
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Healthcheck
app.get("/status", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});

// API Routes
app.use("/login", loginRouter);

// Servir frontend estático
const frontendPath = path.join(process.cwd(), "../frontend");
app.use(express.static(frontendPath));

// SPA fallback: cualquier ruta que no sea API sirve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Puerto dinámico
const PORT = process.env.PORT || 3001;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Backend corriendo en puerto ${PORT}`);
      console.log(`🌐 Frontend servido desde: ${frontendPath}`);
      console.log(`🌐 URL pública: ${FRONTEND_URL}`);
    });
  })
  .catch(err => console.error("❌ Error conectando a MongoDB:", err));
