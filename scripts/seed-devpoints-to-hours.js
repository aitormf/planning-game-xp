#!/usr/bin/env node
/**
 * Seed script for devPointsToHours mapping data
 * Creates the mapping between devPoints and estimated hours
 * for each scoring system.
 *
 * Usage:
 *   node scripts/seed-devpoints-to-hours.js
 *
 * Uses active instance from .last-instance (see instance-manager.cjs)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { initFirebase } = require('./lib/instance-firebase-init.cjs');

const devPointsToHours = {
  scale_1_5: {
    1: 4,
    2: 8,
    3: 16,
    4: 24,
    5: 40
  },
  fibonacci: {
    1: 2,
    2: 4,
    3: 8,
    5: 16,
    8: 40,
    13: 80
  }
};

async function main() {
  const { db } = await initFirebase();

  console.log('Seeding devPointsToHours mapping...');
  await db.ref('/data/devPointsToHours').set(devPointsToHours);
  console.log('Done. Data written to /data/devPointsToHours');

  process.exit(0);
}

main().catch(err => {
  console.error('Error seeding devPointsToHours:', err);
  process.exit(1);
});
