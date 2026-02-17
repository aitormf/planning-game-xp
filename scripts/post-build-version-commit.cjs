#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.join(__dirname, '..');
const versionJsonPath = path.join(repoRoot, 'version.json');
const filesToTrack = [
  'version.json',
  'public/js/version.js',
  'package.json',
  'CHANGELOG.md'
];

function hasChanges(file) {
  try {
    const output = execSync(`git status --porcelain ${file}`, {
      cwd: repoRoot,
      encoding: 'utf8'
    }).trim();
    return Boolean(output);
  } catch (error) {
    console.error(`⚠️  No se pudo comprobar cambios para ${file}:`, error.message);
    return false;
  }
}

function stageFiles(files) {
  execSync(`git add ${files.join(' ')}`, { cwd: repoRoot, stdio: 'inherit' });
}

function commitVersion(version) {
  const message = `chore: bump client version to ${version}`;
  try {
    execSync(`git commit -m "${message}"`, { cwd: repoRoot, stdio: 'inherit' });
    console.log(`✅ Commit creado: ${message}`);
    return true;
  } catch (error) {
    if (error.status === 1) {
      console.log('ℹ️  No se creó commit (probablemente sin cambios stageados).');
    } else {
      console.error('❌ Error al ejecutar el commit:', error.message);
    }
    return false;
  }
}

function pushChanges() {
  try {
    execSync('git push', { cwd: repoRoot, stdio: 'inherit' });
    console.log('🚀 git push ejecutado correctamente.');
  } catch (error) {
    console.error('❌ Error al hacer git push:', error.message);
  }
}

function main() {
  const changedFiles = filesToTrack.filter(hasChanges);
  if (changedFiles.length === 0) {
    console.log('📦 No hay cambios de versión pendientes de commit.');
    return;
  }

  if (!fs.existsSync(versionJsonPath)) {
    console.error('❌ version.json no existe; no se puede leer la versión actual.');
    return;
  }

  const { version } = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));

  stageFiles(changedFiles);
  const committed = commitVersion(version);
  if (committed) {
    pushChanges();
  }
}

main();
