#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const firebaseConfigPath = path.resolve(process.cwd(), 'public/firebase-config.js');
const snapshotPath = path.resolve(process.cwd(), 'playwright/.firebase-config.snapshot');

if (fs.existsSync(firebaseConfigPath) && !fs.existsSync(snapshotPath)) {
  fs.writeFileSync(snapshotPath, fs.readFileSync(firebaseConfigPath, 'utf8'));
}

const restoreSnapshot = () => {
  if (fs.existsSync(snapshotPath) && fs.existsSync(firebaseConfigPath)) {
    fs.writeFileSync(firebaseConfigPath, fs.readFileSync(snapshotPath, 'utf8'));
    fs.unlinkSync(snapshotPath);
  }
};

process.on('exit', restoreSnapshot);
process.on('SIGINT', () => {
  restoreSnapshot();
  process.exit(130);
});
process.on('SIGTERM', () => {
  restoreSnapshot();
  process.exit(143);
});

const cli = require.resolve('@playwright/test/cli');
const args = [cli, 'test', ...process.argv.slice(2)];
const child = spawn(process.execPath, args, { stdio: 'inherit', env: process.env });

child.on('exit', (code) => {
  restoreSnapshot();
  process.exit(code ?? 0);
});
