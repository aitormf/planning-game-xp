import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { FirebaseService } from '../services/firebase-service.js';
import { storyUploadService } from '../services/story-upload-service.js';
class StoryUpload extends LitElement {
  static properties = {
    records: { state: true },
    summary: { state: true },
    error: { state: true },
    status: { state: true },
    uploading: { state: true },
    uploadResult: { state: true },
    selectedFileName: { state: true }
  };

  constructor() {
    super();
    this.records = [];
    this.summary = null;
    this.error = '';
    this.status = '';
    this.uploading = false;
    this.uploadResult = null;
    this.selectedFileName = '';
  }

  connectedCallback() {
    super.connectedCallback();
    FirebaseService.init();
  }

  render() {
    return html`
      <section class="container">
        <header>
          <h2>Importar historias de usuario</h2>
          <p>Selecciona un JSON que respete la estructura de Firebase Realtime Database (cards &rarr; TASKS).</p>
        </header>

        <div class="card">
          <label class="file-label ${this.uploading ? 'is-disabled' : ''}">
            <input
              class="file-input"
              type="file"
              accept="application/json"
              @change=${this._onFileChange}
              ?disabled=${this.uploading}
            />
            <div class="file-content">
              <span class="file-tag">JSON</span>
              <p class="file-title">
                ${this.selectedFileName || 'Haz clic o arrastra tu archivo JSON'}
              </p>
              <p class="file-subtitle">
                Sigue la estructura exportada de Firebase (cards → TASKS).
              </p>
              <span class="file-button">Seleccionar archivo</span>
            </div>
          </label>

          ${this.error ? html`<p class="error">${this.error}</p>` : null}
          ${this.status ? html`<p class="status">${this.status}</p>` : null}
        </div>

        ${this.summary ? this._renderSummary() : null}
        ${this._renderInvalidRecords()}
        ${this._renderUploadActions()}
        ${this._renderUploadResult()}
      </section>
    `;
  }

  _renderSummary() {
    const perProject = Object.entries(this.summary.perProject || {});
    return html`
      <div class="card">
        <h3>Resumen de importación</h3>
        <ul class="summary-list">
          <li>Total detectadas: ${this.summary.total}</li>
          <li>Listas para subir: ${this.summary.valid}</li>
          <li>Con errores: ${this.summary.invalid}</li>
        </ul>
        ${perProject.length ? html`
          <table>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Total</th>
                <th>Válidas</th>
                <th>Errores</th>
              </tr>
            </thead>
            <tbody>
              ${perProject.map(([projectId, stats]) => html`
                <tr>
                  <td>${projectId}</td>
                  <td>${stats.total}</td>
                  <td>${stats.valid}</td>
                  <td>${stats.invalid}</td>
                </tr>
              `)}
            </tbody>
          </table>
        ` : null}
      </div>
    `;
  }

  _renderInvalidRecords() {
    const invalidRecords = this.records.filter((record) => record.errors.length > 0);
    if (!invalidRecords.length) {
      return null;
    }

    return html`
      <div class="card warning">
        <h3>Registros con incidencias (${invalidRecords.length})</h3>
        <ul>
          ${invalidRecords.map((record, index) => html`
            <li>
              <strong>${record.card.title || 'Sin título'}:</strong>
              <span>${record.errors.join(', ')}</span>
            </li>
          `)}
        </ul>
      </div>
    `;
  }

  _renderUploadActions() {
    if (!this.summary || this.summary.valid === 0) {
      return null;
    }

    const isAuthenticated = document.body.getAttribute('data-authenticated') === 'true';
    return html`
      <div class="card actions">
        ${!isAuthenticated ? html`
          <p class="error">Inicia sesión antes de subir historias.</p>
        ` : null}
        <button class="primary" @click=${this._uploadStories} ?disabled=${!isAuthenticated || this.uploading}>
          ${this.uploading ? 'Subiendo…' : 'Subir historias'}
        </button>
      </div>
    `;
  }

  _renderUploadResult() {
    if (!this.uploadResult) {
      return null;
    }

    const { uploaded, toUpload, failed } = this.uploadResult;
    return html`
      <div class="card result">
        <h3>Resultado</h3>
        <p>Solicitadas: ${toUpload}</p>
        <p>Subidas correctamente: ${uploaded}</p>
        <p>Con errores: ${failed.length}</p>
        ${failed.length ? html`
          <details>
            <summary>Ver detalles</summary>
            <ul>
              ${failed.map((error, index) => html`
                <li>
                  <strong>${error.source?.projectId || 'Proyecto desconocido'}:</strong>
                  <span>${error.message}</span>
                </li>
              `)}
            </ul>
          </details>
        ` : null}
      </div>
    `;
  }

