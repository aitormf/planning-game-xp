import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { FirebaseService } from '../services/firebase-service.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js';
import { entityDirectoryService } from '../services/entity-directory-service.js';

/**
 * Component for uploading documents and generating tasks/bugs using AI
 * Visible to superadmin, admins, developers and stakeholders
 * Uses the current project from adminproject page context
 */
export class AiDocumentUploader extends LitElement {
  static properties = {
    projectId: { type: String, attribute: 'project-id' },
    stakeholders: { type: Array },
    developers: { type: Array },
    sprints: { type: Array },
    generatedItems: { type: Array },
    existingEpics: { type: Array },
    loading: { type: Boolean },
    uploading: { type: Boolean },
    error: { type: String },
    success: { type: String },
    fileName: { type: String },
    selectedValidator: { type: String },
    selectedCoValidator: { type: String },
    selectedSprint: { type: String },
    selectedDeveloper: { type: String },
    isCurrentUserStakeholder: { type: Boolean },
    currentUserStakeholderName: { type: String },
    scoringSystem: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .header h3 {
      margin: 0;
      color: #1e293b;
    }

    .header p {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .config-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-group label {
      font-weight: 600;
      font-size: 0.875rem;
      color: #475569;
    }

    .form-group select {
      padding: 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      background: white;
    }

    .project-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .dropzone {
      border: 2px dashed #94a3b8;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: #f8fafc;
    }

    .dropzone:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .dropzone.is-disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .dropzone input {
      display: none;
    }

    .dropzone-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .dropzone-title {
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.25rem;
    }

    .dropzone-subtitle {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }

    .file-types {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 0.75rem;
    }

    .file-type-badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .items-header h4 {
      margin: 0;
      color: #1e293b;
    }

    .items-count {
      display: flex;
      gap: 0.75rem;
    }

    .count-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .count-badge.tasks {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .count-badge.bugs {
      background: #fee2e2;
      color: #dc2626;
    }

    .count-badge.proposals {
      background: #fef3c7;
      color: #b45309;
    }

    .item-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      transition: box-shadow 0.2s;
    }

    .item-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .item-card.task {
      border-left: 4px solid #3b82f6;
    }

    .item-card.bug {
      border-left: 4px solid #ef4444;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .item-type-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .item-type-badge.task {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .item-type-badge.bug {
      background: #fee2e2;
      color: #dc2626;
    }

    .item-type-badge.proposal {
      background: #fef3c7;
      color: #b45309;
    }

    .item-card.proposal {
      border-left: 4px solid #f59e0b;
    }

    .item-actions {
      display: flex;
      gap: 0.5rem;
    }

    .item-actions button {
      background: none;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.35rem 0.6rem;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
    }

    .item-actions button:hover {
      background: #f1f5f9;
    }

    .item-actions button.delete:hover {
      background: #fee2e2;
      border-color: #fecaca;
      color: #dc2626;
    }

    .item-field {
      margin-bottom: 0.75rem;
    }

    .item-field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
    }

    .item-field input,
    .item-field textarea,
    .item-field select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: inherit;
      box-sizing: border-box;
    }

    .item-field textarea {
      min-height: 80px;
      resize: vertical;
    }

