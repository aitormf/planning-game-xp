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

// Get version from package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

const DATABASE_URL = 'https://planning-gamexp-default-rtdb.europe-west1.firebasedatabase.app';

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
    console.log(`✅ Firebase version updated to ${version}`);

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

updateVersion();
