// frontend/js/pwa_register.js
import { urlBase64ToUint8Array, getOrCreateDeviceId } from './utils.js';

export async function registerPush(userMongoId, userId, registration) {
  try {
    console.log('🟢 Iniciando registro PWA para usuario:', userMongoId);

    const deviceId = await getOrCreateDeviceId();
    console.log('💡 DeviceID local:', deviceId);

    if (!registration) {
      registration = await navigator.serviceWorker.ready;
    }

    // ✅ Verificar si ya hay una suscripción activa
    let existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      console.log('⚙️ Ya existe una suscripción activa, reusando...');
    } else {
      const res = await fetch('/key');
      if (!res.ok) throw new Error('No se pudo obtener la VAPID key');
      const { publicKey } = await res.json();

      existingSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      console.log('🆕 Nueva suscripción creada:', existingSubscription);
    }

    // ✅ Enviar al backend (para registrar o actualizar)
    const subscribeRes = await fetch('/pwa/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMongoId,
        userId,
        deviceId,
        subscription: existingSubscription
      })
    });

    const result = await subscribeRes.json();
    if (!subscribeRes.ok) throw new Error(result.error || 'Error en registro del dispositivo');
    console.log('🟢 Dispositivo registrado en backend:', result);

  } catch (err) {
    console.error('❌ Error en registerPush:', err);
  }
}