    .item-field .epic-new {
      color: #16a34a;
      font-style: italic;
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn {
      padding: 0.65rem 1.5rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
    }

    .message {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .message.error {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .message.success {
      background: #dcfce7;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }

    .no-project {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .overlay-content {
      background: white;
      padding: 2rem 3rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 400px;
    }

    .overlay-content .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 1rem;
    }

    .overlay-content h4 {
      margin: 0 0 0.5rem;
      color: #1e293b;
      font-size: 1.1rem;
    }

    .overlay-content p {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }
  `;

  constructor() {
    super();
    this.projectId = '';
    this.stakeholders = [];
    this.developers = [];
    this.sprints = [];
    this.generatedItems = [];
    this.existingEpics = [];
    this.loading = false;
    this.uploading = false;
    this.error = '';
    this.success = '';
    this.fileName = '';
    this.selectedValidator = '';
    this.selectedCoValidator = '';
    this.selectedSprint = '';
    this.selectedDeveloper = '';
    this.isCurrentUserStakeholder = false;
    this.currentUserStakeholderName = '';
    this.scoringSystem = '1-5';
    this._projectChangeHandler = this._handleProjectChange.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._syncProjectId();
    this._checkIfCurrentUserIsStakeholder();
    document.addEventListener('project-change-reload', this._projectChangeHandler);
  }

  /**
   * Check if the current user is a stakeholder and set validator automatically
   */
  async _checkIfCurrentUserIsStakeholder() {
    const userEmail = (document.body.dataset.userEmail || '').toLowerCase().trim();
    if (!userEmail) return;

    try {
      await entityDirectoryService.init();
      const stakeholderId = entityDirectoryService.resolveStakeholderId(userEmail);

      if (stakeholderId) {
        // User is a stakeholder - check if they are also a developer
        const developerId = entityDirectoryService.resolveDeveloperId(userEmail);

        if (!developerId) {
          // User is ONLY a stakeholder (not also a developer) - auto-assign as validator
          this.isCurrentUserStakeholder = true;
          this.currentUserStakeholderName = entityDirectoryService.getStakeholderDisplayName(stakeholderId) || userEmail;
          this.selectedValidator = stakeholderId;
        }
      }
    } catch (error) {
      // Silently fail - user can still use the dropdown
    }
  }

  disconnectedCallback() {
    document.removeEventListener('project-change-reload', this._projectChangeHandler);
    super.disconnectedCallback();
  }

  _handleProjectChange(event) {
    const newProjectId = event.detail?.newProjectId;
    if (newProjectId && newProjectId !== this.projectId) {
      this.projectId = newProjectId;
      this._loadProjectData();
      this._clearAll();
    }
  }

  _syncProjectId() {
    const derived =
      document.body?.dataset?.projectId ||
      window.currentProjectId ||
      this._getProjectFromUrl();
    if (derived && derived !== this.projectId) {
      this.projectId = derived;
      this._loadProjectData();
    }
  }

  /**
   * Load all project data (stakeholders, developers, sprints, scoring system)
   */
  async _loadProjectData() {
    this._loadStakeholders();
    this._loadDevelopers();
    this._loadSprints();
    this._loadProjectScoringSystem();
  }

  async _loadProjectScoringSystem() {
    if (!this.projectId) {
      this.scoringSystem = '1-5';
      return;
    }
    try {
      const projectRef = FirebaseService.getRef(`/projects/${this.projectId}`);
      const { get } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
      const snapshot = await get(projectRef);
      if (snapshot.exists()) {
        const projectData = snapshot.val();
        this.scoringSystem = projectData.scoringSystem || '1-5';
      } else {
        this.scoringSystem = '1-5';
      }
    } catch (error) {
      console.error('Error loading project scoring system:', error);
      this.scoringSystem = '1-5';
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

  async _loadStakeholders() {
    if (!this.projectId) {
      this.stakeholders = [];
      return;
    }
    try {
      await entityDirectoryService.waitForInit();
      // Use entityDirectoryService to get stakeholders with correct IDs (stk_XXX)
      const stakeholdersData = await entityDirectoryService.getProjectStakeholders(this.projectId);
      if (stakeholdersData && Array.isArray(stakeholdersData)) {
        this.stakeholders = stakeholdersData
          .filter(s => s && s.id)
          .map(s => ({
            id: s.id, // stk_XXX format
            name: s.name || entityDirectoryService.getStakeholderDisplayName(s.id) || s.id,
            email: s.email || ''
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.stakeholders = [];
      }
    } catch (error) {
      console.error('Error loading stakeholders:', error);
      this.stakeholders = [];
    }
  }

  async _loadDevelopers() {
    if (!this.projectId) {
      this.developers = [];
      return;
    }
    try {
      await entityDirectoryService.waitForInit();
      const developersData = await entityDirectoryService.getProjectDevelopers(this.projectId);
      if (developersData && Array.isArray(developersData)) {
        this.developers = developersData
          .filter(d => d && d.id)
          .map(d => ({
            id: d.id, // dev_XXX format
            name: d.name || entityDirectoryService.getDeveloperDisplayName(d.id) || d.id
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.developers = [];
      }
    } catch (error) {
      console.error('Error loading developers:', error);
      this.developers = [];
    }
  }

  async _loadSprints() {
    if (!this.projectId) {
      this.sprints = [];
      return;
    }
    try {
      const sprintsData = await FirebaseService.getSprintList(this.projectId);
      const currentYear = new Date().getFullYear();
      if (sprintsData && typeof sprintsData === 'object') {
        this.sprints = Object.entries(sprintsData)
          .map(([id, sprint]) => ({
            id: sprint.cardId || id,
            name: sprint.title || sprint.cardId || id,
            year: sprint.year
          }))
          // Filter by current year
          .filter(s => !s.year || s.year === currentYear)
          .sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.sprints = [];
      }
    } catch (error) {
      console.error('Error loading sprints:', error);
      this.sprints = [];
    }
  }

  async _handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.error = '';
    this.success = '';
    this.generatedItems = [];
    this.fileName = file.name;

    if (!this.projectId) {
      this.error = 'No hay proyecto seleccionado.';
      return;
    }

    // Check file type
    const allowedTypes = ['.txt', '.md', '.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      this.error = `Tipo de archivo no soportado. Usa: ${allowedTypes.join(', ')}`;
      return;
    }

    this.loading = true;

    try {
      let textContent = '';

      if (fileExtension === '.txt' || fileExtension === '.md') {
        textContent = await file.text();
      } else if (fileExtension === '.pdf') {
        textContent = await this._extractPdfText(file);
      } else if (fileExtension === '.doc' || fileExtension === '.docx') {
        textContent = await this._extractWordText(file);
      }

      if (!textContent || textContent.trim().length < 10) {
        throw new Error('El documento está vacío o no se pudo extraer el texto.');
      }

      // Call Cloud Function
      const functions = getFunctions(undefined, 'europe-west1');
      const parseDocument = httpsCallable(functions, 'parseDocumentForCards');

      const result = await parseDocument({
        projectId: this.projectId,
        documentContent: textContent,
        fileName: file.name,
        scoringSystem: this.scoringSystem
      });

      if (result.data?.status === 'ok') {
        this.generatedItems = result.data.items.map((item, index) => ({
          ...item,
          id: `item-${index}`,
          selected: true
        }));
        this.existingEpics = result.data.existingEpics || [];
        this.success = `Se generaron ${this.generatedItems.length} items del documento.`;
      } else {
        throw new Error('No se pudieron generar items del documento.');
      }
    } catch (error) {
      console.error('Error processing document:', error);
      this.error = error.message || 'Error al procesar el documento.';
    } finally {
      this.loading = false;
      event.target.value = '';
    }
  }

  async _extractPdfText(file) {
    // Load PDF.js dynamically
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      document.head.appendChild(script);
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  }

  async _extractWordText(file) {
    // Load mammoth.js dynamically
    if (!window.mammoth) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      document.head.appendChild(script);
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  _handleItemChange(itemId, field, value) {
    this.generatedItems = this.generatedItems.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
  }

  _removeItem(itemId) {
    this.generatedItems = this.generatedItems.filter(item => item.id !== itemId);
  }

  _toggleItemType(itemId) {
    const typeOrder = ['task', 'bug', 'proposal'];
    this.generatedItems = this.generatedItems.map(item => {
      if (item.id !== itemId) return item;
      const currentIndex = typeOrder.indexOf(item.type);
      const nextIndex = (currentIndex + 1) % typeOrder.length;
      return { ...item, type: typeOrder[nextIndex] };
    });
  }

  _getNextTypeName(currentType) {
    const typeNames = { task: 'Bug', bug: 'Proposal', proposal: 'Task' };
    return typeNames[currentType] || 'Task';
  }

  _getTypeBadgeLabel(type) {
    const labels = { task: 'TASK', bug: 'BUG', proposal: 'PROPOSAL' };
    return labels[type] || 'TASK';
  }

  /**
   * Get business points options based on project scoring system
   * @returns {Array<{value: number, label: string}>} Options for the select
   */
  _getBusinessPointsOptions() {
    if (this.scoringSystem === 'fibonacci') {
      return [
        { value: 1, label: '1 - Muy bajo' },
        { value: 2, label: '2 - Bajo' },
        { value: 3, label: '3 - Medio' },
        { value: 5, label: '5 - Alto' },
        { value: 8, label: '8 - Muy alto' },
        { value: 13, label: '13 - Crítico' }
      ];
    }
    // Default 1-5 scale
    return [
      { value: 1, label: '1 - Muy bajo' },
      { value: 2, label: '2 - Bajo' },
      { value: 3, label: '3 - Medio' },
      { value: 4, label: '4 - Alto' },
      { value: 5, label: '5 - Crítico' }
    ];
  }

  async _createAllCards() {
    if (!this.projectId || this.generatedItems.length === 0) return;

    this.uploading = true;
    this.error = '';
    this.success = '';

    let createdCards = 0;
    let createdEpics = 0;
    let failed = 0;

    try {
      // Step 1: Identify and create new epics first
      const newEpicNames = new Set();
      const existingEpicTitles = new Set(this.existingEpics.map(e => e.title));

      for (const item of this.generatedItems) {
        if (item.epic && item.epicSuggested && !existingEpicTitles.has(item.epic)) {
          newEpicNames.add(item.epic);
        }
      }

      // Create the new epics
      for (const epicName of newEpicNames) {
        try {
          const epicData = {
            title: epicName,
            description: `Épica generada automáticamente desde documento: ${this.fileName || 'sin nombre'}`,
            projectId: this.projectId,
            cardType: 'epic-card',
            group: 'epics',
            section: 'epics',
            year: new Date().getFullYear(),
            status: 'Active'
          };

          await FirebaseService.saveCard(epicData, { silent: true });
          createdEpics++;
          // Add to existing epics so we don't try to create it again
          existingEpicTitles.add(epicName);
        } catch (error) {
          console.error('Error creating epic:', epicName, error);
          // Continue with cards even if epic creation fails
        }
      }

      // Step 2: Create all the cards
      for (const item of this.generatedItems) {
        try {
          const cardData = {
            title: item.title,
            projectId: this.projectId,
            epic: item.epic || '',
            validator: this.selectedValidator,
            coValidator: this.selectedCoValidator,
            sprint: this.selectedSprint || '',
            developer: this.selectedDeveloper || '',
            year: new Date().getFullYear()
          };

          if (item.type === 'task') {
            cardData.cardType = 'task-card';
            cardData.group = 'tasks';
            cardData.section = 'tasks';
            cardData.status = 'To Do';
            // Tasks use businessPoints for priority (1-5 or Fibonacci based on project scoringSystem)
            // businessPoints represents business value/importance from stakeholder perspective
            cardData.businessPoints = item.businessPoints || 3; // Default to medium (3)
            // Tasks use descriptionStructured with role/goal/benefit format
            cardData.descriptionStructured = [{
              role: item.como || '',
              goal: item.quiero || '',
              benefit: item.para || '',
              legacy: ''
            }];
          } else if (item.type === 'bug') {
            cardData.cardType = 'bug-card';
            cardData.group = 'bugs';
            cardData.section = 'bugs';
            cardData.status = 'Created';
            cardData.priority = item.priority || 'USER EXPERIENCE ISSUE';
            cardData.description = item.description || '';
          } else if (item.type === 'proposal') {
            cardData.cardType = 'proposal-card';
            cardData.group = 'proposals';
            cardData.section = 'proposals';
            // Proposals use descriptionStructured with role/goal/benefit format
            cardData.descriptionStructured = [{
              role: item.como || '',
              goal: item.quiero || '',
              benefit: item.para || '',
              legacy: ''
            }];
          }

          await FirebaseService.saveCard(cardData, { silent: true });
          createdCards++;
        } catch (error) {
          console.error('Error creating card:', error);
          failed++;
        }
      }

      if (createdCards > 0 || createdEpics > 0) {
        let message = '';
        if (createdEpics > 0) {
          message += `Se crearon ${createdEpics} épicas nuevas. `;
        }
        message += `Se crearon ${createdCards} cards correctamente.`;
        if (failed > 0) {
          message += ` ${failed} fallaron.`;
        }
        this.success = message;
        this.generatedItems = [];
        this.fileName = '';

        // Show slide notification
        this._showNotification(message, 'success');

        // Dispatch event to refresh the cards view
        this.dispatchEvent(new CustomEvent('cards-created', {
          bubbles: true,
          composed: true,
          detail: { projectId: this.projectId, count: createdCards, epicsCount: createdEpics }
        }));
      } else {
        this.error = 'No se pudo crear ninguna card.';
      }
    } catch (error) {
      this.error = error.message || 'Error al crear las cards.';
    } finally {
      this.uploading = false;
    }
  }

  _clearAll() {
    this.generatedItems = [];
    this.fileName = '';
    this.error = '';
    this.success = '';
    this.existingEpics = [];
  }

  _showNotification(message, type = 'success') {
    const notification = document.createElement('slide-notification');
    notification.message = message;
    notification.type = type;
    document.body.appendChild(notification);
  }

  render() {
    if (!this.projectId) {
      return html`
        <div class="container">
          <div class="no-project">
            <p>Selecciona un proyecto en el selector superior para comenzar.</p>
          </div>
        </div>
      `;
    }

    const taskCount = this.generatedItems.filter(i => i.type === 'task').length;
    const bugCount = this.generatedItems.filter(i => i.type === 'bug').length;
    const proposalCount = this.generatedItems.filter(i => i.type === 'proposal').length;
    const canCreate = this.generatedItems.length > 0 && !this.uploading;

    return html`
      <div class="container">
        <div class="header">
          <h3>Generar Cards desde Documento</h3>
          <p>Sube un documento y la IA extraerá las tareas y bugs necesarios.</p>
        </div>

        ${this.error ? html`<div class="message error">${this.error}</div>` : null}
        ${this.success ? html`<div class="message success">${this.success}</div>` : null}

        <div class="card">
          <div class="config-section">
            <div class="form-group">
              <label>Proyecto</label>
              <div class="project-badge">
                📁 ${this.projectId}
              </div>
            </div>

            <div class="form-group">
              <label>Quien lo solicita (Validator)</label>
              ${this.isCurrentUserStakeholder ? html`
                <div class="project-badge">
                  👤 ${this.currentUserStakeholderName}
                </div>
              ` : html`
                <select
                  @change=${e => this.selectedValidator = e.target.value}
                  .value=${this.selectedValidator}
                  ?disabled=${this.loading || this.uploading}
                >
                  <option value="">Selecciona validator</option>
                  ${this.stakeholders.map(s => html`
                    <option value=${s.id}>${s.name}</option>
                  `)}
                </select>
              `}
            </div>

            <div class="form-group">
              <label>Co-Validator (opcional)</label>
              <select
                @change=${e => this.selectedCoValidator = e.target.value}
                .value=${this.selectedCoValidator}
                ?disabled=${this.loading || this.uploading}
              >
                <option value="">Ninguno</option>
                ${this.stakeholders
                  .filter(s => s.id !== this.selectedValidator)
                  .map(s => html`
                    <option value=${s.id}>${s.name}</option>
                  `)}
              </select>
            </div>

            <div class="form-group">
              <label>Sprint (opcional)</label>
              <select
                @change=${e => this.selectedSprint = e.target.value}
                .value=${this.selectedSprint}
                ?disabled=${this.loading || this.uploading}
              >
                <option value="">Sin sprint</option>
                ${this.sprints.map(s => html`
                  <option value=${s.id}>${s.name}</option>
                `)}
              </select>
            </div>

            <div class="form-group">
              <label>Developer (opcional)</label>
              <select
                @change=${e => this.selectedDeveloper = e.target.value}
                .value=${this.selectedDeveloper}
                ?disabled=${this.loading || this.uploading}
              >
                <option value="">Sin asignar</option>
                ${this.developers.map(d => html`
                  <option value=${d.id}>${d.name}</option>
                `)}
              </select>
            </div>
          </div>
        </div>

        ${!this.loading ? html`
          <label class="dropzone">
            <input
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx"
              @change=${this._handleFileChange}
              ?disabled=${this.loading || this.uploading}
            />
            <div class="dropzone-icon">📄</div>
            <p class="dropzone-title">
              ${this.fileName || 'Haz clic o arrastra tu documento'}
            </p>
            <p class="dropzone-subtitle">
              La IA analizará el contenido y generará tareas y bugs automáticamente.
            </p>
            <div class="file-types">
              <span class="file-type-badge">TXT</span>
              <span class="file-type-badge">MD</span>
              <span class="file-type-badge">PDF</span>
              <span class="file-type-badge">DOCX</span>
            </div>
          </label>
        ` : null}

        ${this.generatedItems.length > 0 ? html`
          <div class="card items-list">
            <div class="items-header">
              <h4>Items generados</h4>
              <div class="items-count">
                ${taskCount > 0 ? html`
                  <span class="count-badge tasks">${taskCount} Tasks</span>
                ` : null}
                ${bugCount > 0 ? html`
                  <span class="count-badge bugs">${bugCount} Bugs</span>
                ` : null}
                ${proposalCount > 0 ? html`
                  <span class="count-badge proposals">${proposalCount} Proposals</span>
                ` : null}
              </div>
            </div>

            ${this.generatedItems.map(item => html`
              <div class="item-card ${item.type}">
                <div class="item-header">
                  <span class="item-type-badge ${item.type}">
                    ${this._getTypeBadgeLabel(item.type)}
                  </span>
                  <div class="item-actions">
                    <button @click=${() => this._toggleItemType(item.id)} title="Cambiar tipo">
                      ↔ ${this._getNextTypeName(item.type)}
                    </button>
                    <button class="delete" @click=${() => this._removeItem(item.id)} title="Eliminar">
                      ✕
                    </button>
                  </div>
                </div>

                <div class="item-field">
                  <label>Título</label>
                  <input
                    type="text"
                    .value=${item.title}
                    @input=${e => this._handleItemChange(item.id, 'title', e.target.value)}
                  />
                </div>

                ${item.type === 'bug' ? html`
                  <div class="item-field">
                    <label>Descripción</label>
                    <textarea
                      .value=${item.description || ''}
                      @input=${e => this._handleItemChange(item.id, 'description', e.target.value)}
                    ></textarea>
                  </div>
                ` : html`
                  <div class="item-field">
                    <label>Como (rol de usuario)</label>
                    <input
                      type="text"
                      .value=${item.como || ''}
                      @input=${e => this._handleItemChange(item.id, 'como', e.target.value)}
                      placeholder="usuario registrado, administrador..."
                    />
                  </div>
                  <div class="item-field">
                    <label>Quiero (acción)</label>
                    <textarea
                      .value=${item.quiero || ''}
                      @input=${e => this._handleItemChange(item.id, 'quiero', e.target.value)}
                      placeholder="poder hacer..."
                    ></textarea>
                  </div>
                  <div class="item-field">
                    <label>Para (beneficio)</label>
                    <input
                      type="text"
                      .value=${item.para || ''}
                      @input=${e => this._handleItemChange(item.id, 'para', e.target.value)}
                      placeholder="conseguir..."
                    />
                  </div>
                `}

                ${item.type === 'bug' ? html`
                  <div class="item-field">
                    <label>Prioridad</label>
                    <select
                      .value=${item.priority || 'USER EXPERIENCE ISSUE'}
                      @change=${e => this._handleItemChange(item.id, 'priority', e.target.value)}
                    >
                      <option value="APPLICATION BLOCKER">APPLICATION BLOCKER</option>
                      <option value="DEPARTMENT BLOCKER">DEPARTMENT BLOCKER</option>
                      <option value="INDIVIDUAL BLOCKER">INDIVIDUAL BLOCKER</option>
                      <option value="USER EXPERIENCE ISSUE">USER EXPERIENCE ISSUE</option>
                      <option value="WORKFLOW IMPROVEMENT">WORKFLOW IMPROVEMENT</option>
                      <option value="WORKAROUND AVAILABLE ISSUE">WORKAROUND AVAILABLE ISSUE</option>
                    </select>
                  </div>
                ` : html`
                  <div class="item-field">
                    <label>Business Points (Valor de negocio)</label>
                    <select
                      .value=${String(item.businessPoints || 3)}
                      @change=${e => this._handleItemChange(item.id, 'businessPoints', parseInt(e.target.value, 10))}
                    >
                      ${this._getBusinessPointsOptions().map(opt => html`
                        <option value=${opt.value} ?selected=${opt.value === (item.businessPoints || 3)}>${opt.label}</option>
                      `)}
                    </select>
                  </div>
                `}

                <div class="item-field">
                  <label>
                    Épica
                    ${item.epicSuggested ? html`<span class="epic-new">(nueva sugerida)</span>` : ''}
                  </label>
                  <select
                    .value=${item.epic}
                    @change=${e => this._handleItemChange(item.id, 'epic', e.target.value)}
                  >
                    <option value="">Sin épica</option>
                    ${this.existingEpics.map(e => html`
                      <option value=${e.title} ?selected=${e.title === item.epic}>${e.title}</option>
                    `)}
                    ${item.epicSuggested && item.epic && !this.existingEpics.find(e => e.title === item.epic) ? html`
                      <option value=${item.epic} selected>${item.epic} (nueva)</option>
                    ` : null}
                  </select>
                </div>
              </div>
            `)}

            <div class="actions-bar">
              <button class="btn btn-secondary" @click=${this._clearAll}>
                Limpiar todo
              </button>
              <button
                class="btn btn-primary"
                @click=${this._createAllCards}
                ?disabled=${!canCreate}
              >
                ${this.uploading ? 'Creando...' : `Crear ${this.generatedItems.length} Cards`}
              </button>
            </div>
          </div>
        ` : null}
      </div>

      ${this.loading ? html`
        <div class="overlay">
          <div class="overlay-content">
            <div class="spinner"></div>
            <h4>Analizando documento con IA...</h4>
            <p>Este proceso puede durar varios minutos</p>
          </div>
        </div>
      ` : null}

      ${this.uploading ? html`
        <div class="overlay">
          <div class="overlay-content">
            <div class="spinner"></div>
            <h4>Creando cards...</h4>
            <p>Guardando ${this.generatedItems.length} elementos en Firebase</p>
          </div>
        </div>
      ` : null}
    `;
  }
}

customElements.define('ai-document-uploader', AiDocumentUploader);
