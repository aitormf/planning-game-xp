/**
 * E2E Tests: Projects CRUD
 *
 * Uses shared authenticated session (no re-login).
 * Tests project creation, navigation, and deletion.
 */

import { test, expect } from '../../fixtures/auth.fixture.js';
import { DashboardPage } from '../../page-objects/index.js';

test.describe.serial('Projects CRUD', () => {
  const projectName = `E2E-Project-${Date.now()}`;
  let dashboardPage;

  test('create project and verify it exists', async ({ sharedPage }) => {
    dashboardPage = new DashboardPage(sharedPage);

    console.log('  Phase 1/3: Navigate to dashboard');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();

    console.log('  Phase 2/3: Create project');
    await dashboardPage.createProject({
      name: projectName,
      description: 'E2E test project'
    });

    console.log('  Phase 3/3: Verify project exists');
    const exists = await dashboardPage.projectExists(projectName);
    expect(exists).toBeTruthy();
  });

  test('open project and navigate sections', async ({ sharedPage }) => {
    dashboardPage = new DashboardPage(sharedPage);

    console.log('  Phase 1/3: Open project');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();
    await dashboardPage.openProject(projectName);

    console.log('  Phase 2/3: Verify project page loaded');
    await expect(sharedPage).toHaveURL(/adminproject/);

    console.log('  Phase 3/3: Verify sections visible');
    const sections = ['Sprints', 'Epics', 'Tasks', 'Bugs'];
    for (const section of sections) {
      const sectionBtn = sharedPage.locator(`button:has-text("${section}")`).first();
      await expect(sectionBtn).toBeVisible({ timeout: 10000 });
    }
  });

  test('delete project and verify cleanup', async ({ sharedPage }) => {
    dashboardPage = new DashboardPage(sharedPage);

    console.log('  Phase 1/3: Navigate to dashboard');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();

    console.log('  Phase 2/3: Delete project');
    await dashboardPage.deleteProject(projectName);

    console.log('  Phase 3/3: Verify project removed');
    await sharedPage.waitForTimeout(2000);
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();
    const exists = await dashboardPage.projectExists(projectName);
    expect(exists).toBeFalsy();
  });
});
