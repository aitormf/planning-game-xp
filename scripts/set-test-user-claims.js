#!/usr/bin/env node
/**
 * Sets Custom Claims for the test user so they can access Firebase RTDB.
 * Usage: node scripts/set-test-user-claims.js
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = resolve(__dirname, '../planning-game-instances/manufosela/serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);

const TEST_EMAIL = 'testuser@pgamexp.com';

async function main() {
  try {
    const user = await auth.getUserByEmail(TEST_EMAIL);
    console.log(`Found user: ${user.uid} (${user.email})`);
    console.log('Current claims:', user.customClaims);

    await auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      allowed: true,
    });

    // Verify
    const updated = await auth.getUserByEmail(TEST_EMAIL);
    console.log('Updated claims:', updated.customClaims);
    console.log('Done! The user may need to re-login for claims to take effect.');
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

main();
