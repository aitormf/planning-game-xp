#!/usr/bin/env node

/**
 * Update Firebase Version Script
 * Updates the current version in Firebase Realtime Database
 * Run this after deployment to notify connected clients
 *
 * Uses firebase-admin with Application Default Credentials or service account
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Get version from version.json (source of truth, written by update-version.cjs)
const versionJsonPath = path.join(__dirname, '../version.json');
const packageJsonPath = path.join(__dirname, '../package.json');

if (!fs.existsSync(versionJsonPath)) {
  console.error('❌ version.json not found. Run "npm run build:all" first.');
  process.exit(1);
}

const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
const version = versionData.version;

// Cross-check with package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (packageJson.version !== version) {
  console.warn(`⚠️  VERSION MISMATCH: package.json=${packageJson.version}, version.json=${version}`);
  console.warn(`   Using version.json as source of truth`);
}

/**
 * Reads PUBLIC_FIREBASE_DATABASE_URL from .env.prod (symlinked to active instance).
 */
function getDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env.prod');
  if (!fs.existsSync(envPath)) {
    throw new Error('No .env.prod found. Run: npm run instance:use -- <name>');
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/^PUBLIC_FIREBASE_DATABASE_URL=(.+)$/m);
  if (!match) {
    throw new Error('PUBLIC_FIREBASE_DATABASE_URL not found in .env.prod');
  }
  // Use the URL as-is (firebasedatabase.app format includes region info)
  // Previously converted to firebaseio.com, but that drops region and causes
  // connection hangs for databases outside us-central1
  return match[1].trim();
}

const DATABASE_URL = getDatabaseUrl();

// Paths to check for service account
const serviceAccountPaths = [
  path.join(__dirname, '../firebase-service-account.json'),
  path.join(__dirname, '../serviceAccountKey.json'),
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
].filter(Boolean);

async function initFirebase() {
  // Try service account from environment variable (CI/CD)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: DATABASE_URL
      });
      return true;
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT env var');
    }
  }

  // Try service account from file
  for (const filePath of serviceAccountPaths) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: DATABASE_URL
        });
        console.log(`✅ Using service account from: ${filePath}`);
        return true;
      } catch (e) {
        console.warn(`Failed to load service account from ${filePath}`);
      }
    }
  }

  // Try Application Default Credentials (gcloud / Firebase CLI)
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: DATABASE_URL
    });
    console.log('✅ Using Application Default Credentials');
    return true;
  } catch (e) {
    // ADC not available
  }

  return false;
}

async function updateVersion() {
  console.log(`\n📦 Updating Firebase version to: ${version}\n`);

  const initialized = await initFirebase();

  if (!initialized) {
    console.log('⚠️  No Firebase credentials found.');
    console.log('   Options to enable version notifications:');
    console.log('   1. Run: gcloud auth application-default login');
    console.log('   2. Create firebase-service-account.json from Firebase Console');
    console.log('   3. Set FIREBASE_SERVICE_ACCOUNT env var with JSON');
    console.log('\n   Skipping Firebase version update - deploy completed without notification.\n');
    process.exit(0);
  }

  const database = admin.database();

  try {
    // Update version
    await database.ref('/appConfig/currentVersion').set(version);

    // Verify write (with 10s timeout to avoid hanging)
    const verifyPromise = database.ref('/appConfig/currentVersion').once('value');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Read-back verification timed out after 10s')), 10000)
    );

    try {
      const readBack = await Promise.race([verifyPromise, timeoutPromise]);
      if (readBack.val() !== version) {
        console.error(`❌ VERIFICATION FAILED: wrote ${version}, read back ${readBack.val()}`);
        process.exit(1);
      }
      console.log(`✅ Firebase version updated and verified: ${version}`);
    } catch (verifyErr) {
      console.warn(`⚠️  ${verifyErr.message}. Version was written but could not be verified.`);
    }

    // Update deploy timestamp
    await database.ref('/appConfig/lastDeployedAt').set(new Date().toISOString());
    console.log('✅ Deploy timestamp updated');

    console.log('\n🚀 All connected clients will be notified to refresh!\n');

    // Properly close the connection
    await database.goOffline();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating Firebase version:', error.message);

    // Still exit successfully - the deploy itself worked
    process.exit(0);
  }
}

// Global timeout: if the whole operation hangs (e.g. wrong region in database URL),
// exit with a warning after 15 seconds instead of blocking indefinitely
const GLOBAL_TIMEOUT = setTimeout(() => {
  console.error('❌ Operation timed out after 15s.');
  console.error('   This usually means the database URL region is incorrect.');
  console.error(`   Current URL: ${DATABASE_URL}`);
  console.error('   Check PUBLIC_FIREBASE_DATABASE_URL in this instance\'s .env.prod');
  process.exit(1);
}, 15000);

updateVersion().finally(() => clearTimeout(GLOBAL_TIMEOUT));
