import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env si existe
dotenv.config();

/**
 * Genera los archivos de configuración de Firebase en la carpeta public.
 * @param {object} env - Variables de entorno necesarias para la configuración.
 * @returns {void}
 */
export function generateFirebaseMessagingServiceWorker(env) {
  const firebaseConfig = {
    apiKey: env.PUBLIC_FIREBASE_API_KEY,
    authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.PUBLIC_FIREBASE_DATABASE_URL,
    projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.PUBLIC_FIREBASE_APP_ID
  };

  // Detectar si se debe usar el emulador
  const useEmulator = env.USE_FIREBASE_EMULATOR === 'true';
  const emulatorPort = env.FIREBASE_EMULATOR_MESSAGING_PORT || '5001';
  const emulatorHost = env.FIREBASE_EMULATOR_MESSAGING_HOST || 'localhost';

  // Contenido de firebase-messaging-sw.js
  const messagingSwContent = `
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Mensaje en segundo plano recibido:", payload);

  const notificationTitle = payload.notification?.title || "Nueva Notificación";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes una nueva actualización.",
    icon: "/icon.png",
    badge: "/badge-icon.png",
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(targetUrl));
});
`;

  // Escribir los archivos
  fs.writeFileSync('./public/firebase-messaging-sw.js', messagingSwContent);
  console.log('✅ Firebase messaging service worker generated successfully!');
} 