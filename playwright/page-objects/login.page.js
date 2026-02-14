import { BasePage } from './base.page.js';

/**
 * Login Page Object - Manejo de autenticación
 */
export class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      // Botones de login en la app
      loginWithMicrosoftButton: 'button:has-text("Sign in with Microsoft")',
      loginWithEmailButton: 'button:has-text("Entrar con email")',

      // Email/Password login form - use specific IDs to avoid strict mode violations
      emailInput: '#emailLoginInput',
      passwordInput: '#emailLoginPassword', // NOSONAR - This is a CSS selector, not a password
      submitButton: '#emailLoginForm button.login-button[type="submit"]',

      // Login success indicators
      logoutButton: '#logoutButton:not(.hidden)',
      newProjectButton: 'button:has-text("Nuevo Proyecto"), button:has-text("New Project")',
      userStatus: '#userStatus',

      // Dashboard elements
      dashboardContainer: '.dashboard, #dashboard, [data-page="dashboard"]',
      userEmail: '[data-user-email], .user-email'
    };
  }

  /**
   * Navega a la página de login
   */
  async goto() {
    await super.goto('/');
  }

  /**
   * Verifica si el usuario ya está autenticado
   */
  async isLoggedIn() {
    try {
      // Verificar si existe el botón de logout visible (indica que está logueado)
      const logoutBtn = this.page.locator(this.selectors.logoutButton);
      await logoutBtn.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Performs email/password login
   * @param {string} email
   * @param {string} password
   * @param {object} [options]
   * @param {boolean} [options.silent] - Suppress console output (used by fixture)
   */
  async login(email, password, { silent = false } = {}) {
    if (await this.isLoggedIn()) {
      return;
    }

    if (!silent) console.log(`  [login] Authenticating: ${email}`);

    const loginWithEmailBtn = this.page.locator(this.selectors.loginWithEmailButton);
    await loginWithEmailBtn.waitFor({ state: 'visible', timeout: 10000 });
    await loginWithEmailBtn.click();

    await this.page.waitForTimeout(500);

    const emailInput = this.page.locator(this.selectors.emailInput);
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(email);

    const passwordInput = this.page.locator(this.selectors.passwordInput);
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.fill(password);

    const submitBtn = this.page.locator(this.selectors.submitButton);
    await submitBtn.click();

    await this.waitForAuthenticated();

    if (!silent) console.log('  [login] OK');
  }

  /**
   * Waits for authentication to complete (logout button visible + data-authenticated)
   */
  async waitForAuthenticated() {
    const logoutBtn = this.page.locator(this.selectors.logoutButton);
    await logoutBtn.waitFor({ state: 'visible', timeout: 30000 });

    const isAuthenticated = await this.page.evaluate(() => {
      return document.body.dataset.authenticated === 'true';
    });

    if (!isAuthenticated) {
      throw new Error('Login failed - data-authenticated is not true');
    }
  }

  /**
   * Obtiene el email del usuario logueado
   */
  async getLoggedUserEmail() {
    const userStatus = this.page.locator(this.selectors.userStatus);
    if (await userStatus.isVisible()) {
      const text = await userStatus.textContent();
      // Texto es "Signed in as email@example.com"
      return text?.replace('Signed in as ', '').trim();
    }
    return null;
  }

  /**
   * Realiza logout
   */
  async logout() {
    const logoutButton = this.page.locator(this.selectors.logoutButton);
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await this.waitForLoadingComplete();
    }
  }
}
