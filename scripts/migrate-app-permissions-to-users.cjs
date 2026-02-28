#!/usr/bin/env node
/**
 * Migration script: Copy legacy app permissions to /users/{email}/projects/{pid}/appPermissions
 *
 * Reads from:
 *   /data/appAdmins/{encodedEmail} = true
 *   /data/appUploaders/{projectId}/{encodedEmail} = true
 *   /data/betaUsers/{projectId}/{encodedEmail} = true
 *
 * Writes to:
 *   /users/{encodedEmail}/projects/{projectId}/appPermissions/{view,download,upload,edit,approve}
 *
 * Rules:
 *   - appAdmins → all permissions true for ALL their projects
 *   - appUploaders → upload=true, view=true, download=true
 *   - betaUsers → view=true
 *
 * Usage:
 *   node scripts/migrate-app-permissions-to-users.cjs [--dry-run]
 *
 * Requires serviceAccountKey.json in project root or GOOGLE_APPLICATION_CREDENTIALS env var.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const isDryRun = process.argv.includes('--dry-run');

// Resolve credentials
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(credPath)) {
  console.error(`Credentials not found at: ${credPath}`);
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in project root.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
const databaseURL = process.env.FIREBASE_DATABASE_URL ||
  `https://${serviceAccount.project_id}-default-rtdb.europe-west1.firebasedatabase.app`;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL
});

const db = admin.database();

async function migrate() {
  console.log(`Migration: Legacy app permissions → /users/*/projects/*/appPermissions`);
  console.log(`Firebase project: ${serviceAccount.project_id}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no writes)' : 'LIVE'}\n`);

  const updates = {};

  // 1. Read all data sources
  const [appAdminsSnap, appUploadersSnap, betaUsersSnap, usersSnap] = await Promise.all([
    db.ref('/data/appAdmins').once('value'),
    db.ref('/data/appUploaders').once('value'),
    db.ref('/data/betaUsers').once('value'),
    db.ref('/users').once('value'),
  ]);

  const appAdmins = appAdminsSnap.val() || {};
  const appUploaders = appUploadersSnap.val() || {};
  const betaUsers = betaUsersSnap.val() || {};
  const users = usersSnap.val() || {};

  // Helper: set a permission for a user/project
  function setPermission(encodedEmail, projectId, permKey, value) {
    const path = `/users/${encodedEmail}/projects/${projectId}/appPermissions/${permKey}`;
    // Only set to true (don't overwrite existing true with false)
    if (value === true) {
      updates[path] = true;
    }
  }

  // 2. Process appAdmins: all permissions for all their projects
  let adminCount = 0;
  for (const encodedEmail of Object.keys(appAdmins)) {
    if (appAdmins[encodedEmail] !== true) continue;
    const userData = users[encodedEmail];
    if (!userData || !userData.projects) {
      console.log(`  SKIP appAdmin ${encodedEmail}: no /users/ record or no projects`);
      continue;
    }
    for (const pid of Object.keys(userData.projects)) {
      setPermission(encodedEmail, pid, 'view', true);
      setPermission(encodedEmail, pid, 'download', true);
      setPermission(encodedEmail, pid, 'upload', true);
      setPermission(encodedEmail, pid, 'edit', true);
      setPermission(encodedEmail, pid, 'approve', true);
    }
    adminCount++;
    console.log(`  appAdmin: ${encodedEmail} → all perms for ${Object.keys(userData.projects).join(', ')}`);
  }

  // 3. Process appUploaders: upload + view + download per project
  let uploaderCount = 0;
  for (const [pid, emailsObj] of Object.entries(appUploaders)) {
    if (!emailsObj || typeof emailsObj !== 'object') continue;
    for (const encodedEmail of Object.keys(emailsObj)) {
      if (emailsObj[encodedEmail] !== true) continue;
      if (!users[encodedEmail]) {
        console.log(`  SKIP appUploader ${encodedEmail}/${pid}: no /users/ record`);
        continue;
      }
      setPermission(encodedEmail, pid, 'upload', true);
      setPermission(encodedEmail, pid, 'view', true);
      setPermission(encodedEmail, pid, 'download', true);
      uploaderCount++;
      console.log(`  appUploader: ${encodedEmail} → upload+view+download for ${pid}`);
    }
  }

  // 4. Process betaUsers: view per project
  let betaCount = 0;
  for (const [pid, emailsObj] of Object.entries(betaUsers)) {
    if (!emailsObj || typeof emailsObj !== 'object') continue;
    for (const encodedEmail of Object.keys(emailsObj)) {
      if (emailsObj[encodedEmail] !== true) continue;
      if (!users[encodedEmail]) {
        console.log(`  SKIP betaUser ${encodedEmail}/${pid}: no /users/ record`);
        continue;
      }
      setPermission(encodedEmail, pid, 'view', true);
      betaCount++;
      console.log(`  betaUser: ${encodedEmail} → view for ${pid}`);
    }
  }

  // 5. Summary and apply
  const pathCount = Object.keys(updates).length;
  console.log(`\nSummary:`);
  console.log(`  appAdmins processed: ${adminCount}`);
  console.log(`  appUploaders processed: ${uploaderCount}`);
  console.log(`  betaUsers processed: ${betaCount}`);
  console.log(`  Total paths to write: ${pathCount}`);

  if (pathCount === 0) {
    console.log('\nNothing to migrate.');
    process.exit(0);
  }

  if (isDryRun) {
    console.log('\n--- DRY RUN: Paths that would be written ---');
    for (const [p, v] of Object.entries(updates)) {
      console.log(`  ${p} = ${v}`);
    }
    console.log('\nRe-run without --dry-run to apply changes.');
  } else {
    console.log('\nApplying updates...');
    await db.ref().update(updates);
    console.log('Done! Migration applied successfully.');
    console.log('The syncAppPermissionsClaim trigger will update custom claims automatically.');
  }

  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
