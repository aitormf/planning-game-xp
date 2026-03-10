import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

const CONFIG_FILENAME = 'pg.config.yml';

/**
 * Resolve the path to pg.config.yml.
 * Priority:
 * 1. MCP_INSTANCE_DIR/pg.config.yml
 * 2. CWD/pg.config.yml
 * @returns {string} Absolute path to config file
 */
export function resolveConfigPath() {
  const instanceDir = process.env.MCP_INSTANCE_DIR;
  if (instanceDir) {
    return resolve(instanceDir, CONFIG_FILENAME);
  }
  return resolve(process.cwd(), CONFIG_FILENAME);
}

/**
 * Check if a pg.config.yml exists.
 * @param {string} [configPath] - Override path
 * @returns {boolean}
 */
export function configExists(configPath) {
  return existsSync(configPath || resolveConfigPath());
}

/**
 * Read and parse pg.config.yml.
 * Uses a minimal YAML parser — only supports the flat/nested structure
 * used by PG config (no arrays, no multiline strings, no anchors).
 *
 * @param {string} [configPath] - Override path
 * @returns {object|null} Parsed config or null if file doesn't exist
 */
export function readConfig(configPath) {
  const path = configPath || resolveConfigPath();

  if (!existsSync(path)) {
    return null;
  }

  const content = readFileSync(path, 'utf-8');
  return parseSimpleYaml(content);
}

/**
 * Write config object to pg.config.yml.
 * @param {object} config - Config object
 * @param {string} [configPath] - Override path
 */
export function writeConfig(config, configPath) {
  const path = configPath || resolveConfigPath();
  const content = serializeToYaml(config);
  writeFileSync(path, content, 'utf-8');
}

/**
 * Get a nested value from config using dot notation.
 * @param {object} config
 * @param {string} key - e.g., "firebase.projectId"
 * @returns {*}
 */
export function getConfigValue(config, key) {
  if (!config) return undefined;
  return key.split('.').reduce((obj, k) => obj?.[k], config);
}

/**
 * Set a nested value in config using dot notation.
 * @param {object} config
 * @param {string} key - e.g., "firebase.projectId"
 * @param {*} value
 */
export function setConfigValue(config, key, value) {
  const keys = key.split('.');
  let obj = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') {
      obj[keys[i]] = {};
    }
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
}

// ── Minimal YAML parser ──

/**
 * Parse a simple YAML string into a nested object.
 * Supports: nested keys via indentation, string/number/boolean values, comments.
 * Does NOT support: arrays, multiline strings, anchors, tags.
 */
export function parseSimpleYaml(text) {
  const result = {};
  const stack = [{ indent: -1, obj: result }];

  for (const rawLine of text.split('\n')) {
    // Skip empty lines and comments
    const line = rawLine.replace(/#.*$/, '');
    if (!line.trim()) continue;

    const indent = rawLine.search(/\S/);
    const trimmed = line.trim();

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const rawValue = trimmed.slice(colonIndex + 1).trim();

    // Pop stack to find parent at correct indentation
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    if (rawValue === '') {
      // Nested object
      parent[key] = {};
      stack.push({ indent, obj: parent[key] });
    } else {
      // Leaf value
      parent[key] = parseYamlValue(rawValue);
    }
  }

  return result;
}

/**
 * Parse a YAML scalar value.
 */
function parseYamlValue(raw) {
  // Remove surrounding quotes
  if ((raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }

  // Booleans
  if (raw === 'true') return true;
  if (raw === 'false') return false;

  // Null
  if (raw === 'null' || raw === '~') return null;

  // Numbers
  const num = Number(raw);
  if (!isNaN(num) && raw !== '') return num;

  return raw;
}

// ── Minimal YAML serializer ──

/**
 * Serialize a nested object to YAML string.
 */
export function serializeToYaml(obj, indent = 0) {
  let output = '';
  const prefix = '  '.repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      output += `${prefix}${key}: null\n`;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      output += `${prefix}${key}:\n`;
      output += serializeToYaml(value, indent + 1);
    } else if (typeof value === 'string') {
      // Quote strings that contain special chars
      const needsQuotes = value.includes(':') || value.includes('#') ||
                          value.includes('{') || value.includes('}') ||
                          value.includes('[') || value.includes(']') ||
                          value.startsWith(' ') || value.endsWith(' ');
      output += `${prefix}${key}: ${needsQuotes ? `"${value}"` : value}\n`;
    } else {
      output += `${prefix}${key}: ${value}\n`;
    }
  }

  return output;
}
