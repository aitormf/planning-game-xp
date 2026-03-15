import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, basename, isAbsolute } from 'path';
import { execSync } from 'child_process';
import { ask, confirm, multiSelect, printHeader, printSuccess, printError, printWarning, printInfo } from '../utils/wizard.js';
import { readConfig, writeConfig, resolveConfigPath } from '../utils/pg-config.js';
import { syncGuidelines } from '../tools/sync-guidelines.js';

/**
 * Run the interactive setup wizard.
 * @param {object} options
 * @param {boolean} [options.nonInteractive=false]
 */
export async function runInit({ nonInteractive = false } = {}) {
  printHeader('Planning Game MCP — Setup Wizard');

  const configPath = resolveConfigPath();
  const existing = readConfig(configPath);

  if (existing && !nonInteractive) {
    printInfo(`Config found at: ${configPath}`);
    const reconfigure = await confirm('Reconfigure existing setup?', false);
    if (!reconfigure) {
      printInfo('Setup cancelled. Existing config preserved.');
      process.exit(0);
    }
  }

  // ── Step 1: Prerequisites ──
  printHeader('Step 1/7 — Prerequisites');
  checkPrerequisites();

  // ── Step 2: Instance name & description ──
  printHeader('Step 2/7 — Instance Name');
  const { instanceName, instanceDescription } = await resolveInstanceIdentity(existing, nonInteractive);

  // ── Step 3: Firebase credentials ──
  printHeader('Step 3/7 — Firebase Credentials');
  const { credentialsPath, projectId } = await resolveCredentials(existing, nonInteractive);

  // ── Step 4: Database URL + connectivity ──
  printHeader('Step 4/7 — Firebase Database');
  const databaseUrl = await resolveDatabaseUrl(projectId, existing, nonInteractive);
  await testConnectivity(credentialsPath, databaseUrl);

  // ── Step 5: User identity ──
  printHeader('Step 5/7 — User Identity');
  const user = await resolveUser(existing, nonInteractive);

  // ── Step 6: Generate config ──
  printHeader('Step 6/7 — Save Configuration');
  const serverName = `planning-game-${instanceName}`;

  const config = {
    instance: { name: instanceName, description: instanceDescription },
    firebase: {
      projectId,
      databaseUrl,
      credentialsPath
    },
    user: {
      developerId: user.developerId,
      name: user.name,
      email: user.email
    },
    mcp: {
      serverName,
      autoUpdate: true
    }
  };

  writeConfig(config, configPath);
  printSuccess(`Config saved to: ${configPath}`);

  // Write mcp.user.json for backwards compatibility
  writeMcpUserCompat(config);

  // Offer to register in AI CLIs
  if (!nonInteractive) {
    await offerCliRegistrations(config);
  }

  // ── Step 7: Sync Guidelines ──
  printHeader('Step 7/7 — Sync Guidelines');
  await syncGuidelinesStep(credentialsPath, databaseUrl, nonInteractive);

  // Final summary
  printHeader('Setup Complete');
  printSuccess(`Instance: ${instanceName}`);
  printSuccess(`Firebase project: ${projectId}`);
  printSuccess(`Database URL: ${databaseUrl}`);
  printSuccess(`User: ${user.name} (${user.developerId})`);
  printSuccess(`Config: ${configPath}`);
  printInfo('Run "planning-game-mcp --version" to verify installation.');
  printInfo('The MCP server will use pg.config.yml on next startup.');
}

// ── Step implementations ──

function checkPrerequisites() {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);

  if (major < 18) {
    printError(`Node.js ${nodeVersion} is too old. Minimum: v18.0.0`);
    process.exit(1);
  }
  printSuccess(`Node.js ${nodeVersion}`);

  try {
    execSync('git --version', { stdio: 'pipe', timeout: 5000 });
    printSuccess('Git available');
  } catch {
    printWarning('Git not available. Version checking will not work.');
  }
}

async function resolveInstanceIdentity(existing, nonInteractive) {
  const envInstanceDir = process.env.MCP_INSTANCE_DIR;
  const envName = envInstanceDir ? basename(envInstanceDir) : null;
  const defaultName = existing?.instance?.name || envName || 'default';
  const defaultDescription = existing?.instance?.description || '';

  if (nonInteractive) {
    printInfo(`Instance name: ${defaultName}`);
    if (defaultDescription) printInfo(`Description: ${defaultDescription}`);
    return { instanceName: defaultName, instanceDescription: defaultDescription };
  }

  const name = await ask('Instance name', {
    defaultValue: defaultName,
    validate: (val) => {
      if (!val) return 'Instance name is required';
      if (!/^[a-zA-Z0-9_-]+$/.test(val)) return 'Only letters, numbers, hyphens and underscores allowed';
      return null;
    }
  });

  const description = await ask('Instance description (what is this instance for?)', {
    defaultValue: defaultDescription
  });

  printSuccess(`Instance: ${name}`);
  if (description) printSuccess(`Description: ${description}`);
  return { instanceName: name, instanceDescription: description };
}

