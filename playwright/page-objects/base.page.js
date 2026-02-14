/**
 * Base Page Object - Funcionalidad común para todas las páginas
 */
export class BasePage {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:4325';
  }

  /**
   * Navega a una URL específica
   */
  async goto(path = '/') {
    await this.page.goto(`${this.baseUrl}${path}`);
  }

  /**
   * Espera a que desaparezca cualquier indicador de carga
   */
  async waitForLoadingComplete() {
    // Esperar a que no haya spinners o loaders visibles
    await this.page.waitForLoadState('networkidle');

    // Esperar a que desaparezcan los loaders específicos de la app
    const loaders = [
      '.loading',
      '.spinner',
      '[data-loading="true"]',
      '.skeleton'
    ];

    for (const loader of loaders) {
      const element = this.page.locator(loader);
      if (await element.count() > 0) {
        await element.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      }
    }
  }

  /**
   * Espera a que aparezca un modal
   */
  async waitForModal() {
    await this.page.locator('app-modal').waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Espera a que se cierre el modal
   */
  async waitForModalClose() {
    await this.page.locator('app-modal').waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Cierra el modal actual si está abierto
   */
  async closeModal() {
    const closeButton = this.page.locator('app-modal .close-button, app-modal [aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await this.waitForModalClose();
    }
  }

  /**
   * Toma una captura de pantalla con nombre descriptivo
   */
  async screenshot(name) {
    const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
    await this.page.screenshot({
      path: `playwright/screenshots/${name}-${timestamp}.png`,
      fullPage: true
    });
  }

  /**
   * Genera un ID único para tests
   */
  generateTestId(prefix = 'test') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8); // NOSONAR - Not used for security, only for unique test IDs
    return `E2E-${prefix}-${timestamp}-${random}`;
  }

  /**
   * Espera y hace click en un elemento
   */
  async clickAndWait(selector, options = {}) {
    await this.page.locator(selector).click(options);
    await this.waitForLoadingComplete();
  }

  /**
   * Verifica que aparezca una notificación de éxito
   */
  async expectSuccessNotification(timeout = 5000) {
    await this.page.locator('slide-notification[type="success"], .notification-success, .toast-success')
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Verifica que aparezca una notificación de error
   */
  async expectErrorNotification(timeout = 5000) {
    await this.page.locator('slide-notification[type="error"], .notification-error, .toast-error')
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Confirma un diálogo de eliminación
   */
  async confirmDelete() {
    // Buscar el botón de confirmación en el modal
    const confirmButton = this.page.locator('app-modal button:has-text("Yes"), app-modal button:has-text("Sí"), app-modal button:has-text("Confirmar"), app-modal button:has-text("Eliminar")').first();
    await confirmButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Cancela un diálogo
   */
  async cancelDialog() {
    const cancelButton = this.page.locator('app-modal button:has-text("No"), app-modal button:has-text("Cancelar")').first();
    await cancelButton.click();
    await this.waitForModalClose();
  }
}
