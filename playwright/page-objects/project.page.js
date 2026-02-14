import { BasePage } from './base.page.js';

/**
 * Project Page Object - Página de administración de proyecto (adminproject)
 * Maneja navegación entre secciones: Tasks, Bugs, Proposals, QA, Sprints, Epics
 */
export class ProjectPage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      // Navegación de secciones
      navTabs: '.nav-tabs, .section-tabs, [role="tablist"]',
      tasksTab: '#tasksTab, [href*="#tasks"], button.tablinks:has-text("Tasks")',
      bugsTab: '#bugsTab, [href*="#bugs"], button.tablinks:has-text("Bugs")',
      proposalsTab: '#proposalsTab, [href*="#proposals"], button.tablinks:has-text("Proposals")',
      qaTab: '#qaTab, [href*="#qa"], button.tablinks:has-text("QA")',
      sprintsTab: '#sprintsTab, [href*="#sprints"], button.tablinks:has-text("Sprints")',
      epicsTab: '#epicsTab, [href*="#epics"], button.tablinks:has-text("Epics")',

      // Contenedores de secciones
      tasksSection: '#tasks, [data-section="tasks"]',
      bugsSection: '#bugs, [data-section="bugs"]',
      proposalsSection: '#proposals, [data-section="proposals"]',
      qaSection: '#qa, [data-section="qa"]',
      sprintsSection: '#sprints, [data-section="sprints"]',
      epicsSection: '#epics, [data-section="epics"]',

      // Botones de crear
      createButton: 'button:has-text("Crear"), button:has-text("Nuevo"), button:has-text("New"), button:has-text("+")',
      createTaskButton: 'button:has-text("Nueva Tarea"), button:has-text("New Task")',
      createBugButton: 'button:has-text("Nuevo Bug"), button:has-text("New Bug")',
      createProposalButton: 'button:has-text("Nueva Propuesta"), button:has-text("New Proposal")',
      createSprintButton: 'button:has-text("Nuevo Sprint"), button:has-text("New Sprint")',
      createEpicButton: 'button:has-text("Nueva Épica"), button:has-text("New Epic")',
      createQAButton: 'button:has-text("Nuevo QA"), button:has-text("New QA")',

      // Vistas
      kanbanViewButton: 'button:has-text("Kanban"), [data-view="kanban"]',
      listViewButton: 'button:has-text("Lista"), [data-view="list"]',
      tableViewButton: 'button:has-text("Tabla"), [data-view="table"]',

      // Cards
      taskCard: 'task-card',
      bugCard: 'bug-card',
      proposalCard: 'proposal-card',
      sprintCard: 'sprint-card',
      epicCard: 'epic-card',
      qaCard: 'qa-card',

      // Project info
      projectTitle: '.project-title, h1, .project-name',
      projectSelector: '.project-selector, #project-selector'
    };
  }

  /**
   * Navega a la página del proyecto
   * @param {string} projectId - ID del proyecto
   */
  async goto(projectId) {
    await super.goto(`/adminproject/?projectId=${projectId}`);
    await this.waitForLoadingComplete();
  }

  /**
   * Navega a la sección de Tasks
   */
  async goToTasks() {
    await this.page.locator(this.selectors.tasksTab).click();
    await this.waitForLoadingComplete();
    await this.page.waitForURL(/#tasks/);
  }

  /**
   * Navega a la sección de Bugs
   */
  async goToBugs() {
    await this.page.locator(this.selectors.bugsTab).click();
    await this.waitForLoadingComplete();
    await this.page.waitForURL(/#bugs/);
  }

  /**
   * Navega a la sección de Proposals
   */
  async goToProposals() {
    await this.page.locator(this.selectors.proposalsTab).click();
    await this.waitForLoadingComplete();
    await this.page.waitForURL(/#proposals/);
  }

  /**
   * Navega a la sección de QA
   */
  async goToQA() {
    await this.page.locator(this.selectors.qaTab).click();
    await this.waitForLoadingComplete();
    await this.page.waitForURL(/#qa/);
  }

  /**
   * Navega a la sección de Sprints
   */
  async goToSprints() {
    await this.page.locator(this.selectors.sprintsTab).click();
    await this.waitForLoadingComplete();
    await this.page.waitForURL(/#sprints/);
  }

  /**
   * Navega a la sección de Epics
   */
  async goToEpics() {
    await this.page.locator(this.selectors.epicsTab).click();
    await this.waitForLoadingComplete();
    await this.page.waitForURL(/#epics|#epicas/);
  }

  /**
   * Obtiene el título del proyecto actual
   */
  async getProjectTitle() {
    const title = this.page.locator(this.selectors.projectTitle).first();
    return await title.textContent();
  }

  /**
   * Cambia a vista Kanban
   */
  async switchToKanbanView() {
    const btn = this.page.locator(this.selectors.kanbanViewButton);
    if (await btn.isVisible()) {
      await btn.click();
      await this.waitForLoadingComplete();
    }
  }

  /**
   * Cambia a vista Lista
   */
  async switchToListView() {
    const btn = this.page.locator(this.selectors.listViewButton);
    if (await btn.isVisible()) {
      await btn.click();
      await this.waitForLoadingComplete();
    }
  }

  /**
   * Cambia a vista Tabla
   */
  async switchToTableView() {
    const btn = this.page.locator(this.selectors.tableViewButton);
    if (await btn.isVisible()) {
      await btn.click();
      await this.waitForLoadingComplete();
    }
  }

  /**
   * Cuenta el número de cards de un tipo
   * @param {string} cardType - Tipo de card (task, bug, proposal, sprint, epic, qa)
   */
  async countCards(cardType) {
    const selectorMap = {
      task: this.selectors.taskCard,
      bug: this.selectors.bugCard,
      proposal: this.selectors.proposalCard,
      sprint: this.selectors.sprintCard,
      epic: this.selectors.epicCard,
      qa: this.selectors.qaCard
    };

    const selector = selectorMap[cardType];
    if (!selector) throw new Error(`Unknown card type: ${cardType}`);

    return await this.page.locator(selector).count();
  }

  /**
   * Busca una card por título
   * @param {string} title - Título de la card
   * @param {string} cardType - Tipo de card
   */
  async findCardByTitle(title, cardType) {
    const selectorMap = {
      task: this.selectors.taskCard,
      bug: this.selectors.bugCard,
      proposal: this.selectors.proposalCard,
      sprint: this.selectors.sprintCard,
      epic: this.selectors.epicCard,
      qa: this.selectors.qaCard
    };

    const selector = selectorMap[cardType];
    return this.page.locator(`${selector}:has-text("${title}")`).first();
  }

  /**
   * Abre una card por título
   * @param {string} title - Título de la card
   * @param {string} cardType - Tipo de card
   */
  async openCard(title, cardType) {
    const card = await this.findCardByTitle(title, cardType);
    await card.click();
    await this.waitForModal();
  }

  /**
   * Elimina una card por título
   * @param {string} title - Título de la card
   * @param {string} cardType - Tipo de card
   */
  async deleteCard(title, cardType) {
    console.log(`🗑️ Eliminando ${cardType}: ${title}`);

    const card = await this.findCardByTitle(title, cardType);

    // Buscar botón de eliminar en la card
    const deleteBtn = card.locator('button:has-text("🗑️"), .delete-button');
    await deleteBtn.click();

    // Confirmar eliminación
    await this.confirmDelete();

    console.log(`✅ ${cardType} eliminado: ${title}`);
  }

  /**
   * Verifica si una card existe
   * @param {string} title - Título de la card
   * @param {string} cardType - Tipo de card
   */
  async cardExists(title, cardType) {
    const card = await this.findCardByTitle(title, cardType);
    return await card.count() > 0;
  }
}
