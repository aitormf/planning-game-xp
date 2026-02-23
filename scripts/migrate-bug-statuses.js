#!/usr/bin/env node
'use strict';

/**
 * Migration script: Align bug statuses from 10 to 5
 *
 * Mapping (old → new):
 *   Created     → Created        (unchanged)
 *   Triaged     → Assigned
 *   Assigned    → Assigned       (unchanged)
 *   In Progress → Assigned
 *   In Testing  → Fixed
 *   Fixed       → Fixed          (unchanged)
 *   Verified    → Verified       (unchanged)
 *   Closed      → Closed         (unchanged)
 *   Blocked     → Assigned       (adds note in description)
 *   Rejected    → Closed
 *
 * Usage:
 *   node scripts/migrate-bug-statuses.js <input.json> [output.json]
 *
 * Input:  Firebase Realtime Database export (JSON)
 * Output: Migrated JSON (default: <input>_migrated.json)
 */

const fs = require('fs');
const path = require('path');

const STATUS_MAP = {
  'Triaged': 'Assigned',
  'In Progress': 'Assigned',
  'In Testing': 'Fixed',
  'Blocked': 'Assigned',
  'Rejected': 'Closed'
};

function migrateBugStatuses(data) {
  let migratedCount = 0;
  let skippedCount = 0;

  const cards = data.cards;
  if (!cards) {
    console.log('No /cards node found in data.');
    return { data, migratedCount, skippedCount };
  }

  for (const [projectId, sections] of Object.entries(cards)) {
    for (const [sectionKey, sectionData] of Object.entries(sections)) {
      // Only process bug sections (BUGS_ProjectName)
      if (!sectionKey.startsWith('BUGS_')) continue;

      for (const [cardId, card] of Object.entries(sectionData)) {
        if (!card || !card.status) {
          skippedCount++;
          continue;
        }

        const oldStatus = card.status;
        const newStatus = STATUS_MAP[oldStatus];

        if (newStatus) {
          card.status = newStatus;

          // Add note for blocked bugs
          if (oldStatus === 'Blocked') {
            const note = `[Migration] Previously "Blocked". Migrated to "Assigned" on ${new Date().toISOString().split('T')[0]}.`;
            card.description = card.description
              ? `${card.description}\n\n${note}`
              : note;
          }

          // Add note for rejected bugs
          if (oldStatus === 'Rejected') {
            const note = `[Migration] Previously "Rejected". Migrated to "Closed" on ${new Date().toISOString().split('T')[0]}.`;
            card.description = card.description
              ? `${card.description}\n\n${note}`
              : note;
          }

          migratedCount++;
          console.log(`  ${projectId}/${card.cardId || cardId}: "${oldStatus}" → "${newStatus}"`);
        } else {
          skippedCount++;
        }
      }
    }
  }

  return { data, migratedCount, skippedCount };
}

// Main
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node scripts/migrate-bug-statuses.js <input.json> [output.json]');
  process.exit(1);
}

const outputFile = process.argv[3] || inputFile.replace(/\.json$/, '_migrated.json');

console.log(`Reading: ${inputFile}`);
const rawData = fs.readFileSync(path.resolve(inputFile), 'utf-8');
const data = JSON.parse(rawData);

console.log('Migrating bug statuses...');
const { data: migratedData, migratedCount, skippedCount } = migrateBugStatuses(data);

console.log(`\nResults: ${migratedCount} migrated, ${skippedCount} unchanged`);

fs.writeFileSync(path.resolve(outputFile), JSON.stringify(migratedData, null, 2));
console.log(`Output: ${outputFile}`);
