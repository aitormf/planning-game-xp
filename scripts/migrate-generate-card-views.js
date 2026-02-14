#!/usr/bin/env node
/**
 * Script de migración para generar vistas optimizadas de cards
 *
 * Este script procesa un export de Firebase y genera las vistas denormalizadas
 * en /views/task-list, /views/bug-list, /views/proposal-list
 *
 * Uso:
 *   node scripts/migrate-generate-card-views.js <input.json> [output.json]
 *
 * Si no se especifica output.json, se genera con sufijo _with_views.json
 *
 * Las vistas reducen el tráfico de Firebase ~70-80% para vistas de tabla.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract essential fields for task table view
 * @param {Object} taskData - Full task data from /cards
 * @param {string} firebaseId - Firebase key of the card
 * @returns {Object} - Minimal data for table view
 */
function extractTaskViewFields(taskData, firebaseId) {
  const viewData = {
    firebaseId,
    cardId: taskData.cardId,
    title: taskData.title,
    status: taskData.status,
    businessPoints: taskData.businessPoints,
    devPoints: taskData.devPoints,
    sprint: taskData.sprint,
    developer: taskData.developer,
    coDeveloper: taskData.coDeveloper,
    validator: taskData.validator,
    epic: taskData.epic,
    startDate: taskData.startDate,
    endDate: taskData.endDate,
    spike: taskData.spike,
    expedited: taskData.expedited,
    blockedByBusiness: taskData.blockedByBusiness,
    blockedByDevelopment: taskData.blockedByDevelopment,
    coValidator: taskData.coValidator,
    notesCount: Array.isArray(taskData.notes) ? taskData.notes.length : 0,
    year: taskData.year,
    relatedTasks: Array.isArray(taskData.relatedTasks)
      ? taskData.relatedTasks.map(rt => ({
        id: rt.id,
        title: rt.title || rt.id,
        type: rt.type || 'related',
        projectId: rt.projectId
      }))
      : undefined
  };

  // Remove undefined values
  Object.keys(viewData).forEach(key => {
    if (viewData[key] === undefined) {
      delete viewData[key];
    }
  });

  return viewData;
}

/**
 * Extract essential fields for bug table view
 * @param {Object} bugData - Full bug data from /cards
 * @param {string} firebaseId - Firebase key of the card
 * @returns {Object} - Minimal data for table view
 */
function extractBugViewFields(bugData, firebaseId) {
  const viewData = {
    firebaseId,
    cardId: bugData.cardId,
    title: bugData.title,
    status: bugData.status,
    priority: bugData.priority,
    developer: bugData.developer,
    createdBy: bugData.createdBy,
    registerDate: bugData.registerDate,
    startDate: bugData.startDate,
    endDate: bugData.endDate,
    year: bugData.year
  };

  // Remove undefined values
  Object.keys(viewData).forEach(key => {
    if (viewData[key] === undefined) {
      delete viewData[key];
    }
  });

  return viewData;
}

/**
 * Extract essential fields for proposal table view
 * @param {Object} proposalData - Full proposal data from /cards
 * @param {string} firebaseId - Firebase key of the card
 * @returns {Object} - Minimal data for table view
 */
function extractProposalViewFields(proposalData, firebaseId) {
  const viewData = {
    firebaseId,
    cardId: proposalData.cardId,
    title: proposalData.title,
    status: proposalData.status,
    businessPoints: proposalData.businessPoints,
    createdBy: proposalData.createdBy,
    stakeholder: proposalData.stakeholder,
    registerDate: proposalData.registerDate,
    year: proposalData.year
  };

  // Remove undefined values
  Object.keys(viewData).forEach(key => {
    if (viewData[key] === undefined) {
      delete viewData[key];
    }
  });

  return viewData;
}

/**
 * Process all cards and generate views
 * @param {Object} data - Firebase database export
 * @returns {Object} - Statistics about generated views
 */