async function resolveCredentials(existing, nonInteractive) {
  const defaultPath = existing?.firebase?.credentialsPath || findServiceAccountKey();

  if (nonInteractive) {
    if (!defaultPath || !existsSync(defaultPath)) {
      printError('serviceAccountKey.json not found. Provide path via pg.config.yml or GOOGLE_APPLICATION_CREDENTIALS.');
      process.exit(1);
    }
    return validateCredentialsFile(defaultPath);
  }

  let credPath = await ask('Path to serviceAccountKey.json', {
    defaultValue: defaultPath || '',
    validate: (val) => {
      if (!val) return 'Path is required';
      const resolved = isAbsolute(val) ? val : resolve(process.cwd(), val);
      if (!existsSync(resolved)) return `File not found: ${resolved}`;
      return null;
    }
  });

  credPath = isAbsolute(credPath) ? credPath : resolve(process.cwd(), credPath);
  return validateCredentialsFile(credPath);
}

function validateCredentialsFile(credPath) {
  let content;
  try {
    content = JSON.parse(readFileSync(credPath, 'utf-8'));
  } catch (err) {
    printError(`Invalid JSON in ${credPath}: ${err.message}`);
    process.exit(1);
  }

  if (!content.project_id) {
    printError('serviceAccountKey.json is missing the "project_id" field.');
    printInfo('Download a fresh key from Firebase Console > Project Settings > Service Accounts.');
    process.exit(1);
  }

  printSuccess(`Credentials valid — project: ${content.project_id}`);
  return { credentialsPath: credPath, projectId: content.project_id };
}

/**
 * Search common locations for serviceAccountKey.json.
 */
function findServiceAccountKey() {
  const candidates = [];

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    candidates.push(resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS));
  }

  const instanceDir = process.env.MCP_INSTANCE_DIR;
  if (instanceDir) {
    candidates.push(resolve(instanceDir, 'serviceAccountKey.json'));
  }

  candidates.push(resolve(process.cwd(), 'serviceAccountKey.json'));

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  return null;
}

async function resolveDatabaseUrl(projectId, existing, nonInteractive) {
  const autoUrl = `https://${projectId}-default-rtdb.europe-west1.firebasedatabase.app`;
  const defaultUrl = existing?.firebase?.databaseUrl || process.env.FIREBASE_DATABASE_URL || autoUrl;

  if (nonInteractive) {
    printInfo(`Database URL: ${defaultUrl}`);
    return defaultUrl;
  }

  printInfo(`Auto-detected URL: ${autoUrl}`);
  const url = await ask('Firebase Database URL', {
    defaultValue: defaultUrl,
    validate: (val) => {
      if (!val) return 'URL is required';
      if (!val.startsWith('https://')) return 'URL must start with https://';
      return null;
    }
  });

  return url;
}

async function testConnectivity(credentialsPath, databaseUrl) {
  printInfo('Testing Firebase connectivity...');

  try {
    const admin = (await import('firebase-admin')).default;

    const testApp = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(readFileSync(credentialsPath, 'utf-8'))),
      databaseURL: databaseUrl
    }, `init-test-${Date.now()}`);

    const db = testApp.database();
    const snapshot = await Promise.race([
      db.ref('/projects').limitToFirst(1).once('value'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000))
    ]);

    const data = snapshot.val();
    if (data) {
      printSuccess('Connected to Firebase — projects found');
    } else {
      printWarning('Connected to Firebase but no projects found at /projects');
    }

    await testApp.delete();
  } catch (err) {
    printError(`Firebase connection failed: ${err.message}`);
    printInfo('Possible causes:');
    printInfo('  - Database URL is incorrect');
    printInfo('  - Credentials belong to a different Firebase project');
    printInfo('  - Realtime Database is not enabled in this project');
    printInfo('  - Network/firewall issue');
    printWarning('Config will be saved but the MCP may not work until this is fixed.');
  }
}

