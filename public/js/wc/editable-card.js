import { html } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { BaseCard } from './base-card.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';

/**
 * Clase base para tarjetas editables con interfaz de tabs
 * Extiende BaseCard añadiendo funcionalidad de tabs (description, criteria, notes)
 * y manejo avanzado de campos editables
 */
export class EditableCard extends BaseCard {
  static get properties() {
    return {
      ...super.properties,
      
      // Propiedades específicas de cards editables
      acceptanceCriteria: { type: String },
      activeTab: { type: String },
      
      // Propiedades de estado y validación
      status: { type: String },
      statusList: { type: Array },
      
      // Propiedades de puntuación/estimación
      businessPoints: { type: Number },
      devPoints: { type: Number },
      priority: { type: String },
      priorityList: { type: Array },
      
      // Propiedades de asignación
      developer: { type: String },
      developerList: { type: Array },
      
    };
  }

  constructor() {
    super();
    
    // Inicializar propiedades específicas
    this.acceptanceCriteria = '';
    this.activeTab = 'description';
    this.status = '';
    this.statusList = [];
    this.businessPoints = 0;
    this.devPoints = 0;
    this.priority = '';
    this.priorityList = [];
    this.developer = '';
    this.developerList = [];

    // Bind métodos específicos
    this._setActiveTab = this._setActiveTab.bind(this);
    this._handleInput = this._handleInput.bind(this);
    this._handleStatusChange = this._handleStatusChange.bind(this);
    this._handleDeveloperChange = this._handleDeveloperChange.bind(this);
  }

  /**
   * Override del getter canSave para incluir validaciones adicionales
   */
  get canSave() {
    return super.canSave && this.status && this.status.trim();
  }

  /**
   * Override de getCardData para incluir propiedades de cards editables
   */
  getCardData() {
    return {
      ...super.getCardData(),
      acceptanceCriteria: this.acceptanceCriteria,
      status: this.status,
      businessPoints: this.businessPoints,
      devPoints: this.devPoints,
      priority: this.priority,
      developer: this.developer,
    };
  }

  /**
   * Establece el tab activo
   * @param {string} tab - Nombre del tab a activar
   */
  _setActiveTab(tab) {
    this.activeTab = tab;
    this.requestUpdate();
  }

  /**
   * Maneja cambios en inputs de texto
   * @param {string} property - Propiedad a actualizar
   * @param {Event} event - Evento de input
   */
  _handleInput(property, event) {
    const oldValue = this[property];
    this[property] = event.target.value;
    
    if (oldValue !== this[property]) {
      this.hasUnsavedChanges = true;
      this._trackChange(property, oldValue, this[property]);
    }
    
    this.requestUpdate();
  }

  /**
   * Maneja cambios en el estado
   * @param {Event} event - Evento de cambio
   */
  _handleStatusChange(event) {
    const oldStatus = this.status;
    this.status = event.target.value;
    
    if (oldStatus !== this.status) {
      this.hasUnsavedChanges = true;
      this._trackChange('status', oldStatus, this.status);
    }
    
    this.requestUpdate();
  }

  /**
   * Maneja cambios en el desarrollador asignado
   * @param {Event} event - Evento de cambio
   */
  _handleDeveloperChange(event) {
    const oldDeveloper = this.developer;
    this.developer = event.target.value;
    
    if (oldDeveloper !== this.developer) {
      this.hasUnsavedChanges = true;
      this._trackChange('developer', oldDeveloper, this.developer);
    }
    
    this.requestUpdate();
  }

  /**
   * Registra un cambio en el historial (deprecated - now handled by HistoryService)
   * @param {string} property - Propiedad que cambió
   * @param {any} oldValue - Valor anterior
   * @param {any} newValue - Nuevo valor
   */
  _trackChange(property, oldValue, newValue) {
    // History tracking is now handled by HistoryService
    // This method is kept for backward compatibility but does nothing
  }

  /**
   * Renderiza el sistema de tabs
   */
  renderTabs() {
    const tabs = [
      { key: 'description', label: 'Descripción', color: 'var(--description-color, #4caf50)' },
      { key: 'acceptanceCriteria', label: 'Criterios', color: 'var(--acceptanceCriteria-color, #2196f3)' },
      { key: 'notes', label: 'Notas', color: 'var(--notes-color, #ff9800)' }
    ];

    return html`
      <div class="tabs">
        ${tabs.map(tab => html`
          <button 
            class="tab-button ${this.activeTab === tab.key ? 'active' : ''} ${tab.key}"
            style="background-color: ${this.activeTab === tab.key ? tab.color : 'var(--bg-tertiary)'}"
            @click=${() => this._setActiveTab(tab.key)}>
            ${tab.label}
          </button>
        `)}
      </div>
      <div class="tab-content">
        ${this.renderTabContent()}
      </div>
    `;
  }

