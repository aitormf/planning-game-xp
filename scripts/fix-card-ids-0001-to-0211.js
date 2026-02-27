#!/usr/bin/env node

/**
 * Migration script: Fix card IDs PLN-TSK-0001..0006 → PLN-TSK-0211..0216
 *
 * Problem: After migrating data between Firebase instances for open-source,
 * the Firestore counter was reset. New cards got IDs starting from 0001
 * instead of continuing from 0210.
 *
 * What this script does:
 *   1. Updates the `cardId` field in 6 RTDB nodes (cards stored by firebaseId, not cardId)
 *   2. Updates the Firestore counter `projectCounters/PLN-TSK` to lastId=216
 *   3. If /views/ contain these cards, updates cardId there too
 *
 * Usage:
 *   node scripts/fix-card-ids-0001-to-0211.js [--dry-run]
 *
 * Requires:
 *   - serviceAccountKey.json in repo root (or active instance)
 *   - FIREBASE_DATABASE_URL env var (or auto-derived from serviceAccountKey)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ─── Configuration ───────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');

const CARDS_TO_FIX = [
  { firebaseId: '-OmEYmD1QKWkxuyzNG0N', oldCardId: 'PLN-TSK-0001', newCardId: 'PLN-TSK-0211' },
  { firebaseId: '-OmEZUW6nlXcboftCtAa', oldCardId: 'PLN-TSK-0002', newCardId: 'PLN-TSK-0212' },
  { firebaseId: '-OmEZYobIkapauB3p9fj', oldCardId: 'PLN-TSK-0003', newCardId: 'PLN-TSK-0213' },
  { firebaseId: '-OmEZZUyGuGUHGf0xYHa', oldCardId: 'PLN-TSK-0004', newCardId: 'PLN-TSK-0214' },
  { firebaseId: '-OmEZ_Bam49C7uW5DQRu', oldCardId: 'PLN-TSK-0005', newCardId: 'PLN-TSK-0215' },
  { firebaseId: '-OmEZ_kgDrN4lq3_0XQC', oldCardId: 'PLN-TSK-0006', newCardId: 'PLN-TSK-0216' },
];

const PROJECT_ID = 'PlanningGame';
const SECTION = 'TASKS';
const COUNTER_DOC = 'PLN-TSK';
const NEW_LAST_ID = 216;

// ─── Firebase Init ───────────────────────────────────────────────────────────

function findServiceAccountKey() {
  const instanceDir = process.env.MCP_INSTANCE_DIR;
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    instanceDir ? resolve(instanceDir, 'serviceAccountKey.json') : null,
    resolve(ROOT, 'serviceAccountKey.json'),
  ].filter(Boolean);

  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
}

function initFirebase() {
  const keyPath = findServiceAccountKey();
  if (!keyPath) {
    console.error('ERROR: serviceAccountKey.json not found.');
    console.error('Place it in repo root or set GOOGLE_APPLICATION_CREDENTIALS env var.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  const projectId = serviceAccount.project_id;

  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    `https://${projectId}-default-rtdb.europe-west1.firebasedatabase.app`;

  console.log(`Firebase project: ${projectId}`);
  console.log(`Database URL:     ${databaseURL}`);
  console.log(`Service account:  ${keyPath}`);
  console.log('');

  const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL,
  });

  return {
    db: getDatabase(app),
    firestore: getFirestore(app),
  };
}

// ─── Migration Logic ─────────────────────────────────────────────────────────

async function fixCardIds(db, firestore) {
  const basePath = `/cards/${PROJECT_ID}/${SECTION}_${PROJECT_ID}`;
  let successCount = 0;
  let errorCount = 0;

  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Fixing ${CARDS_TO_FIX.length} card IDs...\n`);

  // Step 1: Update cardId in each RTDB node
  for (const { firebaseId, oldCardId, newCardId } of CARDS_TO_FIX) {
    const cardPath = `${basePath}/${firebaseId}`;
    const ref = db.ref(cardPath);

    try {
      const snapshot = await ref.once('value');
      if (!snapshot.exists()) {
        console.error(`  SKIP: ${oldCardId} — node not found at ${cardPath}`);
        errorCount++;
        continue;
      }

      const data = snapshot.val();
      const currentCardId = data.cardId;

      if (currentCardId !== oldCardId) {
        console.error(`  SKIP: ${oldCardId} — unexpected cardId "${currentCardId}" (expected "${oldCardId}")`);
        errorCount++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY] ${oldCardId} → ${newCardId}  (firebaseId: ${firebaseId})`);
      } else {
        await ref.update({ cardId: newCardId });
        console.log(`  OK    ${oldCardId} → ${newCardId}  (firebaseId: ${firebaseId})`);
      }
      successCount++;

      // Step 1b: Check if card exists in /views/ and update there too
      const viewPath = `/views/${SECTION}_${PROJECT_ID}/${PROJECT_ID}/${firebaseId}`;
      const viewRef = db.ref(viewPath);
      const viewSnap = await viewRef.once('value');
      if (viewSnap.exists()) {
        const viewData = viewSnap.val();
        if (viewData.cardId === oldCardId) {
          if (DRY_RUN) {
            console.log(`  [DRY] view: ${viewPath} → ${newCardId}`);
          } else {
            await viewRef.update({ cardId: newCardId });
            console.log(`  OK    view: ${viewPath} → ${newCardId}`);
          }
        }
      }
    } catch (err) {
      console.error(`  ERROR: ${oldCardId} — ${err.message}`);
      errorCount++;
    }
  }

  // Step 2: Update Firestore counter
  console.log('');
  const counterRef = firestore.collection('projectCounters').doc(COUNTER_DOC);

  try {
    const counterSnap = await counterRef.get();
    const currentLastId = counterSnap.exists ? counterSnap.data().lastId : 0;
    console.log(`Counter "${COUNTER_DOC}" current lastId: ${currentLastId}`);

    if (currentLastId >= NEW_LAST_ID) {
      console.log(`Counter already >= ${NEW_LAST_ID}, no update needed.`);
    } else if (DRY_RUN) {
      console.log(`[DRY] Would update counter to lastId: ${NEW_LAST_ID}`);
    } else {
      await counterRef.set({ lastId: NEW_LAST_ID }, { merge: true });
      console.log(`OK    Counter updated to lastId: ${NEW_LAST_ID}`);
    }
  } catch (err) {
    console.error(`ERROR updating counter: ${err.message}`);
    errorCount++;
  }

  // Summary
  console.log('\n─── Summary ───');
  console.log(`Cards updated:  ${successCount}/${CARDS_TO_FIX.length}`);
  console.log(`Errors:         ${errorCount}`);
  if (DRY_RUN) {
    console.log('\nThis was a DRY RUN. Run without --dry-run to apply changes.');
  }

  return errorCount === 0;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Fix Card IDs: PLN-TSK-0001..0006 → PLN-TSK-0211..0216');
  console.log('═══════════════════════════════════════════════════════\n');

  const { db, firestore } = initFirebase();
  const success = await fixCardIds(db, firestore);

  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
