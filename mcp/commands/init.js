import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, basename, isAbsolute } from 'path';
import { execSync } from 'child_process';
import { ask, confirm, printHeader, printSuccess, printError, printWarning, printInfo } from '../utils/wizard.js';
import { readConfig, writeConfig, resolveConfigPath } from '../utils/pg-config.js';

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
  printHeader('Step 1/6 — Prerequisites');
  checkPrerequisites();

  // ── Step 2: Instance name & description ──
  printHeader('Step 2/6 — Instance Name');
  const { instanceName, instanceDescription } = await resolveInstanceIdentity(existing, nonInteractive);

  // ── Step 3: Firebase credentials ──
  printHeader('Step 3/6 — Firebase Credentials');
  const { credentialsPath, projectId } = await resolveCredentials(existing, nonInteractive);

  // ── Step 4: Database URL + connectivity ──
  printHeader('Step 4/6 — Firebase Database');
  const databaseUrl = await resolveDatabaseUrl(projectId, existing, nonInteractive);
  await testConnectivity(credentialsPath, databaseUrl);

  // ── Step 5: User identity ──
  printHeader('Step 5/6 — User Identity');
  const user = await resolveUser(existing, nonInteractive);

  // ── Step 6: Generate config ──
  printHeader('Step 6/6 — Save Configuration');
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

  // Offer to register in Claude Code
  if (!nonInteractive) {
    await offerClaudeRegistration(config);
  }

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

async function offerClaudeRegistration(config) {
  const register = await confirm('Register this MCP in Claude Code (~/.claude.json)?', true);
  if (!register) return;

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
    const instanceDir = process.env.MCP_INSTANCE_DIR || process.cwd();

    claudeConfig.mcpServers[serverName] = {
      type: 'stdio',
      command: 'node',
      args: [resolve(process.cwd(), 'index.js')],
      env: {
        MCP_INSTANCE_DIR: instanceDir,
        GOOGLE_APPLICATION_CREDENTIALS: config.firebase.credentialsPath
      }
    };

    writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2) + '\n', 'utf-8');
    printSuccess(`Registered "${serverName}" in ${claudeConfigPath}`);
  } catch (err) {
    printWarning(`Could not update Claude config: ${err.message}`);
    printInfo('You can register manually with: claude mcp add');
  }
}
