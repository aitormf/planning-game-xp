import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { projectCardUploadService } from '../services/project-card-upload-service.js';
const TYPE_LABELS = {
  tasks: 'Tasks',
  bugs: 'Bugs',
  proposals: 'Proposals'
};

export class ProjectCardUpload extends LitElement {
  static properties = {
    projectId: { type: String, attribute: 'project-id' },
    selectedType: { state: true },
    records: { state: true },
    summary: { state: true },
    analysisError: { state: true },
    analyzing: { state: true },
    uploading: { state: true },
    statusMessage: { state: true },
    uploadReport: { state: true },
    fileName: { state: true },
    isAuthenticated: { state: true }
  };

  constructor() {
    super();
    this.projectId = '';
    this.selectedType = 'tasks';
    this.records = [];
    this.summary = null;
    this.analysisError = '';
    this.analyzing = false;
    this.uploading = false;
    this.statusMessage = '';
    this.uploadReport = null;
    this.fileName = '';
    this.isAuthenticated = document.body?.dataset?.authenticated === 'true';
    this._bodyObserver = null;
    this._projectChangeHandler = (event) => {
      const newProjectId = event.detail?.newProjectId;
      if (newProjectId && newProjectId !== this.projectId) {
        this.projectId = newProjectId;
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this._syncProjectId(true);
    this._syncAuthState(true);
    this._observeBodyProjectId();
    document.addEventListener('project-change-reload', this._projectChangeHandler);
  }

  disconnectedCallback() {
    document.removeEventListener('project-change-reload', this._projectChangeHandler);
    if (this._bodyObserver) {
      this._bodyObserver.disconnect();
      this._bodyObserver = null;
    }
    super.disconnectedCallback();
  }

  updated(changed) {
    if (changed.has('projectId')) {
      this._resetAnalysis();
    }
  }

  render() {
    const isAuthenticated = this.isAuthenticated;
    const canUpload = isAuthenticated && this.projectId && this.validRecordsCount > 0 && !this.analyzing && !this.uploading;

    return html`
      <section class="upload-container">
        <header>
          <h3>Importar ${TYPE_LABELS[this.selectedType]}</h3>
          <p>Valida y sube archivos JSON formateados según el esquema de Firebase Realtime Database.</p>
        </header>

        ${this._renderConfiguration()}
        ${this._renderDropzone()}

        ${this.analysisError ? html`<p class="error">${this.analysisError}</p>` : null}
        ${this.statusMessage ? html`<p class="status">${this.statusMessage}</p>` : null}

        ${this.summary ? this._renderSummary() : null}
        ${this._renderInvalidRecords()}

        <div class="actions">
          ${!isAuthenticated ? html`<p class="error">Inicia sesión para poder importar cards.</p>` : null}
          <button class="primary" @click=${this._uploadRecords} ?disabled=${!canUpload}>
            ${this.uploading ? 'Importando…' : `Importar ${this.validRecordsCount || ''}`.trim()}
          </button>
        </div>

        ${this.uploadReport ? this._renderReport() : null}
      </section>
    `;
  }

  _renderConfiguration() {
    return html`
      <div class="card config">
        <div class="form-group">
          <label for="typeSelect">Tipo de card</label>
          <select id="typeSelect" @change=${this._handleTypeChange} .value=${this.selectedType} ?disabled=${this.analyzing || this.uploading}>
            ${Object.entries(TYPE_LABELS).map(([value, label]) => html`
              <option value=${value}>${label}</option>
            `)}
          </select>
        </div>
        <div class="form-group">
          <label>Proyecto seleccionado</label>
          <div class="project-pill">
            ${this.projectId ? this.projectId : 'Selecciona un proyecto para habilitar la importación'}
          </div>
        </div>
      </div>
    `;
  }

  _renderDropzone() {
    const disabled = !this.projectId || this.analyzing || this.uploading;
    return html`
      <label class="card dropzone ${disabled ? 'is-disabled' : ''}">
        <input type="file" accept="application/json" @change=${this._handleFileChange} ?disabled=${disabled} />
        <div class="dropzone-body">
          <div class="badge">${TYPE_LABELS[this.selectedType]}</div>
          <p class="title">${this.fileName || 'Haz clic o arrastra tu archivo JSON'}</p>
          <p class="subtitle">
            El archivo debe contener cards de ${TYPE_LABELS[this.selectedType]} para el proyecto actual.
          </p>
          <span class="button">Seleccionar archivo</span>
        </div>
      </label>
    `;
  }

  _renderSummary() {
    return html`
      <div class="card summary">
        <h4>Resumen del análisis</h4>
        <ul>
          <li>Total detectados: ${this.summary.total}</li>
          <li>Listos para importar: ${this.summary.valid}</li>
          <li>Con incidencias: ${this.summary.invalid}</li>
        </ul>
      </div>
    `;
  }

  _renderInvalidRecords() {
    const invalidRecords = this.records.filter((record) => record.errors.length);
    if (!invalidRecords.length) {
      return null;
    }

    return html`
      <div class="card warning">
        <h4>Registros con incidencias (${invalidRecords.length})</h4>
        <ul>
          ${invalidRecords.map((record) => html`
            <li>
              <strong>${record.card.title || record.source?.firebaseKey || `Registro ${record.index + 1}`}:</strong>
              <span>${record.errors.join(' · ')}</span>
            </li>
          `)}
        </ul>
      </div>
    `;
  }

  _renderReport() {
    const { total, queued, uploaded, failed } = this.uploadReport;
    return html`
      <div class="card result">
        <h4>Resultado de la importación</h4>
        <p>Registros analizados: ${total}</p>
        <p>Peticiones enviadas: ${queued}</p>
        <p>Cards creadas: ${uploaded}</p>
        <p>Errores durante la importación: ${failed.length}</p>
        ${failed.length ? html`
          <details>
            <summary>Ver detalles de errores</summary>
            <ul>
              ${failed.map((item) => html`
                <li>
                  <strong>${item.title}</strong>
                  <span>${item.message}</span>
                </li>
              `)}
            </ul>
          </details>
        ` : null}
      </div>
    `;
  }

  get validRecordsCount() {
    return this.records.filter((record) => record.errors.length === 0).length;
  }

  _resetAnalysis() {
    this.records = [];
    this.summary = null;
    this.analysisError = '';
    this.statusMessage = '';
    this.uploadReport = null;
    this.fileName = '';
  }

  async _handleFileChange(event) {
    const file = event.target.files?.[0];
    this._resetAnalysis();
    if (!file) {
      return;
    }

    this.fileName = file.name;
    if (!this.projectId) {
      this.analysisError = 'Selecciona un proyecto antes de cargar un archivo.';
      return;
    }

    this.analyzing = true;
    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);
      const { records, summary } = await projectCardUploadService.analyzePayload(parsed, {
        projectId: this.projectId,
        targetType: this.selectedType
      });
      this.records = records;
      this.summary = summary;
      this.statusMessage = `Archivo cargado correctamente (${file.name}).`;
} catch (error) {
this.analysisError = error?.message || 'No se pudo procesar el archivo seleccionado.';
    } finally {
      this.analyzing = false;
      event.target.value = '';
    }
  }

