#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Archivos que NO deben incluirse en las actualizaciones
const EXCLUDE_FILES = [
  'firebase-config.js',
  'firebase-messaging-sw.js',
  'client-config.js',
  'theme-overrides.css',
  'branding.json',
  '.env',
  '.env.*',
  'kanban-status-colors.css' // Este se genera dinámicamente
];

// Directorios a excluir completamente
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'tests',
  'playwright',
  'coverage'
];

// Archivos de configuración que se mantienen separados
const CONFIG_FILES = [
  'public/firebase-config.js',
  'public/firebase-messaging-sw.js',
  'public/js/config/theme-config.js',
  'public/css/kanban-status-colors.css'
];

async function createUpdatePackage() {
  console.log('📦 Creating update package...');
  
  const distDir = path.join(rootDir, 'dist');
  const distCoreDir = path.join(rootDir, 'dist-core');
  const distConfigDir = path.join(rootDir, 'dist-config');
  const packageDir = path.join(rootDir, 'update-packages');
  
  try {
    // Limpiar directorios anteriores
    await fs.rm(distCoreDir, { recursive: true, force: true });
    await fs.rm(distConfigDir, { recursive: true, force: true });
    await fs.mkdir(distCoreDir, { recursive: true });
    await fs.mkdir(distConfigDir, { recursive: true });
    await fs.mkdir(packageDir, { recursive: true });
    
    // Copiar archivos core (excluyendo configuraciones)
    console.log('📋 Copying core files...');
    await copyDirectory(distDir, distCoreDir, (filePath) => {
      const relativePath = path.relative(distDir, filePath);
      const fileName = path.basename(filePath);
      
      // Excluir archivos de configuración
      if (EXCLUDE_FILES.some(exclude => fileName.includes(exclude))) {
        return false;
      }
      
      // Excluir directorios
      if (EXCLUDE_DIRS.some(dir => relativePath.includes(dir))) {
        return false;
      }
      
      return true;
    });
    
    // Copiar archivos de configuración por separado
    console.log('📋 Copying config files...');
    for (const configFile of CONFIG_FILES) {
      const srcPath = path.join(rootDir, configFile);
      const destPath = path.join(distConfigDir, path.basename(configFile));
      
      try {
        await fs.copyFile(srcPath, destPath);
        console.log(`  ✓ ${path.basename(configFile)}`);
      } catch (error) {
        console.log(`  ⚠️  ${path.basename(configFile)} not found`);
      }
    }
    
    // Obtener versión del package.json
    const packageJson = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
    const version = packageJson.version || '1.0.0';
    
    // Crear manifest de actualización
    const manifest = {
      version,
      date: new Date().toISOString(),
      type: 'core-update',
      files: await getFileList(distCoreDir),
      excludedFiles: EXCLUDE_FILES,
      checksum: await generateChecksum(distCoreDir)
    };
    
    await fs.writeFile(
      path.join(distCoreDir, 'update-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    // Crear archivo ZIP
    const zipName = `planning-game-update-${version}-${Date.now()}.zip`;
    const zipPath = path.join(packageDir, zipName);
    
    console.log('📦 Creating ZIP package...');
    await execAsync(`cd ${distCoreDir} && zip -r ${zipPath} .`);
    
    console.log(`✅ Update package created: ${zipName}`);
    console.log(`📁 Location: ${zipPath}`);
    
    // Información sobre el paquete
    const stats = await fs.stat(zipPath);
    console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      path: zipPath,
      name: zipName,
      version,
      manifest
    };
    
  } catch (error) {
    console.error('❌ Error creating update package:', error);
    throw error;
  }
}

async function copyDirectory(src, dest, filter) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (!filter || filter(srcPath)) {
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath, filter);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

async function getFileList(dir, baseDir = dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...await getFileList(fullPath, baseDir));
    } else {
      files.push(path.relative(baseDir, fullPath));
    }
  }
  
  return files;
}

async function generateChecksum(dir) {
  // Simple checksum basado en la lista de archivos y sus tamaños
  const files = await getFileList(dir);
  let checksum = '';
  
  for (const file of files.sort()) {
    const stats = await fs.stat(path.join(dir, file));
    checksum += `${file}:${stats.size};`;
  }
  
  // Generar hash simple
  return Buffer.from(checksum).toString('base64').substring(0, 16);
}

// Ejecutar si se llama directamente
if (process.argv[1] === __filename) {
  createUpdatePackage()
    .then(result => {
      console.log('\n📄 Manifest:', JSON.stringify(result.manifest, null, 2));
    })
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

export { createUpdatePackage, EXCLUDE_FILES, CONFIG_FILES };