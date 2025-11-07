// frontend/js/pwa_register.js
import { urlBase64ToUint8Array } from './utils.js';

export async function registerPush(userMongoId) {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.register('/service-worker.js');

  // Obtenemos la VAPID key del backend
  const res = await fetch('/key');
  const { publicKey } = await res.json();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });

  await fetch('/pwa/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userMongoId, subscription })
  });
}
