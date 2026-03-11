import { describe, it, expect } from 'vitest';
import {
  generateClaudeMd,
  orderGuidelines,
  SECTION_ORDER,
  PREAMBLE_TEMPLATE,
} from '../../scripts/lib/sync-guidelines.js';

describe('SECTION_ORDER', () => {
  it('should define an ordered list of configIds', () => {
    expect(Array.isArray(SECTION_ORDER)).toBe(true);
    expect(SECTION_ORDER.length).toBeGreaterThan(0);
    expect(SECTION_ORDER).toContain('instr_code_style');
    expect(SECTION_ORDER).toContain('instr_architecture');
  });
});

describe('PREAMBLE_TEMPLATE', () => {
  it('should contain the CLAUDE.md header', () => {
    expect(PREAMBLE_TEMPLATE).toContain('# CLAUDE.md');
  });
});

describe('orderGuidelines', () => {
  it('should sort guidelines by SECTION_ORDER', () => {
    const guidelines = [
      { configId: 'instr_architecture', name: 'Architecture', content: 'arch' },
      { configId: 'instr_code_style', name: 'Code Style', content: 'code' },
      { configId: 'instr_dev_commands', name: 'Dev Commands', content: 'cmds' },
    ];

    const ordered = orderGuidelines(guidelines);

    const ids = ordered.map(g => g.configId);
    const codeIdx = ids.indexOf('instr_code_style');
    const devIdx = ids.indexOf('instr_dev_commands');
    const archIdx = ids.indexOf('instr_architecture');

    // Code style should come before dev commands and architecture
    expect(codeIdx).toBeLessThan(devIdx);
    expect(devIdx).toBeLessThan(archIdx);
  });

  it('should place unknown guidelines at the end', () => {
    const guidelines = [
      { configId: 'instr_unknown_custom', name: 'Custom', content: 'custom' },
      { configId: 'instr_code_style', name: 'Code Style', content: 'code' },
    ];

    const ordered = orderGuidelines(guidelines);
    expect(ordered[0].configId).toBe('instr_code_style');
    expect(ordered[1].configId).toBe('instr_unknown_custom');
  });

  it('should return empty array for empty input', () => {
    expect(orderGuidelines([])).toEqual([]);
  });

  it('should sort multiple unknown guidelines alphabetically by name', () => {
    const guidelines = [
      { configId: 'instr_z_custom', name: 'Zebra Custom', content: '' },
      { configId: 'instr_a_custom', name: 'Alpha Custom', content: '' },
    ];

    const ordered = orderGuidelines(guidelines);
    expect(ordered[0].configId).toBe('instr_a_custom');
    expect(ordered[1].configId).toBe('instr_z_custom');
  });
});

describe('generateClaudeMd', () => {
  it('should generate valid markdown with preamble and sections', () => {
    const guidelines = [
      {
        configId: 'instr_code_style',
        name: 'Code Style',
        content: '## Communication & Commit Guidelines\n\nAlways use conventional commits.',
      },
      {
        configId: 'instr_dev_commands',
        name: 'Development Commands',
        content: '## Development Commands\n\n```bash\nnpm run dev\n```',
      },
    ];

    const md = generateClaudeMd(guidelines);

    expect(md).toContain('# CLAUDE.md');
    expect(md).toContain('Always use conventional commits.');
    expect(md).toContain('npm run dev');
  });

  it('should include preamble at the top', () => {
    const md = generateClaudeMd([
      { configId: 'instr_code_style', name: 'Code', content: '## Code\n\nContent.' },
    ]);

    const lines = md.split('\n');
    expect(lines[0]).toBe('# CLAUDE.md');
  });

  it('should order sections according to SECTION_ORDER', () => {
    const guidelines = [
      { configId: 'instr_architecture', name: 'Architecture', content: '## Architecture\n\nArch content.' },
      { configId: 'instr_code_style', name: 'Code Style', content: '## Code Style\n\nCode content.' },
    ];

    const md = generateClaudeMd(guidelines);

    const codePos = md.indexOf('Code content.');
    const archPos = md.indexOf('Arch content.');
    expect(codePos).toBeLessThan(archPos);
  });

  it('should return only preamble when no guidelines provided', () => {
    const md = generateClaudeMd([]);

    expect(md).toContain('# CLAUDE.md');
    expect(md.trim().split('\n').length).toBeGreaterThan(0);
  });

  it('should handle guidelines with targetFile field', () => {
    const guidelines = [
      {
        configId: 'instr_code_style',
        name: 'Code Style',
        content: '## Code Style\n\nRules here.',
        targetFile: 'CLAUDE.md',
      },
    ];

    const md = generateClaudeMd(guidelines);
    expect(md).toContain('Rules here.');
  });

  it('should filter guidelines by targetFile when specified', () => {
    const guidelines = [
      {
        configId: 'instr_code_style',
        name: 'Code Style',
        content: '## Code Style\n\nRules here.',
        targetFile: 'CLAUDE.md',
      },
      {
        configId: 'instr_mcp_internal',
        name: 'MCP Internal',
        content: '## MCP Internal\n\nInternal rules.',
        targetFile: 'mcp/CLAUDE.md',
      },
    ];

    const mdMain = generateClaudeMd(guidelines, { targetFile: 'CLAUDE.md' });
    expect(mdMain).toContain('Rules here.');
    expect(mdMain).not.toContain('Internal rules.');

    const mdMcp = generateClaudeMd(guidelines, { targetFile: 'mcp/CLAUDE.md' });
    expect(mdMcp).toContain('Internal rules.');
    expect(mdMcp).not.toContain('Rules here.');
  });

  it('should include all guidelines when no targetFile filter is specified', () => {
    const guidelines = [
      {
        configId: 'instr_code_style',
        name: 'Code Style',
        content: '## Code Style\n\nRules here.',
        targetFile: 'CLAUDE.md',
      },
      {
        configId: 'instr_other',
        name: 'Other',
        content: '## Other\n\nOther content.',
      },
    ];

    const md = generateClaudeMd(guidelines);
    expect(md).toContain('Rules here.');
    expect(md).toContain('Other content.');
  });

  it('should separate sections with double newlines', () => {
    const guidelines = [
      { configId: 'instr_code_style', name: 'Code', content: '## Code\n\nFirst section.' },
      { configId: 'instr_dev_commands', name: 'Commands', content: '## Commands\n\nSecond section.' },
    ];

    const md = generateClaudeMd(guidelines);
    expect(md).toContain('First section.\n\n## Commands');
  });

  it('should not produce duplicate ## headings from content', () => {
    const guidelines = [
      {
        configId: 'instr_code_style',
        name: 'Code Style',
        content: '## Communication & Commit Guidelines\n\nComm rules.\n\n---\n\n## DOM Modern Best Practices\n\nDOM rules.',
      },
    ];

    const md = generateClaudeMd(guidelines);
    // Content already has headings, should be used as-is
    expect(md).toContain('## Communication & Commit Guidelines');
    expect(md).toContain('## DOM Modern Best Practices');
  });
});
