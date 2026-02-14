import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const firebaseConfigPath = path.resolve(process.cwd(), 'public/firebase-config.js');
const firebaseSnapshotPath = path.join(__dirname, '.firebase-config.snapshot');

async function ensureBrowserInstalled() {
  try {
    const executablePath = chromium.executablePath();
    if (!fs.existsSync(executablePath)) {
      throw new Error('Chromium not found');
    }
  } catch {
    console.log('  [setup] Installing Chromium...');
    const playwrightCli = require.resolve('playwright/cli');
    const result = spawnSync(process.execPath, [playwrightCli, 'install', 'chromium'], { stdio: 'inherit' });
    if (result.status !== 0) {
      throw new Error('Failed to install Chromium');
    }
    console.log('  [setup] Chromium installed');
  }
}

/**
 * Verifies we are using the test database (not production).
 */
function verifyTestDatabase() {
  const databaseUrl = process.env.PUBLIC_FIREBASE_DATABASE_URL || '';
  const isTestDatabase = databaseUrl.includes('tests');

  if (!isTestDatabase) {
    console.error('\n  ERROR: NOT USING TEST DATABASE');
    console.error(`  DATABASE_URL: ${databaseUrl}`);
    console.error('  Expected URL containing "tests"');
    console.error('  Run with: npm run test:e2e\n');
    throw new Error('ABORTED: Tests cannot run against non-test database');
  }

  console.log(`  [setup] Test database: ${databaseUrl}`);
}

async function globalSetup() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' E2E TEST SUITE - Global Setup');
  console.log('══════════════════════════════════════════════\n');

  verifyTestDatabase();

  // Snapshot firebase-config.js so we can restore after tests
  if (fs.existsSync(firebaseConfigPath) && !fs.existsSync(firebaseSnapshotPath)) {
    fs.writeFileSync(firebaseSnapshotPath, fs.readFileSync(firebaseConfigPath, 'utf8'));
  }

  await ensureBrowserInstalled();

  console.log('  [setup] Ready\n');
}

export default globalSetup;
