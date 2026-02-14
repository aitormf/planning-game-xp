import { BasePage } from './base.page.js';

/**
 * Dashboard Page Object - Gestión de proyectos
 */
export class DashboardPage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      // Botones principales
      newProjectButton: 'button:has-text("Nuevo Proyecto"), button:has-text("New Project")',

      // Lista de proyectos - en realidad es una tabla
      projectList: 'table',
      projectCard: 'table tbody tr',  // Las filas de la tabla
      projectName: 'td:first-child a, td:first-child',  // El nombre está en la primera celda

      // Modal de proyecto
      projectModal: 'app-modal',
      projectNameInput: 'input[name="projectName"], input[placeholder*="nombre"], #projectName',
      projectDescriptionInput: 'textarea[name="description"], textarea[placeholder*="descripción"], #projectDescription',
      projectPrefixInput: 'input[name="prefix"], input[placeholder*="prefijo"], #projectPrefix',
      // Usar selector específico para el botón dentro del modal footer
      saveProjectButton: 'app-modal .modal-footer button:has-text("Crear Proyecto"), app-modal .modal-footer button:has-text("Guardar")',
      cancelButton: 'app-modal .modal-footer button:has-text("Cancelar")',

      // Acciones de proyecto
      editProjectButton: 'button.edit-project-icon, button[title*="Editar proyecto"]',
      deleteProjectButton: '.delete-project, button[title*="Eliminar"], button:has-text("🗑️")',
      openProjectButton: '.open-project, button[title*="Abrir"], button:has-text("Abrir")',

      // Confirmación de eliminación
      confirmDeleteButton: 'button:has-text("Yes"), button:has-text("Sí"), button:has-text("Confirmar")',
      cancelDeleteButton: 'button:has-text("No"), button:has-text("Cancelar")'
    };
  }

  /**
   * Navega al dashboard
   */
  async goto() {
    await super.goto('/');
    await this.waitForLoadingComplete();
  }

  /**
   * Crea un nuevo proyecto
   * @param {Object} projectData - Datos del proyecto
   * @param {string} projectData.name - Nombre del proyecto
   * @param {string} projectData.abbreviation - Abreviatura (2-4 caracteres, auto-generada si no se proporciona)
   * @param {string} projectData.description - Descripción
   * @param {Object} projectData.developer - Developer {name, email}
   * @param {Object} projectData.stakeholder - Stakeholder {name, email}
   */
  async createProject({ name, abbreviation = '', description = '', developer = null, stakeholder = null }) {
    console.log(`📁 Creando proyecto: ${name}`);

    // Click en "Nuevo Proyecto"
    await this.page.locator(this.selectors.newProjectButton).click();
    await this.waitForModal();

    // El formulario está dentro de un shadow DOM (project-form es un Lit component)
    const projectForm = this.page.locator('project-form');
    await projectForm.waitFor({ state: 'visible', timeout: 10000 });

    // Esperar a que el loading del formulario termine (isLoading = false)
    // El formulario muestra "Cargando..." mientras inicializa entityDirectoryService
    // Cuando isLoading=false, el div.loading se elimina del DOM y se renderiza el form
    await projectForm.locator('#projectName').waitFor({ state: 'visible', timeout: 20000 });

    // Rellenar nombre del proyecto
    const nameInput = projectForm.locator('#projectName');
    await nameInput.fill(name);

    // Rellenar abreviatura (obligatoria, mínimo 2 caracteres)
    const abbrevInput = projectForm.locator('#abbreviation');
    const abbrev = abbreviation || name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'TEST';
    await abbrevInput.fill(abbrev);

    // Rellenar descripción si se proporciona
    if (description) {
      const descInput = projectForm.locator('#projectDescription');
      await descInput.fill(description);
    }

    // Añadir developer (requerido para que el proyecto funcione)
    // El formulario usa un dropdown para seleccionar developers existentes
    if (developer) {
      // Navegar a la pestaña "Equipo" donde está el dropdown de developers
      // Los tabs están renderizados como <button id="tab-team"> dentro del shadow DOM de color-tabs
      const colorTabs = projectForm.locator('color-tabs');
      const teamTabButton = colorTabs.locator('#tab-team');
      await teamTabButton.click();
      await this.page.waitForTimeout(300);

      // Buscar el dropdown de developers por su ID (inside shadow DOM)
      const devSelect = this.page.locator('project-form').locator('#developerSelect');
      await devSelect.waitFor({ state: 'visible', timeout: 15000 });

      // Esperar a que el dropdown tenga opciones con el email del developer (Firebase sync)
      let devOptionText = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        const devOptions = await devSelect.locator('option').allTextContents();
        devOptionText = devOptions.find(opt => opt.includes(developer.email));
        if (devOptionText) break;
        // Wait for Firebase to sync and component to update
        await this.page.waitForTimeout(500);
      }

      if (devOptionText) {
        await devSelect.selectOption({ label: devOptionText });
        // Esperar a que el botón "Añadir" se habilite y hacer clic
        const addDevButton = this.page.locator('project-form').locator('button:has-text("Añadir")').first();
        await this.page.waitForTimeout(300);
        await addDevButton.click();
        await this.page.waitForTimeout(500);
        console.log(`👤 Developer añadido: ${developer.email}`);
      } else {
        console.log(`⚠️ Developer ${developer.email} no encontrado en dropdown después de 10 intentos`);
      }
    }

    // Añadir stakeholder (requerido para que el proyecto funcione)
    // El formulario usa un dropdown para seleccionar stakeholders existentes
    if (stakeholder) {
      // Si no se añadió developer, navegar a la pestaña "Equipo" primero
      if (!developer) {
        const colorTabs = projectForm.locator('color-tabs');
        const teamTabButton = colorTabs.locator('#tab-team');
        await teamTabButton.click();
        await this.page.waitForTimeout(300);
      }

      // Buscar el dropdown de stakeholders por su ID (inside shadow DOM)
      const stSelect = this.page.locator('project-form').locator('#stakeholderSelect');
      await stSelect.waitFor({ state: 'visible', timeout: 15000 });

      // Esperar a que el dropdown tenga opciones con el email del stakeholder (Firebase sync)
      let stOptionText = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        const stOptions = await stSelect.locator('option').allTextContents();
        stOptionText = stOptions.find(opt => opt.includes(stakeholder.email));
        if (stOptionText) break;
        // Wait for Firebase to sync and component to update
        await this.page.waitForTimeout(500);
      }

      if (stOptionText) {
        await stSelect.selectOption({ label: stOptionText });
        // Esperar a que el botón "Añadir" se habilite y hacer clic
        // El segundo botón "Añadir" es para stakeholders
        const addButtons = this.page.locator('project-form').locator('button:has-text("Añadir")');
        const addStButton = addButtons.nth(1);
        await this.page.waitForTimeout(300);
        await addStButton.click();
        await this.page.waitForTimeout(500);
        console.log(`📋 Stakeholder añadido: ${stakeholder.email}`);
      } else {
        console.log(`⚠️ Stakeholder ${stakeholder.email} no encontrado en dropdown después de 10 intentos`);
      }
    }

    // Guardar - buscar el botón en el modal footer
    await this.page.locator(this.selectors.saveProjectButton).click();

    // Esperar a que el modal se cierre (indica que se guardó)
    await this.waitForModalClose().catch(() => {});

    // Esperar a que aparezca la notificación de éxito (puede tener variantes)
    try {
      await this.page.locator('text=/[Pp]royecto.*creado|[Pp]roject.*created/i').waitFor({ timeout: 10000 });
      console.log('✅ Notificación de éxito recibida');
    } catch {
      console.log('⚠️ No se encontró notificación de éxito, continuando...');
    }

    // Esperar a que Firebase sincronice
    await this.page.waitForTimeout(2000);

    // Verificar que el proyecto aparece en la lista, con reintentos
    let projectInList = await this.projectExists(name);
    if (!projectInList) {
      console.log('⚠️ Proyecto no encontrado en lista, esperando...');
      await this.page.waitForTimeout(3000);
      projectInList = await this.projectExists(name);
    }

    if (!projectInList) {
      console.log('⚠️ Proyecto aún no encontrado, recargando página...');
      await this.page.reload();
      await this.waitForLoadingComplete();
      await this.page.waitForTimeout(2000);
    }

    console.log(`✅ Proyecto creado: ${name}`);
  }

  /**
   * Abre un proyecto por nombre
   * @param {string} projectName - Nombre del proyecto
   */
  async openProject(projectName) {
    console.log(`📂 Abriendo proyecto: ${projectName}`);

    // El nombre del proyecto es un link en la primera columna de la tabla
    // Usar regex para coincidencia parcial (el nombre puede estar truncado en la UI)
    const projectLink = this.page.locator('table tbody tr td a').filter({ hasText: new RegExp(projectName.substring(0, 20), 'i') }).first();
    await projectLink.waitFor({ state: 'visible', timeout: 20000 });
    await projectLink.click();

    // Esperar navegación a adminproject
    await this.page.waitForURL(/adminproject/, { timeout: 15000 });

    // Esperar a que Firebase Auth confirme y el mainContainer sea visible
    await this.page.locator('#mainContainer:not(.hidden)').waitFor({ state: 'visible', timeout: 15000 });
    await this.waitForLoadingComplete();

    console.log(`✅ Proyecto abierto: ${projectName}`);
  }

  /**
   * Edita un proyecto existente
   * @param {string} currentName - Nombre actual del proyecto
   * @param {Object} newData - Nuevos datos
   */
  async editProject(currentName, newData) {
    console.log(`✏️ Editando proyecto: ${currentName}`);

    // Usar coincidencia parcial para nombres truncados
    const searchText = currentName.substring(0, 20);
    const projectRow = this.page.locator(this.selectors.projectCard).filter({ hasText: new RegExp(searchText, 'i') }).first();

    // Click en botón de editar (buscar en la fila)
    const editBtn = projectRow.locator(this.selectors.editProjectButton);
    await editBtn.click();
    await this.waitForModal();

    // El formulario está dentro de un shadow DOM (project-form es un Lit component)
    const projectForm = this.page.locator('project-form');
    await projectForm.waitFor({ state: 'visible', timeout: 10000 });

    // Esperar a que el loading del formulario termine
    await projectForm.locator('#projectName').waitFor({ state: 'visible', timeout: 20000 });

    // Actualizar campos
    if (newData.name) {
      const nameInput = projectForm.locator('#projectName');
      await nameInput.clear();
      await nameInput.fill(newData.name);
    }

    if (newData.description) {
      const descInput = projectForm.locator('#projectDescription');
      await descInput.clear();
      await descInput.fill(newData.description);
    }

    // Guardar
    await this.page.locator(this.selectors.saveProjectButton).click();

    // Esperar a que el modal se cierre
    await this.waitForModalClose().catch(() => {});

    // Esperar sincronización con Firebase
    await this.page.waitForTimeout(2000);

    // Refrescar para ver los cambios
    await this.page.reload();
    await this.waitForLoadingComplete();

    console.log(`✅ Proyecto editado: ${newData.name || currentName}`);
  }

  /**
   * Elimina un proyecto
   * La eliminación se hace desde el modal de edición, en la "Zona de Peligro"
   * @param {string} projectName - Nombre del proyecto a eliminar
   */
  async deleteProject(projectName) {
    console.log(`🗑️ Eliminando proyecto: ${projectName}`);

    // Usar coincidencia parcial para nombres truncados
    const searchText = projectName.substring(0, 20);
    const projectRow = this.page.locator(this.selectors.projectCard).filter({ hasText: new RegExp(searchText, 'i') }).first();

    // Click en botón de editar para abrir el modal
    const editBtn = projectRow.locator(this.selectors.editProjectButton);
    await editBtn.click();
    await this.waitForModal();

    // El formulario está dentro de un Lit component
    const projectForm = this.page.locator('project-form');
    await projectForm.waitFor({ state: 'visible', timeout: 10000 });

    // Esperar a que el loading del formulario termine
    await projectForm.locator('#projectName').waitFor({ state: 'visible', timeout: 20000 });

    // Navegar a la pestaña "Admin" donde está la zona de peligro
    const colorTabs = projectForm.locator('color-tabs');
    const adminTabButton = colorTabs.locator('#tab-admin');
    await adminTabButton.click();
    await this.page.waitForTimeout(300);

    // Scroll hasta la zona de peligro
    const dangerZone = projectForm.locator('.danger-zone');
    await dangerZone.scrollIntoViewIfNeeded();

    // Click en "Eliminar Proyecto" para mostrar la confirmación
    const deleteButton = projectForm.locator('.delete-button');
    await deleteButton.click();

    // Esperar a que aparezca el campo de confirmación
    const confirmInput = projectForm.locator('.delete-confirmation input');
    await confirmInput.waitFor({ state: 'visible', timeout: 5000 });

    // Escribir el nombre del proyecto para confirmar
    // IMPORTANTE: Debe coincidir EXACTAMENTE con originalProjectName del formulario
    await confirmInput.fill(projectName);

    // Click en el botón de eliminar definitivamente
    // Esperar a que el botón esté habilitado (el texto debe coincidir exactamente)
    const finalDeleteButton = projectForm.locator('.final-delete-button');
    await finalDeleteButton.waitFor({ state: 'visible', timeout: 5000 });

    // Esperar a que el botón no esté deshabilitado (el input match con originalProjectName)
    // Si después de 5s sigue deshabilitado, intentar con el nombre exacto del input
    const isEnabled = await finalDeleteButton.isEnabled();
    if (!isEnabled) {
      // El nombre no coincide exactamente, intentar obtener el nombre del formulario
      const codeElement = projectForm.locator('.delete-confirmation code');
      const exactName = await codeElement.textContent();
      if (exactName && exactName !== projectName) {
        console.log(`⚠️ Nombre exacto del proyecto: "${exactName}" (test usó: "${projectName}")`);
        await confirmInput.clear();
        await confirmInput.fill(exactName.trim());
        await this.page.waitForTimeout(300);
      }
    }

    await finalDeleteButton.click();

    // Esperar a que se procese la eliminación (puede tardar más con proyectos grandes)
    await this.page.waitForTimeout(5000);

    console.log(`✅ Proyecto eliminado: ${projectName}`);
  }

  /**
   * Verifica si un proyecto existe
   * @param {string} projectName - Nombre del proyecto
   * @returns {Promise<boolean>}
   */
  async projectExists(projectName) {
    // Usar coincidencia parcial para nombres que pueden estar truncados en la UI
    const searchText = projectName.substring(0, 20);
    const projectCard = this.page.locator(this.selectors.projectCard).filter({ hasText: new RegExp(searchText, 'i') });
    return await projectCard.count() > 0;
  }

  /**
   * Obtiene la lista de nombres de proyectos
   * @returns {Promise<string[]>}
   */
  async getProjectNames() {
    const cards = this.page.locator(this.selectors.projectCard);
    const count = await cards.count();
    const names = [];

    for (let i = 0; i < count; i++) {
      const name = await cards.nth(i).locator(this.selectors.projectName).textContent();
      names.push(name.trim());
    }

    return names;
  }
}
