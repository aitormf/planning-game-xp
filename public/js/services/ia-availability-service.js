import { ref, get, onValue } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js';
import { database } from '../../firebase-config.js';
import { IA_CONFIG } from '../../ia-config.js';
class IaAvailabilityService {
  constructor() {
    this.available = IA_CONFIG?.fallbackEnabled || true;
    this.initialized = false;
    this._initPromise = null;
  }

  isAvailable() {
    return this.available;
  }

  async ensureInitialized() {
    if (this.initialized) {
      return this.available;
    }
    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = this._loadAvailability();
    return this._initPromise;
  }

  async _loadAvailability() {
    try {
      const cfgRef = ref(database, '/config/ia/enabled');
      const snap = await get(cfgRef);
      if (snap.exists()) {
        this.available = Boolean(snap.val());
      }
      // Suscripción para cambios futuros
      onValue(cfgRef, (valSnap) => {
        if (valSnap.exists()) {
          this.available = Boolean(valSnap.val());
        }
      });
      this.initialized = true;
} catch (err) {
this.available = IA_CONFIG?.fallbackEnabled || true;
      this.initialized = true;
    }
    return this.available;
  }
}

export const iaAvailabilityService = new IaAvailabilityService();
