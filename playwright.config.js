import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env.test for E2E tests
dotenv.config({ path: '.env.test' });

// Headed mode: enabled via --headed CLI flag or HEADED=true env var
const isHeaded = process.argv.includes('--headed') || process.env.HEADED === 'true';

export default defineConfig({
  testDir: './playwright/tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 0,
  /* Sequential execution */
  workers: 1,
  /* Reporter: custom verbose reporter + HTML report */
  reporter: [
    ['html', { open: 'never' }],
    ['./playwright/reporters/verbose-reporter.js']
  ],
  /* Shared settings for all the projects below. */
  use: {
    baseURL: 'http://localhost:4325',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: !isHeaded,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: process.env.CI ? 'npm run dev:ci -- --port 4325' : 'npm run dev:test -- --port 4325',
    port: 4325,
    reuseExistingServer: false, // No reutilizar para asegurar que usa .env.test
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Global setup and teardown */
  globalSetup: './playwright/global-setup.js',
  globalTeardown: './playwright/global-teardown.js',
});