#!/usr/bin/env node

/**
 * Migration script: CLAUDE.md → Firebase global_config guidelines
 *
 * Parses the project CLAUDE.md into semantic sections and creates/merges
 * them as global_config entries (type=instructions) in Firebase.
 *
 * Usage:
 *   node mcp/scripts/migrate-claude-md-to-guidelines.js [options]
 *
 * Options:
 *   --dry-run       Preview changes without writing to Firebase
 *   --claude-md     Path to CLAUDE.md (default: ./CLAUDE.md)
 *   --verbose       Show detailed output for each section
 *
 * Environment variables:
 *   MCP_INSTANCE_DIR — path to instance directory with serviceAccountKey.json
 *   GOOGLE_APPLICATION_CREDENTIALS — path to service account key
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseSections, parseSectionsWithExtraction } from './lib/claude-md-parser.js';
import { resolveTarget, MERGE_SEPARATOR, SUBSECTION_EXTRACTION } from './lib/section-mapping.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function parseArgs(argv) {
  const args = {
    dryRun: false,
    claudeMdPath: resolve(PROJECT_ROOT, 'CLAUDE.md'),
    verbose: false,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--claude-md':
        args.claudeMdPath = resolve(argv[++i]);
        break;
      case '--verbose':
        args.verbose = true;
        break;
      default:
        console.error(`Unknown option: ${argv[i]}`);
        process.exit(1);
    }
  }

  return args;
}

/**
 * Build migration plan from parsed sections.
 *
 * @param {Array} sections - Parsed sections from claude-md-parser
 * @returns {Array<{section: object, target: object}>} Migration plan entries
 */
export function buildMigrationPlan(sections) {
  const plan = [];

  for (const section of sections) {
    const target = resolveTarget(section);
    if (target.action === 'skip') continue;

    plan.push({ section, target });
  }

  return plan;
}

/**
 * Execute the migration plan against Firebase.
 *
 * @param {Array} plan - Migration plan from buildMigrationPlan
 * @param {object} db - Firebase Realtime Database instance
 * @param {object} options - { dryRun, verbose }
 * @returns {object} Results summary { created, merged, skipped, errors }
 */
export async function executeMigration(plan, db, options = {}) {
  const { dryRun = false, verbose = false } = options;
  const results = { created: [], merged: [], skipped: [], errors: [] };
  const now = new Date().toISOString();

  // Group merge entries by target configId to handle multiple sections → same config
  const mergeGroups = new Map();
  const createEntries = [];

  for (const entry of plan) {
    if (entry.target.action === 'merge') {
      const key = entry.target.configId;
      if (!mergeGroups.has(key)) {
        mergeGroups.set(key, { target: entry.target, sections: [] });
      }
      mergeGroups.get(key).sections.push(entry.section);
    } else {
      createEntries.push(entry);
    }
  }

  // Process merges
  for (const [configId, group] of mergeGroups) {
    try {
      const ref = db.ref(`global/instructions/${configId}`);
      const snapshot = await ref.once('value');

      if (!snapshot.exists()) {
        if (verbose) {
          console.log(`${COLORS.yellow}  WARN${COLORS.reset}  Merge target "${configId}" not found in Firebase — creating instead`);
        }
        // Fall back to create
        const combinedContent = group.sections
          .map(s => `## ${s.name}\n\n${s.content}`)
          .join(MERGE_SEPARATOR);

        if (!dryRun) {
          await ref.set({
            name: group.sections[0].name,
            description: `Migrated from CLAUDE.md (sections: ${group.sections.map(s => s.name).join(', ')})`,
            content: combinedContent,
            category: group.sections[0].category,
            sourceSection: group.sections.map(s => s.name).join(', '),
            createdAt: now,
            createdBy: 'migration-script',
            updatedAt: now,
            updatedBy: 'migration-script',
          });
        }
        results.created.push(configId);
        continue;
      }

      const existing = snapshot.val();
      const newContent = group.sections
        .map(s => `## ${s.name}\n\n${s.content}`)
        .join(MERGE_SEPARATOR);

      // Check for duplicate content (avoid re-merging on re-run)
      if (existing.content && existing.content.includes(newContent.substring(0, 100))) {
        if (verbose) {
          console.log(`${COLORS.dim}  SKIP${COLORS.reset}  "${configId}" — content already merged`);
        }
        results.skipped.push(configId);
        continue;
      }

      const mergedContent = existing.content
        ? `${existing.content}${MERGE_SEPARATOR}${newContent}`
        : newContent;

      if (!dryRun) {
        await ref.update({
          content: mergedContent,
          sourceSection: [existing.sourceSection, ...group.sections.map(s => s.name)]
            .filter(Boolean).join(', '),
          updatedAt: now,
          updatedBy: 'migration-script',
        });
      }
      results.merged.push(configId);
    } catch (error) {
      results.errors.push({ configId, error: error.message });
    }
  }

  // Process creates
  for (const entry of createEntries) {
    const { section, target } = entry;
    const configId = target.configId;

    try {
      const ref = db.ref(`global/instructions/${configId}`);
      const snapshot = await ref.once('value');

      if (snapshot.exists()) {
        if (verbose) {
          console.log(`${COLORS.dim}  SKIP${COLORS.reset}  "${configId}" — already exists`);
        }
        results.skipped.push(configId);
        continue;
      }

      const content = `## ${section.name}\n\n${section.content}`;

      if (!dryRun) {
        await ref.set({
          name: section.name,
          description: target.description || `Migrated from CLAUDE.md section: ${section.name}`,
          content,
          category: target.category || section.category,
          sourceSection: section.name,
          createdAt: now,
          createdBy: 'migration-script',
          updatedAt: now,
          updatedBy: 'migration-script',
        });
      }
      results.created.push(configId);
    } catch (error) {
      results.errors.push({ configId, error: error.message });
    }
  }

  return results;
}

