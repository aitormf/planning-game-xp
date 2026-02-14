/**
 * Backfill script to add the `encodedEmail` custom claim to all existing users.
 * This script is intended to be run once.
 */

const admin = require('firebase-admin');

// --- Instructions ---
// 1. Download your service account key JSON file from Firebase Console > Project Settings > Service Accounts.
// 2. Save it to a secure location OUTSIDE your project repository.
// 3. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to point to this file:
//    - Linux/macOS: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/keyfile.json"
//    - Windows:     set GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\keyfile.json"
// 4. Navigate to the 'functions' directory: `cd functions` (to use its node_modules)
// 5. Run the script: `node ../scripts/backfill-custom-claims.js`
// --------------------

/**
 * Encodes an email for Firebase keys.
 * This logic MUST match the logic in the `setEncodedEmailClaim` Cloud Function.
 * @param {string} email The email to encode.
 * @return {string} The encoded email.
 */
function encodeEmailForFirebase(email) {
  if (!email) return '';
  return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
}

/**
 * Iterates through all Firebase Auth users and sets the custom claim if it doesn't exist.
 */
async function backfillUsers() {
  try {
    // Initialize the Admin SDK. It will automatically use the service account credentials
    // from the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    admin.initializeApp();

    console.log('Starting user backfill process...');

    let pageToken = undefined;
    let updatedUsersCount = 0;
    let scannedUsersCount = 0;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, pageToken);
      pageToken = listUsersResult.pageToken;
      const users = listUsersResult.users;

      if (users.length === 0) {
        console.log('No users found to process.');
        break;
      }

      for (const user of users) {
        scannedUsersCount++;
        // Skip if user has no email or if the claim is already set
        if (!user.email) {
          console.log(`- Skipping user ${user.uid} (no email).`);
          continue;
        }

        if (user.customClaims && user.customClaims.encodedEmail) {
          // console.log(`- Skipping user ${user.email} (claim already exists).`);
          continue;
        }

        const encodedEmail = encodeEmailForFirebase(user.email);
        
        await admin.auth().setCustomUserClaims(user.uid, { encodedEmail });
        console.log(`  -> Successfully set claim for ${user.email}`);
        updatedUsersCount++;
      }

    } while (pageToken);

    console.log(`
✅ Backfill complete.`);
    console.log(`   Scanned users: ${scannedUsersCount}`);
    console.log(`   Updated users: ${updatedUsersCount}`);

  } catch (error) {
    console.error('\n❌ Error during backfill process:', error);
    process.exit(1);
  }
}

// Run the script
backfillUsers();
