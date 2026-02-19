/**
 * E2E Tests: Dark Theme
 *
 * Verifies dark theme toggle, CSS class application,
 * localStorage persistence, and visual consistency.
 */

import { test, expect } from '../../fixtures/auth.fixture.js';

test.describe('Dark Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('toggle dark mode via button', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();

    // Start in light mode (default)
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark-theme/);

    // Toggle to dark
    await themeToggle.click();
    await expect(html).toHaveClass(/dark-theme/);

    // Toggle back to light
    await themeToggle.click();
    await expect(html).toHaveClass(/light-theme/);
    await expect(html).not.toHaveClass(/dark-theme/);
  });

  test('dark theme persists after reload', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await themeToggle.click();

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark-theme/);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Theme should persist
    await expect(html).toHaveClass(/dark-theme/);

    // Restore to light for other tests
    const toggle = page.locator('#themeToggle');
    await toggle.click();
    await expect(html).not.toHaveClass(/dark-theme/);
  });

  test('dark theme applies CSS variables to root', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await themeToggle.click();

    // Verify dark theme CSS variables are applied
    const bgPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim()
    );
    expect(bgPrimary).toBeTruthy();
    expect(bgPrimary).not.toBe('');

    const textPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim()
    );
    expect(textPrimary).toBeTruthy();

    // Restore light theme
    await themeToggle.click();
  });

  test('no visual contrast issues in dark mode on main views', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await themeToggle.click();

    // Check text is readable (light text on dark background)
    const contrast = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const textColor = style.getPropertyValue('--text-primary').trim();
      const bgColor = style.getPropertyValue('--bg-primary').trim();

      // Parse hex to RGB luminance
      function hexLuminance(hex) {
        if (!hex) return 0;
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }

      return {
        textLuminance: hexLuminance(textColor),
        bgLuminance: hexLuminance(bgColor),
        textColor,
        bgColor
      };
    });

    // Dark bg should have low luminance, light text should have high luminance
    expect(contrast.bgLuminance).toBeLessThan(0.3);
    expect(contrast.textLuminance).toBeGreaterThan(0.7);

    // Restore light theme
    await themeToggle.click();
  });
});
