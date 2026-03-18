import { databaseFirestore, doc, setDoc, vapidKey, auth, messaging } from '../../../firebase-config.js';
import { getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";
import { serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { PushNotificationStyles } from './push-notification-styles.js';

/**
 * Componente web personalizado para manejar notificaciones push.
 * @class
 * @extends HTMLElement
 * @property {boolean} isAuthenticated - Indica si el usuario está autenticado
 * @property {number} retryCount - Contador de reintentos para obtener el token
 * @property {number} maxRetries - Número máximo de reintentos permitidos
 * @property {HTMLElement} notification - Elemento DOM que muestra la notificación
 */
class PushNotification extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        ${PushNotificationStyles}
      </style>
      <div class="notification">
        <slot></slot>
      </div>
    `;
    this.notification = this.shadowRoot.querySelector('.notification');
    this.isAuthenticated = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Se ejecuta cuando el elemento es conectado al DOM.
   * Inicializa los listeners de autenticación y estado de conexión.
   * @returns {void}
   */
  connectedCallback() {
    this.setupAuthListener();
    this.setupOnlineListener();
  }

  /**
   * Configura los listeners para detectar cambios en el estado de la conexión.
   * @returns {void}
   */
  setupOnlineListener() {
    window.addEventListener('online', () => {
if (this.isAuthenticated) {
        this.requestPermission();
      }
    });

    window.addEventListener('offline', () => {
});
  }

  /**
   * Configura el listener para detectar cambios en el estado de autenticación.
   * @returns {void}
   */
  setupAuthListener() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
this.isAuthenticated = true;
        this.retryCount = 0;
        await this.requestPermission();
      } else {
this.isAuthenticated = false;
      }
    });
  }

  /**
   * Solicita permiso al usuario para mostrar notificaciones.
   * @returns {Promise<void>}
   */
  async requestPermission() {
    if (!this.isAuthenticated) {
return;
    }

    if (!navigator.onLine) {
return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.getToken();
      }
    } catch (error) {
      // Silently ignore permission errors
    }
  }

  /**
   * Obtiene el token FCM para el dispositivo actual.
   * @returns {Promise<void>}
   */
  async getToken() {
    if (!this.isAuthenticated) {
return;
    }

    if (!navigator.onLine) {
return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
return;
      }
      // Refresh token to ensure authentication is valid
      await currentUser.getIdToken(true);
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const currentToken = await getToken(messaging, { 
        vapidKey,
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
await this.saveToken(currentToken);
        this.setupMessageListener();
      } else {
if (this.retryCount < this.maxRetries) {
          this.retryCount++;
setTimeout(() => this.getToken(), 2000 * this.retryCount);
        }
      }
    } catch (error) {
if (error.code === 'messaging/token-subscribe-failed' && this.retryCount < this.maxRetries) {
        this.retryCount++;
setTimeout(() => this.getToken(), 2000 * this.retryCount);
      }
    }
  }

  /**
   * Guarda el token FCM en Firestore.
   * @param {string} token - Token FCM a guardar
   * @returns {Promise<void>}
   */
  async saveToken(token) {
    if (!navigator.onLine) {
return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const tokenRef = doc(databaseFirestore, 'fcmTokens', currentUser.uid);
      await setDoc(tokenRef, { 
        token,
        userId: currentUser.uid,
        email: currentUser.email,
        createdAt: serverTimestamp()
      }, { merge: true });
} catch (error) {
if (error.code === 'unavailable' && this.retryCount < this.maxRetries) {
        this.retryCount++;
setTimeout(() => this.saveToken(token), 2000 * this.retryCount);
      }
    }
  }

  /**
   * Configura el listener para recibir mensajes en primer plano.
   * @returns {void}
   */
  setupMessageListener() {
    onMessage(messaging, (payload) => {
if (payload && payload.notification) {
        this.showNotification(payload);
      }
    });
  }

  /**
   * Muestra una notificación en la interfaz.
   * @param {Object} payload - Payload de la notificación
   * @param {Object} payload.notification - Datos de la notificación
   * @param {string} payload.notification.body - Cuerpo del mensaje
   * @returns {void}
   */
  showNotification(payload) {
    if (!payload || !payload.notification) {
return;
    }

    this.textContent = payload.notification.body || 'Nueva notificación';
    this.style.transform = 'translate(-50%, 20px)';
    setTimeout(() => {
      this.style.transform = 'translate(-50%, -100%)';
    }, 5000);
  }
}

customElements.define('push-notification', PushNotification);