async function resolveUser(existing, nonInteractive) {
  const defaults = {
    name: existing?.user?.name || '',
    email: existing?.user?.email || '',
    developerId: existing?.user?.developerId || ''
  };

  if (nonInteractive) {
    if (!defaults.developerId) {
      printWarning('User not configured. Run "planning-game-mcp init" interactively to set up.');
    }
    return defaults;
  }

  const name = await ask('Your name', {
    defaultValue: defaults.name,
    validate: (val) => val ? null : 'Name is required'
  });

  const email = await ask('Your email', {
    defaultValue: defaults.email,
    validate: (val) => {
      if (!val) return 'Email is required';
      if (!val.includes('@')) return 'Invalid email';
      return null;
    }
  });

  const developerId = await ask('Your developer ID (e.g., dev_001)', {
    defaultValue: defaults.developerId,
    validate: (val) => {
      if (!val) return 'Developer ID is required';
      if (!val.startsWith('dev_')) return 'Developer ID must start with "dev_"';
      return null;
    }
  });

  printSuccess(`User: ${name} <${email}> (${developerId})`);
  return { name, email, developerId };
}

function writeMcpUserCompat(config) {
  try {
    const userConfigPath = resolveUserConfigPathCompat();
    const userData = {
      developerId: config.user.developerId,
      developerName: config.user.name,
      developerEmail: config.user.email
    };
    writeFileSync(userConfigPath, JSON.stringify(userData, null, 2) + '\n', 'utf-8');
    printSuccess(`mcp.user.json updated at: ${userConfigPath}`);
  } catch {
    // Not critical — pg.config.yml is the source of truth
  }
}

function resolveUserConfigPathCompat() {
  const instanceDir = process.env.MCP_INSTANCE_DIR;
  if (instanceDir) {
    return resolve(instanceDir, 'mcp.user.json');
  }
  return resolve(process.cwd(), 'mcp.user.json');
}

async function syncGuidelinesStep(credentialsPath, databaseUrl, nonInteractive) {
  let shouldSync = true;

  if (!nonInteractive) {
    shouldSync = await confirm('Sync project guidelines from Firebase?', true);
  }

  if (!shouldSync) {
    printInfo('Guidelines sync skipped.');
    return;
  }

  let tempApp;
  try {
    const admin = (await import('firebase-admin')).default;

    tempApp = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(readFileSync(credentialsPath, 'utf-8'))),
      databaseURL: databaseUrl
    }, `init-guidelines-${Date.now()}`);

    const db = tempApp.database();
    const result = await syncGuidelines({ force: true, db });

    const parsed = JSON.parse(result.content[0].text);

    if (parsed.synced > 0) {
      printSuccess(`${parsed.synced} guideline(s) synced successfully.`);
      for (const detail of parsed.details || []) {
        if (detail.action !== 'skipped') {
          printInfo(`  → ${detail.targetFile} (${detail.name || detail.configId})`);
        }
      }
    } else if (parsed.errors > 0) {
      printWarning(`Guidelines sync completed with ${parsed.errors} error(s).`);
    } else {
      printInfo('No guidelines found in Firebase. You can add them later.');
    }
  } catch (err) {
    printWarning(`Could not sync guidelines: ${err.message}`);
    printInfo('You can sync later with the sync_guidelines MCP tool.');
  } finally {
    if (tempApp) {
      try { await tempApp.delete(); } catch { /* ignore cleanup errors */ }
    }
  }
}

// ── CLI Registration ──

const CLI_DEFINITIONS = [
  {
    id: 'claude',
    label: 'Claude Code',
    detect: () => {
      const homedir = process.env.HOME || process.env.USERPROFILE;
      return existsSync(resolve(homedir, '.claude.json')) || commandExists('claude');
    },
    register: registerInClaudeCode
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    detect: () => {
      const homedir = process.env.HOME || process.env.USERPROFILE;
      return existsSync(resolve(homedir, '.config', 'opencode')) || commandExists('opencode');
    },
    register: registerInOpenCode
  },
  {
    id: 'codex',
    label: 'Codex CLI',
    detect: () => {
      const homedir = process.env.HOME || process.env.USERPROFILE;
      return existsSync(resolve(homedir, '.codex')) || commandExists('codex');
    },
    register: registerInCodex
  }
];

function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'pipe', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function offerCliRegistrations(config) {
  const detected = CLI_DEFINITIONS.filter(cli => cli.detect());

  if (detected.length === 0) {
    printInfo('No AI CLIs detected (Claude Code, OpenCode, Codex).');
    printInfo('You can register manually later.');
    return;
  }

  const register = await confirm('Register this MCP in an AI CLI?', true);
  if (!register) return;

  let selected;
  if (detected.length === 1) {
    printInfo(`Detected: ${detected[0].label}`);
    selected = [detected[0].id];
  } else {
    const options = detected.map(cli => ({ label: cli.label, value: cli.id }));
    selected = await multiSelect('Which AI CLIs do you want to configure?', options);
  }

  for (const cliId of selected) {
    const cli = CLI_DEFINITIONS.find(c => c.id === cliId);
    await cli.register(config);
  }
}

