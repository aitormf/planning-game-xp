import { LitElement, html, css } from 'lit';
import { ThemeManagerService } from '../services/theme-manager-service.js';

/**
 * ThemeToggle component
 *
 * A button that toggles between light and dark themes.
 * Shows sun icon for light mode, moon icon for dark mode.
 */
class ThemeToggle extends LitElement {
  static properties = {
    isDark: { type: Boolean, state: true }
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
    }

    .toggle-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 45px;
      height: 45px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.2s ease;
    }

    .toggle-button:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.05);
    }

    .toggle-button:active {
      transform: scale(0.95);
    }

    .toggle-button:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }

    .icon {
      width: 30px;
      height: 30px;
      object-fit: contain;
      transition: transform 0.3s ease;
      pointer-events: none;
    }

    .toggle-button:hover .icon {
      transform: scale(1.15);
    }
  `;

  constructor() {
    super();
    this.isDark = false;
    this._handleThemeChange = this._handleThemeChange.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    // Get initial theme state
    this.isDark = ThemeManagerService.isDarkMode();
    // Listen for theme changes
    document.addEventListener('theme-change', this._handleThemeChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('theme-change', this._handleThemeChange);
  }

  _handleThemeChange(event) {
    this.isDark = event.detail.isDark;
  }

  _toggleTheme() {
    ThemeManagerService.toggleDarkMode();
  }

  render() {
    const title = this.isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
    const iconSrc = this.isDark ? '/images/light-mode.svg' : '/images/dark-mode.svg';

    return html`
      <button
        class="toggle-button"
        @click="${this._toggleTheme}"
        title="${title}"
        aria-label="${title}"
      >
        <img class="icon" src="${iconSrc}" alt="">
      </button>
    `;
  }
}

customElements.define('theme-toggle', ThemeToggle);

export { ThemeToggle };
