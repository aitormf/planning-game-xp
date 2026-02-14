import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { updateService } from '../services/update-service.js';

export class UpdateManager extends LitElement {
  static get properties() {
    return {
      updateAvailable: { type: Object },
      updateStatus: { type: String }, // 'checking', 'available', 'downloading', 'installing', 'complete', 'error'
      progress: { type: Number },
      error: { type: String },
      showModal: { type: Boolean },
      autoMode: { type: Boolean }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .update-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4a9eff, #0066cc);
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 350px;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .update-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .update-icon {
        font-size: 20px;
      }

      .update-title {
        font-weight: 600;
        font-size: 16px;
      }

      .update-message {
        font-size: 14px;
        margin-bottom: 12px;
        opacity: 0.9;
      }

      .update-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-primary {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .btn-primary:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .btn-secondary {
        background: transparent;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        background: white;
        transition: width 0.3s ease;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
      }

      .modal {
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }

      .modal-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .modal-title {
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }

      .modal-content {
        color: #666;
        line-height: 1.5;
        margin-bottom: 20px;
      }

      .update-details {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 6px;
        margin: 12px 0;
        font-size: 14px;
      }

      .version-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .changelog {
        max-height: 200px;
        overflow-y: auto;
        font-size: 13px;
        color: #555;
      }

      .error-message {
        background: #fee;
        color: #c33;
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid #c33;
        margin: 12px 0;
      }

      .success-message {
        background: #efe;
        color: #363;
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid #363;
        margin: 12px 0;
      }

      .close-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
      }

      .close-btn:hover {
        color: #333;
      }

      .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .hidden {
        display: none;
      }
    `;
  }

  constructor() {
    super();
    this.updateAvailable = null;
    this.updateStatus = 'idle';
    this.progress = 0;
    this.error = '';
    this.showModal = false;
    this.autoMode = false;
    
    this.bindEventListeners();
  }

  bindEventListeners() {
    document.addEventListener('update-available', (e) => {
      this.updateAvailable = e.detail;
      this.updateStatus = 'available';
      this.requestUpdate();
    });

    document.addEventListener('update-download-started', () => {
      this.updateStatus = 'downloading';
      this.progress = 0;
      this.requestUpdate();
    });

    document.addEventListener('update-download-completed', () => {
      this.updateStatus = 'downloaded';
      this.progress = 100;
      this.requestUpdate();
    });

    document.addEventListener('update-installation-started', () => {
      this.updateStatus = 'installing';
      this.progress = 0;
      this.requestUpdate();
    });

    document.addEventListener('update-installation-completed', () => {
      this.updateStatus = 'complete';
      this.progress = 100;
      this.requestUpdate();
    });

    document.addEventListener('update-reload-required', () => {
      this.showReloadPrompt();
    });

    document.addEventListener('update-download-failed', (e) => {
      this.updateStatus = 'error';
      this.error = e.detail.error;
      this.requestUpdate();
    });

    document.addEventListener('update-installation-failed', (e) => {
      this.updateStatus = 'error';
      this.error = e.detail.error;
      this.requestUpdate();
    });
  }

  async checkForUpdates() {
    this.updateStatus = 'checking';
    this.requestUpdate();
    
    try {
      const update = await updateService.manualUpdateCheck();
      if (!update) {
        this.updateStatus = 'up-to-date';
        setTimeout(() => {
          this.updateStatus = 'idle';
          this.requestUpdate();
        }, 2000);
      }
    } catch (error) {
      this.updateStatus = 'error';
      this.error = error.message;
    }
    
    this.requestUpdate();
  }

  async installUpdate() {
    if (!this.updateAvailable) return;
    
    try {
      await updateService.manualInstall(this.updateAvailable);
    } catch (error) {
      // Silently ignore update installation errors
    }
  }

  showUpdateModal() {
    this.showModal = true;
    this.requestUpdate();
  }

  hideUpdateModal() {
    this.showModal = false;
    this.requestUpdate();
  }

  dismissUpdate() {
    this.updateAvailable = null;
    this.updateStatus = 'idle';
    this.hideUpdateModal();
  }

  showReloadPrompt() {
    if (confirm('Actualización completada. ¿Recargar la página para aplicar los cambios?')) {
      this._hardRefresh();
    }
  }

  /**
   * Force a hard refresh by clearing all caches and reloading with cache-busting parameter
   */
  async _hardRefresh() {
    // Clear service worker caches to ensure fresh content
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (e) {
        // Ignore cache clear errors
      }
    }

    // Unregister service workers to force fresh registration
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      } catch (e) {
        // Ignore SW unregister errors
      }
    }

    // Force hard refresh by adding cache-busting parameter
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now());
    window.location.replace(url.toString());
  }

  renderNotification() {
    if (!this.updateAvailable && this.updateStatus === 'idle') {
      return html``;
    }

    let icon = '🔄';
    let title = 'Verificando actualizaciones...';
    let message = '';
    let actions = html``;

    switch (this.updateStatus) {
      case 'checking':
        icon = '🔍';
        title = 'Verificando actualizaciones...';
        message = 'Buscando nuevas versiones disponibles';
        actions = html`<div class="spinner"></div>`;
        break;

      case 'available':
        icon = '✨';
        title = 'Actualización disponible';
        message = `Nueva versión ${this.updateAvailable.version} disponible`;
        actions = html`
          <button class="btn btn-secondary" @click=${this.dismissUpdate}>Omitir</button>
          <button class="btn btn-primary" @click=${this.showUpdateModal}>Ver detalles</button>
        `;
        break;

      case 'downloading':
        icon = '📥';
        title = 'Descargando actualización...';
        message = 'Preparando la nueva versión';
        actions = html`<div class="spinner"></div>`;
        break;

      case 'downloaded':
        icon = '📦';
        title = 'Actualización descargada';
        message = 'Lista para instalar';
        actions = html`
          <button class="btn btn-secondary" @click=${this.dismissUpdate}>Más tarde</button>
          <button class="btn btn-primary" @click=${this.installUpdate}>Instalar</button>
        `;
        break;

      case 'installing':
        icon = '🔧';
        title = 'Instalando actualización...';
        message = 'Aplicando cambios, no cerrar la aplicación';
        actions = html`<div class="spinner"></div>`;
        break;

      case 'complete':
        icon = '✅';
        title = 'Actualización completada';
        message = 'Recarga la página para ver los cambios';
        actions = html`
          <button class="btn btn-primary" @click=${() => this._hardRefresh()}>Recargar</button>
        `;
        break;

      case 'up-to-date':
        icon = '✅';
        title = 'Aplicación actualizada';
        message = 'Tienes la versión más reciente';
        actions = html``;
        break;

      case 'error':
        icon = '❌';
        title = 'Error en actualización';
        message = this.error || 'Ocurrió un error durante la actualización';
        actions = html`
          <button class="btn btn-secondary" @click=${this.dismissUpdate}>Cerrar</button>
          <button class="btn btn-primary" @click=${this.checkForUpdates}>Reintentar</button>
        `;
        break;
    }

    return html`
      <div class="update-notification">
        <div class="update-header">
          <span class="update-icon">${icon}</span>
          <span class="update-title">${title}</span>
        </div>
        <div class="update-message">${message}</div>
        ${this.progress > 0 && this.progress < 100 ? html`
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.progress}%"></div>
          </div>
        ` : ''}
        <div class="update-actions">${actions}</div>
      </div>
    `;
  }

  renderModal() {
    if (!this.showModal || !this.updateAvailable) {
      return html``;
    }

    return html`
      <div class="modal-overlay" @click=${this.hideUpdateModal}>
        <div class="modal" @click=${(e) => e.stopPropagation()}>
          <button class="close-btn" @click=${this.hideUpdateModal}>×</button>
          
          <div class="modal-header">
            <span class="update-icon">✨</span>
            <span class="modal-title">Actualización Disponible</span>
          </div>
          
          <div class="modal-content">
            <div class="update-details">
              <div class="version-info">
                <span><strong>Versión actual:</strong> ${updateService.currentVersion}</span>
                <span><strong>Nueva versión:</strong> ${this.updateAvailable.version}</span>
              </div>
              <div class="version-info">
                <span><strong>Tamaño:</strong> ${this.formatSize(this.updateAvailable.size)}</span>
                <span><strong>Fecha:</strong> ${this.formatDate(this.updateAvailable.date)}</span>
              </div>
            </div>

            ${this.updateAvailable.changelog ? html`
              <div class="changelog">
                <strong>Cambios en esta versión:</strong>
                <div style="margin-top: 8px;">
                  ${this.updateAvailable.changelog.split('\n').map(line => 
                    html`<div>• ${line}</div>`
                  )}
                </div>
              </div>
            ` : ''}

            <p>Esta actualización incluye mejoras y correcciones. Se instalará automáticamente sin afectar tu configuración.</p>
          </div>

          <div class="update-actions">
            <button class="btn btn-secondary" @click=${this.hideUpdateModal}>Más tarde</button>
            <button class="btn btn-primary" @click=${this.installUpdate}>Instalar ahora</button>
          </div>
        </div>
      </div>
    `;
  }

  formatSize(bytes) {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  render() {
    return html`
      ${this.renderNotification()}
      ${this.renderModal()}
    `;
  }
}

customElements.define('update-manager', UpdateManager);