  /**
   * Renderiza el contenido del tab activo
   */
  renderTabContent() {
    const isDisabled = !this.isEditable;
    
    switch (this.activeTab) {
      case 'description':
        return html`
          <textarea 
            class="ta-description"
            .value=${this.description}
            ?disabled=${isDisabled}
            @input=${e => this._handleInput('description', e)}
            placeholder="Descripción de la tarea..."
            style="border: 4px solid var(--description-color, #4caf50);">
          </textarea>
        `;
      
      case 'acceptanceCriteria':
        return html`
          <textarea 
            class="ta-acceptanceCriteria"
            .value=${this.acceptanceCriteria}
            ?disabled=${isDisabled}
            @input=${e => this._handleInput('acceptanceCriteria', e)}
            placeholder="Criterios de aceptación..."
            style="border: 4px solid var(--acceptanceCriteria-color, #2196f3);">
          </textarea>
        `;
      
      case 'notes':
        return html`
          <textarea 
            class="ta-notes"
            .value=${this.notes}
            ?disabled=${isDisabled}
            @input=${e => this._handleInput('notes', e)}
            placeholder="Notas adicionales..."
            style="border: 4px solid var(--notes-color, #ff9800);">
          </textarea>
        `;
      
      default:
        return html`<p>Tab no encontrado</p>`;
    }
  }

  /**
   * Renderiza los campos de fecha
   */
  renderDateFields() {
    const isDisabled = !this.isEditable;
    
    return html`
      <div class="dates-group">
        <div class="field-group">
          <label>Fecha de Inicio</label>
          <input 
            type="date" 
            .value=${this.startDate}
            ?disabled=${isDisabled}
            @change=${e => this._handleInput('startDate', e)}>
        </div>
        <div class="field-group">
          <label>Fecha de Fin</label>
          <input 
            type="date" 
            .value=${this.endDate}
            ?disabled=${isDisabled}
            @change=${e => this._handleInput('endDate', e)}>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza los campos de estado y desarrollador
   */
  renderStatusFields() {
    const isDisabled = !this.isEditable;
    
    return html`
      <div class="status-fields">
        <div class="field-group">
          <label>Estado</label>
          <select 
            .value=${this.status}
            ?disabled=${isDisabled}
            @change=${this._handleStatusChange}>
            ${this.statusList.map(status => html`
              <option value="${status}" ?selected=${this.status === status}>${status}</option>
            `)}
          </select>
        </div>
        
        ${this.developerList.length > 0 ? html`
          <div class="field-group">
            <label>Desarrollador</label>
            <select 
              .value=${this.developer}
              ?disabled=${isDisabled}
              @change=${this._handleDeveloperChange}>
              <option value="${APP_CONSTANTS.DEVELOPER_UNASSIGNED.STORAGE_VALUE}">${APP_CONSTANTS.DEVELOPER_UNASSIGNED.DISPLAY_ES}</option>
              ${this.developerList.map(dev => html`
                <option value="${dev}" ?selected=${this.developer === dev}>${dev}</option>
              `)}
            </select>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Renderiza los campos de puntuación
   */
  renderPointsFields() {
    const isDisabled = !this.isEditable;
    
    return html`
      <div class="points-fields">
        <div class="field-group">
          <label>Puntos de Negocio</label>
          <input 
            type="number" 
            min="0" 
            .value=${this.businessPoints}
            ?disabled=${isDisabled}
            @input=${e => this._handleInput('businessPoints', e)}>
        </div>
        <div class="field-group">
          <label>Puntos de Desarrollo</label>
          <input 
            type="number" 
            min="0" 
            .value=${this.devPoints}
            ?disabled=${isDisabled}
            @input=${e => this._handleInput('devPoints', e)}>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza el botón de guardado
   */
  renderSaveButton() {
    if (!this.isEditable) return '';
    
    return html`
      <div class="card-footer">
        <button 
          class="save-button"
          ?disabled=${!this.canSave}
          @click=${this._handleSave}>
          Guardar
        </button>
      </div>
    `;
  }

  /**
   * Override del método renderExpanded para cards editables
   */
  renderExpanded() {
    return html`
      <div class="expanded-content">
        <!-- Header con título editable -->
        <div class="expanded-header">
          <input 
            type="text" 
            class="title-input"
            .value=${this.title}
            ?disabled=${!this.isEditable}
            @input=${e => this._handleInput('title', e)}
            placeholder="Título de la card">
        </div>

        <!-- Campos de estado y desarrollador -->
        ${this.renderStatusFields()}

        <!-- Sistema de tabs para descripción, criterios y notas -->
        ${this.renderTabs()}

        <!-- Campos de fecha -->
        ${this.renderDateFields()}

        <!-- Campos de puntuación (si aplica) -->
        ${this.businessPoints !== undefined || this.devPoints !== undefined ? this.renderPointsFields() : ''}

        <!-- Botón de guardado -->
        ${this.renderSaveButton()}
      </div>
    `;
  }
}