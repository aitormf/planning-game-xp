#!/usr/bin/env node

/**
 * Diagnostic script: Check all card ID counters across all projects.
 * Compares Firestore counters (projectCounters collection) with actual
 * highest cardId found in RTDB.
 *
 * Usage:
 *   node scripts/check-all-counters.js [--fix]
 *
 * Without --fix: only reports mismatches
 * With --fix: updates Firestore counters to match actual highest IDs
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

const FIX_MODE = process.argv.includes('--fix');

// Card type → RTDB section key
const SECTION_MAP = {
  task: 'TASKS',
  bug: 'BUGS',
  epic: 'EPICS',
  sprint: 'SPRINTS',
  proposal: 'PROPOSALS',
  qa: 'QA',
};

// Card type → abbreviation used in cardId
// Special cases handled by getAbbrId logic
function getTypeAbbr(sectionKey) {
  const map = {
    TASKS: 'TSK',
    BUGS: 'BUG',
    EPICS: 'PCS',
    SPRINTS: 'SPR',
    PROPOSALS: 'PRP',
    QA: '_QA',
  };
  return map[sectionKey];
}

// ─── Firebase Init ───────────────────────────────────────────────────────────

function findServiceAccountKey() {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.MCP_INSTANCE_DIR ? resolve(process.env.MCP_INSTANCE_DIR, 'serviceAccountKey.json') : null,
    resolve(ROOT, 'serviceAccountKey.json'),
  ].filter(Boolean);

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

function initFirebase() {
  const keyPath = findServiceAccountKey();
  if (!keyPath) {
    console.error('ERROR: serviceAccountKey.json not found.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  const projectId = serviceAccount.project_id;
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    `https://${projectId}-default-rtdb.europe-west1.firebasedatabase.app`;

  console.log(`Firebase: ${projectId}`);
  console.log(`RTDB:     ${databaseURL}\n`);

  const app = initializeApp({ credential: cert(serviceAccount), databaseURL });
  return { db: getDatabase(app), firestore: getFirestore(app) };
}

// ─── Analysis ────────────────────────────────────────────────────────────────

async function getProjectsFromRTDB(db) {
  const snap = await db.ref('/projects').once('value');
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.entries(data).map(([id, proj]) => ({
    id,
    abbreviation: proj.abbreviation || id,
  }));
}

async function getHighestCardId(db, projectId, sectionKey) {
  const path = `/cards/${projectId}/${sectionKey}_${projectId}`;
  const snap = await db.ref(path).once('value');
  if (!snap.exists()) return { highest: 0, count: 0 };

  const cards = snap.val();
  let highest = 0;
  let count = 0;

  for (const [, card] of Object.entries(cards)) {
    if (!card.cardId) continue;
    count++;
    // Extract numeric part from cardId like "PLN-TSK-0042"
    const match = card.cardId.match(/-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highest) highest = num;
    }
  }

  return { highest, count };
}

async function getFirestoreCounter(firestore, counterKey) {
  const ref = firestore.collection('projectCounters').doc(counterKey);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return snap.data().lastId || 0;
}

async function fixCounter(firestore, counterKey, newValue) {
  const ref = firestore.collection('projectCounters').doc(counterKey);
  await ref.set({ lastId: newValue }, { merge: true });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Counter Health Check — All Projects × All Card Types');
  console.log('═══════════════════════════════════════════════════════\n');

  const { db, firestore } = initFirebase();
  const projects = await getProjectsFromRTDB(db);

  if (projects.length === 0) {
    console.log('No projects found in /projects/');
    process.exit(0);
  }

  console.log(`Found ${projects.length} project(s): ${projects.map(p => `${p.id} (${p.abbreviation})`).join(', ')}\n`);

  const issues = [];

  for (const project of projects) {
    console.log(`─── ${project.id} (${project.abbreviation}) ───`);

    for (const [type, sectionKey] of Object.entries(SECTION_MAP)) {
      const typeAbbr = getTypeAbbr(sectionKey);
      const counterKey = `${project.abbreviation}-${typeAbbr}`;

      const { highest, count } = await getHighestCardId(db, project.id, sectionKey);
      const counterValue = await getFirestoreCounter(firestore, counterKey);

      if (count === 0 && counterValue === null) {
        // No cards and no counter — skip silently
        continue;
      }

      const status = counterValue === null
        ? '⚠️  NO COUNTER'
        : counterValue >= highest
          ? '✅'
          : '❌ DESFASADO';

      const line = `  ${counterKey.padEnd(12)} | cards: ${String(count).padStart(4)} | highest: ${String(highest).padStart(4)} | counter: ${counterValue === null ? 'N/A ' : String(counterValue).padStart(4)} | ${status}`;
      console.log(line);

      if (counterValue !== null && counterValue < highest) {
        issues.push({ counterKey, counterValue, highest, project: project.id, type });
      } else if (counterValue === null && count > 0) {
        issues.push({ counterKey, counterValue: 0, highest, project: project.id, type, missing: true });
      }
    }
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  if (issues.length === 0) {
    console.log('  ✅ All counters are correct!');
  } else {
    console.log(`  ❌ ${issues.length} counter(s) need fixing:\n`);
    for (const issue of issues) {
      const action = issue.missing ? 'CREATE' : 'UPDATE';
      console.log(`  ${action} ${issue.counterKey}: ${issue.counterValue} → ${issue.highest}`);
    }

    if (FIX_MODE) {
      console.log('\n  Applying fixes...\n');
      for (const issue of issues) {
        try {
          await fixCounter(firestore, issue.counterKey, issue.highest);
          console.log(`  ✅ ${issue.counterKey} → ${issue.highest}`);
        } catch (err) {
          console.error(`  ❌ ${issue.counterKey}: ${err.message}`);
        }
      }
      console.log('\n  Done! All counters updated.');
    } else {
      console.log('\n  Run with --fix to apply corrections.');
    }
  }
  console.log('═══════════════════════════════════════════════════════');

  process.exit(issues.length > 0 && !FIX_MODE ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
