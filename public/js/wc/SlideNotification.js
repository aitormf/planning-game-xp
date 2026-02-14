import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit-html@3.0.2/directives/unsafe-html.js';
import { SlideNotificationStyles } from './slide-notification-styles.js';

class SlideNotification extends LitElement {
  static properties = {
    title: { type: String },
    message: { type: String },
    timetohide: { type: Number },
    backgroundColor: { type: String },
    type: { type: String }
  };

  static styles = SlideNotificationStyles;

  constructor(options) {
    super();
    this.title = options?.title || 'Notification';
    this.message = options?.message || 'This is a notification';
    this.timetohide = options?.timetohide || 3000;
    this.type = options?.type || 'info';
    
    // Define colors based on project criteria: blue=ok, yellow=warning, red=critical
    const colors = {
      error: '#dc3545',     // Rojo para errores críticos
      success: '#2196F3',   // Azul para todo ok
      warning: '#ffc107',   // Amarillo para advertencias
      info: '#17a2b8'       // Azul más claro para info
    };
    
    this.backgroundColor = options?.backgroundColor || colors[this.type] || colors.info;
  }

  connectedCallback() {
    super.connectedCallback();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.classList.add('visible');
      });

      setTimeout(() => {
        this.hideNotification();
      }, this.timetohide);
    });
  }

  hideNotification() {
    requestAnimationFrame(() => {
      const style = document.createElement('style');
      style.textContent = `:host { transform: translateX(320px) !important; }`;
      this.shadowRoot.appendChild(style);
    });
    setTimeout(() => this.remove(), 600); // Espera la animación completa antes de eliminar
  }

  render() {
    // Determine text color based on background (yellow warnings need dark text)
    const textColor = this.type === 'warning' ? '#212529' : 'white';
    
    // Iconos por tipo
    const icons = {
      error: '❌',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️'
    };
    const icon = icons[this.type] || icons.info;
    
    // Set CSS custom properties directly on the host
    this.style.setProperty('--notification-bg', this.backgroundColor);
    this.style.setProperty('--notification-color', textColor);
    this.style.setProperty('--text-shadow', this.type === 'warning' ? '1px 1px 2px rgba(0, 0, 0, 0.3)' : '1px 1px 2px rgba(0, 0, 0, 0.5)');
    
    return html`
      <div class="title">${this.title}</div>
      <div class="notification-content">
        <span class="icon">${icon}</span>
        <div class="message">${unsafeHTML(this.message)}</div>
      </div>
    `;
  }
}

customElements.define('slide-notification', SlideNotification);

export function showSlideNotification(options = { title: '', message: 'Notification', timetohide: 3000, type: 'info' }) {
  const notification = document.createElement('slide-notification');
  notification.title = options?.title || '';
  notification.message = options?.message || 'Notification';
  notification.timetohide = options?.timetohide || 3000;
  notification.type = options?.type || 'info';
  
  // Define colors based on project criteria: blue=ok, yellow=warning, red=critical
  const colors = {
    error: '#dc3545',     // Rojo para errores críticos
    success: '#2196F3',   // Azul para todo ok
    warning: '#ffc107',   // Amarillo para advertencias
    info: '#17a2b8'       // Azul más claro para info
  };
  
  notification.backgroundColor = options?.backgroundColor || colors[notification.type] || colors.info;
  document.body.appendChild(notification);
}
