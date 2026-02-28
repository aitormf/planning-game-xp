#!/usr/bin/env node
/**
 * Initialize required list data in the personal (manufosela) RTDB instance.
 * This sets up bugpriorityList, statusList, and other required config
 * that the MCP server needs to function properly.
 *
 * Usage: node scripts/init-personal-rtdb-lists.cjs [--dry-run]
 */

const admin = require('firebase-admin');
const path = require('path');

const INSTANCE_DIR = path.join(__dirname, '..', 'planning-game-instances', 'manufosela');
const SERVICE_ACCOUNT = path.join(INSTANCE_DIR, 'serviceAccountKey.json');
const DATABASE_URL = 'https://planning-game-xp-default-rtdb.europe-west1.firebasedatabase.app';

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

async function main() {
  console.log(`\n=== Init RTDB Lists for manufosela (planning-game-xp) ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'REAL'}\n`);

  if (!DRY_RUN) {
    const serviceAccount = require(SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: DATABASE_URL
    });
  }

  for (const [listName, data] of Object.entries(LISTS_DATA)) {
    const dbPath = `/data/${listName}`;
    console.log(`Setting ${dbPath}...`);

    if (DRY_RUN) {
      console.log(`  Would write: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
    } else {
      const ref = admin.database().ref(dbPath);
      const snapshot = await ref.once('value');

      if (snapshot.exists()) {
        console.log(`  Already exists, skipping (use --force to overwrite)`);
        continue;
      }

      await ref.set(data);
      console.log(`  Done.`);
    }
  }

  console.log('\nCompleted!');

  if (!DRY_RUN) {
    await admin.app().delete();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
