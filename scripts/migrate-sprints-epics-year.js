#!/usr/bin/env node

/**
 * Migration script to add year property to existing sprints and epics.
 *
 * This script adds year: 2025 to all sprints and epics that don't have a year property.
 * This is necessary for the yearly cycles feature that allows filtering by year.
 *
 * Usage:
 *   node scripts/migrate-sprints-epics-year.js [--dry-run] [--year 2025]
 *
 * Options:
 *   --dry-run    Preview changes without writing to Firebase
 *   --year       Year to assign (default: 2025)
 *
 * Requirements:
 *   - `firebase-admin` installed
 *   - Environment variables with credentials:
 *       * GOOGLE_APPLICATION_CREDENTIALS (path to JSON) **or**
 *       * PUBLIC_FIREBASE_CLIENT_EMAIL, PUBLIC_FIREBASE_PRIVATE_KEY, PUBLIC_FIREBASE_PROJECT_ID
 *   - PUBLIC_FIREBASE_DATABASE_URL (or FIREBASE_DATABASE_URL) with the RTDB URL
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function parseArgs(argv) {
  const args = {
    dryRun: false,
    year: 2025
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--year':
        args.year = parseInt(argv[++i], 10) || 2025;
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

  return args;
}

function printHelp() {
  console.log(`Migrate sprints and epics to add year property.

Usage:
  node scripts/migrate-sprints-epics-year.js [--dry-run] [--year 2025]

Options:
  --dry-run    Preview changes without writing to Firebase
  --year       Year to assign to cards without year property (default: 2025)
  --help, -h   Show this help message

Examples:
  node scripts/migrate-sprints-epics-year.js --dry-run
  node scripts/migrate-sprints-epics-year.js --year 2025
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

async function migrateYearProperty(dryRun = false, year = 2025) {
  console.log('Initializing Firebase Admin SDK...');

  const config = getFirebaseConfig();
  admin.initializeApp(config);

  const db = admin.database();

  console.log(`Database URL: ${config.databaseURL}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log(`Year to assign: ${year}`);
  console.log('');

  const stats = {
    sprintsUpdated: 0,
    sprintsSkipped: 0,
    epicsUpdated: 0,
    epicsSkipped: 0,
    projectsProcessed: 0,
    errors: []
  };

  try {
    // Get all cards
    const cardsRef = db.ref('cards');
    const snapshot = await cardsRef.once('value');
    const cardsData = snapshot.val();

    if (!cardsData) {
      console.log('No cards data found in database.');
      return stats;
    }

    const updates = {};

    // Process each project
    for (const [projectId, projectData] of Object.entries(cardsData)) {
      stats.projectsProcessed++;
      console.log(`\nProcessing project: ${projectId}`);

      // Process sprints
      const sprintsKey = `sprints_${projectId}`;
      if (projectData[sprintsKey]) {
        console.log(`  Processing sprints...`);

        for (const [sprintId, sprintData] of Object.entries(projectData[sprintsKey])) {
          if (!sprintData || typeof sprintData !== 'object') continue;

          // Skip if already has year property
          if (sprintData.year !== undefined && sprintData.year !== null) {
            stats.sprintsSkipped++;
            continue;
          }

          // Add year property
          const path = `cards/${projectId}/${sprintsKey}/${sprintId}/year`;
          updates[path] = year;
          stats.sprintsUpdated++;

          console.log(`    Sprint "${sprintData.title || sprintId}": adding year=${year}`);
        }
      }

      // Process epics
      const epicsKey = `epics_${projectId}`;
      if (projectData[epicsKey]) {
        console.log(`  Processing epics...`);

        for (const [epicId, epicData] of Object.entries(projectData[epicsKey])) {
          if (!epicData || typeof epicData !== 'object') continue;

          // Skip if already has year property
          if (epicData.year !== undefined && epicData.year !== null) {
            stats.epicsSkipped++;
            continue;
          }

          // Add year property
          const path = `cards/${projectId}/${epicsKey}/${epicId}/year`;
          updates[path] = year;
          stats.epicsUpdated++;

          console.log(`    Epic "${epicData.title || epicId}": adding year=${year}`);
        }
      }
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Total updates to apply: ${Object.keys(updates).length}`);

      if (dryRun) {
        console.log('\nDRY RUN - No changes made to database.');
        console.log('Updates that would be applied:');
        for (const [path, value] of Object.entries(updates)) {
          console.log(`  ${path} = ${value}`);
        }
      } else {
        console.log('\nApplying updates to Firebase...');
        await db.ref().update(updates);
        console.log('Updates applied successfully!');
      }
    } else {
      console.log('\nNo updates needed - all cards already have year property.');
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
  console.log('Sprint & Epic Year Migration Script');
  console.log('='.repeat(60));
  console.log('');

  try {
    const stats = await migrateYearProperty(args.dryRun, args.year);

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`Projects processed: ${stats.projectsProcessed}`);
    console.log(`Sprints updated:    ${stats.sprintsUpdated}`);
    console.log(`Sprints skipped:    ${stats.sprintsSkipped} (already have year)`);
    console.log(`Epics updated:      ${stats.epicsUpdated}`);
    console.log(`Epics skipped:      ${stats.epicsSkipped} (already have year)`);

    if (stats.errors.length > 0) {
      console.log(`Errors:             ${stats.errors.length}`);
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
