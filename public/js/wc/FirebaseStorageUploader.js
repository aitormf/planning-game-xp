import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { firebaseStorageUploaderStyles } from './firebase-storage-uploader-styles.js';
import { generateSecureTestId } from '../utils/common-functions.js';

/**
 * Componente para subir archivos a Firebase Storage.
 * @property {string} storagePath - Ruta en Storage donde guardar el archivo.
 * @property {string} filenameTemplate - Plantilla para el nombre del archivo.
 * @property {string} fileUrl - URL del archivo subido (opcional).
 */
export class FirebaseStorageUploader extends LitElement {
  // Definición de propiedades estáticas compatible con vanilla JS
  static get properties() {
    return {
      storagePath: { type: String, attribute: 'storage-path' },
      filenameTemplate: { type: String, attribute: 'filename-template' },
      projectName: { type: String, attribute: 'project-name' },
      fileUrl: { type: String, attribute: 'file-url' },
      file: { type: Object },
      uploading: { type: Boolean },
      uploadedFilename: { type: String },
      showModal: { type: Boolean },
      showDeleteConfirm: { type: Boolean },
      allowMultipleFiles: { type: Boolean, attribute: 'allow-multiple-files' },
      generateUniqueFilenames: { type: Boolean, attribute: 'generate-unique-filenames' },
      autoUpload: { type: Boolean, attribute: 'auto-upload' },
    };
  }

  static get styles() {
    return firebaseStorageUploaderStyles;
  }

  constructor() {
    super();
    this.storagePath = '';
    this.filenameTemplate = '';
    this.projectName = '';
    this.fileUrl = '';
    this.firebaseConfig = null;
    this.file = null;
    this.uploading = false;
    this.uploadedFilename = '';
    this.showModal = false;
    this.showDeleteConfirm = false;
    this.allowMultipleFiles = true; // Por defecto permitir múltiples archivos
    this.generateUniqueFilenames = true; // Por defecto generar nombres únicos
    this.autoUpload = true; // Por defecto subida automática
    this.errorMessage = '';
    this._onConfigReceived = this._onConfigReceived.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    // Escucha la respuesta
    window.addEventListener('provide-firebase-storage-config', this._onConfigReceived);
    
    // Solicita la configuración de Firebase Storage
document.dispatchEvent(new CustomEvent('request-firebase-storage-config', { bubbles: true, composed: true, detail: { requester: this } }));
  }

  firstUpdated() {
    super.firstUpdated();
    // Dispatch an event when the component is fully rendered and ready to receive config
this.dispatchEvent(new CustomEvent('firebase-uploader-ready', {
      bubbles: true,
      composed: true,
      detail: { uploader: this }
    }));
  }

  disconnectedCallback() {
    window.removeEventListener('provide-firebase-storage-config', this._onConfigReceived);
    super.disconnectedCallback();
  }

  /**
   * Maneja la recepción de la configuración de Firebase Storage.
   * @param {CustomEvent} e
   */
  _onConfigReceived(e) {
if (e.detail?.config) {
      this.firebaseConfig = e.detail.config;
} else {
      console.error('🔥 Invalid config received:', e.detail);
    }
  }

  /**
   * Maneja la selección de archivo.
   * @param {Event} e
   */
  _onFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      this.file = file;
      this.errorMessage = '';
      this.requestUpdate();

      // Emit file-selected event
      this.dispatchEvent(new CustomEvent('file-selected', {
        bubbles: true,
        composed: true,
        detail: { file, uploader: this }
      }));