function buildMcpEnv(config) {
  const instanceDir = process.env.MCP_INSTANCE_DIR || process.cwd();
  return {
    MCP_INSTANCE_DIR: instanceDir,
    GOOGLE_APPLICATION_CREDENTIALS: config.firebase.credentialsPath
  };
}

function registerInClaudeCode(config) {
  try {
    const homedir = process.env.HOME || process.env.USERPROFILE;
    const claudeConfigPath = resolve(homedir, '.claude.json');

    let claudeConfig = {};
    if (existsSync(claudeConfigPath)) {
      claudeConfig = JSON.parse(readFileSync(claudeConfigPath, 'utf-8'));
    }

    if (!claudeConfig.mcpServers) {
      claudeConfig.mcpServers = {};
    }

    const serverName = config.mcp.serverName;
    claudeConfig.mcpServers[serverName] = {
      type: 'stdio',
      command: 'node',
      args: [resolve(process.cwd(), 'index.js')],
      env: buildMcpEnv(config)
    };

    writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2) + '\n', 'utf-8');
    printSuccess(`Registered "${serverName}" in ${claudeConfigPath}`);
  } catch (err) {
    printWarning(`Could not update Claude Code config: ${err.message}`);
    printInfo('You can register manually with: claude mcp add');
  }
}

function registerInOpenCode(config) {
  try {
    const homedir = process.env.HOME || process.env.USERPROFILE;
    const configDir = resolve(homedir, '.config', 'opencode');
    const configPath = resolve(configDir, 'opencode.json');

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    let openCodeConfig = {};
    if (existsSync(configPath)) {
      openCodeConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    }

    if (!openCodeConfig.mcp) {
      openCodeConfig.mcp = {};
    }

    const serverName = config.mcp.serverName;
    const env = buildMcpEnv(config);

    openCodeConfig.mcp[serverName] = {
      type: 'local',
      command: ['node', resolve(process.cwd(), 'index.js')],
      environment: env,
      enabled: true
    };

    writeFileSync(configPath, JSON.stringify(openCodeConfig, null, 2) + '\n', 'utf-8');
    printSuccess(`Registered "${serverName}" in ${configPath}`);
  } catch (err) {
    printWarning(`Could not update OpenCode config: ${err.message}`);
    printInfo('You can register manually in ~/.config/opencode/opencode.json');
  }
}

function registerInCodex(config) {
  try {
    const homedir = process.env.HOME || process.env.USERPROFILE;
    const codexDir = resolve(homedir, '.codex');
    const configPath = resolve(codexDir, 'config.toml');

    if (!existsSync(codexDir)) {
      mkdirSync(codexDir, { recursive: true });
    }

    let tomlContent = '';
    if (existsSync(configPath)) {
      tomlContent = readFileSync(configPath, 'utf-8');
    }

    const serverName = config.mcp.serverName;
    const env = buildMcpEnv(config);
    const indexPath = resolve(process.cwd(), 'index.js');

    const sectionHeader = `[mcp_servers.${serverName}]`;
    const envHeader = `[mcp_servers.${serverName}.env]`;

    const newSection = [
      sectionHeader,
      `command = "node"`,
      `args = [${JSON.stringify(indexPath)}]`,
      '',
      envHeader,
      ...Object.entries(env).map(([k, v]) => `${k} = ${JSON.stringify(v)}`),
    ].join('\n');

    // Remove existing section if present
    const sectionRegex = new RegExp(
      `\\[mcp_servers\\.${escapeRegex(serverName)}\\][\\s\\S]*?(?=\\n\\[(?!mcp_servers\\.${escapeRegex(serverName)}\\.)|\n*$)`,
    );

    if (sectionRegex.test(tomlContent)) {
      tomlContent = tomlContent.replace(sectionRegex, newSection);
    } else {
      tomlContent = tomlContent.trimEnd() + (tomlContent ? '\n\n' : '') + newSection + '\n';
    }

    writeFileSync(configPath, tomlContent, 'utf-8');
    printSuccess(`Registered "${serverName}" in ${configPath}`);
  } catch (err) {
    printWarning(`Could not update Codex config: ${err.message}`);
    printInfo('You can register manually in ~/.codex/config.toml');
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
