import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

const INIT_JS = path.resolve(import.meta.dirname, '../../mcp/commands/init.js');
const WIZARD_JS = path.resolve(import.meta.dirname, '../../mcp/utils/wizard.js');

describe('mcp/utils/wizard.js — multiSelect', () => {
  it('should export multiSelect function', () => {
    const content = fs.readFileSync(WIZARD_JS, 'utf8');
    expect(content).toContain('export async function multiSelect');
  });

  it('multiSelect should accept "all" as input', () => {
    const content = fs.readFileSync(WIZARD_JS, 'utf8');
    expect(content).toContain("'all'");
    expect(content).toContain('options.map(o => o.value)');
  });

  it('multiSelect should accept comma-separated numbers', () => {
    const content = fs.readFileSync(WIZARD_JS, 'utf8');
    expect(content).toContain("split(',')");
    expect(content).toContain('parseInt');
  });

  it('multiSelect should validate input numbers are in range', () => {
    const content = fs.readFileSync(WIZARD_JS, 'utf8');
    expect(content).toContain('isNaN(num)');
    expect(content).toContain('options.length');
  });

  it('multiSelect should deduplicate selections', () => {
    const content = fs.readFileSync(WIZARD_JS, 'utf8');
    expect(content).toContain('new Set');
  });
});

describe('mcp/commands/init.js — CLI registration', () => {
  it('should define CLI_DEFINITIONS for claude, opencode, and codex', () => {
    const content = fs.readFileSync(INIT_JS, 'utf8');
    expect(content).toContain('CLI_DEFINITIONS');
    expect(content).toContain("id: 'claude'");
    expect(content).toContain("id: 'opencode'");
    expect(content).toContain("id: 'codex'");
  });

  it('should have offerCliRegistrations instead of offerClaudeRegistration', () => {
    const content = fs.readFileSync(INIT_JS, 'utf8');
    expect(content).toContain('offerCliRegistrations');
    expect(content).not.toContain('offerClaudeRegistration');
  });

  it('should import multiSelect from wizard', () => {
    const content = fs.readFileSync(INIT_JS, 'utf8');
    expect(content).toContain('multiSelect');
  });

  it('should import mkdirSync for creating config directories', () => {
    const content = fs.readFileSync(INIT_JS, 'utf8');
    expect(content).toContain('mkdirSync');
  });

  it('should have a commandExists helper', () => {
    const content = fs.readFileSync(INIT_JS, 'utf8');
    expect(content).toContain('function commandExists');
    expect(content).toContain('which');
  });

  it('registerInClaudeCode should write to ~/.claude.json', () => {
    const content = fs.readFileSync(INIT_JS, 'utf8');
    expect(content).toContain("'.claude.json'");
    expect(content).toContain('mcpServers');
  });

  it('registerInOpenCode should write to ~/.config/opencode/opencode.json', () => {
    const content = fs.readFileSync(INIT_JS, 'utf8');
    expect(content).toContain("'opencode.json'");
    expect(content).toContain("'.config'");
    expect(content).toContain("'opencode'");
    expect(content).toContain('enabled: true');
  });

  it('registerInCodex should write TOML to ~/.codex/config.toml', () => {
    const content = fs.readFileSync(INIT_JS, 'utf8');
    expect(content).toContain("'config.toml'");
    expect(content).toContain("'.codex'");
    expect(content).toContain('mcp_servers');
    expect(content).toContain('command = "node"');
  });

  it('registerInCodex should handle existing TOML sections', () => {
    const content = fs.readFileSync(INIT_JS, 'utf8');
    expect(content).toContain('escapeRegex');
    expect(content).toContain('sectionRegex');
  });

  it('should detect CLIs by config dir or command existence', () => {
    const content = fs.readFileSync(INIT_JS, 'utf8');
    // Claude detection
    expect(content).toContain("'.claude.json'");
    expect(content).toContain("commandExists('claude')");
    // OpenCode detection
    expect(content).toContain("commandExists('opencode')");
    // Codex detection
    expect(content).toContain("commandExists('codex')");
  });
});

