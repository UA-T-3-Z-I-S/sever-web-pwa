// backend/src/push.js
import connectDB from './db.js';
import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:sistema_ia@server-web-pwa.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function startPushListener() {
  const db = await connectDB();
  const notificacionesCol = db.collection('notificaciones_albergue');
  const personalCol = db.collection('personal_albergue');
  const pwaCol = db.collection('pwa_dispositivos');

  console.log('🚀 Escuchando notificaciones_albergue...');

  // 🧠 Cache para evitar procesar el mismo ID dos veces
  const processed = new Set();

  // Limpieza automática cada 10 minutos para evitar crecimiento del Set
  setInterval(() => processed.clear(), 10 * 60 * 1000);

  const changeStream = notificacionesCol.watch([{ $match: { operationType: 'insert' } }]);

  changeStream.on('change', async (change) => {
    const id = change.documentKey._id.toString();

    // 🚫 Si ya se procesó este ID, no volver a enviarlo
    if (processed.has(id)) return;
    processed.add(id);

    const notif = change.fullDocument;
    console.log('📌 Nuevo registro detectado:', notif);

    // Obtener personal activo
    const personal = await personalCol.find({ estado: true }).toArray();

    const now = new Date();
    const dayMap = ["DOMINGO","LUNES","MARTES","MIERCOLES","JUEVES","VIERNES","SABADO"];
    const currentDay = dayMap[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const user of personal) {
      let enviar = false;

      // Condición test
      if (notif.estado === 0 && user.test === true) {
        enviar = true;
      } 
      // Condición por horario
      else if (notif.estado !== 0) {
        const activo = user.horarios.some(h => {
          if (h.dia.toUpperCase() !== currentDay) return false;
          const [hiH, hiM] = h.hora_inicio.split(':').map(Number);
          const [hfH, hfM] = h.hora_fin.split(':').map(Number);
          const inicio = hiH * 60 + hiM;
          const fin = hfH * 60 + hfM;
          return currentTime >= inicio && currentTime <= fin;
        });
        if (activo) enviar = true;
      }

      if (!enviar) continue;

      // Enviar push a todos los PWA del usuario
      const pwaDocs = await pwaCol.find({ _id: { $in: user.pwas } }).toArray();
      console.log(`👀 ${user.nombre} tiene ${pwaDocs.length} PWA(s):`, pwaDocs.map(p => p._id));

      for (const pwa of pwaDocs) {
        try {
          const payload = JSON.stringify({
            title: '🔔 Alerta de caída',
            body: `Evento: ${notif.evento}, Cámara: ${notif.camara}`,
            url: '/dashboard.html',
            vibrate: [200, 100, 200],
            data: { 
              id: notif._id,
              evento: notif.evento,
              camara: notif.camara,
            }
          });

          await webpush.sendNotification(pwa.subscription, payload, {
            TTL: 0,
            headers: { urgency: 'high' }
          });

          console.log(`✅ Notificación enviada a ${user.nombre}`);
        } catch (err) {
          console.error(`❌ Error enviando notificación a ${user.nombre}:`, err);
        }
      }
    }
  });
}

// startPushListener().catch(err => console.error('❌ Error listener push:', err));

