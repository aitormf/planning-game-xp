#!/usr/bin/env node

/**
 * migrate-users-to-centralized.cjs
 *
 * Migrates developers and stakeholders from legacy paths to /users/{encodedEmail}.
 * Reads /data/developers, /data/stakeholders, and /projects to build the centralized model.
 *
 * Usage:
 *   node scripts/migrate-users-to-centralized.cjs [--dry-run]
 */

const { initFirebase } = require('./lib/instance-firebase-init.cjs');

function encodeEmailForFirebase(email) {
  if (!email) return '';
  return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.log('🏃 Dry-run mode — no changes will be written\n');

  const { db, instanceName, projectId } = await initFirebase();
  console.log(`\n🔑 Instance: ${instanceName} (${projectId})\n`);

  const now = new Date().toISOString();

  // 1. Read global developers
  const devsSnap = await db.ref('/data/developers').once('value');
  const developers = devsSnap.val() || {};
  console.log(`📋 Global developers: ${Object.keys(developers).length}`);

  // 2. Read global stakeholders
  const stksSnap = await db.ref('/data/stakeholders').once('value');
  const stakeholders = stksSnap.val() || {};
  console.log(`📋 Global stakeholders: ${Object.keys(stakeholders).length}`);

  // 3. Read projects
  const projSnap = await db.ref('/projects').once('value');
  const projects = projSnap.val() || {};
  const projectNames = Object.keys(projects);
  console.log(`📋 Projects: ${projectNames.length}\n`);

  // 4. Build email→user map from global lists
  const usersMap = {}; // keyed by lowercase email

  for (const [devId, dev] of Object.entries(developers)) {
    if (!dev.email) continue;
    const email = dev.email.toLowerCase().trim();
    if (!usersMap[email]) {
      usersMap[email] = {
        name: dev.name || '',
        email,
        developerId: devId,
        stakeholderId: null,
        active: dev.active !== false,
        createdAt: now,
        createdBy: 'migration-script',
        projects: {},
      };
    } else {
      usersMap[email].developerId = devId;
      if (dev.name && !usersMap[email].name) usersMap[email].name = dev.name;
    }
  }

  for (const [stkId, stk] of Object.entries(stakeholders)) {
    if (!stk.email) continue;
    const email = stk.email.toLowerCase().trim();
    if (!usersMap[email]) {
      usersMap[email] = {
        name: stk.name || '',
        email,
        developerId: null,
        stakeholderId: stkId,
        active: stk.active !== false,
        createdAt: now,
        createdBy: 'migration-script',
        projects: {},
      };
    } else {
      usersMap[email].stakeholderId = stkId;
      if (stk.name && !usersMap[email].name) usersMap[email].name = stk.name;
    }
  }

  console.log(`👤 Unique users (merged): ${Object.keys(usersMap).length}\n`);

  // 5. Map project-level assignments
  for (const [projName, projData] of Object.entries(projects)) {
    const projDevs = projData.developers || [];
    const projStks = projData.stakeholders || {};

    // Developers: can be array of objects [{name, email}] or array of IDs ["dev_001"]
    if (Array.isArray(projDevs)) {
      for (const entry of projDevs) {
        let email = null;
        if (typeof entry === 'string') {
          // It's a dev_XXX ID — resolve from global developers
          const dev = developers[entry];
          if (dev?.email) email = dev.email.toLowerCase().trim();
        } else if (entry?.email) {
          email = entry.email.toLowerCase().trim();
        }
        if (email && usersMap[email]) {
          if (!usersMap[email].projects[projName]) {
            usersMap[email].projects[projName] = { developer: false, stakeholder: false, addedAt: now };
          }
          usersMap[email].projects[projName].developer = true;
        }
      }
    } else if (typeof projDevs === 'object') {
      // Object format: {"Name": "email"} or {"dev_001": {name, email}}
      for (const [key, val] of Object.entries(projDevs)) {
        let email = null;
        if (typeof val === 'string') {
          email = val.toLowerCase().trim(); // name→email format
        } else if (val?.email) {
          email = val.email.toLowerCase().trim();
        } else if (key.startsWith('dev_') && developers[key]?.email) {
          email = developers[key].email.toLowerCase().trim();
        }
        if (email && usersMap[email]) {
          if (!usersMap[email].projects[projName]) {
            usersMap[email].projects[projName] = { developer: false, stakeholder: false, addedAt: now };
          }
          usersMap[email].projects[projName].developer = true;
        }
      }
    }

    // Stakeholders: can be object {"Name": "email"} or array
    if (Array.isArray(projStks)) {
      for (const entry of projStks) {
        let email = null;
        if (typeof entry === 'string') {
          const stk = stakeholders[entry];
          if (stk?.email) email = stk.email.toLowerCase().trim();
        } else if (entry?.email) {
          email = entry.email.toLowerCase().trim();
        }
        if (email && usersMap[email]) {
          if (!usersMap[email].projects[projName]) {
            usersMap[email].projects[projName] = { developer: false, stakeholder: false, addedAt: now };
          }
          usersMap[email].projects[projName].stakeholder = true;
        }
      }
    } else if (typeof projStks === 'object') {
      for (const [key, val] of Object.entries(projStks)) {
        let email = null;
        if (typeof val === 'string') {
          email = val.toLowerCase().trim();
        } else if (val?.email) {
          email = val.email.toLowerCase().trim();
        }
        if (email && usersMap[email]) {
          if (!usersMap[email].projects[projName]) {
            usersMap[email].projects[projName] = { developer: false, stakeholder: false, addedAt: now };
          }
          usersMap[email].projects[projName].stakeholder = true;
        }
      }
    }
  }

  // 6. Build Firebase updates
  const updates = {};
  let userCount = 0;
  let devCount = 0;
  let stkCount = 0;

  for (const [email, user] of Object.entries(usersMap)) {
    const encoded = encodeEmailForFirebase(email);
    const userData = {
      name: user.name,
      email: user.email,
      active: user.active,
      createdAt: user.createdAt,
      createdBy: user.createdBy,
    };
    if (user.developerId) userData.developerId = user.developerId;
    if (user.stakeholderId) userData.stakeholderId = user.stakeholderId;

    updates[`/users/${encoded}/name`] = userData.name;
    updates[`/users/${encoded}/email`] = userData.email;
    updates[`/users/${encoded}/active`] = userData.active;
    updates[`/users/${encoded}/createdAt`] = userData.createdAt;
    updates[`/users/${encoded}/createdBy`] = userData.createdBy;
    if (userData.developerId) updates[`/users/${encoded}/developerId`] = userData.developerId;
    if (userData.stakeholderId) updates[`/users/${encoded}/stakeholderId`] = userData.stakeholderId;

    const projectCount = Object.keys(user.projects).length;
    for (const [projName, roles] of Object.entries(user.projects)) {
      updates[`/users/${encoded}/projects/${projName}/developer`] = roles.developer;
      updates[`/users/${encoded}/projects/${projName}/stakeholder`] = roles.stakeholder;
      updates[`/users/${encoded}/projects/${projName}/addedAt`] = roles.addedAt;
    }

    const isDev = user.developerId ? '🔧' : '  ';
    const isStk = user.stakeholderId ? '✅' : '  ';
    const projList = Object.entries(user.projects)
      .map(([p, r]) => `${p}(${r.developer ? 'D' : ''}${r.stakeholder ? 'S' : ''})`)
      .join(', ');

    console.log(`  ${isDev}${isStk} ${email} → ${encoded}`);
    if (projList) console.log(`       Projects: ${projList}`);

    userCount++;
    if (user.developerId) devCount++;
    if (user.stakeholderId) stkCount++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Users to create:  ${userCount}`);
  console.log(`   With developerId: ${devCount}`);
  console.log(`   With stakeholderId: ${stkCount}`);
  console.log(`   Firebase updates: ${Object.keys(updates).length}`);

  // 7. Check existing /users/ data
  const existingSnap = await db.ref('/users').once('value');
  const existingUsers = existingSnap.val();
  if (existingUsers) {
    const existingCount = Object.keys(existingUsers).length;
    console.log(`\n⚠️  /users/ already has ${existingCount} entries. Migration will MERGE (not overwrite).`);
  }

  if (dryRun) {
    console.log('\n🏃 Dry-run — skipping write.');
  } else {
    await db.ref().update(updates);
    console.log(`\n✅ Migrated ${userCount} users to /users/`);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
