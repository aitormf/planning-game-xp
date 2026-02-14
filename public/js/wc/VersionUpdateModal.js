import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

/**
 * Version Update Modal - Shows when a new app version is deployed
 * Displays a countdown timer and forces refresh after timeout
 */
export class VersionUpdateModal extends LitElement {
  static get properties() {
    return {
      visible: { type: Boolean },
      currentVersion: { type: String },
      newVersion: { type: String },
      countdown: { type: Number },
      paused: { type: Boolean }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal {
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          transform: translateY(30px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .icon {
        font-size: 64px;
        margin-bottom: 16px;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .title {
        font-size: 24px;
        font-weight: 700;
        color: #1a1a2e;
        margin-bottom: 12px;
      }

      .message {
        font-size: 16px;
        color: #666;
        margin-bottom: 24px;
        line-height: 1.5;
      }

      .version-info {
        display: flex;
        justify-content: center;
        gap: 24px;
        margin-bottom: 24px;
        font-size: 14px;
      }

      .version-badge {
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 500;
      }

      .version-old {
        background: #fee2e2;
        color: #dc2626;
      }

      .version-new {
        background: #d1fae5;
        color: #059669;
      }

      .countdown-container {
        margin-bottom: 24px;
      }

      .countdown-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
        position: relative;
      }

      .countdown-circle::before {
        content: '';
        position: absolute;
        inset: 4px;
        border-radius: 50%;
        background: white;
      }

      .countdown-number {
        font-size: 36px;
        font-weight: 700;
        color: #667eea;
        position: relative;
        z-index: 1;
      }

      .countdown-text {
        font-size: 14px;
        color: #888;
      }

      .countdown-paused {
        color: #f59e0b;
        font-weight: 500;
      }

      .actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .btn {
        padding: 14px 28px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 140px;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .btn-secondary {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      }

      .btn-secondary:hover {
        background: #e5e7eb;
      }

      .hidden {
        display: none;
      }
    `;
  }

  constructor() {
    super();
    this.visible = false;
    this.currentVersion = '';
    this.newVersion = '';
    this.countdown = 30;
    this.paused = false;
    this._countdownInterval = null;

    this._handleVersionUpdate = this._handleVersionUpdate.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('app-version-update-required', this._handleVersionUpdate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('app-version-update-required', this._handleVersionUpdate);
    this._stopCountdown();
  }

  _handleVersionUpdate(event) {
    const { currentVersion, newVersion } = event.detail;
    this.currentVersion = currentVersion;
    this.newVersion = newVersion;
    this.countdown = 30;
    this.paused = false;
    this.visible = true;
    this._startCountdown();
  }

  _startCountdown() {
    this._stopCountdown();

    this._countdownInterval = setInterval(() => {
      if (!this.paused) {
        this.countdown--;

        if (this.countdown <= 0) {
          this._doRefresh();
        }
      }
    }, 1000);
  }

  _stopCountdown() {
    if (this._countdownInterval) {
      clearInterval(this._countdownInterval);
      this._countdownInterval = null;
    }
  }

  _pauseCountdown() {
    this.paused = true;
  }

  _resumeCountdown() {
    this.paused = false;
  }

  async _doRefresh() {
    this._stopCountdown();

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

    // Clear localStorage cache data
    try {
      localStorage.removeItem('cache-manager-backup');
    } catch (e) {
      // Ignore localStorage errors
    }

    // Force hard refresh - preserve existing query params and add cache busting
    const url = new URL(window.location.href);
    url.searchParams.set('_nocache', Date.now().toString());
    window.location.href = url.toString();
  }

  _handleCancel() {
    this._pauseCountdown();
    this.visible = false;
    this._stopCountdown();

    // Show a reminder notification
    const notification = document.createElement('slide-notification');
    notification.message = `Nueva versión ${this.newVersion} disponible. Recarga cuando puedas.`;
    notification.type = 'warning';
    notification.duration = 10000;
    document.body.appendChild(notification);
  }

  _handleUpdate() {
    this._doRefresh();
  }

  render() {
    if (!this.visible) {
      return html``;
    }

    return html`
      <div class="overlay">
        <div class="modal">
          <div class="icon">🚀</div>

          <h2 class="title">Nueva versión de Planning Game</h2>

          <p class="message">
            Se ha desplegado una nueva versión de la aplicación.
            Es necesario recargar para continuar trabajando correctamente.
          </p>

          <div class="version-info">
            <span class="version-badge version-old">
              Actual: v${this.currentVersion}
            </span>
            <span class="version-badge version-new">
              Nueva: v${this.newVersion}
            </span>
          </div>

          <div class="countdown-container">
            <div class="countdown-circle">
              <span class="countdown-number">${this.countdown}</span>
            </div>
            <p class="countdown-text ${this.paused ? 'countdown-paused' : ''}">
              ${this.paused
                ? 'Cuenta pausada'
                : `Recarga automática en ${this.countdown} segundos`}
            </p>
          </div>

          <div class="actions">
            <button class="btn btn-secondary" @click=${this._handleCancel}>
              Cancelar
            </button>
            <button class="btn btn-primary" @click=${this._handleUpdate}>
              Actualizar ahora
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('version-update-modal', VersionUpdateModal);