  async _onFileChange(event) {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    this.error = '';
    this.status = '';
    this.summary = null;
    this.records = [];
    this.uploadResult = null;
    this.selectedFileName = file ? file.name : '';

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const { records, summary } = storyUploadService.prepareRecords(parsed);
      this.records = records;
      this.summary = summary;
      this.status = `Archivo cargado: ${file.name}`;
} catch (error) {
this.error = error?.message || 'No se pudo procesar el archivo seleccionado.';
    }
  }

  async _uploadStories() {
    if (!this.records.length || this.uploading) {
      return;
    }

    this.uploading = true;
    this.error = '';

    try {
      const result = await storyUploadService.uploadStories(this.records, { silent: true });
      this.uploadResult = result;
      this.status = 'Proceso completado.';
} catch (error) {
this.error = error?.message || 'No se pudieron subir las historias.';
    } finally {
      this.uploading = false;
    }
  }

  static styles = css`
    :host {
      display: block;
      max-width: 960px;
      margin: 0 auto;
      padding: 1.5rem;
      box-sizing: border-box;
      color: var(--pg-text-color, #1f2933);
      font-family: var(--pg-font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
    }

    header h2 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
    }

    header p {
      margin: 0;
      color: var(--text-secondary, #52606d);
      font-size: 0.95rem;
    }

    .card {
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-default, #d9e2ec);
      border-radius: 12px;
      padding: 1.25rem;
      margin-top: 1rem;
      box-shadow: 0 10px 30px -20px rgba(15, 23, 42, 0.45);
    }

    .warning {
      border-color: var(--color-warning, #f59e0b);
      background: var(--color-warning-bg, #fff7e6);
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .result details {
      margin-top: 0.75rem;
    }

    label.file-label {
      position: relative;
      display: block;
      padding: 1.75rem;
      border: 2px dashed rgba(236, 62, 149, 0.4);
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(236, 62, 149, 0.05), rgba(255, 255, 255, 0.9));
      cursor: pointer;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    }

    label.file-label:hover,
    label.file-label:focus-within {
      border-color: var(--brand-secondary, #ec3e95);
      box-shadow: 0 16px 32px -24px rgba(236, 62, 149, 0.65);
      transform: translateY(-1px);
    }

    label.file-label.is-disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
      transform: none;
      box-shadow: none;
    }

    .file-input {
      display: none;
    }

    .file-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      color: var(--text-primary, #102a43);
    }

    .file-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--brand-secondary, #ec3e95);
      background: rgba(236, 62, 149, 0.12);
      border: 1px solid rgba(236, 62, 149, 0.3);
      font-weight: 700;
    }

    .file-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
      letter-spacing: -0.01em;
    }

    .file-subtitle {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-secondary, #52606d);
    }

    .file-button {
      margin-top: 1rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: var(--brand-secondary, #ec3e95);
      color: var(--text-inverse, #ffffff);
      padding: 0.55rem 1.2rem;
      border-radius: 999px;
      font-weight: 600;
      letter-spacing: 0.03em;
      box-shadow: 0 14px 28px -20px rgba(236, 62, 149, 0.65);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    label.file-label:hover .file-button,
    label.file-label:focus-within .file-button {
      transform: translateY(-1px);
      box-shadow: 0 16px 32px -20px rgba(236, 62, 149, 0.75);
    }

    .file-button::after {
      content: '↗';
      font-size: 0.85rem;
    }

    .summary-list {
      padding: 0;
      list-style: none;
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    table {
      width: 100%;
      margin-top: 1rem;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    th, td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--border-default, #edf2f7);
      text-align: left;
    }

    th {
      font-weight: 600;
      background: var(--bg-secondary, #f8fafc);
    }

    button.primary {
      background-color: var(--brand-secondary, #ec3e95);
      border: 2px solid var(--brand-secondary, #ec3e95);
      color: var(--text-inverse, #ffffff);
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      letter-spacing: 0.01em;
      box-shadow: 0 16px 32px -20px rgba(236, 62, 149, 0.45);
      transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }

    button.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 18px 36px -18px rgba(236, 62, 149, 0.55);
      background-color: var(--brand-secondary-strong, #ff5cad);
    }

    button.primary[disabled] {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    p.error {
      color: var(--color-error, #f43f5e);
      margin: 0.5rem 0 0;
    }

    p.status {
      color: var(--color-success, #10b981);
      margin: 0.5rem 0 0;
    }
  `;
}

if (!customElements.get('story-upload')) {
  customElements.define('story-upload', StoryUpload);
}
