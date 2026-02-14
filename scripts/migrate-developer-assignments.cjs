#!/usr/bin/env node
/**
 * Script to migrate task assignments from duplicate developers to the consolidated ones
 *
 * Usage:
 *   node scripts/migrate-developer-assignments.cjs <cards-export.json> [output.json]
 *
 * This script:
 * 1. Reads a Firebase export of /cards
 * 2. Finds all tasks assigned to the old duplicate developer IDs
 * 3. Updates them to point to the consolidated developer ID
 * 4. Outputs the migrated JSON for re-import
 *
 * You need to export /cards from Firebase Console first.
 */

const fs = require('fs');

// Mapping: old duplicate ID -> consolidated ID
const DEVELOPER_MIGRATION = {
  'dev_018': 'dev_002',  // aamartinez_maurerlabs.com#ext#@... -> Alex Martínez
  'dev_019': 'dev_011',  // ogiriepar_maurerlabs.com#ext#@... -> Oscar Giriepar
  'dev_020': 'dev_004',  // dglopez_maurerlabs.com#ext#@... -> Dani González
};

const DEVELOPER_NAMES = {
  'dev_002': 'Alex Martínez',
  'dev_011': 'Oscar Giriepar',
  'dev_004': 'Dani González',
};

let totalMigrations = 0;
const migrationLog = [];

function migrateCard(card, cardPath) {
  let modified = false;

  // Check developer field
  if (card.developer && DEVELOPER_MIGRATION[card.developer]) {
    const oldDev = card.developer;
    const newDev = DEVELOPER_MIGRATION[oldDev];
    migrationLog.push({
      path: cardPath,
      field: 'developer',
      from: oldDev,
      to: newDev,
      cardId: card.cardId || card.id || 'unknown'
    });
    card.developer = newDev;
    card.developerName = DEVELOPER_NAMES[newDev];
    modified = true;
    totalMigrations++;
  }

  // Check coDevelopers array
  if (Array.isArray(card.coDevelopers)) {
    card.coDevelopers = card.coDevelopers.map(coDev => {
      if (DEVELOPER_MIGRATION[coDev]) {
        const newDev = DEVELOPER_MIGRATION[coDev];
        migrationLog.push({
          path: cardPath,
          field: 'coDevelopers',
          from: coDev,
          to: newDev,
          cardId: card.cardId || card.id || 'unknown'
        });
        totalMigrations++;
        modified = true;
        return newDev;
      }
      return coDev;
    });
  }

  // Check createdBy field (might contain developer ID)
  if (card.createdBy && DEVELOPER_MIGRATION[card.createdBy]) {
    const oldDev = card.createdBy;
    const newDev = DEVELOPER_MIGRATION[oldDev];
    migrationLog.push({
      path: cardPath,
      field: 'createdBy',
      from: oldDev,
      to: newDev,
      cardId: card.cardId || card.id || 'unknown'
    });
    card.createdBy = newDev;
    modified = true;
    totalMigrations++;
  }

  // Check assignee field
  if (card.assignee && DEVELOPER_MIGRATION[card.assignee]) {
    const oldDev = card.assignee;
    const newDev = DEVELOPER_MIGRATION[oldDev];
    migrationLog.push({
      path: cardPath,
      field: 'assignee',
      from: oldDev,
      to: newDev,
      cardId: card.cardId || card.id || 'unknown'
    });
    card.assignee = newDev;
    modified = true;
    totalMigrations++;
  }

  return modified;
}

function processCards(data, path = '') {
  if (!data || typeof data !== 'object') return;

  // Check if this is a card object (has cardId or cardType)
  if (data.cardId || data.cardType) {
    migrateCard(data, path);
    return;
  }

  // Recursively process nested objects
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object') {
      processCards(value, path ? `${path}/${key}` : key);
    }
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node scripts/migrate-developer-assignments.cjs <cards-export.json> [output.json]');
    console.log('');
    console.log('Export /cards from Firebase Console first, then run this script.');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace('.json', '_migrated.json');

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log(`Reading: ${inputFile}`);
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  console.log('\nMigrating developer assignments...\n');
  console.log('Mapping:');
  for (const [oldId, newId] of Object.entries(DEVELOPER_MIGRATION)) {
    console.log(`  ${oldId} -> ${newId} (${DEVELOPER_NAMES[newId]})`);
  }
  console.log('');

  processCards(data);

  if (migrationLog.length > 0) {
    console.log('Migrations performed:');
    for (const log of migrationLog) {
      console.log(`  ${log.cardId}: ${log.field} ${log.from} -> ${log.to}`);
    }
  } else {
    console.log('No migrations needed - no tasks found assigned to duplicate developers.');
  }

  console.log(`\nTotal migrations: ${totalMigrations}`);

  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  console.log(`\nWritten to: ${outputFile}`);

  if (totalMigrations > 0) {
    console.log('\nNext steps:');
    console.log('1. Review the output file');
    console.log('2. Import to Firebase: Go to Firebase Console > Realtime Database');
    console.log('3. Navigate to /cards');
    console.log('4. Import the migrated JSON (this will overwrite existing data)');
  }
}

main();
