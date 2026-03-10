import { describe, it, expect } from 'vitest';
import { parseSimpleYaml, serializeToYaml, getConfigValue, setConfigValue } from '../utils/pg-config.js';

describe('pg-config YAML parser', () => {
  it('should parse simple key-value pairs', () => {
    const yaml = `name: test\nversion: 1.0`;
    const result = parseSimpleYaml(yaml);
    expect(result.name).toBe('test');
    expect(result.version).toBe(1.0);
  });

  it('should parse nested objects', () => {
    const yaml = [
      'instance:',
      '  name: personal',
      'firebase:',
      '  projectId: my-project',
      '  databaseUrl: https://my-project.firebaseio.com'
    ].join('\n');
    const result = parseSimpleYaml(yaml);
    expect(result.instance.name).toBe('personal');
    expect(result.firebase.projectId).toBe('my-project');
    expect(result.firebase.databaseUrl).toBe('https://my-project.firebaseio.com');
  });

  it('should handle booleans and null', () => {
    const yaml = `enabled: true\ndisabled: false\nempty: null`;
    const result = parseSimpleYaml(yaml);
    expect(result.enabled).toBe(true);
    expect(result.disabled).toBe(false);
    expect(result.empty).toBe(null);
  });

  it('should handle quoted strings', () => {
    const yaml = `name: "John Doe"\npath: '/home/user'`;
    const result = parseSimpleYaml(yaml);
    expect(result.name).toBe('John Doe');
    expect(result.path).toBe('/home/user');
  });

  it('should skip comments and empty lines', () => {
    const yaml = [
      '# This is a comment',
      '',
      'name: test',
      '  # inline comment gets stripped',
      'value: 42'
    ].join('\n');
    const result = parseSimpleYaml(yaml);
    expect(result.name).toBe('test');
    expect(result.value).toBe(42);
  });

  it('should parse a full pg.config.yml', () => {
    const yaml = [
      'instance:',
      '  name: personal',
      'firebase:',
      '  projectId: planning-game-xp',
      '  databaseUrl: https://planning-game-xp-default-rtdb.firebaseio.com',
      '  credentialsPath: /home/user/serviceAccountKey.json',
      'user:',
      '  developerId: dev_001',
      '  name: Test User',
      '  email: test@example.com',
      'mcp:',
      '  serverName: planning-game-personal',
      '  autoUpdate: true'
    ].join('\n');
    const result = parseSimpleYaml(yaml);
    expect(result.instance.name).toBe('personal');
    expect(result.firebase.projectId).toBe('planning-game-xp');
    expect(result.user.developerId).toBe('dev_001');
    expect(result.mcp.autoUpdate).toBe(true);
  });
});

describe('pg-config YAML serializer', () => {
  it('should serialize a nested config', () => {
    const config = {
      instance: { name: 'personal' },
      firebase: { projectId: 'my-project' },
      mcp: { autoUpdate: true }
    };
    const yaml = serializeToYaml(config);
    expect(yaml).toContain('instance:');
    expect(yaml).toContain('  name: personal');
    expect(yaml).toContain('firebase:');
    expect(yaml).toContain('  projectId: my-project');
    expect(yaml).toContain('  autoUpdate: true');
  });

  it('should quote strings with special characters', () => {
    const config = {
      firebase: { databaseUrl: 'https://my-project.firebaseio.com' }
    };
    const yaml = serializeToYaml(config);
    // URL contains : so should be quoted
    expect(yaml).toContain('"https://my-project.firebaseio.com"');
  });

  it('should handle null values', () => {
    const config = { key: null };
    const yaml = serializeToYaml(config);
    expect(yaml).toContain('key: null');
  });

  it('should roundtrip parse → serialize → parse', () => {
    const original = {
      instance: { name: 'test' },
      firebase: {
        projectId: 'my-project',
        databaseUrl: 'https://example.com',
        credentialsPath: '/path/to/key.json'
      },
      user: {
        developerId: 'dev_001',
        name: 'Test',
        email: 'test@test.com'
      },
      mcp: {
        serverName: 'planning-game-test',
        autoUpdate: true
      }
    };

    const yaml = serializeToYaml(original);
    const parsed = parseSimpleYaml(yaml);

    expect(parsed.instance.name).toBe('test');
    expect(parsed.firebase.projectId).toBe('my-project');
    expect(parsed.user.developerId).toBe('dev_001');
    expect(parsed.mcp.autoUpdate).toBe(true);
  });
});

describe('getConfigValue', () => {
  it('should get nested values with dot notation', () => {
    const config = { firebase: { projectId: 'test' } };
    expect(getConfigValue(config, 'firebase.projectId')).toBe('test');
  });

  it('should return undefined for missing keys', () => {
    const config = { firebase: {} };
    expect(getConfigValue(config, 'firebase.missing')).toBeUndefined();
  });

  it('should return undefined for null config', () => {
    expect(getConfigValue(null, 'any.key')).toBeUndefined();
  });
});

describe('setConfigValue', () => {
  it('should set nested values with dot notation', () => {
    const config = {};
    setConfigValue(config, 'firebase.projectId', 'test');
    expect(config.firebase.projectId).toBe('test');
  });

  it('should create intermediate objects', () => {
    const config = {};
    setConfigValue(config, 'a.b.c', 'deep');
    expect(config.a.b.c).toBe('deep');
  });
});
