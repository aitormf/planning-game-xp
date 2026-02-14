import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { version } from '../version.js';

export class AppFooter extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        background: #4a9eff;
        color: white;
        padding: 0.1rem;
        text-align: center;
        box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
        position: fixed;
        width: 100%;
        bottom: 0;
        z-index: 1000;
        border-top: 2px solid #357ae8;
        font-weight: bold;
      }

      .footer-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .footer-left {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .footer-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .version {
        background: #ec3e95;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 500;
        font-size: 0.8rem;
      }

      .copyright {
        color: white;
        font-size: 0.8rem;
        font-weight: bold;
      }

      @media (max-width: 768px) {
        .footer-content {
          flex-direction: column;
          text-align: center;
        }
        
        .footer-left,
        .footer-right {
          justify-content: center;
        }
      }
    `;
  }

  render() {
    return html`
      <footer>
        <div class="footer-content">
          <div class="footer-left">
            <span class="copyright">© ${new Date().getFullYear()} Geniova Technologies - Planning Game XP</span>
          </div>
          <div class="footer-right">
            <span class="version">v${version}</span>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define('app-footer', AppFooter);