// backend/routes/key.js
import express from 'express';
const router = express.Router();

// GET /key → devuelve la VAPID public key
router.get('/', (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(500).json({ error: 'VAPID_PUBLIC_KEY no configurada' });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

export default router;
