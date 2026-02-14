#!/usr/bin/env node

/**
 * CSS Token Migration Script
 *
 * This script helps migrate hardcoded CSS values to design tokens.
 * It scans files and suggests replacements based on a mapping table.
 *
 * Usage:
 *   node scripts/migrate-css-tokens.js [--dry-run] [--file <path>] [--dir <path>]
 *
 * Options:
 *   --dry-run    Show what would be changed without modifying files
 *   --file       Process a specific file
 *   --dir        Process all files in a directory (default: public/js)
 *
 * Example:
 *   node scripts/migrate-css-tokens.js --dry-run --file public/js/ui/styles/notes-styles.js
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color mappings: hardcoded value -> CSS variable
const COLOR_MAPPINGS = {
  // Brand colors
  '#4a9eff': 'var(--brand-primary)',
  '#3a8eef': 'var(--brand-primary-hover)',
  '#4A9EFF': 'var(--brand-primary)',
  '#ec3e95': 'var(--brand-secondary)',
  '#EC3E95': 'var(--brand-secondary)',
  '#d81b60': 'var(--brand-secondary-hover)',

  // Functional colors
  '#4caf50': 'var(--color-success)',
  '#4CAF50': 'var(--color-success)',
  '#43a047': 'var(--color-success-hover)',
  '#28a745': 'var(--color-success)',
  '#ff9800': 'var(--color-warning)',
  '#FF9800': 'var(--color-warning)',
  '#f57c00': 'var(--color-warning-hover)',
  '#ffc107': 'var(--color-warning)',
  '#d9534f': 'var(--color-error)',
  '#D9534F': 'var(--color-error)',
  '#c9302c': 'var(--color-error-hover)',
  '#dc3545': 'var(--color-error)',
  '#17a2b8': 'var(--color-info)',
  '#138496': 'var(--color-info-hover)',

  // Status colors
  '#449bd3': 'var(--status-todo)',
  '#cce500': 'var(--status-in-progress)',
  '#CCE500': 'var(--status-in-progress)',
  '#ff6600': 'var(--status-to-validate)',
  '#FF6600': 'var(--status-to-validate)',
  '#d4edda': 'var(--status-done)',
  '#f8d7da': 'var(--status-blocked)',

  // Gray scale
  '#ffffff': 'var(--bg-primary)',
  '#FFFFFF': 'var(--bg-primary)',
  '#fff': 'var(--bg-primary)',
  '#FFF': 'var(--bg-primary)',
  'white': 'var(--bg-primary)',
  '#f8f9fa': 'var(--bg-secondary)',
  '#F8F9FA': 'var(--bg-secondary)',
  '#f1f1f1': 'var(--bg-tertiary)',
  '#e9ecef': 'var(--bg-muted)',
  '#e0e0e0': 'var(--border-default)',
  '#E0E0E0': 'var(--border-default)',
  '#dee2e6': 'var(--bg-muted)',

  // Text colors
  '#333333': 'var(--text-primary)',
  '#333': 'var(--text-primary)',
  '#666666': 'var(--text-secondary)',
  '#666': 'var(--text-secondary)',
  '#999999': 'var(--text-muted)',
  '#999': 'var(--text-muted)',
  '#6c757d': 'var(--text-muted)',

  // Tab colors
  '#2196f3': 'var(--tab-acceptance-criteria-color)',
  '#2196F3': 'var(--tab-acceptance-criteria-color)',
};

// Size/spacing mappings
const SIZE_MAPPINGS = {
  '0.2rem': 'var(--spacing-xs)',
  '0.5rem': 'var(--spacing-sm)',
  '1rem': 'var(--spacing-md)',
  '1.5rem': 'var(--spacing-lg)',
  '2rem': 'var(--spacing-xl)',
  '4px': 'var(--radius-sm)',
  '6px': 'var(--radius-md)',
  '8px': 'var(--radius-lg)',
};

// Font size mappings
const FONT_MAPPINGS = {
  '0.75rem': 'var(--font-size-xs)',
  '0.8rem': 'var(--font-size-sm)',
  '1rem': 'var(--font-size-base)',
  '1.1rem': 'var(--font-size-lg)',
  '1.2rem': 'var(--font-size-xl)',
  '1.3rem': 'var(--font-size-2xl)',
  '1.5rem': 'var(--font-size-3xl)',
};

// Files to skip
const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'tokens', // Don't migrate the tokens themselves
  '.test.',
  '.spec.',
];

// File extensions to process
const EXTENSIONS = ['.js', '.css', '.astro', '.html'];

function shouldSkipFile(filePath) {
  return SKIP_PATTERNS.some((pattern) => filePath.includes(pattern));
}

function findReplacements(content) {
  const replacements = [];
  const allMappings = { ...COLOR_MAPPINGS };

  for (const [hardcoded, token] of Object.entries(allMappings)) {
    // Create a regex that matches the value in various contexts
    const escapedValue = hardcoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match in CSS properties like: color: #fff; or background: #4a9eff
    const regex = new RegExp(`(:\\s*)(${escapedValue})(\\s*[;\\}\\n])`, 'gi');

    let match;
    while ((match = regex.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      replacements.push({
        line,
        original: hardcoded,
        replacement: token,
        context: content.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20).trim(),
      });
    }
  }

  return replacements;
}

function applyReplacements(content, mappings) {
  let result = content;

  for (const [hardcoded, token] of Object.entries(mappings)) {
    const escapedValue = hardcoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Only replace in CSS value contexts (after : and before ; or })
    const regex = new RegExp(`(:\\s*)(${escapedValue})(\\s*[;\\}\\n])`, 'gi');
    result = result.replace(regex, `$1${token}$3`);
  }

  return result;
}

function processFile(filePath, dryRun = true) {
  if (shouldSkipFile(filePath)) {
    return { skipped: true };
  }

  const ext = extname(filePath);
  if (!EXTENSIONS.includes(ext)) {
    return { skipped: true };
  }

  const content = readFileSync(filePath, 'utf-8');
  const replacements = findReplacements(content);

  if (replacements.length === 0) {
    return { replacements: 0 };
  }

  console.log(`\n📄 ${filePath}`);
  console.log(`   Found ${replacements.length} potential replacements:`);

  for (const r of replacements) {
    console.log(`   Line ${r.line}: ${r.original} → ${r.replacement}`);
    console.log(`      Context: ...${r.context}...`);
  }

  if (!dryRun) {
    const newContent = applyReplacements(content, COLOR_MAPPINGS);
    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`   ✅ Applied ${replacements.length} replacements`);
  } else {
    console.log(`   ℹ️  Run without --dry-run to apply changes`);
  }

  return { replacements: replacements.length };
}

function processDirectory(dirPath, dryRun = true) {
  let totalReplacements = 0;
  let filesProcessed = 0;

  function walkDir(dir) {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        if (!shouldSkipFile(filePath)) {
          walkDir(filePath);
        }
      } else {
        const result = processFile(filePath, dryRun);
        if (!result.skipped) {
          filesProcessed++;
          totalReplacements += result.replacements || 0;
        }
      }
    }
  }

  walkDir(dirPath);

  return { filesProcessed, totalReplacements };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  let targetPath = join(__dirname, '..', 'public', 'js');

  const fileIndex = args.indexOf('--file');
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    targetPath = args[fileIndex + 1];
    console.log(`🔍 Processing file: ${targetPath}`);
    console.log(dryRun ? '📋 DRY RUN - no changes will be made' : '⚡ LIVE RUN - files will be modified');
    processFile(targetPath, dryRun);
  } else {
    const dirIndex = args.indexOf('--dir');
    if (dirIndex !== -1 && args[dirIndex + 1]) {
      targetPath = args[dirIndex + 1];
    }

    console.log(`🔍 Scanning directory: ${targetPath}`);
    console.log(dryRun ? '📋 DRY RUN - no changes will be made' : '⚡ LIVE RUN - files will be modified');

    const result = processDirectory(targetPath, dryRun);

    console.log('\n📊 Summary:');
    console.log(`   Files processed: ${result.filesProcessed}`);
    console.log(`   Total replacements: ${result.totalReplacements}`);
  }
}

main();
