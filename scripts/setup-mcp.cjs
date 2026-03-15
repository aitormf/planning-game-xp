#!/usr/bin/env node
/**
 * Standalone MCP Setup Script
 *
 * Registers a Planning Game MCP instance in Claude Code with a unique name
 * derived from the instance directory name (e.g. "planning-game-personal").
 *
 * Usage:
 *   npm run setup:mcp                 # Uses active instance
 *   npm run setup:mcp -- my-instance  # Uses specified instance
 *   node scripts/setup-mcp.cjs [instanceName]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const INSTANCES_DIR = path.join(ROOT_DIR, 'planning-game-instances');
const MCP_DIR = path.join(ROOT_DIR, 'mcp');
const MCP_INDEX = path.join(MCP_DIR, 'index.js');

function print(msg) {
  console.log(msg);
}

function question(rl, prompt, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` [${defaultValue}]` : '';
    rl.question(`${prompt}${defaultText}: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Detect the active instance from .last-instance file.
 */
function getActiveInstance() {
  const lastInstanceFile = path.join(ROOT_DIR, '.last-instance');
  if (fs.existsSync(lastInstanceFile)) {
    return fs.readFileSync(lastInstanceFile, 'utf8').trim();
  }
  return null;
}

/**
 * List available instances.
 */
function listInstances() {
  if (!fs.existsSync(INSTANCES_DIR)) return [];
  return fs.readdirSync(INSTANCES_DIR).filter(name => {
    const dir = path.join(INSTANCES_DIR, name);
    return fs.statSync(dir).isDirectory() && name !== 'example';
  });
}

const { setupMcpUser } = require('./setup-mcp-helpers.cjs');

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  print('\n=== Planning Game MCP - Setup ===\n');

  // Determine instance name
  let instanceName = process.argv[2];

  if (!instanceName) {
    const active = getActiveInstance();
    const instances = listInstances();

    if (instances.length === 0) {
      print('No se encontraron instancias en planning-game-instances/.');
      print('Ejecuta primero: npm run setup');
      rl.close();
      process.exit(1);
    }

    if (instances.length === 1) {
      instanceName = instances[0];
      print(`Instancia detectada: ${instanceName}`);
    } else {
      print('Instancias disponibles:');
      instances.forEach((name, i) => {
        const marker = name === active ? ' (activa)' : '';
        print(`  ${i + 1}. ${name}${marker}`);
      });
      print('');

      const choice = await question(rl, 'Selecciona instancia (número o nombre)', active || '');
      const num = parseInt(choice, 10);
      if (num >= 1 && num <= instances.length) {
        instanceName = instances[num - 1];
      } else if (instances.includes(choice)) {
        instanceName = choice;
      } else {
        print(`Instancia "${choice}" no encontrada.`);
        rl.close();
        process.exit(1);
      }
    }
  }

  const instanceDir = path.join(INSTANCES_DIR, instanceName);
  if (!fs.existsSync(instanceDir)) {
    print(`Error: directorio ${instanceDir} no existe.`);
    rl.close();
    process.exit(1);
  }

  const serverName = `planning-game-${instanceName}`;
  print(`\nConfigurando MCP server: ${serverName}`);
  print(`Instancia: ${instanceDir}\n`);

  // Install MCP dependencies
  print('Instalando dependencias del MCP...');
  try {
    execSync('npm install --ignore-scripts', { stdio: 'pipe', cwd: MCP_DIR });
    print('  OK: dependencias instaladas');
  } catch (error) {
    print(`  Error: ${error.message}`);
    print('  Ejecuta: cd mcp && npm install');
    rl.close();
    process.exit(1);
  }

  // Check serviceAccountKey.json
  const keyPath = path.join(instanceDir, 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    print(`\nNo se encontro serviceAccountKey.json en ${instanceDir}`);
    print('Para obtenerlo:');
    print('  1. Firebase Console > Project Settings > Service Accounts');
    print('  2. "Generate new private key"');
    print(`  3. Guardar como: ${keyPath}`);
    print('  4. Ejecutar: npm run setup:mcp');
    rl.close();
    process.exit(1);
  }
  print('  OK: serviceAccountKey.json encontrado');

  // Read project ID
  let projectId;
  try {
    const sa = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    projectId = sa.project_id;
    print(`  OK: proyecto Firebase: ${projectId}`);
  } catch (error) {
    print(`  Error leyendo serviceAccountKey.json: ${error.message}`);
    rl.close();
    process.exit(1);
  }

  // Determine database URL
  let databaseURL = '';
  for (const envFile of ['.env.prod', '.env.dev']) {
    const envPath = path.join(instanceDir, envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/PUBLIC_FIREBASE_DATABASE_URL=(.+)/);
      if (match) {
        databaseURL = match[1].trim();
        break;
      }
    }
  }
  if (!databaseURL) {
    databaseURL = `https://${projectId}-default-rtdb.europe-west1.firebasedatabase.app`;
  }

  const confirmedUrl = await question(rl, 'Database URL', databaseURL);
  databaseURL = confirmedUrl;

  // Register with AI CLIs
  print(`\nRegistrando MCP server "${serverName}" en CLIs detectados...`);

  const mcpEnv = {
    MCP_INSTANCE_DIR: instanceDir,
    GOOGLE_APPLICATION_CREDENTIALS: keyPath,
    FIREBASE_DATABASE_URL: databaseURL
  };

  // Claude Code
  registerClaudeCode(serverName, mcpEnv, MCP_INDEX);

  // OpenCode
  registerOpenCode(serverName, mcpEnv, MCP_INDEX);

  // Codex CLI
  registerCodex(serverName, mcpEnv, MCP_INDEX);

  // Configure mcp.user.json
  await setupMcpUser({
    question: (prompt, defaultValue) => question(rl, prompt, defaultValue),
    print,
    instanceDir,
    keyPath,
    databaseURL
  });

  // Run smoke test
  print('\nEjecutando test de verificacion...');
  try {
    const result = execSync('node mcp/scripts/smoke-test.js', {
      stdio: 'pipe',
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        MCP_INSTANCE_DIR: instanceDir,
        GOOGLE_APPLICATION_CREDENTIALS: keyPath,
        FIREBASE_DATABASE_URL: databaseURL,
      }
    });
    print(result.toString());
  } catch (error) {
    print('  El test de verificacion fallo. Reintenta con: npm run mcp:test');
  }

  print('Setup MCP completado.\n');
  rl.close();
}

