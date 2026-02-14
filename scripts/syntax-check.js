#!/usr/bin/env node
/**
 * Syntax check for JavaScript files
 * Verifies that all JS files in public/js have valid syntax before commit/build
 */

import { execSync } from 'child_process';
import { globSync } from 'glob';
import path from 'path';

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkSyntax() {
  log('blue', '🔍 Verificando sintaxis de archivos JavaScript...');

  // Get all JS files in public/js
  const jsFiles = globSync('public/js/**/*.js', {
    ignore: ['**/node_modules/**', '**/*.min.js']
  });

  if (jsFiles.length === 0) {
    log('yellow', '⚠️  No se encontraron archivos JS para verificar');
    return true;
  }

  log('blue', `   Verificando ${jsFiles.length} archivos...`);

  const errors = [];

  for (const file of jsFiles) {
    try {
      // Use node --check to verify syntax
      execSync(`node --check "${file}"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (error) {
      // Extract meaningful error message
      const stderr = error.stderr || error.message;
      errors.push({
        file,
        error: stderr.trim()
      });
    }
  }

  if (errors.length > 0) {
    log('red', `\n❌ Se encontraron ${errors.length} error(es) de sintaxis:\n`);

    for (const { file, error } of errors) {
      log('red', `📄 ${file}`);
      console.log(`   ${error.split('\n').join('\n   ')}\n`);
    }

    return false;
  }

  log('green', `✅ Sintaxis verificada: ${jsFiles.length} archivos OK`);
  return true;
}

// Run check
const success = checkSyntax();
process.exit(success ? 0 : 1);
