/**
 * Update Service - Maneja las actualizaciones automáticas de la aplicación
 * Soporta actualizaciones modulares sin afectar configuraciones del cliente
 */
import { CLIENT_CONFIG } from '../config/client-config.js';

export class UpdateService {
  constructor() {
    this.currentVersion = null;
    this.updateCheckInterval = null;
    this.updateInProgress = false;
    this.backupCreated = false;
    this._initPromise = null;

    // Configuración por defecto
    this.config = {
      checkInterval: 24 * 60 * 60 * 1000, // 24 horas
      autoCheck: true,
      autoDownload: false,
      autoInstall: false,
      backupBeforeUpdate: true,
      updateServer: CLIENT_CONFIG?.updateServer || 'https://api.planninggame.com',
      maxRetries: 3
    };
  }

  async init() {
    if (this._initPromise) return this._initPromise;

    this._initPromise = this._doInit();
    return this._initPromise;
  }

  async _doInit() {
    try {
      await this.loadCurrentVersion();

      if (this.config.autoCheck) {
        this.startUpdateChecker();
      }
    } catch (error) {
      // Silent initialization failure
    }
  }
  
  async loadCurrentVersion() {
    try {
      // Intentar cargar desde manifest local
      const response = await fetch('/update-manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        this.currentVersion = manifest.version;
      } else {
        // Fallback al package.json version
        this.currentVersion = '1.0.0'; // Default
      }
} catch (error) {
this.currentVersion = '1.0.0';
    }
  }
  
  startUpdateChecker() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
    
    // Check immediately, then at intervals
    this.checkForUpdates();
    
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.config.checkInterval);
}
  
  stopUpdateChecker() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
}
  }
  
  async checkForUpdates() {
    try {
const response = await fetch(`${this.config.updateServer}/updates/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentVersion: this.currentVersion,
          instanceId: CLIENT_CONFIG?.instanceId,
          type: CLIENT_CONFIG?.type
        })
      });
      
      if (!response.ok) {
        throw new Error(`Update check failed: ${response.status}`);
      }
      
      const updateInfo = await response.json();
      
      if (updateInfo.available) {
// Emit update available event
        document.dispatchEvent(new CustomEvent('update-available', {
          detail: updateInfo
        }));
        
        if (this.config.autoDownload) {
          await this.downloadUpdate(updateInfo);
        }
        
        return updateInfo;
      } else {
return null;
      }
      
    } catch (error) {
return null;
    }
  }
  
  async downloadUpdate(updateInfo) {
    try {
      if (this.updateInProgress) {
return false;
      }
      
      this.updateInProgress = true;
// Emit download started event
      document.dispatchEvent(new CustomEvent('update-download-started', {
        detail: updateInfo
      }));
      
      const response = await fetch(updateInfo.downloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const updateBlob = await response.blob();
      
      // Store in IndexedDB or similar for later installation
      await this.storeUpdate(updateInfo, updateBlob);
// Emit download completed event
      document.dispatchEvent(new CustomEvent('update-download-completed', {
        detail: updateInfo
      }));
      
      if (this.config.autoInstall) {
        await this.installUpdate(updateInfo);
      }
      
      return true;
      
    } catch (error) {
// Emit download failed event
      document.dispatchEvent(new CustomEvent('update-download-failed', {
        detail: { updateInfo, error: error.message }
      }));
      
      return false;
    } finally {
      this.updateInProgress = false;
    }
  }
  
  async installUpdate(updateInfo) {
    try {
      if (this.updateInProgress) {
return false;
      }
      
      this.updateInProgress = true;
// Emit installation started event
      document.dispatchEvent(new CustomEvent('update-installation-started', {
        detail: updateInfo
      }));
      
      // Create backup if enabled
      if (this.config.backupBeforeUpdate && !this.backupCreated) {
        await this.createBackup();
      }
      
      // Get stored update
      const updateBlob = await this.getStoredUpdate(updateInfo.version);
      if (!updateBlob) {
        throw new Error('Update package not found');
      }
      
      // Extract and apply update
      await this.applyUpdate(updateBlob, updateInfo);
      
      // Update current version
      this.currentVersion = updateInfo.version;
      await this.saveCurrentVersion();
// Emit installation completed event
      document.dispatchEvent(new CustomEvent('update-installation-completed', {
        detail: updateInfo
      }));
      
      // Clear caches
      await this.clearCaches();
      
      // Notify user to reload
      document.dispatchEvent(new CustomEvent('update-reload-required', {
        detail: updateInfo
      }));
      
      return true;
      
    } catch (error) {
// Attempt rollback
      await this.rollback();
      
      // Emit installation failed event
      document.dispatchEvent(new CustomEvent('update-installation-failed', {
        detail: { updateInfo, error: error.message }
      }));
      
      return false;
    } finally {
      this.updateInProgress = false;
    }
  }
  
  async createBackup() {
    try {
// Simple backup - store current version info
      const backup = {
        version: this.currentVersion,
        timestamp: Date.now(),
        url: window.location.href
      };
      
      localStorage.setItem('planning-game-backup', JSON.stringify(backup));
      this.backupCreated = true;
} catch (error) {
throw error;
    }
  }
  
  async rollback() {
    try {
const backup = localStorage.getItem('planning-game-backup');
      if (!backup) {
return false;
      }
      
      const backupData = JSON.parse(backup);
// In a real implementation, this would restore files
      // For now, we just reset the version
      this.currentVersion = backupData.version;
return true;
      
    } catch (error) {
return false;
    }
  }
  
  async storeUpdate(updateInfo, updateBlob) {
    // Store in IndexedDB for offline installation
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PlanningGameUpdates', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['updates'], 'readwrite');
        const store = transaction.objectStore('updates');
        
        store.put({
          version: updateInfo.version,
          data: updateBlob,
          info: updateInfo,
          timestamp: Date.now()
        });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('updates', { keyPath: 'version' });
      };
    });
  }
  
  async getStoredUpdate(version) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PlanningGameUpdates', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['updates'], 'readonly');
        const store = transaction.objectStore('updates');
        const getRequest = store.get(version);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.data);
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }
  
  async applyUpdate(updateBlob, updateInfo) {
    // In a real implementation, this would:
    // 1. Extract the ZIP file
    // 2. Validate the contents
    // 3. Replace core files (excluding config files)
    // 4. Update the service worker
    
    
    // Mock delay for demonstration
    await new Promise(resolve => setTimeout(resolve, 2000));
}
  
  async saveCurrentVersion() {
    try {
      const manifest = {
        version: this.currentVersion,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('planning-game-version', JSON.stringify(manifest));
    } catch (error) {
      // Silently ignore manifest save errors
    }
  }

  async clearCaches() {
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear browser cache for static assets
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
      }
    } catch (error) {
      // Silently ignore cache clear errors
    }
  }
  
  // Public API methods
  async manualUpdateCheck() {
    return await this.checkForUpdates();
  }
  
  async manualInstall(updateInfo) {
    return await this.installUpdate(updateInfo);
  }
  
  getUpdateStatus() {
    return {
      currentVersion: this.currentVersion,
      updateInProgress: this.updateInProgress,
      autoCheck: this.config.autoCheck,
      lastCheck: this.lastCheck
    };
  }
  
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.autoCheck !== undefined) {
      if (newConfig.autoCheck) {
        this.startUpdateChecker();
      } else {
        this.stopUpdateChecker();
      }
    }
  }
}

// Create singleton instance
export const updateService = new UpdateService();
// Initialize asynchronously (non-blocking)
updateService.init();