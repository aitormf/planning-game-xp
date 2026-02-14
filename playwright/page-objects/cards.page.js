import { BasePage } from './base.page.js';

/**
 * Cards Page Object - Gestión de todas las cards (Tasks, Bugs, Proposals, Sprints, Epics, QA)
 */
export class CardsPage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      // Modal de card expandida
      cardModal: 'app-modal',
      cardExpanded: '[expanded]',

      // Campos comunes
      titleInput: 'input.title, input.title-input, input[aria-label="Title"], input[placeholder*="título"], input[placeholder*="Título"]',
      descriptionTextarea: 'textarea[aria-label="Description"], textarea[placeholder*="description"], textarea[placeholder*="Description"]',
      retrospectiveTextarea: 'textarea[aria-label="Retrospective"], textarea[placeholder*="Retrospective"]',
      notesTextarea: 'textarea[aria-label="Notes"], textarea[placeholder*="Notes"]',
      acceptanceCriteriaTextarea: 'textarea[aria-label="Acceptance Criteria"]',

      // Selects comunes
      statusSelect: 'select.status-select, select[aria-label="Status"]',
      epicSelect: 'select:has(option:has-text("Sin epic")), select[aria-label="Epic"]',
      sprintSelect: 'select:has(option:has-text("Sin sprint")), select[aria-label="Sprint"]',
      developerSelect: 'select:has(option:has-text("No developer")), select[aria-label="Developer"]',
      validatorSelect: 'select:has(option:has-text("Sin validator")), select[aria-label="Validator"]',
      prioritySelect: 'select[aria-label="Priority"], select:has(option:has-text("Alta"))',

      // Points
      businessPointsSelect: 'select.points-select:first-of-type, select[aria-label="Business points"]',
      devPointsSelect: 'select.points-select:last-of-type, select[aria-label="Dev points"]',

      // Fechas - varios formatos según el componente
      startDateInput: 'app-modal input[type="date"]',
      endDateInput: 'app-modal input[type="date"]',

      // Botones de acción
      saveButton: 'button.save-button, button:has-text("Save"), button:has-text("Guardar")',
      deleteButton: 'button:has-text("🗑️"), button.delete-button',
      convertToTaskButton: 'button:has-text("Convert to Task"), button:has-text("Convertir")',

      // Tabs
      descriptionTab: 'button:has-text("Description")',
      retrospectiveTab: 'button:has-text("Retrospective")',
      acceptanceCriteriaTab: 'button:has-text("Acceptance")',
      notesTab: 'button:has-text("Notes")',
      historyTab: 'button:has-text("Histórico"), button:has-text("History")',

      // Checkboxes
      expeditedCheckbox: 'input#expedited, input[name="expedited"]',
      blockedBusinessCheckbox: 'input#blockedBusiness, input[name="blockedByBusiness"]',
      blockedDevCheckbox: 'input#blockedDev, input[name="blockedByDevelopment"]'
    };
  }

  // ==================== TASK ====================

  /**
   * Crea una nueva tarea
   */
  async createTask(data) {
    console.log(`📝 Creando tarea: ${data.title}`);

    // Click en crear tarea
    await this.page.locator('button#addTaskCard, button:has-text("+ New Task")').first().click();
    await this.waitForModal();

    // Rellenar campos
    await this.fillCardFields(data);

    // Guardar
    await this.saveCard();

    console.log(`✅ Tarea creada: ${data.title}`);
  }

  /**
   * Edita una tarea existente
   */
  async editTask(title, newData) {
    console.log(`✏️ Editando tarea: ${title}`);

    // Abrir la tarea
    await this.page.locator(`task-card:has-text("${title}")`).first().click();
    await this.waitForModal();

    // Modificar campos
    await this.fillCardFields(newData);

    // Guardar
    await this.saveCard();

    console.log(`✅ Tarea editada: ${newData.title || title}`);
  }

  // ==================== BUG ====================

  /**
   * Crea un nuevo bug
   */
  async createBug(data) {
    console.log(`🐛 Creando bug: ${data.title}`);

    await this.page.locator('button#addBugCard, button:has-text("+ New Bug")').first().click();
    await this.waitForModal();

    await this.fillCardFields(data);
    await this.saveCard();

    console.log(`✅ Bug creado: ${data.title}`);
  }

  /**
   * Edita un bug existente
   */
  async editBug(title, newData) {
    console.log(`✏️ Editando bug: ${title}`);

    await this.page.locator(`bug-card:has-text("${title}")`).first().click();
    await this.waitForModal();

    await this.fillCardFields(newData);
    await this.saveCard();

    console.log(`✅ Bug editado: ${newData.title || title}`);
  }

  // ==================== PROPOSAL ====================

  /**
   * Crea una nueva propuesta
   */
  async createProposal(data) {
    console.log(`💡 Creando propuesta: ${data.title}`);

    await this.page.locator('button#addProposalCard, button:has-text("+ New Proposal")').first().click();
    await this.waitForModal();

    await this.fillCardFields(data);
    await this.saveCard();

    console.log(`✅ Propuesta creada: ${data.title}`);
  }

  /**
   * Edita una propuesta existente
   */
  async editProposal(title, newData) {
    console.log(`✏️ Editando propuesta: ${title}`);

    await this.page.locator(`proposal-card:has-text("${title}")`).first().click();
    await this.waitForModal();

    await this.fillCardFields(newData);
    await this.saveCard();

    console.log(`✅ Propuesta editada: ${newData.title || title}`);
  }

  /**
   * Convierte una propuesta en tarea
   * @returns {Promise<string>} El título de la tarea convertida
   */
  async convertProposalToTask(title) {
    console.log(`🔄 Convirtiendo propuesta a tarea: ${title}`);

    // Abrir la propuesta
    await this.page.locator(`proposal-card:has-text("${title}")`).first().click();
    await this.waitForModal();

    // Obtener el título actual (puede haber cambiado)
    const titleInput = this.page.locator(this.selectors.titleInput);
    const currentTitle = await titleInput.inputValue();

    // Click en convertir
    await this.page.locator(this.selectors.convertToTaskButton).click();

    // Esperar modal de confirmación y confirmar
    await this.page.waitForTimeout(500);
    const confirmButton = this.page.locator('button:has-text("Convertir"), button:has-text("Sí"), button:has-text("Yes")').first();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.waitForLoadingComplete();
    await this.waitForModalClose().catch(() => {});

    console.log(`✅ Propuesta convertida a tarea: ${currentTitle}`);

    // Retornar el título de la tarea (mismo que la proposal)
    return currentTitle || title;
  }

  // ==================== SPRINT ====================

  /**
   * Crea un nuevo sprint
   */
  async createSprint(data) {
    console.log(`🏃 Creando sprint: ${data.title}`);

    await this.page.locator('button#addSprintCard, button:has-text("+ New Sprint")').first().click();
    await this.waitForModal();

    await this.fillCardFields(data);
    await this.saveCard();

    console.log(`✅ Sprint creado: ${data.title}`);
  }

  /**
   * Edita un sprint existente
   */
  async editSprint(title, newData) {
    console.log(`✏️ Editando sprint: ${title}`);

    await this.page.locator(`sprint-card:has-text("${title}")`).first().click();
    await this.waitForModal();

    await this.fillCardFields(newData);
    await this.saveCard();

    console.log(`✅ Sprint editado: ${newData.title || title}`);
  }

  // ==================== EPIC ====================

  /**
   * Crea una nueva épica
   */
  async createEpic(data) {
    console.log(`📚 Creando épica: ${data.title}`);

    await this.page.locator('button#addEpicCard, button:has-text("+ New Epic")').first().click();
    await this.waitForModal();

    await this.fillCardFields(data);
    await this.saveCard();

    console.log(`✅ Épica creada: ${data.title}`);
  }

  /**
   * Edita una épica existente
   */
  async editEpic(title, newData) {
    console.log(`✏️ Editando épica: ${title}`);

    await this.page.locator(`epic-card:has-text("${title}")`).first().click();
    await this.waitForModal();

    await this.fillCardFields(newData);
    await this.saveCard();

    console.log(`✅ Épica editada: ${newData.title || title}`);
  }

  // ==================== QA ====================

  /**
   * Crea un nuevo QA
   */
  async createQA(data) {
    console.log(`🧪 Creando QA: ${data.title}`);

    await this.page.locator('button#addQACard, button:has-text("+ New QA")').first().click();
    await this.waitForModal();

    await this.fillCardFields(data);
    await this.saveCard();

    console.log(`✅ QA creado: ${data.title}`);
  }

  /**
   * Edita un QA existente
   */
  async editQA(title, newData) {
    console.log(`✏️ Editando QA: ${title}`);

    await this.page.locator(`qa-card:has-text("${title}")`).first().click();
    await this.waitForModal();

    await this.fillCardFields(newData);
    await this.saveCard();

    console.log(`✅ QA editado: ${newData.title || title}`);
  }

  /**
   * Crea una nueva suite QA
   */
  async createQASuite(data) {
    console.log(`📋 Creando suite QA: ${data.title}`);

    // Buscar botón de crear suite
    await this.page.locator('button:has-text("Nueva Suite"), button:has-text("New Suite")').click();
    await this.waitForModal();

    await this.fillCardFields(data);
    await this.saveCard();

    console.log(`✅ Suite QA creada: ${data.title}`);
  }

  /**
   * Asocia un QA a una suite
   */
  async associateQAToSuite(qaTitle, suiteName) {
    console.log(`🔗 Asociando QA "${qaTitle}" a suite "${suiteName}"`);

    // Abrir el QA
    await this.page.locator(`qa-card:has-text("${qaTitle}")`).first().click();
    await this.waitForModal();

    // Seleccionar la suite
    const suiteSelect = this.page.locator('select:has(option:has-text("Sin suite")), select[aria-label="Suite"]');
    await suiteSelect.selectOption({ label: suiteName });

    await this.saveCard();

    console.log(`✅ QA asociado a suite`);
  }

  // ==================== HELPERS ====================

  /**
   * Rellena los campos de una card
   */
  async fillCardFields(data) {
    // Título
    if (data.title) {
      const titleInput = this.page.locator(this.selectors.titleInput).first();
      await titleInput.waitFor({ state: 'visible', timeout: 5000 });
      await titleInput.clear();
      await titleInput.fill(data.title);
    }

    // Descripción o Retrospective (según el tipo de card)
    if (data.description) {
      // Primero intentar con Description tab (tasks, bugs, etc.)
      const descTab = this.page.locator(this.selectors.descriptionTab);
      const retroTab = this.page.locator(this.selectors.retrospectiveTab);

      if (await descTab.isVisible()) {
        await descTab.click();
        await this.page.waitForTimeout(300); // Esperar a que el tab se active
        const structuredInputs = this.page.locator('app-modal .structured-description input');
        if (await structuredInputs.first().isVisible().catch(() => false)) {
          // Only fill the "goal" field (2nd input). Do NOT fill all 3 fields
          // (role, goal, benefit) as that triggers AI acceptance criteria
          // generation which takes ~1 min.
          await structuredInputs.nth(1).fill(data.description);
        } else {
          // Buscar el textarea con varios selectores posibles
          const descTextarea = this.page.locator('textarea[placeholder*="description" i], textarea[aria-label="Description"]').first();
          await descTextarea.waitFor({ state: 'visible', timeout: 5000 });
          await descTextarea.clear();
          await descTextarea.fill(data.description);
        }
      } else if (await retroTab.isVisible()) {
        // Sprint usa Retrospective en lugar de Description
        await retroTab.click();
        await this.page.waitForTimeout(300);
        const retroTextarea = this.page.locator(this.selectors.retrospectiveTextarea).first();
        await retroTextarea.waitFor({ state: 'visible', timeout: 5000 });
        await retroTextarea.clear();
        await retroTextarea.fill(data.description);
      } else {
        // Intentar directamente con el textarea si no hay tabs
        const descTextarea = this.page.locator('textarea').first();
        if (await descTextarea.isVisible()) {
          await descTextarea.clear();
          await descTextarea.fill(data.description);
        }
      }
    }

    // Acceptance Criteria
    if (data.acceptanceCriteria) {
      const acTab = this.page.locator(this.selectors.acceptanceCriteriaTab);
      if (await acTab.isVisible()) {
        await acTab.click();
      }
      const acTextarea = this.page.locator(this.selectors.acceptanceCriteriaTextarea);
      await acTextarea.clear();
      await acTextarea.fill(data.acceptanceCriteria);
    }

    // Notes
    if (data.notes) {
      const notesTab = this.page.locator(this.selectors.notesTab);
      if (await notesTab.isVisible()) {
        await notesTab.click();
      }
      const notesTextarea = this.page.locator(this.selectors.notesTextarea);
      await notesTextarea.clear();
      await notesTextarea.fill(data.notes);
    }

    // Status
    if (data.status) {
      const statusSelect = this.page.locator(this.selectors.statusSelect);
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption({ label: data.status });
      }
    }

    // Epic
    if (data.epic) {
      const epicSelect = this.page.locator(this.selectors.epicSelect);
      if (await epicSelect.isVisible()) {
        await epicSelect.selectOption({ label: data.epic });
      }
    }

    // Sprint
    if (data.sprint) {
      const sprintSelect = this.page.locator(this.selectors.sprintSelect);
      if (await sprintSelect.isVisible()) {
        await sprintSelect.selectOption({ label: data.sprint });
      }
    }

    // Developer
    if (data.developer) {
      const devSelect = this.page.locator(this.selectors.developerSelect);
      if (await devSelect.isVisible()) {
        await devSelect.selectOption({ label: data.developer });
      }
    }

    // Business Points (primer select de puntos)
    if (data.businessPoints !== undefined) {
      const bpSelect = this.page.locator('select.points-select').first();
      if (await bpSelect.isVisible().catch(() => false)) {
        await bpSelect.selectOption({ value: String(data.businessPoints) });
      }
    }

    // Dev Points (segundo select de puntos)
    if (data.devPoints !== undefined) {
      const dpSelect = this.page.locator('select.points-select').nth(1);
      if (await dpSelect.isVisible().catch(() => false)) {
        await dpSelect.selectOption({ value: String(data.devPoints) });
      }
    }

    // Priority
    if (data.priority) {
      const prioritySelect = this.page.locator(this.selectors.prioritySelect);
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption({ label: data.priority });
      }
    }

    // Start Date
    if (data.startDate) {
      const startDateInput = this.page.locator(this.selectors.startDateInput).first();
      if (await startDateInput.isVisible().catch(() => false)) {
        await startDateInput.fill(data.startDate);
      }
    }

    // End Date
    if (data.endDate) {
      const endDateInput = this.page.locator(this.selectors.endDateInput).nth(1);
      if (await endDateInput.isVisible().catch(() => false)) {
        await endDateInput.fill(data.endDate);
      }
    }
  }

  /**
   * Guarda la card actual
   */
  async saveCard() {
    // Buscar el botón Save dentro del modal/card visible
    const saveButton = this.page.locator('app-modal button.save-button, app-modal button:has-text("Save")').first();

    // Esperar a que el botón sea visible
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });

    // Verificar que el botón está habilitado antes de hacer clic
    const isDisabled = await saveButton.isDisabled();
    if (isDisabled) {
      console.log('⚠️ Botón Save está deshabilitado, esperando...');
      await this.page.waitForTimeout(1000);
    }

    console.log('💾 Haciendo clic en Save...');
    await saveButton.click({ force: true }); // Force click por si hay algún overlay

    // Esperar a que el indicador de guardado desaparezca
    const savingIndicator = this.page.locator('text="Guardando..."');
    try {
      await savingIndicator.waitFor({ state: 'visible', timeout: 2000 });
      console.log('⏳ Esperando guardado...');
      await savingIndicator.waitFor({ state: 'hidden', timeout: 15000 });
    } catch {
      // Si no aparece el indicador de guardado, continuar
    }

    await this.waitForLoadingComplete();

    // Esperar más tiempo para que el modal se cierre
    await this.page.waitForTimeout(1000);

    // Esperar a que el modal se cierre automáticamente
    try {
      await this.waitForModalClose();
      console.log('✅ Modal cerrado automáticamente');
    } catch {
      // Si el modal sigue abierto después de 5 segundos, intentar cerrarlo manualmente
      const modal = this.page.locator('app-modal');
      const isModalVisible = await modal.isVisible().catch(() => false);
      if (isModalVisible) {
        console.log('⚠️ Modal sigue abierto, intentando cerrar manualmente...');
        await this._forceCloseModal();
      }
    }

    // Esperar un momento para que Firebase sincronice
    await this.page.waitForTimeout(500);
  }

  /**
   * Cierra el modal forzadamente, manejando el diálogo "Cambios sin guardar"
   */
  async _forceCloseModal() {
    // Intentar presionar Escape
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);

    // Comprobar si apareció el modal de confirmación "Cambios sin guardar"
    const confirmCloseBtn = this.page.locator('button:has-text("Sí, cerrar sin guardar")');
    if (await confirmCloseBtn.isVisible().catch(() => false)) {
      console.log('🔒 Modal "Cambios sin guardar" detectado, confirmando cierre...');
      await confirmCloseBtn.click();
      await this.page.waitForTimeout(500);
      return;
    }

    // Si no apareció confirmación, verificar si el modal sigue abierto
    const modal = this.page.locator('app-modal');
    if (await modal.isVisible().catch(() => false)) {
      // Intentar con el botón X
      const closeButton = this.page.locator('.close-btn').first();
      if (await closeButton.isVisible().catch(() => false)) {
        console.log('🔘 Cerrando con botón X...');
        await closeButton.click({ force: true, timeout: 2000 }).catch(() => {});
        await this.page.waitForTimeout(500);

        // Comprobar de nuevo el modal de confirmación
        if (await confirmCloseBtn.isVisible().catch(() => false)) {
          await confirmCloseBtn.click();
          await this.page.waitForTimeout(500);
        }
      }
    }
  }

  /**
   * Elimina una card de cualquier tipo
   */
  async deleteCard(title, cardType) {
    console.log(`🗑️ Eliminando ${cardType}: ${title}`);

    const cardSelectors = {
      task: 'task-card',
      bug: 'bug-card',
      proposal: 'proposal-card',
      sprint: 'sprint-card',
      epic: 'epic-card',
      qa: 'qa-card'
    };

    const selector = cardSelectors[cardType];
    const card = this.page.locator(`${selector}:has-text("${title}")`).first();

    // Click en el botón de eliminar dentro de la card
    const deleteBtn = card.locator('button:has-text("🗑️"), .delete-button');
    await deleteBtn.click();

    // Confirmar eliminación
    await this.confirmDelete();

    console.log(`✅ ${cardType} eliminado: ${title}`);
  }

  /**
   * Cambia el estado de una card
   */
  async changeCardStatus(title, cardType, newStatus) {
    console.log(`🔄 Cambiando estado de ${cardType} "${title}" a "${newStatus}"`);

    const cardSelectors = {
      task: 'task-card',
      bug: 'bug-card',
      proposal: 'proposal-card',
      qa: 'qa-card'
    };

    const selector = cardSelectors[cardType];
    await this.page.locator(`${selector}:has-text("${title}")`).first().click();
    await this.waitForModal();

    const statusSelect = this.page.locator(this.selectors.statusSelect);
    await statusSelect.selectOption({ label: newStatus });

    await this.saveCard();

    console.log(`✅ Estado cambiado a: ${newStatus}`);
  }
}
