#!/usr/bin/env node
/**
 * Initialize required list data in the active RTDB instance(s).
 * This sets up bugpriorityList, statusList, and other required config
 * that the MCP server needs to function properly.
 *
 * Reads PUBLIC_FIREBASE_DATABASE_URL from .env.dev and .env.prod (symlinked
 * from the active instance). Both are initialized if they have different URLs.
 *
 * Usage: node scripts/init-personal-rtdb-lists.cjs [--dry-run]
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.join(__dirname, '..');
const SERVICE_ACCOUNT = path.join(ROOT_DIR, 'serviceAccountKey.json');

function loadDatabaseUrls() {
  const envFiles = ['.env.dev', '.env.prod'];
  const urls = new Set();
  for (const envFile of envFiles) {
    const envPath = path.join(ROOT_DIR, envFile);
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/PUBLIC_FIREBASE_DATABASE_URL=(.+)/);
    if (match) urls.add(match[1].trim());
  }
  if (urls.size === 0) {
    throw new Error('PUBLIC_FIREBASE_DATABASE_URL not found in .env.dev or .env.prod. Run "npm run instance:select" first.');
  }
  return [...urls];
}

const DATABASE_URLS = loadDatabaseUrls();
const DRY_RUN = process.argv.includes('--dry-run');

const LISTS_DATA = {
  bugpriorityList: {
    'Application Blocker': 1,
    'Department Blocker': 2,
    'Individual Blocker': 3,
    'User Experience Issue': 4,
    'Workflow Improvement': 5,
    'Workaround Available Issue': 6
  },
  statusList: {
    'bug-card': {
      'Created': 1,
      'Assigned': 2,
      'Fixed': 3,
      'Triaged': 2,
      'In Progress': 4,
      'In Testing': 7,
      'Verified': 8,
      'Closed': 9,
      'Blocked': 5,
      'Rejected': 9
    },
    'task-card': {
      'To Do': 1,
      'In Progress': 2,
      'To Validate': 3,
      'Done&Validated': 4,
      'Blocked': 5,
      'Reopened': 6
    },
    'proposal-card': {
      'Proposed': 1,
      'Accepted': 2,
      'Rejected': 3,
      'Converted': 4
    },
    'epic-card': {
      'To Do': 1,
      'In Progress': 2,
      'Done': 3
    },
    'qa-card': {
      'To Do': 1,
      'In Progress': 2,
      'Done': 3
    }
  }
};

async function initForDatabase(databaseURL) {
  console.log(`\n=== Init RTDB Lists: ${databaseURL} ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'REAL'}\n`);

  if (DRY_RUN) {
    for (const [listName, data] of Object.entries(LISTS_DATA)) {
      console.log(`[dry-run] Would set /data/${listName}:`);
      console.log(`  ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
    }
    return;
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert(require(SERVICE_ACCOUNT)),
    databaseURL
  }, databaseURL);

  const db = admin.database(app);

  for (const [listName, data] of Object.entries(LISTS_DATA)) {
    const dbPath = `/data/${listName}`;
    console.log(`Setting ${dbPath}...`);
    const ref = db.ref(dbPath);
    const snapshot = await ref.once('value');

    if (snapshot.exists()) {
      console.log(`  Already exists, skipping.`);
      continue;
    }

    await ref.set(data);
    console.log(`  Done.`);
  }

  await app.delete();
}

async function main() {
  for (const url of DATABASE_URLS) {
    await initForDatabase(url);
  }
  console.log('\nCompleted!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
