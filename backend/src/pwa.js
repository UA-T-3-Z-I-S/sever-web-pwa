// backend/src/pwa.js
import express from 'express';
import { ObjectId } from 'mongodb';
import connectDB from './db.js';

const router = express.Router();

router.post('/subscribe', async (req, res) => {
  console.log('📩 /pwa/subscribe llamado', req.body);

  try {
    const { userMongoId, userId, deviceId, subscription } = req.body;

    if (!userMongoId || !userId || !deviceId || !subscription) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    const db = await connectDB();
    const pwaCollection = db.collection('pwa_dispositivos');
    const personalCollection = db.collection('personal_albergue');

    // Buscar si ya existe este device
    const existingDevice = await pwaCollection.findOne({ deviceId });

    if (existingDevice) {
      // Si ya pertenece al mismo usuario y la suscripción no cambió → no hacer nada
      const sameUser = existingDevice.userMongoId === userMongoId;
      const sameEndpoint = existingDevice.subscription?.endpoint === subscription.endpoint;

      if (sameUser && sameEndpoint) {
        console.log(`✅ Device ${deviceId} ya está asociado correctamente con el usuario ${userMongoId}`);
        return res.status(200).json({
          success: true,
          message: 'Device ya registrado previamente',
          deviceId,
          pwaId: existingDevice._id,
        });
      }

      // Si pertenece a otro usuario → reasignar
      if (!sameUser) {
        console.log(`⚠️ Reasignando device ${deviceId} de ${existingDevice.userMongoId} → ${userMongoId}`);
        await personalCollection.updateMany(
          { pwas: existingDevice._id },
          { $pull: { pwas: existingDevice._id } }
        );
      }

      // Actualizar registro
      await pwaCollection.updateOne(
        { deviceId },
        {
          $set: {
            userMongoId,
            userId,
            subscription,
            updated_at: new Date()
          }
        }
      );
    } else {
      // Crear nuevo dispositivo
      await pwaCollection.insertOne({
        userMongoId,
        userId,
        deviceId,
        subscription,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Asociar PWA al usuario sin duplicar
    const pwaDoc = await pwaCollection.findOne({ deviceId });
    const pwaId = pwaDoc._id;

    await personalCollection.updateOne(
      { _id: new ObjectId(userMongoId) },
      { $addToSet: { pwas: pwaId } }
    );

    console.log(`🟢 PWA asignado correctamente: ${deviceId} (${pwaId}) → usuario ${userMongoId}`);

    return res.status(200).json({
      success: true,
      message: 'Dispositivo registrado o actualizado correctamente',
      deviceId,
      pwaId
    });

  } catch (err) {
    console.error('❌ Error en /pwa/subscribe:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
