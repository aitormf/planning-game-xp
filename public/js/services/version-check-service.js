/**
 * Version Check Service - Monitors Firebase RTDB for version changes
 * When a new version is deployed, notifies users in real-time to refresh
 */
import { database, ref, onValue, get } from '../../firebase-config.js';

class VersionCheckService {
  constructor() {
    this._currentVersion = null;
    this._unsubscribe = null;
    this._initialized = false;
  }

  /**
   * Initialize the service and start listening for version changes
   * @param {string} currentVersion - The current app version from build
   */
  init(currentVersion) {
    if (this._initialized) return;

    this._currentVersion = currentVersion;
    this._initialized = true;

    this._startListening();
  }

  /**
   * Start listening to version changes in Firebase RTDB
   */
  _startListening() {
    const versionRef = ref(database, '/appConfig/currentVersion');

    // First, get initial value to avoid false positive on first load
    get(versionRef).then((snapshot) => {
      const serverVersion = snapshot.val();

      // If server version doesn't exist yet, ignore
      if (!serverVersion) {
        console.warn('[VersionCheckService] No server version found in /appConfig/currentVersion');
        return;
      }

      // If server version is different from current, user has an outdated version
      // Show the update modal immediately
      if (serverVersion !== this._currentVersion) {
        console.log(`[VersionCheckService] Version mismatch on load: local=${this._currentVersion}, server=${serverVersion}`);
        this._notifyNewVersion(serverVersion);
      }

      // Now start listening for changes
      this._unsubscribe = onValue(versionRef, (snapshot) => {
        const newVersion = snapshot.val();

        if (!newVersion) return;

        // Check if version changed from what we know
        if (newVersion !== this._currentVersion) {
          console.log(`[VersionCheckService] New version detected: ${newVersion} (current: ${this._currentVersion})`);
          this._notifyNewVersion(newVersion);
        }
      });
    }).catch((error) => {
      console.error('[VersionCheckService] Error getting initial version:', error);
    });
  }

  /**
   * Notify the app that a new version is available
   * @param {string} newVersion - The new version string
   */
  _notifyNewVersion(newVersion) {
    document.dispatchEvent(new CustomEvent('app-version-update-required', {
      detail: {
        currentVersion: this._currentVersion,
        newVersion: newVersion,
        timestamp: Date.now()
      }
    }));
  }

  /**
   * Stop listening for version changes
   */
  destroy() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    this._initialized = false;
  }

  /**
   * Get the current version
   */
  get currentVersion() {
    return this._currentVersion;
  }
}

// Singleton instance
export const versionCheckService = new VersionCheckService();
