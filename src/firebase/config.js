import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue } from 'firebase/database';
import { getAuth, OAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.PUBLIC_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const database = getDatabase(app);
export const auth = getAuth(app);
export const databaseFirestore = getFirestore(app);

// Configuración del emulador de Firestore
if (import.meta.env.PUBLIC_USE_FIRESTORE_EMULATOR === 'true') {
  connectFirestoreEmulator(databaseFirestore, 'localhost', 8080);
}

export const messaging = getMessaging(app);
function createAuthProvider() {
  const provider = import.meta.env.PUBLIC_AUTH_PROVIDER || 'google';
  switch (provider) {
    case 'microsoft': return new OAuthProvider('microsoft.com');
    case 'github': return new OAuthProvider('github.com');
    case 'gitlab': return new OAuthProvider(import.meta.env.PUBLIC_GITLAB_ISSUER_URL || 'gitlab.com');
    case 'google': default: return new GoogleAuthProvider();
  }
}
export const authProvider = createAuthProvider();
export const authProviderName = import.meta.env.PUBLIC_AUTH_PROVIDER || 'google';

// Exportar funciones comunes
export { ref, push, set, onValue };