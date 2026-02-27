#!/usr/bin/env node

/**
 * Build MCP Standalone Package
 *
 * Generates a self-contained dist-mcp/ directory that can be distributed
 * independently of the main Planning Game web app.
 *
 * What it does:
 * 1. Copies mcp/ source files to dist-mcp/
 * 2. Copies shared/ to dist-mcp/lib/shared/
 * 3. Rewrites ../../shared/ imports to ./lib/shared/ (or ../lib/shared/)
 * 4. Generates a standalone package.json
 * 5. Copies Dockerfile adapted for standalone use
 */

import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const MCP_SRC = join(ROOT, 'mcp');
const SHARED_SRC = join(ROOT, 'shared');
const DIST = join(ROOT, 'dist-mcp');

function clean() {
  if (existsSync(DIST)) {
    rmSync(DIST, { recursive: true });
  }
  mkdirSync(DIST, { recursive: true });
}

function copyMcpSource() {
  // Copy JS files (root level)
  for (const file of readdirSync(MCP_SRC)) {
    const src = join(MCP_SRC, file);
    const stat = statSync(src);

    // Skip node_modules, tests, and non-essential files
    if (['node_modules', 'tests', 'docker-compose.yml'].includes(file)) continue;

    if (stat.isFile()) {
      cpSync(src, join(DIST, file));
    }
  }

  // Copy subdirectories (tools/, services/)
  for (const dir of ['tools', 'services']) {
    const srcDir = join(MCP_SRC, dir);
    if (existsSync(srcDir)) {
      cpSync(srcDir, join(DIST, dir), { recursive: true });
    }
  }
}

function copyShared() {
  const sharedDist = join(DIST, 'lib', 'shared');
  mkdirSync(sharedDist, { recursive: true });

  for (const file of readdirSync(SHARED_SRC)) {
    if (file.endsWith('.js')) {
      cpSync(join(SHARED_SRC, file), join(sharedDist, file));
    }
  }

  // Ensure shared/ is treated as ESM
  writeFileSync(join(sharedDist, 'package.json'), '{"type":"module"}\n');
}

function rewriteImports(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      rewriteImports(fullPath);
      continue;
    }

    if (!entry.endsWith('.js')) continue;

    let content = readFileSync(fullPath, 'utf-8');
    const relDir = relative(DIST, dirname(fullPath));

    // Calculate the correct relative path from this file to lib/shared/
    const depth = relDir ? relDir.split('/').length : 0;
    const prefix = depth > 0 ? '../'.repeat(depth) : './';
    const sharedPath = `${prefix}lib/shared`;

    // Replace ../../shared/ imports with the correct relative path
    const modified = content.replace(
      /from\s+['"]\.\.\/\.\.\/shared\//g,
      `from '${sharedPath}/`
    );

    if (modified !== content) {
      writeFileSync(fullPath, modified);
    }
  }
}

function fixVersionCheck() {
  // version-check.js uses ROOT_DIR = join(__dirname, '..') to find mcp/package.json
  // In standalone mode, package.json is in the same directory
  const vcPath = join(DIST, 'version-check.js');
  if (!existsSync(vcPath)) return;

  let content = readFileSync(vcPath, 'utf-8');
  content = content.replace(
    "const ROOT_DIR = join(__dirname, '..');",
    "const ROOT_DIR = __dirname;"
  );
  content = content.replace(
    "const packagePath = join(ROOT_DIR, 'mcp', 'package.json');",
    "const packagePath = join(ROOT_DIR, 'package.json');"
  );
  writeFileSync(vcPath, content);
}

function generatePackageJson() {
  const original = JSON.parse(readFileSync(join(MCP_SRC, 'package.json'), 'utf-8'));

  const standalone = {
    name: 'planning-game-mcp',
    version: original.version,
    description: 'Planning Game MCP Server - Standalone distribution. Agile project management (XP) via Model Context Protocol.',
    type: 'module',
    main: 'index.js',
    bin: {
      'planning-game-mcp': './index.js'
    },
    scripts: {
      start: 'node index.js'
    },
    author: original.author || 'Geniova',
    license: original.license || 'MIT',
    dependencies: original.dependencies,
    engines: {
      node: '>=20.0.0'
    }
  };

  writeFileSync(join(DIST, 'package.json'), JSON.stringify(standalone, null, 2) + '\n');
}

function generateDockerfile() {
  const dockerfile = `FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

# serviceAccountKey.json and mcp.user.json are mounted as volumes, NOT baked in

ENTRYPOINT ["node", "index.js"]
`;
  writeFileSync(join(DIST, 'Dockerfile'), dockerfile);
}

function copyReadme() {
  const readmeSrc = join(MCP_SRC, 'README.md');
  if (existsSync(readmeSrc)) {
    cpSync(readmeSrc, join(DIST, 'README.md'));
  }
}

// Main
console.log('Building MCP standalone package...');
console.log(`  Source: ${MCP_SRC}`);
console.log(`  Shared: ${SHARED_SRC}`);
console.log(`  Output: ${DIST}`);
console.log();

clean();
console.log('  [1/7] Copying MCP source...');
copyMcpSource();

console.log('  [2/7] Copying shared/ to lib/shared/...');
copyShared();

console.log('  [3/7] Rewriting imports...');
rewriteImports(DIST);

console.log('  [4/7] Fixing version-check paths...');
fixVersionCheck();

console.log('  [5/7] Generating standalone package.json...');
generatePackageJson();

console.log('  [6/7] Generating Dockerfile...');
generateDockerfile();

console.log('  [7/7] Copying README...');
copyReadme();

// Summary
const fileCount = readdirSync(DIST, { recursive: true }).length;
console.log();
console.log(`Done! ${fileCount} files written to dist-mcp/`);
console.log();
console.log('To use:');
console.log('  cd dist-mcp');
console.log('  npm install');
console.log('  GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node index.js');
