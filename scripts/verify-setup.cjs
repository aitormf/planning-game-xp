#!/usr/bin/env node
/**
 * Verification Script for Planning Game XP
 *
 * Checks that everything is properly configured:
 * - Environment files exist
 * - Firebase connection works
 * - Required dependencies installed
 * - Cloud Functions deployed
 *
 * Usage:
 *   node scripts/verify-setup.js
 *   npm run verify-setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');

class SetupVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  check(name, fn) {
    try {
      const result = fn();
      if (result === true) {
        this.passed.push(name);
        console.log(`  ✅ ${name}`);
      } else if (result === 'warning') {
        this.warnings.push(name);
        console.log(`  ⚠️  ${name}`);
      } else {
        this.errors.push(name);
        console.log(`  ❌ ${name}`);
      }
    } catch (error) {
      this.errors.push(`${name}: ${error.message}`);
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  }

  async run() {
    console.log('\n🔍 Verificando configuración de Planning Game XP...\n');

    // 1. Environment files
    console.log('📁 Archivos de entorno:');
    this.check('.env.dev existe', () => fs.existsSync(path.join(ROOT_DIR, '.env.dev')));
    this.check('.env.prod existe', () => fs.existsSync(path.join(ROOT_DIR, '.env.prod')));
    this.check('functions/.env existe', () => fs.existsSync(path.join(ROOT_DIR, 'functions', '.env')));

    // 2. Environment variables
    console.log('\n🔑 Variables de entorno:');
    this.checkEnvVariables();

    // 3. Dependencies
    console.log('\n📦 Dependencias:');
    this.check('node_modules existe', () => fs.existsSync(path.join(ROOT_DIR, 'node_modules')));
    this.check('functions/node_modules existe', () => {
      if (fs.existsSync(path.join(ROOT_DIR, 'functions', 'node_modules'))) return true;
      return 'warning';
    });

    // 4. Firebase CLI
    console.log('\n🔥 Firebase CLI:');
    this.check('Firebase CLI instalado', () => {
      execSync('firebase --version', { stdio: 'pipe' });
      return true;
    });
    this.check('Firebase project seleccionado', () => {
      try {
        const result = execSync('firebase use', { encoding: 'utf8', stdio: 'pipe', cwd: ROOT_DIR });
        return result.includes('Active Project:');
      } catch {
        return false;
      }
    });

    // 5. Firebase connection
    console.log('\n🌐 Conexión a Firebase:');
    await this.checkFirebaseConnection();

    // 6. Cloud Functions
    console.log('\n☁️  Cloud Functions:');
    this.checkCloudFunctions();

    // Summary
    this.printSummary();
  }

  checkEnvVariables() {
    const requiredVars = [
      'PUBLIC_FIREBASE_API_KEY',
      'PUBLIC_FIREBASE_AUTH_DOMAIN',
      'PUBLIC_FIREBASE_DATABASE_URL',
      'PUBLIC_FIREBASE_PROJECT_ID',
      'PUBLIC_FIREBASE_STORAGE_BUCKET',
      'PUBLIC_SUPER_ADMIN_EMAIL',
    ];

    let envContent = '';
    try {
      envContent = fs.readFileSync(path.join(ROOT_DIR, '.env.prod'), 'utf8');
    } catch {
      try {
        envContent = fs.readFileSync(path.join(ROOT_DIR, '.env.dev'), 'utf8');
      } catch {
        this.errors.push('No se encontró ningún archivo .env');
        return;
      }
    }

    for (const varName of requiredVars) {
      this.check(`${varName} configurado`, () => {
        const regex = new RegExp(`^${varName}=.+`, 'm');
        return regex.test(envContent);
      });
    }
  }

  async checkFirebaseConnection() {
    this.check('Puede listar proyectos Firebase', () => {
      try {
        execSync('firebase projects:list', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    });
  }

  checkCloudFunctions() {
    const requiredFunctions = [
      'addAppAdmin',
      'removeAppAdmin',
      'addAppUploader',
      'removeAppUploader',
      'syncAppAdminClaim',
      'syncAllAppAdminClaims',
    ];

    this.check('Cloud Functions definidas en index.js', () => {
      const indexPath = path.join(ROOT_DIR, 'functions', 'index.js');
      if (!fs.existsSync(indexPath)) return false;
      const content = fs.readFileSync(indexPath, 'utf8');
      return requiredFunctions.every(fn => content.includes(`exports.${fn}`));
    });
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('  RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(50));
    console.log(`\n  ✅ Pasados:    ${this.passed.length}`);
    console.log(`  ⚠️  Warnings:   ${this.warnings.length}`);
    console.log(`  ❌ Errores:    ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      this.errors.forEach(e => console.log(`    - ${e}`));
      console.log('\n  Ejecuta "npm run setup" para corregirlos.');
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log('\n⚠️  Configuración parcial. Algunas funcionalidades pueden no estar disponibles.');
      process.exit(0);
    } else {
      console.log('\n✅ ¡Todo configurado correctamente!');
      process.exit(0);
    }
  }
}

const verifier = new SetupVerifier();
verifier.run().catch(console.error);
