#!/usr/bin/env node

/**
 * sync-users-project-roles.js
 *
 * Synchronizes /users/{email}/projects/{projectId} roles (developer/stakeholder)
 * based on the actual data in /projects/{projectId}/developers and /projects/{projectId}/stakeholders.
 *
 * This fixes the issue where entityDirectoryService.getProjectStakeholders() returns empty
 * because /users/ entries have stakeholder: false even when the user IS a stakeholder in the project.
 *
 * Runs against ALL instances (geniova, manufosela, demo) automatically.
 *
 * Usage:
 *   node scripts/sync-users-project-roles.js [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be changed without writing to Firebase
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// All instances configuration
const INSTANCES = [
  {
    name: 'geniova',
    keyPath: 'planning-game-instances/geniova/serviceAccountKey.json',
    databaseURL: 'https://planning-gamexp-default-rtdb.europe-west1.firebasedatabase.app'
  },
  {
    name: 'manufosela',
    keyPath: 'planning-game-instances/manufosela/serviceAccountKey.json',
    databaseURL: 'https://planning-game-xp-default-rtdb.europe-west1.firebasedatabase.app'
  },
  {
    name: 'demo',
    keyPath: 'planning-game-instances/demo/serviceAccountKey.json',
    databaseURL: 'https://pgamexp-demo-default-rtdb.firebaseio.com'
  }
];

async function syncInstance(instanceConfig) {
  const keyFullPath = resolve(projectRoot, instanceConfig.keyPath);
  if (!existsSync(keyFullPath)) {
    console.log(`  SKIP: ${instanceConfig.name} (no serviceAccountKey.json)`);
    return { name: instanceConfig.name, skipped: true, changes: 0 };
  }

  const serviceAccount = JSON.parse(readFileSync(keyFullPath, 'utf8'));
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: instanceConfig.databaseURL
  }, instanceConfig.name);

  const db = app.database();

  try {
    const [usersSnap, projectsSnap] = await Promise.all([
      db.ref('/users').once('value'),
      db.ref('/projects').once('value')
    ]);

    const users = usersSnap.val() || {};
    const projects = projectsSnap.val() || {};

    // Build reverse lookup: developerId -> encodedEmail, stakeholderId -> encodedEmail
    const devIdToEmail = new Map();
    const stkIdToEmail = new Map();
    const emailToEncodedKey = new Map();

    for (const [encodedEmail, user] of Object.entries(users)) {
      if (!user || typeof user !== 'object') continue;
      const email = (user.email || '').toLowerCase().trim();
      emailToEncodedKey.set(email, encodedEmail);
      if (user.developerId) devIdToEmail.set(user.developerId, encodedEmail);
      if (user.stakeholderId) stkIdToEmail.set(user.stakeholderId, encodedEmail);
    }

    const updates = {};
    let totalChanges = 0;

    for (const [projectName, projectData] of Object.entries(projects)) {
      if (!projectData || typeof projectData !== 'object') continue;

      const devs = projectData.developers || [];
      const stks = projectData.stakeholders || [];

      // Process developers
      const devEntries = Array.isArray(devs) ? devs : Object.values(devs);
      for (const entry of devEntries) {
        if (!entry) continue;
        let encodedEmail = null;

        if (typeof entry === 'string' && entry.startsWith('dev_')) {
          encodedEmail = devIdToEmail.get(entry);
        } else if (typeof entry === 'object') {
          if (entry.id && entry.id.startsWith('dev_')) {
            encodedEmail = devIdToEmail.get(entry.id);
          }
          if (!encodedEmail && entry.email) {
            encodedEmail = emailToEncodedKey.get(entry.email.toLowerCase().trim());
          }
        }

        if (!encodedEmail) continue;

        const currentProj = users[encodedEmail]?.projects?.[projectName];
        if (!currentProj || currentProj.developer !== true) {
          const basePath = `/users/${encodedEmail}/projects/${projectName}`;
          updates[`${basePath}/developer`] = true;
          if (!currentProj) {
            updates[`${basePath}/addedAt`] = new Date().toISOString();
            updates[`${basePath}/stakeholder`] = false;
          }
          totalChanges++;
          console.log(`    [DEV] ${users[encodedEmail]?.name || encodedEmail} -> ${projectName}`);
        }
      }

      // Process stakeholders
      const stkEntries = Array.isArray(stks) ? stks : Object.values(stks);
      for (const entry of stkEntries) {
        if (!entry) continue;
        let encodedEmail = null;

        if (typeof entry === 'string' && entry.startsWith('stk_')) {
          encodedEmail = stkIdToEmail.get(entry);
        } else if (typeof entry === 'object') {
          if (entry.id && entry.id.startsWith('stk_')) {
            encodedEmail = stkIdToEmail.get(entry.id);
          }
          if (!encodedEmail && entry.email) {
            encodedEmail = emailToEncodedKey.get(entry.email.toLowerCase().trim());
          }
        }

        if (!encodedEmail) continue;

        const currentProj = users[encodedEmail]?.projects?.[projectName];
        if (!currentProj || currentProj.stakeholder !== true) {
          const basePath = `/users/${encodedEmail}/projects/${projectName}`;
          updates[`${basePath}/stakeholder`] = true;
          if (!currentProj) {
            updates[`${basePath}/addedAt`] = new Date().toISOString();
            updates[`${basePath}/developer`] = false;
          }
          totalChanges++;
          console.log(`    [STK] ${users[encodedEmail]?.name || encodedEmail} -> ${projectName}`);
        }
      }
    }

    if (totalChanges === 0) {
      console.log('    All roles already in sync.');
    } else if (!dryRun) {
      await db.ref().update(updates);
      console.log(`    Written ${Object.keys(updates).length} update paths.`);
    }

    return { name: instanceConfig.name, skipped: false, changes: totalChanges };
  } finally {
    await app.delete();
  }
}

async function main() {
  console.log(`\n========================================`);
  console.log(`  Sync Users Project Roles`);
  console.log(`  Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`========================================\n`);

  const results = [];

  for (const instance of INSTANCES) {
    console.log(`[${instance.name}] ${instance.databaseURL}`);
    try {
      const result = await syncInstance(instance);
      results.push(result);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      results.push({ name: instance.name, skipped: false, changes: 0, error: err.message });
    }
    console.log('');
  }

  console.log(`========================================`);
  console.log(`  Summary`);
  console.log(`========================================`);
  for (const r of results) {
    const status = r.skipped ? 'SKIP' : r.error ? 'ERROR' : 'OK';
    console.log(`  ${status}  ${r.name}: ${r.changes} changes`);
  }

  if (dryRun) {
    console.log(`\n  DRY RUN - no changes written.`);
    console.log(`  Run without --dry-run to apply.\n`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
