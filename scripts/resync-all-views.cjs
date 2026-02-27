#!/usr/bin/env node
/**
 * One-time script to resync all /views from /cards data.
 * Run when view extraction logic changes (e.g., new fields like notesCount).
 *
 * Usage: node scripts/resync-all-views.js
 */

const {
  extractTaskViewFields,
  extractBugViewFields,
  extractProposalViewFields,
  getViewPathForSection
} = require('../functions/handlers/sync-card-views.js');
const { initFirebase } = require('./lib/instance-firebase-init.cjs');

async function resyncAll() {
  const { db, instanceName, projectId } = await initFirebase();
  console.log(`Resync for instance: ${instanceName} (${projectId})\n`);
  console.log('Reading all cards from /cards...');
  const cardsSnap = await db.ref('/cards').once('value');
  if (!cardsSnap.exists()) {
    console.log('No cards found');
    process.exit(0);
  }

  const cardsData = cardsSnap.val();
  const stats = { tasks: 0, bugs: 0, proposals: 0, projects: 0 };

  for (const [projectId, projectData] of Object.entries(cardsData)) {
    if (!projectData || typeof projectData !== 'object') continue;
    stats.projects++;
    console.log(`\nProcessing project: ${projectId}`);

    for (const [sectionName, sectionData] of Object.entries(projectData)) {
      if (!sectionData || typeof sectionData !== 'object') continue;

      const viewType = getViewPathForSection(sectionName);
      if (!viewType) continue;

      let extractFn;
      if (viewType === 'task-list') extractFn = extractTaskViewFields;
      else if (viewType === 'bug-list') extractFn = extractBugViewFields;
      else if (viewType === 'proposal-list') extractFn = extractProposalViewFields;
      else continue;

      const updates = {};
      for (const [cardId, cardData] of Object.entries(sectionData)) {
        if (!cardData || typeof cardData !== 'object') continue;
        if (cardData.deletedAt) continue;

        const viewData = extractFn(cardData, cardId);
        // Deep-clean undefined values (Firebase RTDB rejects them)
        const clean = JSON.parse(JSON.stringify(viewData, (k, v) => v === undefined ? null : v));
        // Remove null keys at top level
        Object.keys(clean).forEach(key => {
          if (clean[key] === null) delete clean[key];
        });
        // Clean nulls inside relatedTasks entries
        if (Array.isArray(clean.relatedTasks)) {
          clean.relatedTasks = clean.relatedTasks.map(rt => {
            const c = {};
            for (const [k, v] of Object.entries(rt)) {
              if (v != null) c[k] = v;
            }
            return c;
          });
        }
        updates[cardId] = clean;

        if (viewType === 'task-list') stats.tasks++;
        else if (viewType === 'bug-list') stats.bugs++;
        else if (viewType === 'proposal-list') stats.proposals++;
      }

      // Batch write all cards for this section
      if (Object.keys(updates).length > 0) {
        await db.ref(`/views/${viewType}/${projectId}`).set(updates);
        console.log(`  Synced ${Object.keys(updates).length} ${viewType} entries`);
      }
    }
  }

  console.log('\n=== Resync complete ===');
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
}

resyncAll().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
