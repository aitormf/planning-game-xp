#!/usr/bin/env node

/**
 * Backfill script: Copy all data from RTDB to Firestore.
 *
 * Maps RTDB paths to Firestore collections:
 * - /projects/{projectId} → Firestore: projects/{projectId}
 * - /cards/{projectId}/{SECTION}_{projectId}/{cardId} → Firestore: projects/{projectId}/{cardType}/{cardId}
 *
 * Usage:
 *   node scripts/backfill-rtdb-to-firestore.js [--dry-run] [--project <projectId>]
 *
 * Options:
 *   --dry-run     Show what would be migrated without writing
 *   --project     Migrate only a specific project
 *   --verify      Verify counts after migration
 *
 * Requires: serviceAccountKey.json in project root or MCP_INSTANCE_DIR
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SECTION_TO_COLLECTION = {
  TASKS: 'tasks',
  BUGS: 'bugs',
  EPICS: 'epics',
  PROPOSALS: 'proposals',
  SPRINTS: 'sprints',
  QA: 'qa'
};

const BATCH_SIZE = 400; // Firestore batch limit is 500, leave margin

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    verify: args.includes('--verify'),
    projectFilter: args.includes('--project') ? args[args.indexOf('--project') + 1] : null
  };
}

function resolveCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }
  const instanceDir = process.env.MCP_INSTANCE_DIR;
  if (instanceDir) {
    const p = resolve(instanceDir, 'serviceAccountKey.json');
    if (existsSync(p)) return p;
  }
  return resolve(__dirname, '..', 'serviceAccountKey.json');
}

function initFirebase() {
  const credPath = resolveCredentials();
  if (!existsSync(credPath)) {
    console.error(`serviceAccountKey.json not found at: ${credPath}`);
    process.exit(1);
  }
  const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'));
  const databaseURL = process.env.FIREBASE_DATABASE_URL ||
    `https://${serviceAccount.project_id}-default-rtdb.europe-west1.firebasedatabase.app`;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL
  });

  return {
    db: admin.database(),
    firestore: admin.firestore()
  };
}

function sectionToCollection(sectionKey) {
  const prefix = sectionKey.split('_')[0];
  return SECTION_TO_COLLECTION[prefix] || null;
}

/**
 * Migrate projects from RTDB to Firestore.
 */
async function migrateProjects(db, firestore, options) {
  const { dryRun, projectFilter } = options;
  console.log('\n=== Migrating Projects ===');

  const snapshot = await db.ref('/projects').once('value');
  const projects = snapshot.val();
  if (!projects) {
    console.log('No projects found in RTDB.');
    return { migrated: 0, skipped: 0 };
  }

  let migrated = 0;
  let skipped = 0;
  const batch = firestore.batch();
  let batchCount = 0;

  for (const [projectId, data] of Object.entries(projects)) {
    if (projectFilter && projectId !== projectFilter) {
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would migrate project: ${projectId}`);
      migrated++;
      continue;
    }

    const docRef = firestore.collection('projects').doc(projectId);
    batch.set(docRef, data);
    batchCount++;
    migrated++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`  Committed batch of ${batchCount} projects`);
      batchCount = 0;
    }
  }

  if (!dryRun && batchCount > 0) {
    await batch.commit();
  }

  console.log(`  Projects: ${migrated} migrated, ${skipped} skipped`);
  return { migrated, skipped };
}

/**
 * Migrate cards from RTDB to Firestore.
 */
async function migrateCards(db, firestore, options) {
  const { dryRun, projectFilter } = options;
  console.log('\n=== Migrating Cards ===');

  const snapshot = await db.ref('/cards').once('value');
  const allCards = snapshot.val();
  if (!allCards) {
    console.log('No cards found in RTDB.');
    return { migrated: 0, skipped: 0, errors: 0 };
  }

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [projectId, sections] of Object.entries(allCards)) {
    if (projectFilter && projectId !== projectFilter) {
      continue;
    }

    console.log(`\n  Project: ${projectId}`);

    for (const [sectionKey, cards] of Object.entries(sections)) {
      const collectionName = sectionToCollection(sectionKey);
      if (!collectionName) {
        console.log(`    Skipping unknown section: ${sectionKey}`);
        totalSkipped++;
        continue;
      }

      if (!cards || typeof cards !== 'object') continue;

      const cardEntries = Object.entries(cards);
      console.log(`    ${collectionName}: ${cardEntries.length} cards`);

      let batch = firestore.batch();
      let batchCount = 0;

      for (const [cardId, cardData] of cardEntries) {
        if (dryRun) {
          totalMigrated++;
          continue;
        }

        try {
          const docRef = firestore
            .collection('projects')
            .doc(projectId)
            .collection(collectionName)
            .doc(cardId);

          batch.set(docRef, cardData);
          batchCount++;
          totalMigrated++;

          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            console.log(`      Committed batch of ${batchCount} cards`);
            batch = firestore.batch();
            batchCount = 0;
          }
        } catch (error) {
          console.error(`      Error migrating ${cardId}: ${error.message}`);
          totalErrors++;
        }
      }

      if (!dryRun && batchCount > 0) {
        await batch.commit();
      }
    }
  }

  console.log(`\n  Cards total: ${totalMigrated} migrated, ${totalSkipped} skipped, ${totalErrors} errors`);
  return { migrated: totalMigrated, skipped: totalSkipped, errors: totalErrors };
}

/**
 * Verify migration by comparing counts.
 */
async function verifyMigration(db, firestore, projectFilter) {
  console.log('\n=== Verification ===');

  const rtdbSnap = await db.ref('/cards').once('value');
  const rtdbCards = rtdbSnap.val() || {};
  let allMatch = true;

  for (const [projectId, sections] of Object.entries(rtdbCards)) {
    if (projectFilter && projectId !== projectFilter) continue;

    for (const [sectionKey, cards] of Object.entries(sections)) {
      const collectionName = sectionToCollection(sectionKey);
      if (!collectionName || !cards) continue;

      const rtdbCount = Object.keys(cards).length;
      const fsSnap = await firestore
        .collection('projects')
        .doc(projectId)
        .collection(collectionName)
        .count()
        .get();
      const fsCount = fsSnap.data().count;

      const match = rtdbCount === fsCount ? '✓' : '✗ MISMATCH';
      if (rtdbCount !== fsCount) allMatch = false;

      console.log(`  ${projectId}/${collectionName}: RTDB=${rtdbCount}, Firestore=${fsCount} ${match}`);
    }
  }

  return allMatch;
}

async function main() {
  const options = parseArgs();
  console.log('Backfill RTDB → Firestore');
  console.log(`  Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (options.projectFilter) console.log(`  Filter: ${options.projectFilter}`);

  const { db, firestore } = initFirebase();

  const projectResult = await migrateProjects(db, firestore, options);
  const cardResult = await migrateCards(db, firestore, options);

  console.log('\n=== Summary ===');
  console.log(`  Projects: ${projectResult.migrated} migrated`);
  console.log(`  Cards: ${cardResult.migrated} migrated, ${cardResult.errors} errors`);

  if (options.verify && !options.dryRun) {
    const allMatch = await verifyMigration(db, firestore, options.projectFilter);
    console.log(`\n  Verification: ${allMatch ? 'ALL COUNTS MATCH ✓' : 'MISMATCHES FOUND ✗'}`);
    if (!allMatch) process.exit(1);
  }

  process.exit(0);
}

// Export for testing
export { migrateProjects, migrateCards, verifyMigration, sectionToCollection, SECTION_TO_COLLECTION, BATCH_SIZE };

// Run if executed directly
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
