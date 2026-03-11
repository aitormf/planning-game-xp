import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMigrationPlan, executeMigration } from '../../scripts/migrate-claude-md-to-guidelines.js';
import { parseSections, parseSectionsWithExtraction } from '../../scripts/lib/claude-md-parser.js';
import { SUBSECTION_EXTRACTION } from '../../scripts/lib/section-mapping.js';

// Mock Firebase database
function createMockDb(existingData = {}) {
  const store = { ...existingData };

  return {
    ref: (path) => {
      const key = path.replace('global/instructions/', '');
      return {
        once: vi.fn(async () => ({
          exists: () => key in store,
          val: () => store[key] || null,
        })),
        set: vi.fn(async (data) => {
          store[key] = data;
        }),
        update: vi.fn(async (data) => {
          store[key] = { ...store[key], ...data };
        }),
      };
    },
    _store: store,
  };
}

const SAMPLE_MD = `# CLAUDE.md

This file provides guidance.

## Communication & Commit Guidelines

### Language Preferences
- Always speak in Spanish

### Git Commits
- Conventional commits

## Development Commands

### Core Development

\`\`\`bash
npm run dev
npm run build
\`\`\`

## Architecture Overview

### Tech Stack
- Frontend: Astro + Lit
- Backend: Firebase

## DOM Modern Best Practices

### Element Selection
Use querySelector.

## Security & Pre-commit Hooks

The project uses husky pre-commit hooks.

## Common Troubleshooting

### Emulator Issues
Check ports 8080, 9000.`;

describe('buildMigrationPlan', () => {
  it('should build a plan from parsed sections', () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);

    expect(plan.length).toBeGreaterThan(0);

    // Every entry should have section and target
    for (const entry of plan) {
      expect(entry).toHaveProperty('section');
      expect(entry).toHaveProperty('target');
      expect(entry.target).toHaveProperty('action');
      expect(entry.target).toHaveProperty('configId');
    }
  });

  it('should skip preamble sections', () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);

    const preambleEntries = plan.filter(e => e.section.name === '_preamble');
    expect(preambleEntries).toHaveLength(0);
  });

  it('should mark merge targets for mapped sections', () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);

    const commEntry = plan.find(e => e.section.name === 'Communication & Commit Guidelines');
    expect(commEntry.target.action).toBe('merge');
    expect(commEntry.target.configId).toBe('instr_code_style');

    const domEntry = plan.find(e => e.section.name === 'DOM Modern Best Practices');
    expect(domEntry.target.action).toBe('merge');
    expect(domEntry.target.configId).toBe('instr_code_style');

    const securityEntry = plan.find(e => e.section.name === 'Security & Pre-commit Hooks');
    expect(securityEntry.target.action).toBe('merge');
    expect(securityEntry.target.configId).toBe('instr_security');
  });

  it('should mark create targets for new sections', () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);

    const devEntry = plan.find(e => e.section.name === 'Development Commands');
    expect(devEntry.target.action).toBe('create');
    expect(devEntry.target.configId).toBe('instr_dev_commands');

    const archEntry = plan.find(e => e.section.name === 'Architecture Overview');
    expect(archEntry.target.action).toBe('create');
    expect(archEntry.target.configId).toBe('instr_architecture');

    const troubleEntry = plan.find(e => e.section.name === 'Common Troubleshooting');
    expect(troubleEntry.target.action).toBe('create');
    expect(troubleEntry.target.configId).toBe('instr_troubleshooting');
  });
});

