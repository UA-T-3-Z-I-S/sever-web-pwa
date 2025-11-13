import express from "express";
import cors from "cors";
import path from "path";
import connectDB from "./backend/src/db.js";
import { connectMongoose } from "./backend/src/mongoose.js";
import loginRouter from "./backend/routes/login.js";
import usersRouter from "./backend/routes/users.js";
import notsRouter from "./backend/routes/notifications.js";
import keyRouter from "./backend/routes/key.js";
import formRouter from "./backend/routes/form.js";
import pwaRouter from "./backend/src/pwa.js";
import startPushListener from "./backend/src/push.js";

const app = express();
const PORT = process.env.PORT || 3001;
const isRender = !!process.env.PORT;
const FRONTEND_URL = isRender
  ? "https://server-web-pwa.onrender.com"
  : `http://localhost:${PORT}`;

// =====================
// MIDDLEWARES
// =====================
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// =====================
// HEALTHCHECK
// =====================
app.get("/status", (req, res) =>
  res.json({ status: "ok", time: Date.now() })
);

// =====================
// API ROUTES
// =====================
app.use("/login", loginRouter);
app.use("/users", usersRouter);

// No cache en notificaciones
app.use("/nots", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
}, notsRouter);

app.use("/form", formRouter);
app.use("/key", keyRouter);

// =====================
// PWA ROUTES (mover antes del listen ✅)
// =====================
app.use(
  "/pwa",
  (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    next();
  },
  pwaRouter
);

// =====================
// FRONTEND STATIC FILES
// =====================
const frontendPath = path.join(process.cwd(), "frontend");
console.log("🚀 process.cwd():", process.cwd());
console.log("🌐 Frontend path:", frontendPath);

app.use(express.static(frontendPath));

app.get("/", (req, res) =>
  res.sendFile(path.join(frontendPath, "index.html"))
);
app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(frontendPath, "dashboard.html"))
);

// 404 fallback
app.get("*", (req, res) => res.status(404).send("Not found"));

// =====================
// INITIALIZATION
// =====================
(async () => {
  try {
    await connectDB();
    await connectMongoose();

    app.listen(PORT, () => {
      console.log(`🚀 Backend corriendo en puerto ${PORT}`);
      console.log(`🌐 Frontend servido desde: ${frontendPath}`);
      console.log(`🌐 URL pública: ${FRONTEND_URL}`);
    });

    // Inicia listener de push
    startPushListener().catch(err =>
      console.error("❌ Error listener push:", err)
    );
  } catch (err) {
    console.error("❌ Error inicializando servidor:", err);
  }
})();
