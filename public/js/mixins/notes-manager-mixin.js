import { html } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { UserDisplayUtils } from '../utils/user-display-utils.js';
import { modalService } from '../services/modal-service.js';

/**
 * Mixin para manejo genérico de notas en cards
 * Proporciona funcionalidad completa de notas estructuradas con:
 * - Conversión de notas legacy (string) a formato estructurado (array)
 * - Tabla de visualización con autor, contenido, fecha y acciones
 * - Modal para crear/editar notas
 * - Permisos de edición por usuario
 * - Integración con mapeo de email a nombre de usuario
 * 
 * Uso:
 * 1. Aplicar el mixin a la clase: class MyCard extends NotesManagerMixin(BaseCard)
 * 2. Incluir NotesStyles en el array de estilos
 * 3. Usar renderNotesPanel() en el template donde quieras mostrar las notas
 * 4. Asegurar que la propiedad 'notes' esté definida en el constructor
 */

export const NotesManagerMixin = (superClass) => class extends superClass {
  
  static get properties() {
    return {
      ...super.properties,
      // Propiedades necesarias para el sistema de notas
      newNoteText: { type: String },
      editingNoteIndex: { type: Number },
      editingNote: { type: Object }
    };
  }

  constructor() {
    super();
    // Inicializar propiedades del sistema de notas
    this.newNoteText = '';
    this.editingNoteIndex = null;
    this.editingNote = null;
    
    // Asegurar que notes existe (puede ser sobrescrito por las subclases)
    if (this.notes === undefined) {
      this.notes = '';
    }
  }

  /**
   * Convierte notas legacy (string) a formato estructurado (array)
   */
  _convertLegacyNotes() {
    // Solo convertir si es realmente un string con contenido
    if (typeof this.notes === 'string' && this.notes.trim()) {
      // Convertir string a array de objetos
      const legacyNote = {
        id: 'legacy-' + Date.now().toString(),
        content: this.notes.trim(),
        author: '', // Vacío porque no sabemos quién lo escribió
        timestamp: new Date().toISOString()
      };
      this.notes = [legacyNote];
} else if (!this.notes || (typeof this.notes === 'string' && !this.notes.trim())) {
      // Solo inicializar como array vacío si no hay notas o es string vacío
      this.notes = [];
    }
    // Si ya es array, no hacer nada
  }

  /**
   * Obtiene el array de notas, convirtiendo legacy si es necesario
   */
  _getNotesArray() {
    this._convertLegacyNotes();
    return Array.isArray(this.notes) ? this.notes : [];
  }

  /**
   * Verifica si una nota puede ser editada por el usuario actual
   */
  _canEditNote(note) {
    if (!this.canEdit) return false;
    const currentUserEmail = document.body.dataset.userEmail || this.userEmail;
    // Puede editar si es anónima (nota legacy) o si es el autor
    return !note.author || note.author === currentUserEmail;
  }

  /**
   * Convierte email a nombre de display para mostrar en la interfaz
   */
  _getDisplayNameForEmail(email) {
    
    // Si no hay email, mostrar Anónimo (notas legacy)
    if (!email) {
return 'Anónimo';
    }
    
    // Usar UserDisplayUtils para obtener el nombre de display
    const displayName = UserDisplayUtils.emailToDisplayName(email);
// Si no hay mapping, mostrar solo la parte antes del @
    if (displayName === email && email.includes('@')) {
      const fallback = email.split('@')[0];
return fallback;
    }
    
    return displayName || email;
  }

  /**
   * Formatea la fecha de una nota para mostrar en la tabla
   */
  _formatNoteDate(timestamp) {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
return timestamp;
    }
  }

  /**
   * Abre el modal para crear una nueva nota
   */
  _openNewNoteModal() {
    // Guardar valor original para comparar
    this.originalNotesValue = JSON.parse(JSON.stringify(this.notes));
    this.editingNoteIndex = null;
    this.editingNote = null;
    this.newNoteText = '';
    this._openNoteModal();
  }

  /**
   * Abre el modal para editar una nota existente
   */
  _openEditNoteModal(note, index) {
    // Guardar valor original para comparar
    this.originalNotesValue = JSON.parse(JSON.stringify(this.notes));
    this.editingNoteIndex = index;
    this.editingNote = note;
    this.newNoteText = note.content;
    this._openNoteModal();
  }

  /**
   * Abre el modal de notas (común para nueva y editar)
   */
  _openNoteModal() {
const isNewNote = this.editingNoteIndex === null;
    
    const modalContentHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 0; box-sizing: border-box;">
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-weight: 500; color: var(--text-secondary, #495057); font-size: 0.9rem;">Contenido:</label>
          <textarea
            id="note-textarea"
            placeholder="Escribir nota..."
            rows="5"
            style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-default, #ced4da); border-radius: 0.25rem; font-family: inherit; font-size: 0.9rem; resize: vertical; min-height: 100px; box-sizing: border-box; background: var(--input-bg, #fff); color: var(--text-primary, #212529);"
          >${this.newNoteText}</textarea>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-weight: 500; color: var(--text-secondary, #495057); font-size: 0.9rem;">Fecha:</label>
          <input
            type="text"
            value="${isNewNote ? this._formatNoteDate(new Date().toISOString()) : this._formatNoteDate(this.editingNote.timestamp)}"
            disabled
            style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-default, #ced4da); border-radius: 0.25rem; font-size: 0.9rem; background-color: var(--surface-secondary, #e9ecef); color: var(--text-secondary, #495057); box-sizing: border-box;"
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-weight: 500; color: var(--text-secondary, #495057); font-size: 0.9rem;">Usuario:</label>
          <input
            type="text"
            value="${isNewNote ? this._getDisplayNameForEmail(document.body.dataset.userEmail || this.userEmail) : this._getDisplayNameForEmail(this.editingNote.author)}"
            disabled
            style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-default, #ced4da); border-radius: 0.25rem; font-size: 0.9rem; background-color: var(--surface-secondary, #e9ecef); color: var(--text-secondary, #495057); box-sizing: border-box;"
          />
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button id="save-note-btn" style="padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.9rem; background: #28a745; color: white;">
          Guardar
        </button>
        ${!isNewNote && this._canEditNote(this.editingNote) ? `
          <button id="delete-note-btn" style="padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.9rem; background: #dc3545; color: white;">
            Eliminar
          </button>
        ` : ''}
        <button id="cancel-note-btn" style="padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.9rem; background: #6c757d; color: white;">
          Cancelar
        </button>
      </div>
    `;
    
    // Usar modalService para crear el modal
    const modal = modalService.createModal({
      title: isNewNote ? 'Nueva Nota' : 'Editar Nota',
      content: modalContentHTML,
      maxWidth: '500px'
    });
    
    // Eliminar el mensaje por defecto
    modal.then((modalElement) => {
      if (modalElement) {
        modalElement.message = '';
      }
    });
    
    // Agregar event listeners después de que el modal se cree
    setTimeout(() => {
      const textarea = document.getElementById('note-textarea');
      const saveBtn = document.getElementById('save-note-btn');
      const deleteBtn = document.getElementById('delete-note-btn');
      const cancelBtn = document.getElementById('cancel-note-btn');
      
      if (textarea) {
        textarea.addEventListener('input', (e) => {
          this.newNoteText = e.target.value;
        });
      }
      
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this._saveNote());
        saveBtn.addEventListener('mouseenter', () => saveBtn.style.background = '#218838');
        saveBtn.addEventListener('mouseleave', () => saveBtn.style.background = '#28a745');
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => this._deleteNoteFromModal());
        deleteBtn.addEventListener('mouseenter', () => deleteBtn.style.background = '#c82333');
        deleteBtn.addEventListener('mouseleave', () => deleteBtn.style.background = '#dc3545');
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this._closeNoteModal());
        cancelBtn.addEventListener('mouseenter', () => cancelBtn.style.background = '#5a6268');
        cancelBtn.addEventListener('mouseleave', () => cancelBtn.style.background = '#6c757d');
      }
    }, 100);
  }

  /**
   * Guarda la nota (nueva o editada)
   */
  _saveNote() {
    if (!this.newNoteText.trim()) return;
    
    // Asegurar que tenemos un array de notas antes de modificar
    if (!Array.isArray(this.notes)) {
      this._convertLegacyNotes();
    }
    
    if (this.editingNoteIndex === null) {
      // Nueva nota
      const currentUserEmail = document.body.dataset.userEmail || this.userEmail || '';
      const newNote = {
        id: Date.now().toString(),
        content: this.newNoteText.trim(),
        author: currentUserEmail,
        timestamp: new Date().toISOString()
      };
this.notes = [...(this.notes || []), newNote];
    } else {
      // Editar nota existente
      const updatedNotes = [...this.notes];
      updatedNotes[this.editingNoteIndex] = {
        ...this.editingNote,
        content: this.newNoteText.trim()
      };
      this.notes = updatedNotes;
    }
    
    this.requestUpdate();
    
    // Llamar al método de guardado de la card
    // Para BugCard, usar _saveNotesOnly() que no cierra modales
    if (this.constructor.name === 'BugCard' && this._saveNotesOnly && typeof this._saveNotesOnly === 'function') {
this._saveNotesOnly();
    } else if (this.saveCard && typeof this.saveCard === 'function') {
      this.saveCard();
    }
    
    // Cerrar solo el modal de notas
    this._closeNoteModal();
  }

  /**
   * Elimina una nota desde el modal
   */
  _deleteNoteFromModal() {
    if (this.editingNoteIndex !== null) {
      // Asegurar que tenemos un array antes de eliminar
      if (!Array.isArray(this.notes)) {
        this._convertLegacyNotes();
      }
      this.notes = this.notes.filter((_, i) => i !== this.editingNoteIndex);
this.requestUpdate();
      
      // Llamar al método de guardado de la card
      // Para BugCard, usar _saveNotesOnly() que no cierra modales
      if (this.constructor.name === 'BugCard' && this._saveNotesOnly && typeof this._saveNotesOnly === 'function') {
        this._saveNotesOnly();
      } else if (this.saveCard && typeof this.saveCard === 'function') {
        this.saveCard();
      }
      
      // Cerrar solo el modal de notas
      this._closeNoteModal();
    }
  }

  /**
   * Cierra el modal de notas
   */
  _closeNoteModal() {
    // Cerrar solo el modal superior (modal de notas) usando modalService
    modalService.closeTopModal();
    
    // Restablecer estado
    this.editingNoteIndex = null;
    this.editingNote = null;
    this.newNoteText = '';
  }

  /**
   * Cierra el modal de notas de forma segura después de guardar
   * Si hay múltiples modales, cierra solo el último (modal de notas)
   * Si hay solo un modal, no lo cierra para evitar cerrar el modal principal
   */
  _closeNoteModalSafely() {
    // Verificar cuántos modales hay activos
    const activeModals = document.querySelectorAll('app-modal');
    const modalCount = activeModals.length;
if (modalCount > 1) {
      // Hay múltiples modales, cerrar solo el último (modal de notas)
modalService.closeTopModal();
    } else {
      // Solo hay un modal, no cerrarlo para evitar cerrar el modal principal
}
    
    // Restablecer estado siempre
    this.editingNoteIndex = null;
    this.editingNote = null;
    this.newNoteText = '';
  }

  /**
   * Renderiza el panel de notas completo
   * Este método debe ser llamado desde el template de la card
   */
  renderNotesPanel() {
    return html`
      <div class="notes-container">
        <div class="notes-table-container">
          ${this._getNotesArray().length > 0 ? html`
            <table class="notes-table">
              <thead>
                <tr>
                  <th>Autor</th>
                  <th>Contenido</th>
                  <th>Fecha</th>
                  <th class="actions-header"></th>
                </tr>
              </thead>
              <tbody>
                ${this._getNotesArray().map((note, index) => {
                  const canEditNote = this._canEditNote(note);
                  return html`
                    <tr>
                      <td class="note-author-cell">${this._getDisplayNameForEmail(note.author)}</td>
                      <td class="note-content-cell">${note.content}</td>
                      <td class="note-date-cell">${this._formatNoteDate(note.timestamp)}</td>
                      <td class="note-actions-cell">
                        ${canEditNote ? html`
                          <button class="edit-note-btn" 
                                  @click=${(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    this._openEditNoteModal(note, index);
                                  }} 
                                  title="Editar">
                            ✏️
                          </button>
                        ` : ''}
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          ` : html`
            <div class="no-notes">No hay notas registradas</div>
          `}
        </div>
        
        ${this.canEdit ? html`
          <div class="notes-actions">
            <button class="add-note-btn" @click=${this._openNewNoteModal}>
              + Nueva Nota
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }
};