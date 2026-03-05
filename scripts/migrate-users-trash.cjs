#!/usr/bin/env node

/**
 * migrate-users-trash.cjs
 *
 * Moves legacy /data/usersTrash into /trash/users and seeds missing deleted users.
 * Usage:
 *   node scripts/migrate-users-trash.cjs [--dry-run]
 */

const { initFirebase } = require('./lib/instance-firebase-init.cjs');

function encodeEmailForFirebase(email) {
  if (!email) return '';
  return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const instanceFlagIndex = process.argv.indexOf('--instance');
  const instanceName = instanceFlagIndex >= 0 ? process.argv[instanceFlagIndex + 1] : undefined;
  const envFlagIndex = process.argv.indexOf('--env');
  const envName = envFlagIndex >= 0 ? process.argv[envFlagIndex + 1] : undefined;
  const dbUrlFlagIndex = process.argv.indexOf('--db-url');
  const dbUrl = dbUrlFlagIndex >= 0 ? process.argv[dbUrlFlagIndex + 1] : undefined;
  const envFiles = envName ? [`.env.${envName}`] : undefined;
  if (dryRun) console.log('🏃 Dry-run mode — no changes will be written\n');

  const { db, instanceName: resolvedInstance, projectId } = await initFirebase({
    instanceName,
    databaseURL: dbUrl,
    envFiles
  });
  console.log(`\n🔑 Instance: ${resolvedInstance} (${projectId})\n`);

  const legacyRef = db.ref('/data/usersTrash');
  const targetRef = db.ref('/trash/users');

  const [legacySnap, targetSnap] = await Promise.all([
    legacyRef.once('value'),
    targetRef.once('value')
  ]);

  const legacy = legacySnap.val() || {};
  const target = targetSnap.val() || {};
  const merged = { ...target };

  let migratedCount = 0;
  for (const [key, value] of Object.entries(legacy)) {
    if (!merged[key]) {
      merged[key] = value;
      migratedCount += 1;
    }
  }

  const now = new Date().toISOString();
  const seedEmail = 'dnfernandez@geniova.com';
  const seedKey = encodeEmailForFirebase(seedEmail);

  const seedPayload = {
    data: {
      name: 'David Nieto',
      email: seedEmail,
      developerId: 'dev_018',
      stakeholderId: null,
      active: false
    },
    deletedAt: now,
    deletedBy: 'migration-script',
    reason: 'legacy-delete'
  };

  let seeded = false;
  const keysToRemove = [];
  for (const [key, value] of Object.entries(merged)) {
    const candidate = value?.data || value?.user || value?.original || value;
    if (candidate?.developerId === 'dev_018' && key !== seedKey) {
      keysToRemove.push(key);
    }
  }

  merged[seedKey] = {
    ...seedPayload,
    ...(merged[seedKey] || {})
  };
  seeded = true;

  keysToRemove.forEach((key) => {
    delete merged[key];
  });

  console.log(`🧹 Legacy usersTrash entries: ${Object.keys(legacy).length}`);
  console.log(`📦 Existing trash/users entries: ${Object.keys(target).length}`);
  console.log(`➡️  Migrated entries: ${migratedCount}`);
  console.log(`🌱 Seeded dev_018: ${seeded ? 'yes' : 'no (already exists)'}`);
  if (keysToRemove.length > 0) {
    console.log(`🧽 Removed ${keysToRemove.length} legacy dev_018 entries`);
  }

  if (dryRun) return;

  await targetRef.set(merged);
  if (Object.keys(legacy).length > 0) {
    await legacyRef.remove();
    console.log('🗑️  Removed /data/usersTrash');
  }

  console.log('✅ Done.');
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
