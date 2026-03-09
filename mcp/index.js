#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { basename } from 'path';
import { initFirebase } from './firebase-adapter.js';
import { createMcpServer } from './register-tools.js';
import { checkVersionAtStartup, getLocalVersion } from './version-check.js';

// ── CLI flags ──
const arg = process.argv[2];
if (arg === '--version' || arg === '-v') {
  console.log(getLocalVersion());
  process.exit(0);
}
if (arg === '--help' || arg === '-h') {
  console.log(`planning-game-mcp v${getLocalVersion()}`);
  console.log('');
  console.log('Usage: planning-game-mcp [options]');
  console.log('');
  console.log('Options:');
  console.log('  -v, --version  Show version');
  console.log('  -h, --help     Show this help');
  console.log('');
  console.log('Environment variables:');
  console.log('  GOOGLE_APPLICATION_CREDENTIALS  Path to serviceAccountKey.json');
  console.log('  FIREBASE_DATABASE_URL           Firebase RTDB URL (optional)');
  console.log('  MCP_INSTANCE_DIR                Instance directory (multi-instance)');
  process.exit(0);
}

/**
 * Derive instance name from MCP_INSTANCE_DIR (last path segment).
 * Returns null if no instance directory is configured.
 */
function getInstanceName() {
  const instanceDir = process.env.MCP_INSTANCE_DIR;
  if (!instanceDir) return null;
  return basename(instanceDir);
}

// ── Pre-flight: Initialize Firebase ──
try {
  initFirebase();
} catch (err) {
  process.stderr.write(`\n[MCP] Failed to initialize Firebase: ${err.message}\n`);
  process.stderr.write('[MCP] The MCP server cannot start without a valid Firebase connection.\n');
  process.stderr.write('[MCP] Run pg_doctor (or npm run mcp:test) to diagnose the issue.\n\n');
  process.exit(1);
}

// Check for updates at startup (non-blocking, logs to stderr if update available)
checkVersionAtStartup().catch(() => {});

// Derive server name from instance directory
const instanceName = getInstanceName();
const serverName = instanceName ? `planning-game-${instanceName}` : 'planning-gamexp';

// Create and start the MCP server
try {
  const server = createMcpServer(serverName);
  const transport = new StdioServerTransport();
  await server.connect(transport);
} catch (err) {
  process.stderr.write(`\n[MCP] Failed to start MCP server: ${err.message}\n`);
  process.exit(1);
}
