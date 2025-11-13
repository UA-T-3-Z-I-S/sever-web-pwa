// ===============================
// Conversión VAPID Key
// ===============================
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ===============================
// IndexedDB - Device ID Manager
// ===============================

const DB_NAME = 'pwa_device_db';
const STORE_NAME = 'device';
const DEVICE_KEY = 'deviceId';

/**
 * Inicializa o abre la base de datos
 */
function openDeviceDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Devuelve el deviceId actual o crea uno nuevo si no existe.
 */
export async function getOrCreateDeviceId() {
  const db = await openDeviceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getReq = store.get(DEVICE_KEY);
    getReq.onsuccess = () => {
      if (getReq.result) {
        resolve(getReq.result.value);
      } else {
        const newId = crypto.randomUUID();
        store.put({ key: DEVICE_KEY, value: newId });
        resolve(newId);
      }
    };
    getReq.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Elimina el deviceId guardado (por ejemplo, al hacer logout)
 */
export async function clearDeviceId() {
  const db = await openDeviceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const deleteReq = store.delete(DEVICE_KEY);

    deleteReq.onsuccess = () => resolve();
    deleteReq.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Recupera el deviceId actual sin crearlo (por si solo quieres leer)
 */
export async function getDeviceId() {
  const db = await openDeviceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(DEVICE_KEY);

    getReq.onsuccess = () => resolve(getReq.result?.value || null);
    getReq.onerror = (event) => reject(event.target.error);
  });
}