describe('executeMigration', () => {
  it('should create new guidelines when they do not exist', async () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);
    const createOnly = plan.filter(e => e.target.action === 'create');

    const db = createMockDb();
    const results = await executeMigration(createOnly, db);

    expect(results.created.length).toBeGreaterThan(0);
    expect(results.errors).toHaveLength(0);
    expect(results.created).toContain('instr_dev_commands');
    expect(results.created).toContain('instr_architecture');
  });

  it('should skip creating guidelines that already exist', async () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);
    const createOnly = plan.filter(e => e.target.action === 'create');

    const db = createMockDb({
      instr_dev_commands: {
        name: 'Development Commands',
        content: 'Existing content',
        category: 'development',
      },
    });

    const results = await executeMigration(createOnly, db);

    expect(results.skipped).toContain('instr_dev_commands');
    expect(results.created).not.toContain('instr_dev_commands');
  });

  it('should merge content into existing guidelines', async () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);
    const mergeOnly = plan.filter(e => e.target.action === 'merge');

    const db = createMockDb({
      instr_code_style: {
        name: 'Code Style',
        content: 'Existing code style rules.',
        category: 'development',
      },
      instr_security: {
        name: 'Security',
        content: 'Existing security rules.',
        category: 'development',
      },
    });

    const results = await executeMigration(mergeOnly, db);

    expect(results.merged).toContain('instr_code_style');
    expect(results.merged).toContain('instr_security');
    expect(results.errors).toHaveLength(0);
  });

  it('should create merge targets that do not exist yet', async () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);
    const mergeOnly = plan.filter(e => e.target.action === 'merge');

    // No existing configs
    const db = createMockDb();
    const results = await executeMigration(mergeOnly, db);

    // Should fall back to create
    expect(results.created).toContain('instr_code_style');
    expect(results.created).toContain('instr_security');
  });

  it('should respect dry-run mode (no writes)', async () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);
    const createOnly = plan.filter(e => e.target.action === 'create');

    const db = createMockDb();
    const results = await executeMigration(createOnly, db, { dryRun: true });

    // Should report created but not actually write
    expect(results.created.length).toBeGreaterThan(0);
    // The mock store should be empty since nothing was written
    expect(Object.keys(db._store)).toHaveLength(0);
  });

  it('should handle full plan (merge + create) end-to-end', async () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);

    const db = createMockDb({
      instr_code_style: {
        name: 'Code Style',
        content: 'Existing rules.',
        category: 'development',
      },
    });

    const results = await executeMigration(plan, db);

    // Merge groups collapse multiple sections into one configId,
    // so total unique configs <= plan.length
    const total = results.created.length + results.merged.length + results.skipped.length;
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(plan.length);
    expect(results.errors).toHaveLength(0);
  });

  it('should store targetFile when creating new guidelines', async () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);
    const devEntry = plan.filter(e => e.target.configId === 'instr_dev_commands');

    const db = createMockDb();
    await executeMigration(devEntry, db);

    expect(db._store.instr_dev_commands).toBeDefined();
    expect(db._store.instr_dev_commands.targetFile).toBe('CLAUDE.md');
  });

  it('should store targetFile when creating from merge fallback', async () => {
    const sections = parseSections(SAMPLE_MD);
    const plan = buildMigrationPlan(sections);
    const mergeOnly = plan.filter(e => e.target.action === 'merge');

    // No existing configs — will fallback to create
    const db = createMockDb();
    await executeMigration(mergeOnly, db);

    expect(db._store.instr_code_style).toBeDefined();
    expect(db._store.instr_code_style.targetFile).toBe('CLAUDE.md');
  });
});

describe('buildMigrationPlan with subsection extraction', () => {
  const MD_WITH_SUBS = `## Architecture Overview

Intro.

### Tech Stack

- Astro + Lit

### MCP Card Workflow Rules

MCP content.

### Delivery Pipeline Tracking

Pipeline content.

### Test-First Development (MANDATORY)

Testing content.

### Coding Conventions

Coding content.

## Security & Pre-commit Hooks

Security content.`;

  it('should include extracted subsections in the plan', () => {
    const sections = parseSectionsWithExtraction(MD_WITH_SUBS, {
      extractFrom: SUBSECTION_EXTRACTION,
    });
    const plan = buildMigrationPlan(sections);

    const configIds = plan.map(e => e.target.configId);
    expect(configIds).toContain('instr_mcp_workflow');
    expect(configIds).toContain('instr_delivery_pipeline');
  });

  it('should merge extracted subsections mapped to existing configs', () => {
    const sections = parseSectionsWithExtraction(MD_WITH_SUBS, {
      extractFrom: SUBSECTION_EXTRACTION,
    });
    const plan = buildMigrationPlan(sections);

    const testEntry = plan.find(e => e.section.name === 'Test-First Development (MANDATORY)');
    expect(testEntry.target.action).toBe('merge');
    expect(testEntry.target.configId).toBe('instr_testing');

    const codingEntry = plan.find(e => e.section.name === 'Coding Conventions');
    expect(codingEntry.target.action).toBe('merge');
    expect(codingEntry.target.configId).toBe('instr_code_style');
  });

  it('should still include the parent section with remaining content', () => {
    const sections = parseSectionsWithExtraction(MD_WITH_SUBS, {
      extractFrom: SUBSECTION_EXTRACTION,
    });
    const plan = buildMigrationPlan(sections);

    const archEntry = plan.find(e => e.section.name === 'Architecture Overview');
    expect(archEntry).toBeDefined();
    expect(archEntry.section.content).toContain('Tech Stack');
    expect(archEntry.section.content).not.toContain('MCP Card Workflow Rules');
  });
});
