/**
 * Test User Setup Helper
 *
 * Ensures the test user exists in all required Firebase paths
 * before tests run. This is necessary because the test DB is
 * periodically overwritten with production data where testuser
 * doesn't exist.
 *
 * Required paths:
 * - /data/developers/dev_e2e_test
 * - /data/stakeholders/stk_e2e_test
 * - /data/appAdmins (array containing email)
 * - /data/usersDirectory/{encodedEmail}
 * - /data/relEmailUser/{encodedEmail}
 * - /data/projectsByUser/{encodedEmail} = "All" (admin access to all projects)
 */

const TEST_USER_DEV_ID = 'dev_e2e_test';
const TEST_USER_STK_ID = 'stk_e2e_test';

/**
 * Sets up the test user in all required Firebase database paths.
 * Runs inside the browser context via page.evaluate().
 *
 * @param {import('@playwright/test').Page} page - Playwright page (already authenticated)
 * @param {object} userData - Test user data
 * @param {string} userData.email
 * @param {string} userData.name
 */
export async function setupTestUser(page, { email, name }) {
  console.log(`  [setup] Ensuring test user exists in DB: ${email}`);

  const result = await page.evaluate(async ({ email, name, devId, stkId }) => {
    try {
      const { database, ref, set, get, update } = await import('/firebase-config.js');

      const encodedEmail = email.replace(/\./g, ',');
      const results = [];

      // 1. /data/developers/dev_e2e_test
      const devRef = ref(database, `/data/developers/${devId}`);
      const devSnap = await get(devRef);
      if (!devSnap.exists()) {
        await set(devRef, { email, name, active: true });
        results.push(`Created developer: ${devId}`);
      } else {
        results.push(`Developer already exists: ${devId}`);
      }

      // 2. /data/stakeholders/stk_e2e_test
      const stkRef = ref(database, `/data/stakeholders/${stkId}`);
      const stkSnap = await get(stkRef);
      if (!stkSnap.exists()) {
        await set(stkRef, { email, name, active: true, teamId: null });
        results.push(`Created stakeholder: ${stkId}`);
      } else {
        results.push(`Stakeholder already exists: ${stkId}`);
      }

      // 3. /data/appAdmins - ensure email is in the list
      const adminsRef = ref(database, '/data/appAdmins');
      const adminsSnap = await get(adminsRef);
      const admins = adminsSnap.exists() ? adminsSnap.val() : [];
      const adminsList = Array.isArray(admins) ? admins : Object.values(admins);
      if (!adminsList.includes(email)) {
        adminsList.push(email);
        await set(adminsRef, adminsList);
        results.push('Added to appAdmins');
      } else {
        results.push('Already in appAdmins');
      }

      // 4. /data/usersDirectory/{encodedEmail}
      const userDirRef = ref(database, `/data/usersDirectory/${encodedEmail}`);
      const userDirSnap = await get(userDirRef);
      if (!userDirSnap.exists()) {
        await set(userDirRef, {
          email,
          name,
          isAdmin: true,
          isSuperAdmin: true,
          roles: ['developer', 'stakeholder', 'admin']
        });
        results.push('Created usersDirectory entry');
      } else {
        results.push('usersDirectory entry already exists');
      }

      // 5. /data/relEmailUser/{encodedEmail}
      const relRef = ref(database, `/data/relEmailUser/${encodedEmail}`);
      const relSnap = await get(relRef);
      if (!relSnap.exists()) {
        await set(relRef, name);
        results.push('Created relEmailUser entry');
      } else {
        results.push('relEmailUser entry already exists');
      }

      // 6. /data/projectsByUser/{encodedEmail} = "All" (admin access)
      const projectsRef = ref(database, `/data/projectsByUser/${encodedEmail}`);
      const projectsSnap = await get(projectsRef);
      if (!projectsSnap.exists() || projectsSnap.val() !== 'All') {
        await set(projectsRef, 'All');
        results.push('Set projectsByUser to "All" (admin access)');
      } else {
        results.push('projectsByUser already set to "All"');
      }

      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, { email, name, devId: TEST_USER_DEV_ID, stkId: TEST_USER_STK_ID });

  if (result.success) {
    for (const msg of result.results) {
      console.log(`    ${msg}`);
    }
  } else {
    console.error(`  [setup] ERROR setting up test user: ${result.error}`);
    console.error('  [setup] Check Firebase security rules for the test database');
  }

  return result.success;
}

/**
 * Removes the test user data created during setup.
 * Call this in teardown to clean up.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} userData
 * @param {string} userData.email
 */
export async function cleanupTestUser(page, { email }) {
  console.log(`  [cleanup] Removing test user from DB: ${email}`);

  const result = await page.evaluate(async ({ email, devId, stkId }) => {
    try {
      const { database, ref, set, get } = await import('/firebase-config.js');

      const encodedEmail = email.replace(/\./g, ',');

      // Remove developer entry
      await set(ref(database, `/data/developers/${devId}`), null);

      // Remove stakeholder entry
      await set(ref(database, `/data/stakeholders/${stkId}`), null);

      // Remove from appAdmins
      const adminsRef = ref(database, '/data/appAdmins');
      const adminsSnap = await get(adminsRef);
      if (adminsSnap.exists()) {
        const admins = adminsSnap.val();
        const adminsList = Array.isArray(admins) ? admins : Object.values(admins);
        const filtered = adminsList.filter(e => e !== email);
        await set(adminsRef, filtered);
      }

      // Remove usersDirectory entry
      await set(ref(database, `/data/usersDirectory/${encodedEmail}`), null);

      // Remove relEmailUser entry
      await set(ref(database, `/data/relEmailUser/${encodedEmail}`), null);

      // Remove projectsByUser entry
      await set(ref(database, `/data/projectsByUser/${encodedEmail}`), null);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, { email, devId: TEST_USER_DEV_ID, stkId: TEST_USER_STK_ID });

  if (result.success) {
    console.log('  [cleanup] Test user removed from DB');
  } else {
    console.error(`  [cleanup] ERROR removing test user: ${result.error}`);
  }
}
