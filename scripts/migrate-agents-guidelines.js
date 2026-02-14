#!/usr/bin/env node
/**
 * Migration script: Convert agentsGuidelines to global config system
 *
 * This script:
 * 1. Reads all projects with agentsGuidelines
 * 2. Creates a global instruction for each unique agentsGuidelines content
 * 3. Updates projects to reference the global instruction
 * 4. Optionally removes agentsGuidelines from projects
 *
 * Usage:
 *   node scripts/migrate-agents-guidelines.js database-export.json [output.json]
 *
 * The script works on a JSON export from Firebase Console.
 * After running, import the output back to Firebase.
 */

import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

function generateId(content) {
  return createHash('md5').update(content).digest('hex').substring(0, 8);
}

function migrate(inputPath, outputPath) {
  console.log(`Reading ${inputPath}...`);
  const data = JSON.parse(readFileSync(inputPath, 'utf-8'));

  const now = new Date().toISOString();
  const migratedBy = 'migration-script';

  // Initialize global structure if needed
  if (!data.global) {
    data.global = {};
  }
  if (!data.global.instructions) {
    data.global.instructions = {};
  }
  if (!data['global-history']) {
    data['global-history'] = {};
  }
  if (!data['global-history'].instructions) {
    data['global-history'].instructions = {};
  }

  // Track unique guidelines content
  const guidelinesMap = new Map(); // content hash -> instruction id
  const projectsWithGuidelines = [];

  // First pass: collect all unique agentsGuidelines
  if (data.projects) {
    for (const [projectId, project] of Object.entries(data.projects)) {
      if (project.agentsGuidelines && project.agentsGuidelines.trim()) {
        const content = project.agentsGuidelines.trim();
        const hash = generateId(content);

        if (!guidelinesMap.has(hash)) {
          guidelinesMap.set(hash, {
            id: `instr_migrated_${hash}`,
            content,
            projects: [projectId]
          });
        } else {
          guidelinesMap.get(hash).projects.push(projectId);
        }

        projectsWithGuidelines.push({
          projectId,
          hash
        });
      }
    }
  }

  console.log(`Found ${projectsWithGuidelines.length} projects with agentsGuidelines`);
  console.log(`Creating ${guidelinesMap.size} unique global instructions`);

  // Second pass: create global instructions
  for (const [hash, info] of guidelinesMap) {
    const instructionId = info.id;

    // Create the global instruction
    data.global.instructions[instructionId] = {
      name: `Migrated Guidelines (${info.projects.length > 1 ? 'shared' : info.projects[0]})`,
      description: `Auto-migrated from agentsGuidelines field. Original projects: ${info.projects.join(', ')}`,
      content: info.content,
      category: 'development',
      createdAt: now,
      createdBy: migratedBy,
      updatedAt: now,
      updatedBy: migratedBy
    };

    // Create history entry
    if (!data['global-history'].instructions[instructionId]) {
      data['global-history'].instructions[instructionId] = {};
    }
    const historyKey = `migration_${Date.now()}`;
    data['global-history'].instructions[instructionId][historyKey] = {
      name: data.global.instructions[instructionId].name,
      description: data.global.instructions[instructionId].description,
      content: info.content,
      category: 'development',
      timestamp: now,
      changedBy: migratedBy,
      action: 'create'
    };

    console.log(`  Created instruction: ${instructionId} for ${info.projects.length} project(s)`);
  }

  // Third pass: update projects
  for (const { projectId, hash } of projectsWithGuidelines) {
    const info = guidelinesMap.get(hash);
    const project = data.projects[projectId];

    // Initialize selectedInstructions if not exists
    if (!project.selectedInstructions) {
      project.selectedInstructions = [];
    }
    if (!project.selectedAgents) {
      project.selectedAgents = [];
    }
    if (!project.selectedPrompts) {
      project.selectedPrompts = [];
    }

    // Add the migrated instruction
    if (!project.selectedInstructions.includes(info.id)) {
      project.selectedInstructions.push(info.id);
    }

    // Mark old field as migrated (but keep it for safety)
    project._migratedAgentsGuidelines = project.agentsGuidelines;
    project._migratedAt = now;

    // Optionally remove the old field (uncomment to enable)
    // delete project.agentsGuidelines;

    console.log(`  Updated project: ${projectId} -> ${info.id}`);
  }

  // Write output
  const finalPath = outputPath || inputPath.replace('.json', '_migrated.json');
  writeFileSync(finalPath, JSON.stringify(data, null, 2));
  console.log(`\nMigration complete! Output: ${finalPath}`);
  console.log('\nNext steps:');
  console.log('1. Review the migrated file');
  console.log('2. Import to Firebase Console (Database > Import JSON)');
  console.log('3. Update ProjectForm.js to use new selectedInstructions field');
  console.log('4. After verifying, run another migration to remove agentsGuidelines field');
}

// Main
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node scripts/migrate-agents-guidelines.js <input.json> [output.json]');
  console.log('\nExport your Firebase database first:');
  console.log('  Firebase Console > Realtime Database > Export JSON');
  process.exit(1);
}

try {
  migrate(args[0], args[1]);
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
