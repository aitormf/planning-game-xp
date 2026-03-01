#!/usr/bin/env node

/**
 * sync-allowed-users-to-rtdb.cjs
 *
 * Reads all Firebase Auth users with `allowed: true` custom claim
 * and populates /data/allowedUsers/{encodedEmail} = true in RTDB.
 *
 * Usage:
 *   node scripts/sync-allowed-users-to-rtdb.cjs [--dry-run]
 *
 * Requires active instance (npm run instance:select first).
 */

const { initFirebase } = require('./lib/instance-firebase-init.cjs');

function encodeEmailForFirebase(email) {
  if (!email) return '';
  return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('🏃 Dry-run mode — no changes will be written\n');
  }

  const { db, instanceName, projectId } = await initFirebase();
  console.log(`\n🔑 Instance: ${instanceName} (${projectId})\n`);

  const admin = require('firebase-admin');
  const auth = admin.auth();

  // 1. List all Auth users with allowed: true
  const allowedEmails = [];
  let pageToken;

  do {
    const listResult = await auth.listUsers(1000, pageToken);
    pageToken = listResult.pageToken;

    for (const user of listResult.users) {
      if (user.customClaims?.allowed === true && user.email) {
        allowedEmails.push(user.email.toLowerCase().trim());
      }
    }
  } while (pageToken);

  console.log(`📋 Found ${allowedEmails.length} users with allowed: true in Auth\n`);

  if (allowedEmails.length === 0) {
    console.log('Nothing to sync.');
    process.exit(0);
  }

  // 2. Read current /data/allowedUsers
  const snapshot = await db.ref('/data/allowedUsers').once('value');
  const currentAllowed = snapshot.val() || {};
  const currentCount = Object.keys(currentAllowed).length;
  console.log(`📦 Current /data/allowedUsers entries: ${currentCount}\n`);

  // 3. Build updates
  const updates = {};
  let newCount = 0;
  let existingCount = 0;

  for (const email of allowedEmails) {
    const encoded = encodeEmailForFirebase(email);
    if (currentAllowed[encoded] === true) {
      existingCount++;
      console.log(`  ⏭️  ${email} (already in list)`);
    } else {
      newCount++;
      updates[`/data/allowedUsers/${encoded}`] = true;
      console.log(`  ✅ ${email} → ${encoded}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Already in list: ${existingCount}`);
  console.log(`   New to add:      ${newCount}`);

  if (newCount === 0) {
    console.log('\n✅ Nothing new to sync — RTDB is already up to date.');
    process.exit(0);
  }

  // 4. Write updates
  if (dryRun) {
    console.log('\n🏃 Dry-run — skipping write.');
  } else {
    await db.ref().update(updates);
    console.log(`\n✅ Synced ${newCount} users to /data/allowedUsers`);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