/**
 * Print a summary of the migration plan (dry-run mode).
 */
function printPlan(plan) {
  console.log(`\n${COLORS.bold}Migration Plan${COLORS.reset}`);
  console.log(`${'─'.repeat(70)}`);

  const merges = plan.filter(e => e.target.action === 'merge');
  const creates = plan.filter(e => e.target.action === 'create');

  if (merges.length > 0) {
    console.log(`\n${COLORS.yellow}  MERGE${COLORS.reset} (${merges.length} sections → existing configs):`);
    for (const { section, target } of merges) {
      console.log(`    "${section.name}" → ${target.configId}`);
    }
  }

  if (creates.length > 0) {
    console.log(`\n${COLORS.green}  CREATE${COLORS.reset} (${creates.length} new configs):`);
    for (const { section, target } of creates) {
      console.log(`    "${section.name}" → ${target.configId} [${target.category || section.category}]`);
    }
  }

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  Total: ${plan.length} sections (${merges.length} merge, ${creates.length} create)`);
}

/**
 * Print execution results.
 */
function printResults(results, dryRun) {
  console.log(`\n${COLORS.bold}${dryRun ? 'Dry Run Results' : 'Migration Results'}${COLORS.reset}`);
  console.log(`${'─'.repeat(70)}`);

  if (results.created.length > 0) {
    console.log(`${COLORS.green}  Created:${COLORS.reset} ${results.created.join(', ')}`);
  }
  if (results.merged.length > 0) {
    console.log(`${COLORS.cyan}  Merged:${COLORS.reset}  ${results.merged.join(', ')}`);
  }
  if (results.skipped.length > 0) {
    console.log(`${COLORS.dim}  Skipped: ${results.skipped.join(', ')}${COLORS.reset}`);
  }
  if (results.errors.length > 0) {
    console.log(`${COLORS.red}  Errors:${COLORS.reset}`);
    for (const { configId, error } of results.errors) {
      console.log(`    ${configId}: ${error}`);
    }
  }

  console.log(`\n  Summary: ${results.created.length} created, ${results.merged.length} merged, ${results.skipped.length} skipped, ${results.errors.length} errors`);

  if (dryRun) {
    console.log(`\n${COLORS.yellow}  This was a dry run. No changes were written to Firebase.${COLORS.reset}`);
    console.log(`  Run without --dry-run to apply changes.`);
  }
}

// --- Main execution ---
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  const args = parseArgs(process.argv);

  // Validate CLAUDE.md exists
  if (!existsSync(args.claudeMdPath)) {
    console.error(`${COLORS.red}Error:${COLORS.reset} CLAUDE.md not found at ${args.claudeMdPath}`);
    process.exit(1);
  }

  console.log(`${COLORS.bold}Planning Game — CLAUDE.md → Guidelines Migration${COLORS.reset}`);
  console.log(`  Source: ${args.claudeMdPath}`);
  console.log(`  Mode:   ${args.dryRun ? 'DRY RUN' : 'LIVE'}`);

  // Read and parse (with subsection extraction for large sections)
  const markdown = readFileSync(args.claudeMdPath, 'utf8');
  const sections = parseSectionsWithExtraction(markdown, {
    extractFrom: SUBSECTION_EXTRACTION,
  });
  console.log(`  Parsed: ${sections.length} sections`);

  // Build plan
  const plan = buildMigrationPlan(sections);
  printPlan(plan);

  if (args.dryRun) {
    // Dry run: just show the plan with fake results
    const results = {
      created: plan.filter(e => e.target.action === 'create').map(e => e.target.configId),
      merged: plan.filter(e => e.target.action === 'merge').map(e => e.target.configId),
      skipped: [],
      errors: [],
    };
    printResults(results, true);
    process.exit(0);
  }

  // Live mode: initialize Firebase
  const { initFirebase, getDatabase } = await import('../firebase-adapter.js');
  initFirebase();
  const db = getDatabase();

  const results = await executeMigration(plan, db, {
    dryRun: false,
    verbose: args.verbose,
  });

  printResults(results, false);
  process.exit(results.errors.length > 0 ? 1 : 0);
}
