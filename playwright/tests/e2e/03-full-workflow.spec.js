/**
 * E2E Tests: Full Workflow
 *
 * Uses shared authenticated session (no re-login).
 * Tests complete project lifecycle: create project, sprint, epic, task, bug, QA, then delete.
 * Project creation is a prerequisite, not a test assertion itself.
 */

import { test, expect } from '../../fixtures/auth.fixture.js';
import { DashboardPage, ProjectPage, CardsPage } from '../../page-objects/index.js';

const timestamp = Date.now();
const TEST_USER = {
  name: 'Test User',
  email: process.env.TEST_USER_EMAIL || 'testuser@example.com'
};

const TEST_DATA = {
  project: {
    name: `E2E-Workflow-${timestamp}`,
    description: 'Full workflow E2E test',
    developer: TEST_USER,
    stakeholder: TEST_USER
  },
  sprint: {
    title: `E2E-Sprint-${timestamp}`,
    description: 'Sprint E2E test',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  epic: {
    title: `E2E-Epic-${timestamp}`,
    description: 'Epic E2E test',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  task: {
    title: `E2E-Task-${timestamp}`,
    description: 'Task E2E test',
    businessPoints: 3,
    devPoints: 5,
    developer: TEST_USER.name
  },
  bug: {
    title: `E2E-Bug-${timestamp}`,
    description: 'Bug E2E test',
    priority: 'Alta',
    developer: TEST_USER.name
  },
  qa: {
    title: `E2E-QA-${timestamp}`,
    description: 'QA E2E test'
  }
};

test.describe.serial('Full Workflow', () => {
  test.setTimeout(300000);

  test('setup: create project with developer and stakeholder', async ({ sharedPage }) => {
    const dashboardPage = new DashboardPage(sharedPage);

    console.log('  Phase 1/2: Create project');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();
    await dashboardPage.createProject(TEST_DATA.project);

    console.log('  Phase 2/2: Verify project created');
    const exists = await dashboardPage.projectExists(TEST_DATA.project.name);
    expect(exists).toBeTruthy();
  });

  test('create sprint', async ({ sharedPage }) => {
    const dashboardPage = new DashboardPage(sharedPage);
    const projectPage = new ProjectPage(sharedPage);
    const cardsPage = new CardsPage(sharedPage);

    console.log('  Phase 1/3: Navigate to project sprints');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();
    await dashboardPage.openProject(TEST_DATA.project.name);
    await projectPage.goToSprints();

    console.log('  Phase 2/3: Create sprint');
    await cardsPage.createSprint(TEST_DATA.sprint);

    console.log('  Phase 3/3: Verify sprint visible');
    const sprintCard = sharedPage.locator(`sprint-card:has-text("${TEST_DATA.sprint.title}")`);
    await expect(sprintCard).toBeVisible({ timeout: 10000 });
  });

  test('create epic', async ({ sharedPage }) => {
    const projectPage = new ProjectPage(sharedPage);
    const cardsPage = new CardsPage(sharedPage);

    console.log('  Phase 1/2: Navigate to epics');
    await projectPage.goToEpics();

    console.log('  Phase 2/2: Create epic and verify');
    await cardsPage.createEpic(TEST_DATA.epic);
    const epicCard = sharedPage.locator(`epic-card:has-text("${TEST_DATA.epic.title}")`);
    await expect(epicCard).toBeVisible({ timeout: 10000 });
  });

  test('create task with developer', async ({ sharedPage }) => {
    const projectPage = new ProjectPage(sharedPage);
    const cardsPage = new CardsPage(sharedPage);

    console.log('  Phase 1/2: Navigate to tasks');
    await projectPage.goToTasks();

    console.log('  Phase 2/2: Create task');
    await cardsPage.createTask(TEST_DATA.task);
  });

  test('create bug with developer', async ({ sharedPage }) => {
    const projectPage = new ProjectPage(sharedPage);
    const cardsPage = new CardsPage(sharedPage);

    console.log('  Phase 1/2: Navigate to bugs');
    await projectPage.goToBugs();

    console.log('  Phase 2/2: Create bug');
    await cardsPage.createBug(TEST_DATA.bug);
  });

  test('create QA item', async ({ sharedPage }) => {
    const projectPage = new ProjectPage(sharedPage);
    const cardsPage = new CardsPage(sharedPage);

    console.log('  Phase 1/2: Navigate to QA');
    await projectPage.goToQA();

    console.log('  Phase 2/2: Create QA');
    await cardsPage.createQA(TEST_DATA.qa);
  });

  test('cleanup: delete project', async ({ sharedPage }) => {
    const dashboardPage = new DashboardPage(sharedPage);

    console.log('  Phase 1/3: Navigate to dashboard');
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();

    console.log('  Phase 2/3: Delete project');
    await dashboardPage.deleteProject(TEST_DATA.project.name);

    console.log('  Phase 3/3: Verify project removed');
    await sharedPage.waitForTimeout(2000);
    await dashboardPage.goto();
    await dashboardPage.waitForLoadingComplete();
    const exists = await dashboardPage.projectExists(TEST_DATA.project.name);
    expect(exists).toBeFalsy();
  });
});