function registerClaudeCode(serverName, env, mcpIndex) {
  let claudeAvailable = true;
  try {
    execSync('which claude', { stdio: 'pipe' });
  } catch {
    claudeAvailable = false;
  }

  if (claudeAvailable) {
    try {
      try {
        execSync(`claude mcp remove "${serverName}" -s user`, { stdio: 'pipe' });
      } catch { /* may not exist */ }

      const envFlags = Object.entries(env).map(([k, v]) => `-e ${k}=${v}`).join(' ');
      const addCmd = `claude mcp add ${envFlags} -s user "${serverName}" -- node "${mcpIndex}"`;
      execSync(addCmd, { stdio: 'pipe', cwd: ROOT_DIR });
      print(`  OK: "${serverName}" registrado en Claude Code`);
    } catch (error) {
      print(`  Error registrando en Claude Code: ${error.message}`);
      claudeAvailable = false;
    }
  }

  if (!claudeAvailable) {
    print('\nClaude CLI no disponible. Registra manualmente:');
    print(`  claude mcp add \\`);
    print(`    -e MCP_INSTANCE_DIR=${mcpEnv.MCP_INSTANCE_DIR} \\`);
    print(`    -e GOOGLE_APPLICATION_CREDENTIALS=${mcpEnv.GOOGLE_APPLICATION_CREDENTIALS} \\`);
    print(`    -e FIREBASE_DATABASE_URL=${mcpEnv.FIREBASE_DATABASE_URL} \\`);
    print(`    -s user "${serverName}" -- node "${MCP_INDEX}"`);
  }
}

function registerOpenCode(serverName, env, mcpIndex) {
  try {
    const homedir = process.env.HOME || process.env.USERPROFILE;
    const configDir = path.join(homedir, '.config', 'opencode');
    const configPath = path.join(configDir, 'opencode.json');

    if (!fs.existsSync(configDir)) {
      // OpenCode not installed - skip silently
      return;
    }

    let openCodeConfig = {};
    if (fs.existsSync(configPath)) {
      openCodeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    if (!openCodeConfig.mcp) {
      openCodeConfig.mcp = {};
    }

    openCodeConfig.mcp[serverName] = {
      type: 'local',
      command: ['node', mcpIndex],
      environment: env,
      enabled: true
    };

    fs.writeFileSync(configPath, JSON.stringify(openCodeConfig, null, 2) + '\n', 'utf8');
    print(`  OK: "${serverName}" registrado en OpenCode (${configPath})`);
  } catch (error) {
    print(`  Error registrando en OpenCode: ${error.message}`);
  }
}

function registerCodex(serverName, env, mcpIndex) {
  try {
    const homedir = process.env.HOME || process.env.USERPROFILE;
    const codexDir = path.join(homedir, '.codex');
    const configPath = path.join(codexDir, 'config.toml');

    if (!fs.existsSync(codexDir)) {
      // Codex not installed - skip silently
      return;
    }

    let tomlContent = '';
    if (fs.existsSync(configPath)) {
      tomlContent = fs.readFileSync(configPath, 'utf8');
    }

    const sectionHeader = `[mcp_servers.${serverName}]`;
    const envHeader = `[mcp_servers.${serverName}.env]`;

    const newSection = [
      sectionHeader,
      `command = "node"`,
      `args = [${JSON.stringify(mcpIndex)}]`,
      '',
      envHeader,
      ...Object.entries(env).map(([k, v]) => `${k} = ${JSON.stringify(v)}`),
    ].join('\n');

    const escaped = serverName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sectionRegex = new RegExp(
      `\\[mcp_servers\\.${escaped}\\][\\s\\S]*?(?=\\n\\[(?!mcp_servers\\.${escaped}\\.)|\n*$)`,
    );

    if (sectionRegex.test(tomlContent)) {
      tomlContent = tomlContent.replace(sectionRegex, newSection);
    } else {
      tomlContent = tomlContent.trimEnd() + (tomlContent ? '\n\n' : '') + newSection + '\n';
    }

    fs.writeFileSync(configPath, tomlContent, 'utf8');
    print(`  OK: "${serverName}" registrado en Codex (${configPath})`);
  } catch (error) {
    print(`  Error registrando en Codex: ${error.message}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
