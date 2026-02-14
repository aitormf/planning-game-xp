/**
 * E2E Tests: Authentication
 *
 * This is the ONLY spec that TESTS login functionality.
 * All other specs use the shared authenticated session without testing login.
 */

import { test, expect } from '../../fixtures/auth.fixture.js';
import { LoginPage } from '../../page-objects/index.js';

test.describe('Authentication', () => {
  test('login and session persistence', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const email = process.env.TEST_USER_EMAIL || 'testuser@example.com';
    const password = process.env.TEST_USER_PASSWORD || '12345678';

    console.log('  Phase 1/3: Navigate and login');
    await loginPage.goto();
    await loginPage.login(email, password);

    console.log('  Phase 2/3: Verify authenticated state');
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();

    console.log('  Phase 3/3: Verify session persists after reload');
    await page.reload();
    await loginPage.waitForLoadingComplete();
    const stillLoggedIn = await loginPage.isLoggedIn();
    expect(stillLoggedIn).toBeTruthy();
  });
});
