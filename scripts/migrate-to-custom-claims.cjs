#!/usr/bin/env node
/**
 * Migration script: Replace hardcoded email whitelist with Custom Claims
 *
 * This script assigns the `allowed: true` custom claim to ALL existing
 * Firebase Auth users, preserving any existing claims (encodedEmail, isAppAdmin, etc.).
 *
 * IMPORTANT: Run this script BEFORE deploying the new database.rules.json.
 * If rules are deployed first, all users will lose access.
 *
 * Usage:
 *   1. Activate the target instance: node scripts/instance-manager.cjs use <name>
 *   2. Set credentials: export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
 *   3. Run: node scripts/migrate-to-custom-claims.cjs [--dry-run]
 *
 * Options:
 *   --dry-run   Show what would be done without making changes
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Reads PUBLIC_FIREBASE_DATABASE_URL from .env.prod (symlinked to active instance).
 */
function getDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env.prod');
  if (!fs.existsSync(envPath)) {
    throw new Error('No .env.prod found. Run: node scripts/instance-manager.cjs use <name>');
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/^PUBLIC_FIREBASE_DATABASE_URL=(.+)$/m);
  if (!match) {
    throw new Error('PUBLIC_FIREBASE_DATABASE_URL not found in .env.prod');
  }
  return match[1].trim();
}

/**
 * Iterates through all Firebase Auth users and sets the `allowed: true` claim.
 * Preserves existing custom claims (encodedEmail, isAppAdmin, etc.).
 */
async function migrateUsers() {
  const databaseURL = getDatabaseUrl();

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  console.log(`📋 Target database: ${databaseURL}\n`);

  admin.initializeApp({ databaseURL });

  const auth = admin.auth();

  let pageToken = undefined;
  let scannedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const results = [];

  do {
    const listResult = await auth.listUsers(1000, pageToken);
    pageToken = listResult.pageToken;

    for (const user of listResult.users) {
      scannedCount++;

      if (!user.email) {
        console.log(`  SKIP  ${user.uid} (no email)`);
        skippedCount++;
        continue;
      }

      const currentClaims = user.customClaims || {};

      if (currentClaims.allowed === true) {
        console.log(`  OK    ${user.email} (already has allowed=true)`);
        skippedCount++;
        continue;
      }

      const newClaims = { ...currentClaims, allowed: true };

      if (DRY_RUN) {
        console.log(`  WOULD ${user.email} — claims: ${JSON.stringify(currentClaims)} → ${JSON.stringify(newClaims)}`);
      } else {
        await auth.setCustomUserClaims(user.uid, newClaims);
        console.log(`  SET   ${user.email} — allowed=true added`);
      }

      results.push({ email: user.email, uid: user.uid, previousClaims: currentClaims });
      updatedCount++;
    }
  } while (pageToken);

  console.log(`\n${DRY_RUN ? '🔍 DRY RUN' : '✅'} Migration complete.`);
  console.log(`   Scanned: ${scannedCount}`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped: ${skippedCount}`);

  if (updatedCount > 0 && !DRY_RUN) {
    console.log('\n⚠️  Users must re-login or force token refresh for the new claim to take effect.');
    console.log('   The app should call auth.currentUser.getIdToken(true) after this migration.');
  }

  return results;
}

migrateUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  });
