#!/usr/bin/env node
/**
 * Reusable Firebase Admin SDK initializer for scripts.
 *
 * Detects the active instance from .last-instance, loads the
 * serviceAccountKey.json and PUBLIC_FIREBASE_DATABASE_URL from
 * the instance directory, and returns an initialized { app, db, projectId, instanceName }.
 *
 * Usage (CommonJS):
 *   const { initFirebase } = require('./lib/instance-firebase-init.cjs');
 *   const { app, db, projectId, instanceName } = await initFirebase();
 *
 * Usage (ESM):
 *   import { createRequire } from 'module';
 *   const require = createRequire(import.meta.url);
 *   const { initFirebase } = require('./lib/instance-firebase-init.cjs');
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.join(__dirname, '..', '..');
const INSTANCES_DIR = path.join(ROOT_DIR, 'planning-game-instances');
const LAST_INSTANCE_FILE = path.join(ROOT_DIR, '.last-instance');

// ---------------------------------------------------------------------------
// Helpers (subset of instance-manager.cjs)
// ---------------------------------------------------------------------------

function isTTY() {
  return process.stdin.isTTY && process.stdout.isTTY;
}

function getLastInstance() {
  if (!fs.existsSync(LAST_INSTANCE_FILE)) return null;
  return fs.readFileSync(LAST_INSTANCE_FILE, 'utf8').trim();
}

function listInstanceNames() {
  if (!fs.existsSync(INSTANCES_DIR)) return [];
  return fs.readdirSync(INSTANCES_DIR).filter((name) => {
    const fullPath = path.join(INSTANCES_DIR, name);
    return fs.statSync(fullPath).isDirectory() && !name.startsWith('.');
  });
}

function getProjectIdFromFirebaserc(instanceDir) {
  const firebasercPath = path.join(instanceDir, '.firebaserc');
  if (!fs.existsSync(firebasercPath)) return null;
  try {
    const content = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
    const projectId = content.projects?.default;
    if (!projectId || projectId.includes('YOUR_')) return null;
    return projectId;
  } catch {
    return null;
  }
}

function getEnvVar(instanceDir, envFile, varName) {
  const filePath = path.join(instanceDir, envFile);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(new RegExp(`^${varName}=(.+)$`, 'm'));
  if (!match) return null;
  const value = match[1].trim();
  if (value.includes('YOUR_')) return null;
  return value;
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// Resolve the database URL for an instance
// ---------------------------------------------------------------------------

function getDatabaseURL(instanceDir, envFiles) {
  // Try multiple env files in priority order
  const defaultEnvFiles = ['.env.prod', '.env.dev', '.env.pre', '.env'];
  const targetEnvFiles = Array.isArray(envFiles) && envFiles.length > 0
    ? [...envFiles, ...defaultEnvFiles]
    : defaultEnvFiles;
  for (const envFile of targetEnvFiles) {
    const url = getEnvVar(instanceDir, envFile, 'PUBLIC_FIREBASE_DATABASE_URL');
    if (url) return url;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main: resolve instance and initialize Firebase Admin
// ---------------------------------------------------------------------------

/**
 * Initialize Firebase Admin SDK using the active (or selected) instance.
 *
 * @param {Object} [options]
 * @param {string} [options.instanceName] - Force a specific instance (skip detection).
 * @param {boolean} [options.silent] - Suppress console output.
 * @returns {Promise<{app: admin.app.App, db: admin.database.Database, projectId: string, instanceName: string}>}
 */
async function initFirebase({ instanceName, silent = false, databaseURL, envFiles } = {}) {
  // 1. Resolve instance name
  let resolvedName = instanceName || getLastInstance();
  const instances = listInstanceNames();

  if (!resolvedName || !instances.includes(resolvedName)) {
    if (instances.length === 0) {
      throw new Error(
        'No instances found in planning-game-instances/. ' +
        'Run "npm run instance:create -- <name>" first.'
      );
    }

    if (instances.length === 1) {
      resolvedName = instances[0];
    } else if (isTTY()) {
      console.log('\nAvailable instances:\n');
      instances.forEach((name, i) => {
        const dir = path.join(INSTANCES_DIR, name);
        const pid = getProjectIdFromFirebaserc(dir);
        console.log(`  ${i + 1}) ${name}  (${pid || 'not configured'})`);
      });
      const answer = await prompt('\nSelect instance: ');
      const idx = parseInt(answer, 10);
      if (idx >= 1 && idx <= instances.length) {
        resolvedName = instances[idx - 1];
      } else if (instances.includes(answer)) {
        resolvedName = answer;
      } else {
        throw new Error(`Invalid selection: "${answer}"`);
      }
    } else {
      throw new Error(
        'No active instance and not running in an interactive terminal. ' +
        `Available instances: ${instances.join(', ')}. ` +
        'Run "npm run instance:use -- <name>" first.'
      );
    }
  }

  // 2. Resolve paths
  const instanceDir = path.join(INSTANCES_DIR, resolvedName);
  const serviceAccountPath = path.join(instanceDir, 'serviceAccountKey.json');

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `serviceAccountKey.json not found for instance "${resolvedName}" ` +
      `at ${serviceAccountPath}`
    );
  }

  const projectId = getProjectIdFromFirebaserc(instanceDir);
  if (!projectId) {
    throw new Error(
      `Could not read Firebase project ID from .firebaserc for instance "${resolvedName}".`
    );
  }

  const resolvedDatabaseURL = databaseURL || getDatabaseURL(instanceDir, envFiles);
  if (!resolvedDatabaseURL) {
    throw new Error(
      `PUBLIC_FIREBASE_DATABASE_URL not found in any .env file for instance "${resolvedName}".`
    );
  }

  // 3. Initialize Firebase Admin
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: resolvedDatabaseURL,
  });

  const db = admin.database();

  if (!silent) {
    console.log(`Firebase initialized: instance="${resolvedName}", project="${projectId}"`);
    console.log(`  databaseURL: ${resolvedDatabaseURL}`);
  }

  return { app, db, projectId, instanceName: resolvedName };
}

module.exports = { initFirebase };