describe('mcp/commands/init.js — registerInClaudeCode file operations', () => {
  let tmpDir;
  let originalEnv;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-reg-test-'));
    originalEnv = process.env.HOME;
  });

  afterEach(() => {
    process.env.HOME = originalEnv;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create valid Claude Code config JSON', () => {
    const claudeConfigPath = path.join(tmpDir, '.claude.json');
    const config = {
      mcpServers: {
        'planning-game-test': {
          type: 'stdio',
          command: 'node',
          args: ['/path/to/index.js'],
          env: {
            MCP_INSTANCE_DIR: '/some/dir',
            GOOGLE_APPLICATION_CREDENTIALS: '/some/key.json'
          }
        }
      }
    };
    fs.writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2) + '\n');

    const written = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
    expect(written.mcpServers['planning-game-test'].type).toBe('stdio');
    expect(written.mcpServers['planning-game-test'].command).toBe('node');
    expect(written.mcpServers['planning-game-test'].env.MCP_INSTANCE_DIR).toBe('/some/dir');
  });

  it('should create valid OpenCode config JSON', () => {
    const openCodeConfigPath = path.join(tmpDir, 'opencode.json');
    const config = {
      mcp: {
        'planning-game-test': {
          type: 'local',
          command: ['node', '/path/to/index.js'],
          environment: {
            MCP_INSTANCE_DIR: '/some/dir',
            GOOGLE_APPLICATION_CREDENTIALS: '/some/key.json'
          },
          enabled: true
        }
      }
    };
    fs.writeFileSync(openCodeConfigPath, JSON.stringify(config, null, 2) + '\n');

    const written = JSON.parse(fs.readFileSync(openCodeConfigPath, 'utf8'));
    expect(written.mcp['planning-game-test'].type).toBe('local');
    expect(written.mcp['planning-game-test'].command).toEqual(['node', '/path/to/index.js']);
    expect(written.mcp['planning-game-test'].environment.MCP_INSTANCE_DIR).toBe('/some/dir');
    expect(written.mcp['planning-game-test'].enabled).toBe(true);
  });

  it('should create valid Codex TOML config', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    const serverName = 'planning-game-test';
    const indexPath = '/path/to/index.js';
    const env = {
      MCP_INSTANCE_DIR: '/some/dir',
      GOOGLE_APPLICATION_CREDENTIALS: '/some/key.json'
    };

    const toml = [
      `[mcp_servers.${serverName}]`,
      `command = "node"`,
      `args = [${JSON.stringify(indexPath)}]`,
      '',
      `[mcp_servers.${serverName}.env]`,
      ...Object.entries(env).map(([k, v]) => `${k} = ${JSON.stringify(v)}`),
    ].join('\n') + '\n';

    fs.writeFileSync(configPath, toml);

    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain('[mcp_servers.planning-game-test]');
    expect(content).toContain('command = "node"');
    expect(content).toContain('[mcp_servers.planning-game-test.env]');
    expect(content).toContain('MCP_INSTANCE_DIR = "/some/dir"');
    expect(content).toContain('GOOGLE_APPLICATION_CREDENTIALS = "/some/key.json"');
  });
});

describe('scripts/setup-mcp.cjs — multi-CLI support', () => {
  const SETUP_MCP_SCRIPT = path.resolve(import.meta.dirname, '../../scripts/setup-mcp.cjs');

  it('should have registerClaudeCode function', () => {
    const content = fs.readFileSync(SETUP_MCP_SCRIPT, 'utf8');
    expect(content).toContain('function registerClaudeCode');
  });

  it('should have registerOpenCode function', () => {
    const content = fs.readFileSync(SETUP_MCP_SCRIPT, 'utf8');
    expect(content).toContain('function registerOpenCode');
  });

  it('should have registerCodex function', () => {
    const content = fs.readFileSync(SETUP_MCP_SCRIPT, 'utf8');
    expect(content).toContain('function registerCodex');
  });

  it('should call all three register functions in main flow', () => {
    const content = fs.readFileSync(SETUP_MCP_SCRIPT, 'utf8');
    expect(content).toContain('registerClaudeCode(serverName');
    expect(content).toContain('registerOpenCode(serverName');
    expect(content).toContain('registerCodex(serverName');
  });

  it('registerOpenCode should write to opencode.json with correct format', () => {
    const content = fs.readFileSync(SETUP_MCP_SCRIPT, 'utf8');
    expect(content).toContain('opencode.json');
    expect(content).toContain("type: 'local'");
    expect(content).toContain('enabled: true');
    expect(content).toContain('environment: env');
  });

  it('registerCodex should write TOML to config.toml', () => {
    const content = fs.readFileSync(SETUP_MCP_SCRIPT, 'utf8');
    expect(content).toContain('config.toml');
    expect(content).toContain('mcp_servers');
    expect(content).toContain('command = "node"');
  });

  it('registerCodex should skip if .codex dir does not exist', () => {
    const content = fs.readFileSync(SETUP_MCP_SCRIPT, 'utf8');
    expect(content).toContain("'.codex'");
    expect(content).toMatch(/existsSync.*codexDir/);
  });

  it('registerOpenCode should skip if .config/opencode dir does not exist', () => {
    const content = fs.readFileSync(SETUP_MCP_SCRIPT, 'utf8');
    expect(content).toContain("'.config'");
    expect(content).toContain("'opencode'");
    expect(content).toMatch(/existsSync.*configDir/);
  });
});
