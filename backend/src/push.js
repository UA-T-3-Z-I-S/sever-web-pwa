//backend/src/push.js
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

  const changeStream = notificacionesCol.watch([{ $match: { operationType: 'insert' } }]);

  changeStream.on('change', async (change) => {
    const notif = change.fullDocument;
    console.log('📌 Nuevo registro:', notif);

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
      for (const pwa of pwaDocs) {
        try {
          const payload = JSON.stringify({
            title: 'Alerta de caída',
            body: `Evento: ${notif.evento}, Cámara: ${notif.camara}`,
            data: { id: notif._id }
          });
          await webpush.sendNotification(pwa.subscription, payload);
          console.log(`✅ Notificación enviada a ${user.nombre}`);
        } catch (err) {
          console.error(`❌ Error enviando notificación a ${user.nombre}:`, err);
        }
      }
    }
  });
}

startPushListener().catch(err => console.error('❌ Error listener push:', err));
