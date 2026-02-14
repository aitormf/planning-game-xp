#!/usr/bin/env node

/**
 * Migration script to move tasks from one sprint to another.
 * Useful for moving pending tasks from a previous year's sprint to a new year's sprint.
 *
 * Usage:
 *   node scripts/migrate-tasks-to-new-year.js --project PROJECT_ID --from-sprint SPRINT_ID --to-sprint SPRINT_ID [--dry-run] [--status pending,in-progress]
 *
 * Options:
 *   --project       Project ID (required)
 *   --from-sprint   Source sprint ID (required)
 *   --to-sprint     Target sprint ID (required)
 *   --status        Comma-separated list of task statuses to migrate (default: pending,in-progress,blocked)
 *   --dry-run       Preview changes without writing to Firebase
 *   --clear-sprint  Instead of moving to a new sprint, clear the sprint field (leave tasks unassigned)
 *
 * Examples:
 *   # Move all pending tasks from Sprint 2025-Q4 to Sprint 2026-Q1
 *   node scripts/migrate-tasks-to-new-year.js --project Cinema4D --from-sprint "Sprint 2025-Q4" --to-sprint "Sprint 2026-Q1"
 *
 *   # Only move tasks in pending status, with dry-run
 *   node scripts/migrate-tasks-to-new-year.js --project Cinema4D --from-sprint "Sprint 2025-Q4" --to-sprint "Sprint 2026-Q1" --status pending --dry-run
 *
 *   # Clear sprint from all pending tasks (leave unassigned)
 *   node scripts/migrate-tasks-to-new-year.js --project Cinema4D --from-sprint "Sprint 2025-Q4" --clear-sprint --dry-run
 *
 * Requirements:
 *   - Environment variables with Firebase credentials
 */

import process from 'node:process';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DEFAULT_STATUSES = ['pending', 'in-progress', 'blocked', 'todo', 'backlog'];

function parseArgs(argv) {
  const args = {
    project: null,
    fromSprint: null,
    toSprint: null,
    statuses: DEFAULT_STATUSES,
    dryRun: false,
    clearSprint: false
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--project':
      case '-p':
        args.project = argv[++i];
        break;
      case '--from-sprint':
        args.fromSprint = argv[++i];
        break;
      case '--to-sprint':
        args.toSprint = argv[++i];
        break;
      case '--status':
        args.statuses = argv[++i].split(',').map(s => s.trim().toLowerCase());
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--clear-sprint':
        args.clearSprint = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith('-')) {
          console.warn(`Warning: Unknown argument: ${arg}`);
        }
    }
  }

  // Validation
  if (!args.project) {
    console.error('Error: --project is required');
    printHelp();
    process.exit(1);
  }

  if (!args.fromSprint) {
    console.error('Error: --from-sprint is required');
    printHelp();
    process.exit(1);
  }

  if (!args.toSprint && !args.clearSprint) {
    console.error('Error: Either --to-sprint or --clear-sprint is required');
    printHelp();
    process.exit(1);
  }

  return args;
}

function printHelp() {
  console.log(`Migrate tasks from one sprint to another (for year transitions).

Usage:
  node scripts/migrate-tasks-to-new-year.js --project PROJECT --from-sprint SPRINT_ID --to-sprint SPRINT_ID [options]

Options:
  --project, -p     Project ID (required)
  --from-sprint     Source sprint ID or title (required)
  --to-sprint       Target sprint ID or title
  --status          Comma-separated list of statuses to migrate (default: pending,in-progress,blocked,todo,backlog)
  --dry-run         Preview changes without writing to Firebase
  --clear-sprint    Clear sprint field instead of assigning new sprint
  --help, -h        Show this help message

Examples:
  # Move pending/in-progress tasks from Sprint 2025-Q4 to Sprint 2026-Q1
  node scripts/migrate-tasks-to-new-year.js --project Cinema4D --from-sprint "Sprint 2025-Q4" --to-sprint "Sprint 2026-Q1"

  # Preview the migration without making changes
  node scripts/migrate-tasks-to-new-year.js --project Cinema4D --from-sprint "Sprint 2025-Q4" --to-sprint "Sprint 2026-Q1" --dry-run

  # Clear sprint assignment for all pending tasks
  node scripts/migrate-tasks-to-new-year.js --project Cinema4D --from-sprint "Sprint 2025-Q4" --clear-sprint
`);
}