function generateViews(data) {
  const stats = {
    tasks: { total: 0, projects: [] },
    bugs: { total: 0, projects: [] },
    proposals: { total: 0, projects: [] }
  };

  // Initialize views structure
  if (!data.views) {
    data.views = {};
  }
  data.views['task-list'] = {};
  data.views['bug-list'] = {};
  data.views['proposal-list'] = {};

  // Check if we have cards
  if (!data.cards || typeof data.cards !== 'object') {
    console.log('No cards found in data');
    return stats;
  }

  // Process each project
  for (const [projectId, projectData] of Object.entries(data.cards)) {
    if (!projectData || typeof projectData !== 'object') continue;

    // Initialize project views
    data.views['task-list'][projectId] = {};
    data.views['bug-list'][projectId] = {};
    data.views['proposal-list'][projectId] = {};

    let projectTaskCount = 0;
    let projectBugCount = 0;
    let projectProposalCount = 0;

    // Process each section in the project
    for (const [sectionName, sectionData] of Object.entries(projectData)) {
      if (!sectionData || typeof sectionData !== 'object') continue;

      // Determine section type (case-insensitive)
      let viewType = null;
      let extractFn = null;
      const sectionLower = sectionName.toLowerCase();

      if (sectionLower.startsWith('tasks_')) {
        viewType = 'task-list';
        extractFn = extractTaskViewFields;
      } else if (sectionLower.startsWith('bugs_')) {
        viewType = 'bug-list';
        extractFn = extractBugViewFields;
      } else if (sectionLower.startsWith('proposals_')) {
        viewType = 'proposal-list';
        extractFn = extractProposalViewFields;
      } else {
        // Skip epics, sprints, qa
        continue;
      }

      // Process each card in the section
      for (const [firebaseId, cardData] of Object.entries(sectionData)) {
        if (!cardData || typeof cardData !== 'object') continue;

        const viewData = extractFn(cardData, firebaseId);
        data.views[viewType][projectId][firebaseId] = viewData;

        if (viewType === 'task-list') projectTaskCount++;
        else if (viewType === 'bug-list') projectBugCount++;
        else if (viewType === 'proposal-list') projectProposalCount++;
      }
    }

    // Update stats
    if (projectTaskCount > 0) {
      stats.tasks.total += projectTaskCount;
      stats.tasks.projects.push({ projectId, count: projectTaskCount });
    }
    if (projectBugCount > 0) {
      stats.bugs.total += projectBugCount;
      stats.bugs.projects.push({ projectId, count: projectBugCount });
    }
    if (projectProposalCount > 0) {
      stats.proposals.total += projectProposalCount;
      stats.proposals.projects.push({ projectId, count: projectProposalCount });
    }

    // Clean up empty project views
    if (Object.keys(data.views['task-list'][projectId]).length === 0) {
      delete data.views['task-list'][projectId];
    }
    if (Object.keys(data.views['bug-list'][projectId]).length === 0) {
      delete data.views['bug-list'][projectId];
    }
    if (Object.keys(data.views['proposal-list'][projectId]).length === 0) {
      delete data.views['proposal-list'][projectId];
    }
  }

  return stats;
}

/**
 * Calculate size reduction
 * @param {Object} data - Full database
 * @param {string} projectId - Project to analyze
 * @returns {Object} - Size comparison
 */
function calculateSizeReduction(data, projectId) {
  if (!data.cards || !data.cards[projectId]) return null;

  const cardsSize = JSON.stringify(data.cards[projectId]).length;

  let viewsSize = 0;
  if (data.views['task-list']?.[projectId]) {
    viewsSize += JSON.stringify(data.views['task-list'][projectId]).length;
  }
  if (data.views['bug-list']?.[projectId]) {
    viewsSize += JSON.stringify(data.views['bug-list'][projectId]).length;
  }
  if (data.views['proposal-list']?.[projectId]) {
    viewsSize += JSON.stringify(data.views['proposal-list'][projectId]).length;
  }

  const reduction = ((cardsSize - viewsSize) / cardsSize * 100).toFixed(1);

  return {
    cardsSize,
    viewsSize,
    reduction: `${reduction}%`
  };
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node migrate-generate-card-views.js <input.json> [output.json]');
    console.log('');
    console.log('Generates optimized views for task, bug, and proposal tables.');
    console.log('The views reduce Firebase traffic by ~70-80%.');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace('.json', '_with_views.json');

  // Check input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log(`Reading: ${inputFile}`);
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  console.log('Generating views...');
  const stats = generateViews(data);

  console.log('');
  console.log('=== Generation Statistics ===');
  console.log(`Tasks: ${stats.tasks.total} across ${stats.tasks.projects.length} projects`);
  stats.tasks.projects.forEach(p => console.log(`  - ${p.projectId}: ${p.count}`));
  console.log(`Bugs: ${stats.bugs.total} across ${stats.bugs.projects.length} projects`);
  stats.bugs.projects.forEach(p => console.log(`  - ${p.projectId}: ${p.count}`));
  console.log(`Proposals: ${stats.proposals.total} across ${stats.proposals.projects.length} projects`);
  stats.proposals.projects.forEach(p => console.log(`  - ${p.projectId}: ${p.count}`));

  // Calculate size reduction for first project with tasks
  if (stats.tasks.projects.length > 0) {
    const sampleProject = stats.tasks.projects[0].projectId;
    const sizeInfo = calculateSizeReduction(data, sampleProject);
    if (sizeInfo) {
      console.log('');
      console.log(`=== Size Reduction (${sampleProject}) ===`);
      console.log(`Original /cards: ${(sizeInfo.cardsSize / 1024).toFixed(1)} KB`);
      console.log(`Views: ${(sizeInfo.viewsSize / 1024).toFixed(1)} KB`);
      console.log(`Reduction: ${sizeInfo.reduction}`);
    }
  }

  // Write output
  console.log('');
  console.log(`Writing: ${outputFile}`);
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

  console.log('');
  console.log('Done! Import the output file to Firebase to enable optimized views.');
  console.log('The Cloud Function "syncCardViews" will keep views updated automatically.');
}

main();
