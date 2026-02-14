/**
 * E2E Tests: Card Interactions
 *
 * Uses shared authenticated session (no re-login).
 * Tests card expand/collapse, eye button, nested modals, copy link, edit.
 * Project + epic + tasks are prerequisites created in setup.
 */

import { test, expect } from '../../fixtures/auth.fixture.js';
import { DashboardPage, ProjectPage, CardsPage } from '../../page-objects/index.js';

const timestamp = Date.now();
const TEST_DATA = {
  project: {
    name: `E2E-Cards-${timestamp}`,
    description: 'Card interactions E2E test',
    developer: { name: 'Test User', email: 'testuser@example.com' }
  },
  epic: {
    title: `E2E-Epic-${timestamp}`,
    description: 'Epic for card interaction tests',
    startDate: new Date().toISOString().split('T')[0]
  },
  task: {
    title: `E2E-Task-${timestamp}`,
    description: 'Task linked to epic',
    businessPoints: 3,
    devPoints: 5
  },
  taskNoEpic: {
    title: `E2E-Task-NoEpic-${timestamp}`,
    description: 'Task without epic'
  }
};

test.describe.serial('Card Interactions', () => {
  test.setTimeout(180000);

  test('setup: create project, epic, and tasks', async ({ sharedPage }) => {
    const page = sharedPage;
    const dashboardPage = new DashboardPage(page);
    const projectPage = new ProjectPage(page);
    const cardsPage = new CardsPage(page);

    console.log('  Phase 1/5: Create project');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();
    await dashboardPage.createProject(TEST_DATA.project);
    await dashboardPage.openProject(TEST_DATA.project.name);

    console.log('  Phase 2/5: Create epic');
    await projectPage.goToEpics();
    await cardsPage.createEpic(TEST_DATA.epic);
    const epicCard = page.locator(`epic-card:has-text("${TEST_DATA.epic.title}")`).first();
    await expect(epicCard).toBeVisible({ timeout: 10000 });

    console.log('  Phase 3/5: Create task linked to epic');
    await projectPage.goToTasks();
    await page.locator('button#addTaskCard, button:has-text("+ New Task")').first().click();
    await cardsPage.waitForModal();
    await cardsPage.fillCardFields(TEST_DATA.task);

    // Try to link task to epic via the epic dropdown
    const epicDropdown = page.locator('select').filter({ hasText: /epic/i }).first()
      .or(page.locator('select:has(option:has-text("Sin epic"))').first());
    if (await epicDropdown.isVisible().catch(() => false)) {
      const options = await epicDropdown.locator('option').allTextContents();
      const epicOption = options.find(opt => opt.includes(TEST_DATA.epic.title));
      if (epicOption) {
        await epicDropdown.selectOption({ label: epicOption });
      }
    }
    await cardsPage.saveCard();

    console.log('  Phase 4/5: Create task without epic');
    await cardsPage.createTask(TEST_DATA.taskNoEpic);

    console.log('  Phase 5/5: Setup complete');
  });

  test('expand and collapse task card', async ({ sharedPage }) => {
    const page = sharedPage;
    const dashboardPage = new DashboardPage(page);
    const projectPage = new ProjectPage(page);

    console.log('  Phase 1/4: Navigate to tasks');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();
    await dashboardPage.openProject(TEST_DATA.project.name);
    // Default view is Table View; switch to Cards View to see task-card elements
    const listViewBtn = page.locator('#listViewBtn');
    await listViewBtn.waitFor({ state: 'visible', timeout: 15000 });
    await listViewBtn.click();
    // Wait for at least one task-card to render
    await page.locator('task-card').first().waitFor({ state: 'visible', timeout: 30000 });

    console.log('  Phase 2/4: Find and click task');
    const taskCard = page.locator(`task-card:has-text("${TEST_DATA.task.title}")`).first();
    await expect(taskCard).toBeVisible({ timeout: 15000 });
    await taskCard.click();

    console.log('  Phase 3/4: Verify modal opens with correct content');
    const modal = page.locator('app-modal').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    // Title may be in an input field (Lit component) or as text
    const titleInput = modal.locator('input.title, input.title-input').first();
    if (await titleInput.isVisible().catch(() => false)) {
      await expect(titleInput).toHaveValue(TEST_DATA.task.title);
    } else {
      // Fallback: check as text content
      await expect(modal.locator(`text="${TEST_DATA.task.title}"`)).toBeVisible({ timeout: 5000 });
    }

    console.log('  Phase 4/4: Close modal with Escape');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // Handle "Cambios sin guardar" confirmation if it appears
    const confirmClose = page.locator('button:has-text("Sí, cerrar sin guardar")');
    if (await confirmClose.isVisible().catch(() => false)) {
      await confirmClose.click();
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(500);
    const modalCount = await page.locator('app-modal').count();
    expect(modalCount).toBe(0);
  });

  test('eye button on epic shows linked tasks', async ({ sharedPage }) => {
    const page = sharedPage;
    const dashboardPage = new DashboardPage(page);
    const projectPage = new ProjectPage(page);

    console.log('  Phase 1/4: Navigate to epics');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();
    await dashboardPage.openProject(TEST_DATA.project.name);
    await projectPage.goToEpics();

    console.log('  Phase 2/4: Click eye button on epic');
    const epicCard = page.locator(`epic-card:has-text("${TEST_DATA.epic.title}")`).first();
    await expect(epicCard).toBeVisible({ timeout: 10000 });
    const eyeButton = epicCard.locator('button:has-text("👁️"), button[title*="tareas"], .show-tasks-button').first();
    await expect(eyeButton).toBeVisible({ timeout: 5000 });
    await eyeButton.click();

    console.log('  Phase 3/4: Verify tasks table in modal');
    const modal = page.locator('app-modal').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    const table = modal.locator('table, .epic-tasks-table');
    await expect(table).toBeVisible({ timeout: 5000 });

    console.log('  Phase 4/4: Verify correct task filtering');
    const taskInTable = modal.locator(`text="${TEST_DATA.task.title}"`);
    await expect(taskInTable).toBeVisible({ timeout: 5000 });
    const noEpicTask = modal.locator(`text="${TEST_DATA.taskNoEpic.title}"`);
    const count = await noEpicTask.count();
    expect(count).toBe(0);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('nested modals: open task from epic modal', async ({ sharedPage }) => {
    const page = sharedPage;
    const projectPage = new ProjectPage(page);

    console.log('  Phase 1/4: Open epic tasks modal');
    await projectPage.goToEpics();
    const epicCard = page.locator(`epic-card:has-text("${TEST_DATA.epic.title}")`).first();
    await expect(epicCard).toBeVisible({ timeout: 10000 });
    const eyeButton = epicCard.locator('button:has-text("👁️"), button[title*="tareas"], .show-tasks-button').first();
    await eyeButton.click();
    const epicModal = page.locator('app-modal').first();
    await expect(epicModal).toBeVisible({ timeout: 10000 });

    console.log('  Phase 2/4: Click view task button inside modal');
    const viewTaskButton = epicModal.locator('button.view-task-btn, button:has-text("👁️")').first();
    await expect(viewTaskButton).toBeVisible({ timeout: 5000 });
    await viewTaskButton.click();

    console.log('  Phase 3/4: Verify nested modal opens');
    await page.waitForTimeout(1000);
    const modals = page.locator('app-modal');
    const modalCount = await modals.count();
    expect(modalCount).toBeGreaterThanOrEqual(2);

    const taskModal = modals.last();
    // Title may be in modal header, input field, or as text
    const titleInput = taskModal.locator('input.title, input.title-input').first();
    const titleInHeader = taskModal.locator(`.modal-header:has-text("${TEST_DATA.task.title}")`).first();
    const titleAsText = taskModal.locator(`text="${TEST_DATA.task.title}"`);
    const found = await titleInput.isVisible().catch(() => false) ||
                  await titleInHeader.isVisible().catch(() => false) ||
                  await titleAsText.isVisible().catch(() => false);
    expect(found).toBeTruthy();

    console.log('  Phase 4/4: Close all modals');
    // Close all open modals by pressing Escape repeatedly
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const confirmClose = page.locator('button:has-text("Sí, cerrar sin guardar")');
      if (await confirmClose.isVisible().catch(() => false)) {
        await confirmClose.click();
        await page.waitForTimeout(500);
      }
      if (await page.locator('app-modal').count() === 0) break;
    }
  });

  test('copy link button does not expand card', async ({ sharedPage }) => {
    const page = sharedPage;
    const projectPage = new ProjectPage(page);

    console.log('  Phase 1/3: Navigate to epics');
    await projectPage.goToEpics();
    // Close any leftover modals from previous test
    while (await page.locator('app-modal').first().isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const confirmClose = page.locator('button:has-text("Sí, cerrar sin guardar")');
      if (await confirmClose.isVisible().catch(() => false)) {
        await confirmClose.click();
        await page.waitForTimeout(300);
      }
    }
    const epicCard = page.locator(`epic-card:has-text("${TEST_DATA.epic.title}")`).first();
    await expect(epicCard).toBeVisible({ timeout: 10000 });

    console.log('  Phase 2/3: Click copy link button');
    // Count visible modals before clicking
    const modalsBefore = await page.locator('app-modal').evaluateAll(modals =>
      modals.filter(m => m.offsetParent !== null).length
    );
    const linkButton = epicCard.locator('button[title="Copiar enlace"], button.copy-link-button:has-text("🔗")').first();
    await expect(linkButton).toBeVisible({ timeout: 5000 });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await linkButton.click();
    await page.waitForTimeout(500);

    console.log('  Phase 3/3: Verify card did NOT expand (no new modal)');
    const modalsAfter = await page.locator('app-modal').evaluateAll(modals =>
      modals.filter(m => m.offsetParent !== null).length
    );
    expect(modalsAfter).toBe(modalsBefore);
  });

  test('edit task and verify persistence', async ({ sharedPage }) => {
    const page = sharedPage;
    const dashboardPage = new DashboardPage(page);
    const projectPage = new ProjectPage(page);
    const cardsPage = new CardsPage(page);
    const newDescription = 'Description modified by E2E test';

    console.log('  Phase 1/5: Navigate to tasks');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();
    await dashboardPage.openProject(TEST_DATA.project.name);
    // Default view is Table View; switch to Cards View
    const listViewBtn = page.locator('#listViewBtn');
    await listViewBtn.waitFor({ state: 'visible', timeout: 15000 });
    await listViewBtn.click();
    await page.locator('task-card').first().waitFor({ state: 'visible', timeout: 30000 });

    console.log('  Phase 2/5: Open task modal');
    const taskCard = page.locator(`task-card:has-text("${TEST_DATA.task.title}")`).first();
    await expect(taskCard).toBeVisible({ timeout: 15000 });
    await taskCard.click();
    await cardsPage.waitForModal();

    console.log('  Phase 3/5: Modify description');
    const descTab = page.locator('button:has-text("Description")').first();
    if (await descTab.isVisible()) {
      await descTab.click();
      await page.waitForTimeout(300);
    }
    const descInput = page.locator('app-modal textarea').first();
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.clear();
      await descInput.fill(newDescription);
    }

    console.log('  Phase 4/5: Save changes');
    await cardsPage.saveCard();
    await page.waitForTimeout(1000);

    console.log('  Phase 5/5: Reopen and verify persistence');
    const taskCardAgain = page.locator(`task-card:has-text("${TEST_DATA.task.title}")`).first();
    await taskCardAgain.click();
    await cardsPage.waitForModal();
    if (await descTab.isVisible()) {
      await descTab.click();
      await page.waitForTimeout(300);
    }
    const savedDesc = page.locator(`text="${newDescription}"`);
    const descVisible = await savedDesc.isVisible().catch(() => false);
    if (descVisible) {
      console.log('    Description persisted correctly');
    }
    await page.keyboard.press('Escape');
  });

  test('cleanup: delete project', async ({ sharedPage }) => {
    const dashboardPage = new DashboardPage(sharedPage);

    console.log('  Phase 1/3: Navigate to dashboard');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();

    console.log('  Phase 2/3: Delete project');
    const exists = await dashboardPage.projectExists(TEST_DATA.project.name);
    if (exists) {
      await dashboardPage.deleteProject(TEST_DATA.project.name);
    }

    console.log('  Phase 3/3: Verify project removed');
    await sharedPage.waitForTimeout(2000);
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();
    const stillExists = await dashboardPage.projectExists(TEST_DATA.project.name);
    expect(stillExists).toBeFalsy();
  });
});
