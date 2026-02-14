import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page.js';
import { DashboardPage } from '../page-objects/dashboard.page.js';
import { setupTestUser, cleanupTestUser } from '../helpers/test-user-setup.js';

/**
 * Worker-scoped fixture: login happens ONCE for the entire test run.
 * Since workers=1, all tests share the same authenticated browser session.
 *
 * After login:
 * 1. Ensures test user exists in all required DB paths (developer, stakeholder, admin)
 *
 * On teardown:
 * 1. Deletes any leftover E2E test projects
 * 2. Removes test user data from DB
 */

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'testuser@example.com',
  name: 'Test User',
  password: process.env.TEST_USER_PASSWORD || '12345678'
};

export const test = base.extend({
  sharedPage: [async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: 'http://localhost:4325'
    });
    const page = await context.newPage();

    // 1. Login once
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    console.log('  [fixture] Authenticated session ready');

    // 2. Ensure test user exists in all required DB paths
    await setupTestUser(page, { email: TEST_USER.email, name: TEST_USER.name });

    // 3. Navigate to dashboard (clean starting state)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await use(page);

    // TEARDOWN

    // 4. Delete any leftover E2E projects
    console.log('\n  [fixture] Running cleanup...');
    try {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForLoadingComplete();

      const projectNames = await dashboardPage.getProjectNames();
      const e2eProjects = projectNames.filter(name => name.startsWith('E2E-'));

      if (e2eProjects.length > 0) {
        console.log(`  [fixture] Found ${e2eProjects.length} leftover E2E project(s)`);
        for (const projectName of e2eProjects) {
          try {
            await dashboardPage.goto();
            await dashboardPage.waitForLoadingComplete();
            await dashboardPage.deleteProject(projectName);
            console.log(`  [fixture] Deleted: ${projectName}`);
          } catch (error) {
            console.error(`  [fixture] Failed to delete ${projectName}: ${error.message}`);
          }
        }
      } else {
        console.log('  [fixture] No leftover E2E projects');
      }
    } catch (error) {
      console.error(`  [fixture] Project cleanup error: ${error.message}`);
    }

    // 5. Remove test user data from DB
    await cleanupTestUser(page, { email: TEST_USER.email });

    await context.close();
  }, { scope: 'worker' }],

  /**
   * Login page instance (for 01-auth tests that test login functionality)
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  }
});

export { expect } from '@playwright/test';
