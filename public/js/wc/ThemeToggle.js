import { LitElement, html, css } from 'lit';
import { ThemeManagerService } from '../services/theme-manager-service.js';
import './avatar-eyes.js';

/**
 * ThemeToggle component
 *
 * A button that toggles between light and dark themes.
 * Uses the <avatar-eyes> component with mouse-tracking pupils.
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
      background: transparent;
      cursor: pointer;
      transition: transform 0.2s ease;
      overflow: hidden;
    }

    .toggle-button:hover {
      transform: scale(1.05);
    }

    .toggle-button:active {
      transform: scale(0.95);
    }

    .toggle-button:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }
  `;

  constructor() {
    super();
    this.isDark = false;
    this._handleThemeChange = this._handleThemeChange.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.isDark = ThemeManagerService.isDarkMode();
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
    const mode = this.isDark ? 'dark' : 'light';

    return html`
      <button
        class="toggle-button"
        @click="${this._toggleTheme}"
        title="${title}"
        aria-label="${title}"
      >
        <avatar-eyes mode="${mode}" size="45px"></avatar-eyes>
      </button>
    `;
  }
}

customElements.define('theme-toggle', ThemeToggle);

export { ThemeToggle };