      // Only auto-upload if enabled
      if (this.autoUpload) {
        this.uploadFile();
      }
    }
  }

  /**
   * Public method to trigger upload manually
   */
  triggerUpload() {
    if (this.file && !this.uploading) {
      this.uploadFile();
    }
  }

  /**
   * Genera un nombre de archivo único agregando timestamp
   * @param {string} filename - Nombre base del archivo
   * @returns {string} - Nombre único del archivo
   */
  _generateUniqueFilename(filename) {
    if (!this.generateUniqueFilenames) {
      return filename;
    }

    const timestamp = Date.now();
    const randomStr = generateSecureTestId('').split('-').pop();
    const parts = filename.split('.');
    const ext = parts.pop();
    const baseName = parts.join('.');

    return `${baseName}_${timestamp}_${randomStr}.${ext}`;
  }

  /**
   * Sube el archivo seleccionado a Firebase Storage.
   * @returns {Promise<void>}
   */
  async uploadFile() {
    if (!this.firebaseConfig || !this.file) return;

    this.uploading = true;
    this.uploadedFilename = '';
    this.errorMessage = '';
    this.requestUpdate();

    try {
      // Importa dinámicamente los módulos de Firebase Storage
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js');
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');

      if (!window._firebaseApp) {
        window._firebaseApp = initializeApp(this.firebaseConfig);
      }

      const storage = getStorage(window._firebaseApp);

      let ext = this.file.name.split('.').pop();
      ext = ext ? ext.toLowerCase() : '';

      let filename = this.filenameTemplate;

      // Handle {projectName}
      if (filename.includes('{projectName}')) {
        filename = filename.replace('{projectName}', this.projectName || 'default');
      }

      // Handle {version}
      if (filename.includes('{version}')) {
        const versionMatch = this.file.name.match(/\d+\.\d+\.\d+/);
        const version = versionMatch ? versionMatch[0] : '0.0.0';
        filename = filename.replace('{version}', version);
      }

      if (filename.includes('{ext}')) {
        filename = filename.replace('{ext}', ext);
      } else {
        filename = filename + '.' + ext;
      }

      // Generar nombre único si está habilitado
      filename = this._generateUniqueFilename(filename);

      const fullPath = `${this.storagePath}/${filename}`;

      const storageRef = ref(storage, fullPath);
      await uploadBytes(storageRef, this.file);
      const url = await getDownloadURL(storageRef);

      this.fileUrl = url;
      this.uploadedFilename = filename;
this.dispatchEvent(new CustomEvent('file-uploaded', {
        detail: {
          url,
          filename,
          fullPath,
          size: this.file.size
        },
        bubbles: true,
        composed: true
      }));

    } catch (error) {
this.errorMessage = `Error al subir archivo: ${error.message}`;
      this.uploadedFilename = '';

      this.dispatchEvent(new CustomEvent('file-upload-error', {
        detail: { error },
        bubbles: true,
        composed: true
      }));
    } finally {
      this.uploading = false;
      this.requestUpdate();
    }
  }

  _openModal(e) {
    e.preventDefault();
    this.showModal = true;
    this.requestUpdate();
    // Abre el <dialog> si existe
    setTimeout(() => {
      const dlg = this.shadowRoot.querySelector('dialog');
      if (dlg && !dlg.open) dlg.showModal();
    }, 0);
  }

  _closeModal() {
    this.showModal = false;
    const dlg = this.shadowRoot.querySelector('dialog');
    if (dlg?.open) dlg.close();
    this.requestUpdate();
  }

  /**
   * Renderiza el thumbnail o icono según el tipo de archivo.
   * @returns {import('lit').TemplateResult|null}
   */
  renderPreview() {
    if (!this.fileUrl) return null;
    // Comprobar por tipo MIME si es posible
    let isImage = false;
    if (this.file?.type) {
      isImage = this.file.type.startsWith('image/');
    } else {
      isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(this.fileUrl);
    }
    if (isImage) {
      return html`
        <div class="thumbnail-wrapper">
          <img class="thumbnail" src="${this.fileUrl}" alt="Preview" />
          <button class="delete-file-btn" @click=${this._showDeleteConfirmModal} title="Eliminar archivo subido">✖</button>
        </div>
      `;
    }
    // Icono genérico para otros tipos
    return html`
      <span class="icon">📄</span>
      <button class="delete-file-btn" @click=${this._showDeleteConfirmModal} title="Eliminar archivo subido">✖</button>
    `;
  }

  renderUploadedLink() {
    if (!this.fileUrl) return null;

    // Si no hay uploadedFilename pero sí fileUrl, lo extraemos de la URL
    if (!this.uploadedFilename && this.fileUrl) {
      try {
        const url = new URL(this.fileUrl);
        // Firebase Storage: .../o/<path>/<filename>?...
        const match = decodeURIComponent(url.pathname).match(/\/o\/(.+)$/);
        if (match) {
          const path = match[1].split('?')[0];
          this.uploadedFilename = path.split('/').pop();
        }
      } catch (e) {
        // fallback: no hacer nada
      }
    }

    const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(this.uploadedFilename);
    return html`
      <div class="uploaded-link" style="display: flex; align-items: center; gap: 0.5rem;">
        ${isImage
        ? html`<a href="#" @click=${this._openModal}>${this.uploadedFilename}</a>`
        : html`
              <a href="${this.fileUrl}" target="_blank" rel="noopener">${this.uploadedFilename}</a>
            `
      }
        ${isImage ? html`
          <dialog ?open=${this.showModal} @close=${this._closeModal}>
            <button class="modal-close" @click=${this._closeModal} title="Cerrar">&times;</button>
            <img class="modal-img" src="${this.fileUrl}" alt="Imagen subida" />
          </dialog>
        ` : ''}
        ${this.showDeleteConfirm ? this.renderDeleteConfirmModal() : ''}
      </div>
    `;
  }

  /**
   * Renderiza mensajes de error
   */
  renderError() {
    if (!this.errorMessage) return null;

    return html`
      <div class="error-message">
        ${this.errorMessage}
      </div>
    `;
  }

  /**
   * Devuelve el nombre final que tendrá el archivo en el servidor.
   * @returns {string}
   */
  _getFinalFilename() {
    if (!this.file) return '';
    let ext = this.file.name.split('.').pop();
    ext = ext ? ext.toLowerCase() : '';
    let filename = this.filenameTemplate;
    if (filename.includes('{ext}')) {
      filename = filename.replace('{ext}', ext);
    } else {
      filename = filename + '.' + ext;
    }
    return this._generateUniqueFilename(filename);
  }

  /**
   * Muestra el modal de confirmación de borrado
   */
  _showDeleteConfirmModal(e) {
    e.preventDefault();
    this.showDeleteConfirm = true;
    this.requestUpdate();
  }

  /**
   * Cierra el modal de confirmación de borrado
   */
  _closeDeleteConfirmModal() {
    this.showDeleteConfirm = false;
    this.requestUpdate();
  }

  /**
   * Renderiza el modal de confirmación de borrado
   */
  renderDeleteConfirmModal() {
    return html`
      <div class="delete-confirm-modal">
        <div class="delete-confirm-content">
          <div class="delete-confirm-title">¿Eliminar archivo?</div>
          <div>¿Seguro que quieres eliminar este archivo del servidor?</div>
          <div style="margin-top:1.5rem;">
            <button @click=${this._deleteFileFromStorage.bind(this)} style="background:#d9534f;">Sí, eliminar</button>
            <button @click=${this._closeDeleteConfirmModal.bind(this)} style="background:#ccc; color:#222;">Cancelar</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Elimina el archivo subido de Firebase Storage.
   */
  async _deleteFileFromStorage() {
    if (!this.firebaseConfig || !this.fileUrl) return;

    try {
      const { getStorage, ref, deleteObject } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js');
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');

      if (!window._firebaseApp) {
        window._firebaseApp = initializeApp(this.firebaseConfig);
      }

      const storage = getStorage(window._firebaseApp);

      // Obtener el path relativo del archivo a partir de la URL
      // Firebase Storage URLs: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media
      const url = new URL(this.fileUrl);
      const pathMatch = decodeURIComponent(url.pathname).match(/\/o\/(.+)$/);
      const fullPath = pathMatch ? pathMatch[1].split('?')[0] : null;

      if (!fullPath) {
        throw new Error('No se pudo determinar la ruta del archivo en Storage.');
      }
const fileRef = ref(storage, fullPath);
      await deleteObject(fileRef);

      this.fileUrl = '';
      this.uploadedFilename = '';
      this.file = null;
      this.showDeleteConfirm = false;
      this.errorMessage = '';
      this.requestUpdate();
// Opcional: lanzar evento para notificar que se ha eliminado el archivo
      this.dispatchEvent(new CustomEvent('file-deleted', {
        detail: { fullPath },
        bubbles: true,
        composed: true
      }));

    } catch (err) {
this.errorMessage = `Error al eliminar archivo: ${err.message}`;
      this._closeDeleteConfirmModal();
    }
  }

  render() {
    if (!this.firebaseConfig) {
      return html`
        <div class="uploader">
          <span style="color: red;">No hay configuración de Firebase Storage disponible.</span>
        </div>
      `;
    }

    // Generar un id único para el input file
    const inputId = generateSecureTestId('fileInput');

    return html`
      <div class="uploader">
        ${this.uploading ? html`<div class="overlay"><div class="loader"></div></div>` : ''}
        ${this.renderPreview()}
        <input
          type="file"
          class="hidden-input"
          @change=${this._onFileChange}
          id="${inputId}"
          accept="*"
        />
        ${this.renderUploadedLink()}
        ${this.renderError()}
        <button
          type="button"
          class="select-file-btn"
          @click=${() => this.shadowRoot.getElementById(inputId).click()}
          ?disabled=${this.uploading}
        >
          ${this.file ? 'Seleccionar otro archivo' : 'Seleccionar archivo'}
        </button>
      </div>
    `;
  }
}

customElements.define('firebase-storage-uploader', FirebaseStorageUploader);