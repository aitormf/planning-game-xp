#!/usr/bin/env node
/**
 * Interactive Setup Script for Planning Game XP
 *
 * This script guides you through the complete setup process:
 * 1. Firebase project configuration
 * 2. Environment variables
 * 3. Microsoft Graph API (for emails)
 * 4. First App Admin
 * 5. Optional: MCP Server installation
 *
 * Usage:
 *   node scripts/setup.js
 *   npm run setup
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, spawn } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const ENV_TEMPLATE = {
  client: [
    { key: 'PUBLIC_FIREBASE_API_KEY', desc: 'Firebase API Key', required: true },
    { key: 'PUBLIC_FIREBASE_AUTH_DOMAIN', desc: 'Firebase Auth Domain (ej: tu-proyecto.firebaseapp.com)', required: true },
    { key: 'PUBLIC_FIREBASE_DATABASE_URL', desc: 'Firebase Realtime Database URL', required: true },
    { key: 'PUBLIC_FIREBASE_PROJECT_ID', desc: 'Firebase Project ID', required: true },
    { key: 'PUBLIC_FIREBASE_STORAGE_BUCKET', desc: 'Firebase Storage Bucket (ej: tu-proyecto.firebasestorage.app)', required: true },
    { key: 'PUBLIC_FIREBASE_MESSAGING_SENDER_ID', desc: 'Firebase Messaging Sender ID', required: true },
    { key: 'PUBLIC_FIREBASE_APP_ID', desc: 'Firebase App ID', required: true },
    { key: 'PUBLIC_FIREBASE_MEASUREMENT_ID', desc: 'Firebase Measurement ID (Google Analytics)', required: false },
    { key: 'PUBLIC_FIREBASE_VAPID_KEY', desc: 'Firebase VAPID Key (para push notifications)', required: false },
    { key: 'PUBLIC_SUPER_ADMIN_EMAIL', desc: 'Email del Super Admin', required: true },
    { key: 'PUBLIC_ORG_NAME', desc: 'Nombre de la organización/marca (ej: GENIOVA)', required: false },
    { key: 'PUBLIC_AUTH_PROVIDER', desc: 'Auth provider (google/microsoft/github/gitlab)', required: true, default: 'google' },
  ],
  functions: [
    { key: 'PUBLIC_SUPER_ADMIN_EMAIL', desc: 'Email del Super Admin (mismo que arriba)', required: true },
    { key: 'MS_CLIENT_ID', desc: 'Microsoft Azure Client ID (para emails)', required: false },
    { key: 'MS_CLIENT_SECRET', desc: 'Microsoft Azure Client Secret', required: false },
    { key: 'MS_TENANT_ID', desc: 'Microsoft Azure Tenant ID', required: false },
    { key: 'MS_FROM_EMAIL', desc: 'Email remitente para notificaciones', required: false },
  ]
};

class SetupWizard {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.config = {
      client: {},
      functions: {}
    };
  }

  async question(prompt, defaultValue = '') {
    return new Promise((resolve) => {
      const defaultText = defaultValue ? ` [${defaultValue}]` : '';
      this.rl.question(`${prompt}${defaultText}: `, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  async confirm(prompt, defaultYes = true) {
    const suffix = defaultYes ? ' [S/n]' : ' [s/N]';
    const answer = await this.question(prompt + suffix);
    if (!answer) return defaultYes;
    return answer.toLowerCase().startsWith('s') || answer.toLowerCase().startsWith('y');
  }

  print(msg) {
    console.log(msg);
  }

  printHeader(title) {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${title}`);
    console.log('='.repeat(60) + '\n');
  }

  printStep(step, total, description) {
    console.log(`\n[${step}/${total}] ${description}\n`);
  }

  async run() {
    this.printHeader('🎮 Planning Game XP - Setup Wizard');
    this.print('Este asistente te guiará a través de la configuración completa.\n');
    this.print('Necesitarás:');
    this.print('  - Un proyecto de Firebase creado');
    this.print('  - (Opcional) Credenciales de Microsoft Azure para emails');
    this.print('  - (Opcional) API Key de OpenAI para IA\n');

    if (!await this.confirm('¿Deseas continuar?')) {
      this.print('\nSetup cancelado.');
      this.rl.close();
      return;
    }

    const totalSteps = 8;

    // Step 1: Check prerequisites
    this.printStep(1, totalSteps, 'Verificando prerequisitos...');
    await this.checkPrerequisites();

    // Step 2: Auth provider selection
    this.printStep(2, totalSteps, 'Selección de proveedor de autenticación');
    await this.configureAuth();

    // Step 3: Firebase configuration
    this.printStep(3, totalSteps, 'Configuración de Firebase');
    await this.configureFirebase();

    // Step 4: Environment files
    this.printStep(4, totalSteps, 'Generando archivos de entorno');
    await this.generateEnvFiles();

    // Step 5: Email service (optional)
    this.printStep(5, totalSteps, 'Configuración de servicio de emails (opcional)');
    await this.configureMicrosoftGraph();

    // Step 6: Deploy
    this.printStep(6, totalSteps, 'Despliegue inicial');
    await this.deploy();

    // Step 7: First App Admin
    this.printStep(7, totalSteps, 'Configuración del primer App Admin');
    await this.setupFirstAdmin();

    // Step 8: MCP Server (optional)
    this.printStep(8, totalSteps, 'MCP Server (opcional)');
    await this.setupMCP();

    // Done
    this.printHeader('✅ Setup completado!');
    this.printNextSteps();

    this.rl.close();
  }

  async checkPrerequisites() {
    const checks = [
      { name: 'Node.js', cmd: 'node --version', required: true },
      { name: 'npm', cmd: 'npm --version', required: true },
      { name: 'Firebase CLI', cmd: 'firebase --version', required: true },
      { name: 'gcloud CLI', cmd: 'gcloud --version', required: false },
    ];

    let allPassed = true;

    for (const check of checks) {
      try {
        const version = execSync(check.cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim().split('\n')[0];
        this.print(`  ✅ ${check.name}: ${version}`);
      } catch {
        if (check.required) {
          this.print(`  ❌ ${check.name}: NO ENCONTRADO (requerido)`);
          allPassed = false;
        } else {
          this.print(`  ⚠️  ${check.name}: no encontrado (opcional)`);
        }
      }
    }

    if (!allPassed) {
      this.print('\n❌ Faltan prerequisitos requeridos. Instálalos antes de continuar.');
      this.print('\nPara instalar Firebase CLI: npm install -g firebase-tools');
      process.exit(1);
    }
  }

  async configureAuth() {
    this.print('Elige el proveedor de autenticación OAuth.\n');
    this.print('  1. Google (recomendado - más fácil de configurar)');
    this.print('  2. Microsoft (Azure AD - para organizaciones Microsoft 365)');
    this.print('  3. GitHub (para equipos de desarrollo)');
    this.print('  4. GitLab (OIDC - para instancias self-hosted)\n');

    const choice = await this.question('Selecciona [1-4]', '1');
    const providers = { '1': 'google', '2': 'microsoft', '3': 'github', '4': 'gitlab' };
    const provider = providers[choice] || 'google';

    this.config.client['PUBLIC_AUTH_PROVIDER'] = provider;

    const instructions = {
      google: [
        '  → Ve a Firebase Console → Authentication → Sign-in method',
        '  → Habilita "Google" como proveedor',
        '  → No necesitas configuración adicional'
      ],
      microsoft: [
        '  → Crea una App Registration en Azure Portal',
        '  → Configura redirect URI: https://tu-proyecto.firebaseapp.com/__/auth/handler',
        '  → Habilita Microsoft en Firebase Console → Authentication → Sign-in method'
      ],
      github: [
        '  → Ve a GitHub Settings → Developer settings → OAuth Apps → New OAuth App',
        '  → Authorization callback URL: https://tu-proyecto.firebaseapp.com/__/auth/handler',
        '  → Habilita GitHub en Firebase Console con Client ID y Secret'
      ],
      gitlab: [
        '  → Configura OIDC en tu instancia GitLab',
        '  → Habilita OpenID Connect en Firebase Console → Authentication → Sign-in method'
      ]
    };

    this.print(`\nProveedor seleccionado: ${provider.toUpperCase()}`);
    this.print('Instrucciones para configurar en Firebase:\n');
    instructions[provider].forEach(line => this.print(line));

    if (provider === 'gitlab') {
      const issuer = await this.question('\n  URL de tu instancia GitLab', 'https://gitlab.com');
      this.config.client['PUBLIC_GITLAB_ISSUER_URL'] = issuer;
    }

    this.print('');
  }

  async configureFirebase() {
    this.print('Necesitas los datos de configuración de tu proyecto Firebase.');
    this.print('Los encuentras en: Firebase Console → Project Settings → Your apps\n');

    // Check if already logged in
    try {
      execSync('firebase projects:list', { stdio: 'pipe' });
      this.print('✅ Ya estás autenticado en Firebase\n');
    } catch {
      this.print('Necesitas autenticarte en Firebase...\n');
      if (await this.confirm('¿Ejecutar firebase login?')) {
        execSync('firebase login', { stdio: 'inherit' });
      }
    }

    // Get Firebase config values
    for (const item of ENV_TEMPLATE.client) {
      const value = await this.question(`  ${item.desc}${item.required ? ' *' : ''}`);
      if (item.required && !value) {
        this.print(`    ⚠️  Este campo es requerido`);
        const retry = await this.question(`  ${item.desc} *`);
        this.config.client[item.key] = retry;
      } else {
        this.config.client[item.key] = value;
      }
    }

    // Copy super admin email to functions config
    this.config.functions['PUBLIC_SUPER_ADMIN_EMAIL'] = this.config.client['PUBLIC_SUPER_ADMIN_EMAIL'];
  }

  async generateEnvFiles() {
    const environments = ['dev', 'pre', 'prod'];

    for (const env of environments) {
      const envPath = path.join(ROOT_DIR, `.env.${env}`);
      let content = '# Firebase Configuration\n';

      for (const [key, value] of Object.entries(this.config.client)) {
        if (value) {
          content += `${key}=${value}\n`;
        }
      }

      // Add emulator config for dev
      if (env === 'dev') {
        content += '\n# Emulators (development only)\n';
        content += 'USE_FIREBASE_EMULATOR=true\n';
        content += 'FIREBASE_DATABASE_EMULATOR_HOST=localhost:9001\n';
        content += 'FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199\n';
        content += 'FIRESTORE_EMULATOR_HOST=localhost:8081\n';
      }

      fs.writeFileSync(envPath, content);
      this.print(`  ✅ Creado: .env.${env}`);
    }

    // Functions .env
    const functionsEnvPath = path.join(ROOT_DIR, 'functions', '.env');
    let functionsContent = '# Cloud Functions Environment\n';
    for (const [key, value] of Object.entries(this.config.functions)) {
      if (value) {
        functionsContent += `${key}=${value}\n`;
      }
    }
    fs.writeFileSync(functionsEnvPath, functionsContent);
    this.print(`  ✅ Creado: functions/.env`);
  }

  async configureMicrosoftGraph() {
    this.print('Microsoft Graph permite enviar emails de notificación.');
    this.print('Si no lo configuras ahora, las notificaciones por email no funcionarán.\n');

    if (!await this.confirm('¿Deseas configurar Microsoft Graph?', false)) {
      this.print('  ⏭️  Saltando configuración de Microsoft Graph');
      return;
    }

    this.print('\nNecesitas crear una App Registration en Azure Portal:');
    this.print('  1. Ir a portal.azure.com');
    this.print('  2. Azure Active Directory → App registrations');
    this.print('  3. New registration\n');

    for (const item of ENV_TEMPLATE.functions.filter(i => i.key.startsWith('MS_'))) {
      const value = await this.question(`  ${item.desc}`);
      this.config.functions[item.key] = value;
    }

    // Update functions .env
    const functionsEnvPath = path.join(ROOT_DIR, 'functions', '.env');
    let content = fs.readFileSync(functionsEnvPath, 'utf8');
    for (const [key, value] of Object.entries(this.config.functions)) {
      if (value && key.startsWith('MS_')) {
        content += `${key}=${value}\n`;
      }
    }
    fs.writeFileSync(functionsEnvPath, content);
    this.print('  ✅ Configuración de Microsoft Graph guardada');
  }

  async deploy() {
    this.print('Ahora se desplegará la aplicación a Firebase.\n');

    if (!await this.confirm('¿Deseas desplegar ahora?')) {
      this.print('  ⏭️  Puedes desplegar manualmente después con: npm run deploy');
      return;
    }

    const projectId = this.config.client['PUBLIC_FIREBASE_PROJECT_ID'];

    try {
      this.print('\n  Seleccionando proyecto Firebase...');
      execSync(`firebase use ${projectId}`, { stdio: 'inherit', cwd: ROOT_DIR });

      this.print('\n  Desplegando reglas de base de datos...');
      execSync('npm run deploy:rules', { stdio: 'inherit', cwd: ROOT_DIR });

      this.print('\n  Desplegando Cloud Functions...');
      execSync('npm run deploy:functions', { stdio: 'inherit', cwd: ROOT_DIR });

      this.print('\n  Construyendo aplicación...');
      execSync('npm run build', { stdio: 'inherit', cwd: ROOT_DIR });

      this.print('\n  Desplegando hosting...');
      execSync('npm run deploy:hosting', { stdio: 'inherit', cwd: ROOT_DIR });

      this.print('\n  ✅ Despliegue completado!');
    } catch (error) {
      this.print(`\n  ❌ Error en el despliegue: ${error.message}`);
      this.print('  Puedes intentar desplegar manualmente después.');
    }
  }

  async setupFirstAdmin() {
    const superAdminEmail = this.config.client['PUBLIC_SUPER_ADMIN_EMAIL'];

    this.print(`El primer App Admin será: ${superAdminEmail}\n`);

    if (!await this.confirm('¿Configurar este usuario como App Admin?')) {
      this.print('  ⏭️  Puedes hacerlo después con: npm run setup:app-admin -- email@example.com');
      return;
    }

    try {
      // Check if gcloud is authenticated
      try {
        execSync('gcloud auth application-default print-access-token', { stdio: 'pipe' });
      } catch {
        this.print('\n  Necesitas autenticarte con gcloud...');
        execSync('gcloud auth application-default login', { stdio: 'inherit' });
      }

      execSync(`node scripts/setup-app-admin.js ${superAdminEmail}`, {
        stdio: 'inherit',
        cwd: ROOT_DIR
      });
    } catch (error) {
      this.print(`\n  ⚠️  No se pudo configurar el App Admin automáticamente.`);
      this.print(`  Ejecuta después: npm run setup:app-admin -- ${superAdminEmail}`);
    }
  }

  async setupMCP() {
    this.print('El MCP Server permite gestionar el proyecto desde Claude Code.\n');

    if (!await this.confirm('¿Deseas instalar el MCP Server?', false)) {
      this.print('  ⏭️  Puedes instalarlo después siguiendo docs/MCP_INSTALLATION_GUIDE.md');
      return;
    }

    this.print('\n  Consulta docs/MCP_INSTALLATION_GUIDE.md para instrucciones detalladas.');
    this.print('  El MCP se configura en ~/.claude/claude_desktop_config.json\n');
  }

  printNextSteps() {
    this.print('Próximos pasos:\n');
    this.print('  1. Inicia sesión en la aplicación con el email del Super Admin');
    this.print('  2. Cierra sesión y vuelve a entrar para cargar los permisos');
    this.print('  3. Ve a la sección de Apps para gestionar aplicaciones\n');
    this.print('Comandos útiles:\n');
    this.print('  npm run dev          # Iniciar en desarrollo');
    this.print('  npm run emulator     # Iniciar emuladores de Firebase');
    this.print('  npm run build        # Construir para producción');
    this.print('  npm run deploy       # Desplegar a Firebase\n');
    this.print('Documentación:\n');
    this.print('  README.md            # Visión general');
    this.print('  INSTALL.md           # Guía de instalación detallada');
    this.print('  ENV_VARIABLES.md     # Variables de entorno');
    this.print('  CLAUDE.md            # Guía para desarrollo con IA\n');
  }
}

// Run the wizard
const wizard = new SetupWizard();
wizard.run().catch(console.error);