function getFirebaseConfig() {
  const databaseURL = process.env.PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL;

  if (!databaseURL) {
    throw new Error('Missing FIREBASE_DATABASE_URL or PUBLIC_FIREBASE_DATABASE_URL environment variable');
  }

  // Check for service account credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return {
      credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      databaseURL
    };
  }

  // Use individual environment variables
  const clientEmail = process.env.PUBLIC_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.PUBLIC_FIREBASE_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error('Missing Firebase credentials. Set GOOGLE_APPLICATION_CREDENTIALS or individual env vars.');
  }

  return {
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    }),
    databaseURL
  };
}

async function migrateTasks(args) {
  console.log('Initializing Firebase Admin SDK...');

  const config = getFirebaseConfig();
  admin.initializeApp(config);

  const db = admin.database();

  console.log(`\nConfiguration:`);
  console.log(`  Database URL: ${config.databaseURL}`);
  console.log(`  Project: ${args.project}`);
  console.log(`  From Sprint: ${args.fromSprint}`);
  console.log(`  To Sprint: ${args.clearSprint ? '(clear sprint)' : args.toSprint}`);
  console.log(`  Statuses: ${args.statuses.join(', ')}`);
  console.log(`  Mode: ${args.dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('');

  const stats = {
    tasksFound: 0,
    tasksMigrated: 0,
    tasksSkipped: 0,
    errors: []
  };

  try {
    // Get tasks for the project
    const tasksPath = `cards/${args.project}/tasks_${args.project}`;
    const tasksRef = db.ref(tasksPath);
    const snapshot = await tasksRef.once('value');
    const tasksData = snapshot.val();

    if (!tasksData) {
      console.log(`No tasks found for project ${args.project}`);
      return stats;
    }

    const updates = {};
    const tasksToMigrate = [];

    // Find tasks matching criteria
    for (const [taskId, taskData] of Object.entries(tasksData)) {
      if (!taskData || typeof taskData !== 'object') continue;
      stats.tasksFound++;

      // Check if task is in the source sprint
      const taskSprint = taskData.sprint || '';
      if (taskSprint !== args.fromSprint) {
        continue;
      }

      // Check if task status matches
      const taskStatus = (taskData.status || '').toLowerCase();
      if (!args.statuses.includes(taskStatus)) {
        stats.tasksSkipped++;
        console.log(`  Skipping "${taskData.title || taskId}" (status: ${taskStatus})`);
        continue;
      }

      // Add to migration list
      tasksToMigrate.push({
        id: taskId,
        title: taskData.title || taskId,
        status: taskStatus,
        currentSprint: taskSprint
      });

      // Prepare update
      const path = `${tasksPath}/${taskId}/sprint`;
      updates[path] = args.clearSprint ? '' : args.toSprint;
    }

    console.log(`\nTasks to migrate: ${tasksToMigrate.length}`);
    console.log('─'.repeat(60));

    for (const task of tasksToMigrate) {
      const newSprint = args.clearSprint ? '(no sprint)' : args.toSprint;
      console.log(`  [${task.status}] "${task.title}"`);
      console.log(`      ${task.currentSprint} → ${newSprint}`);
      stats.tasksMigrated++;
    }

    console.log('─'.repeat(60));

    // Apply updates
    if (Object.keys(updates).length > 0) {
      if (args.dryRun) {
        console.log('\nDRY RUN - No changes made to database.');
      } else {
        console.log('\nApplying updates to Firebase...');
        await db.ref().update(updates);
        console.log('Updates applied successfully!');
      }
    } else {
      console.log('\nNo tasks matched the migration criteria.');
    }

  } catch (error) {
    stats.errors.push(error.message);
    console.error('Error during migration:', error);
    throw error;
  }

  return stats;
}

async function main() {
  const args = parseArgs(process.argv);

  console.log('='.repeat(60));
  console.log('Task Sprint Migration Script');
  console.log('='.repeat(60));

  try {
    const stats = await migrateTasks(args);

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`Tasks found:     ${stats.tasksFound}`);
    console.log(`Tasks migrated:  ${stats.tasksMigrated}`);
    console.log(`Tasks skipped:   ${stats.tasksSkipped}`);

    if (stats.errors.length > 0) {
      console.log(`Errors:          ${stats.errors.length}`);
      stats.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('='.repeat(60));

    if (args.dryRun) {
      console.log('\nThis was a DRY RUN. Run without --dry-run to apply changes.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\nMigration failed:', error.message);
    process.exit(1);
  }
}

main();
