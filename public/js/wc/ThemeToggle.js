import { LitElement, html, css, unsafeCSS } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { ThemeManagerService } from '../services/theme-manager-service.js';

/**
 * ThemeToggle component
 *
 * A button that toggles between light and dark themes.
 * Shows sun icon for light mode, moon icon for dark mode.
 * SVGs are inlined in the DOM to support SMIL animations.
 */
class ThemeToggle extends LitElement {
  static properties = {
    isDark: { type: Boolean, state: true },
    _lightSvg: { type: String, state: true },
    _darkSvg: { type: String, state: true }
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
      pointer-events: none;
    }

    .icon svg {
      width: 100%;
      height: 100%;
    }

    .toggle-button:hover .icon {
      transform: scale(1.15);
    }
  `;

  constructor() {
    super();
    this.isDark = false;
    this._lightSvg = '';
    this._darkSvg = '';
    this._handleThemeChange = this._handleThemeChange.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.isDark = ThemeManagerService.isDarkMode();
    document.addEventListener('theme-change', this._handleThemeChange);
    this._loadSvgs();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('theme-change', this._handleThemeChange);
  }

  async _loadSvgs() {
    const [lightRes, darkRes] = await Promise.all([
      fetch('/images/light-mode.svg'),
      fetch('/images/dark-mode.svg')
    ]);
    this._lightSvg = await lightRes.text();
    this._darkSvg = await darkRes.text();
  }

  _handleThemeChange(event) {
    this.isDark = event.detail.isDark;
  }

  _toggleTheme() {
    ThemeManagerService.toggleDarkMode();
  }

  render() {
    const title = this.isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
    const svgContent = this.isDark ? this._lightSvg : this._darkSvg;

    return html`
      <button
        class="toggle-button"
        @click="${this._toggleTheme}"
        title="${title}"
        aria-label="${title}"
      >
        <span class="icon">${svgContent ? unsafeSVG(svgContent) : ''}</span>
      </button>
    `;
  }
}

customElements.define('theme-toggle', ThemeToggle);

export { ThemeToggle };