  async _uploadRecords() {
    if (!this.validRecordsCount || this.uploading) {
      return;
    }

    this.uploading = true;
    this.analysisError = '';
    try {
      const report = await projectCardUploadService.uploadRecords(this.records, {
        projectId: this.projectId,
        targetType: this.selectedType
      });
      this.uploadReport = report;
      this.statusMessage = 'Proceso de importación finalizado.';
} catch (error) {
this.analysisError = error?.message || 'No se pudieron subir las cards.';
    } finally {
      this.uploading = false;
    }
  }

  _handleTypeChange(event) {
    this.selectedType = event.target.value;
    this._resetAnalysis();
  }

  _observeBodyProjectId() {
    if (!document.body || this._bodyObserver) {
      return;
    }
    this._bodyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type !== 'attributes') return;
        if (mutation.attributeName === 'data-project-id') {
          this._syncProjectId();
        } else if (mutation.attributeName === 'data-authenticated') {
          this._syncAuthState();
        }
      });
    });
    this._bodyObserver.observe(document.body, { attributes: true });
  }

  _syncProjectId(force = false) {
    const derived =
      document.body?.dataset?.projectId ||
      window.currentProjectId ||
      this._getProjectFromUrl();
    if (derived && (force || derived !== this.projectId)) {
      this.projectId = derived;
    }
  }

  _getProjectFromUrl() {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('projectId') || '';
    } catch {
      return '';
    }
  }

  _syncAuthState(force = false) {
    const auth = document.body?.dataset?.authenticated === 'true';
    if (force || auth !== this.isAuthenticated) {
      this.isAuthenticated = auth;
    }
  }

  static styles = css`
    :host {
      display: block;
      color: #0f172a;
    }

    .upload-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    header h3 {
      margin: 0;
    }

    .card {
      background: #fff;
      border: 1px solid #dbe2f0;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 10px 30px -20px rgba(15, 23, 42, 0.35);
    }

    .config {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .form-group {
      flex: 1;
      min-width: 220px;
    }

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.35rem;
    }

    select {
      width: 100%;
      padding: 0.6rem;
      border-radius: 8px;
      border: 1px solid #cbd5f5;
      font-size: 0.95rem;
    }

    .project-pill {
      padding: 0.65rem;
      border-radius: 999px;
      background: #eef2ff;
      border: 1px dashed #a5b4fc;
      font-weight: 600;
      text-align: center;
    }

    .dropzone {
      border: 2px dashed #94a3b8;
      cursor: pointer;
      transition: border-color 0.2s ease;
      display: block;
    }

    .dropzone input {
      display: none;
    }

    .dropzone-body {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      align-items: flex-start;
    }

    .badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .title {
      margin: 0;
      font-weight: 600;
      font-size: 1rem;
    }

    .subtitle {
      margin: 0;
      color: #475569;
      font-size: 0.9rem;
    }

    .button {
      margin-top: 0.35rem;
      padding: 0.4rem 1rem;
      border-radius: 999px;
      border: 1px solid #2563eb;
      color: #2563eb;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .dropzone:is(:hover, :focus-within) {
      border-color: #2563eb;
    }

    .dropzone.is-disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .summary ul,
    .warning ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .warning {
      border-color: #f97316;
      background: #fff7ed;
    }

    .warning li {
      font-size: 0.9rem;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    button.primary {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 0.65rem 1.5rem;
      border-radius: 999px;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    button.primary:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .error {
      color: #b91c1c;
      margin: 0;
    }

    .status {
      color: #0f5132;
      margin: 0;
    }

    details {
      margin-top: 0.5rem;
    }
  `;
}

customElements.define('project-card-upload', ProjectCardUpload);
