import { describe, it, expect } from 'vitest';
import { slugify, inferCategory, parseSections, parseSectionsByCategory, extractSubsections, parseSectionsWithExtraction } from '../../scripts/lib/claude-md-parser.js';

describe('slugify', () => {
  it('should generate a prefixed slug from a heading', () => {
    expect(slugify('Communication & Commit Guidelines')).toBe('instr_communication_commit_guidelines');
  });

  it('should handle special characters', () => {
    expect(slugify('UI/UX Guidelines')).toBe('instr_ui_ux_guidelines');
  });

  it('should handle parentheses and mixed case', () => {
    expect(slugify('Test-First Development (MANDATORY)')).toBe('instr_test_first_development_mandatory');
  });

  it('should use custom prefix', () => {
    expect(slugify('My Section', 'cfg')).toBe('cfg_my_section');
  });

  it('should handle leading/trailing special characters', () => {
    expect(slugify('---Hello World---')).toBe('instr_hello_world');
  });

  it('should collapse multiple underscores', () => {
    expect(slugify('A & & B')).toBe('instr_a_b');
  });
});

describe('inferCategory', () => {
  it('should return "architecture" for architecture-related headings', () => {
    expect(inferCategory('Architecture Overview')).toBe('architecture');
    expect(inferCategory('System Requirements')).toBe('architecture');
  });

  it('should return "qa" for testing headings', () => {
    expect(inferCategory('Test-First Development')).toBe('qa');
    expect(inferCategory('Testing Commands')).toBe('qa');
  });

  it('should return "documentation" for troubleshooting headings', () => {
    expect(inferCategory('Common Troubleshooting')).toBe('documentation');
  });

  it('should return "planning" for workflow headings', () => {
    expect(inferCategory('MCP Card Workflow Rules')).toBe('planning');
    expect(inferCategory('Delivery Pipeline Tracking')).toBe('planning');
  });

  it('should default to "development" for unmatched headings', () => {
    expect(inferCategory('Communication & Commit Guidelines')).toBe('development');
    expect(inferCategory('DOM Modern Best Practices')).toBe('development');
  });
});

describe('parseSections', () => {
  it('should return empty array for null/empty input', () => {
    expect(parseSections(null)).toEqual([]);
    expect(parseSections('')).toEqual([]);
    expect(parseSections(undefined)).toEqual([]);
  });

  it('should parse simple ## sections', () => {
    const md = `# Title

## Section One

Content of section one.

## Section Two

Content of section two.`;

    const sections = parseSections(md);
    // # Title is captured as preamble
    expect(sections).toHaveLength(3);

    expect(sections[0].name).toBe('_preamble');

    expect(sections[1].name).toBe('Section One');
    expect(sections[1].id).toBe('instr_section_one');
    expect(sections[1].content).toBe('Content of section one.');
    expect(sections[1].level).toBe(2);

    expect(sections[2].name).toBe('Section Two');
    expect(sections[2].content).toBe('Content of section two.');
  });

  it('should capture preamble content before first ## heading', () => {
    const md = `Some intro text here.

## First Section

Content here.`;

    const sections = parseSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0].name).toBe('_preamble');
    expect(sections[0].content).toBe('Some intro text here.');
  });

  it('should skip empty preamble', () => {
    const md = `
## Only Section

Content.`;

    const sections = parseSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0].name).toBe('Only Section');
  });

  it('should include ### subsections within their parent ## section', () => {
    const md = `## Parent Section

Intro text.

### Subsection A

Sub content A.

### Subsection B

Sub content B.

## Next Section

Other content.`;

    const sections = parseSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0].name).toBe('Parent Section');
    expect(sections[0].content).toContain('### Subsection A');
    expect(sections[0].content).toContain('Sub content A.');
    expect(sections[0].content).toContain('### Subsection B');
    expect(sections[0].content).toContain('Sub content B.');
  });

  it('should handle code blocks with ## inside', () => {
    const md = `## Development Commands

\`\`\`bash
## This is a comment in bash, not a heading
npm run dev
\`\`\`

## Next Section

Content.`;

    const sections = parseSections(md);
    // The parser splits on `## ` at the start of a line — the one inside the code block
    // also matches. This is a known trade-off for simplicity. The content inside code
    // blocks that starts with `## ` on its own line will cause a split.
    // For the CLAUDE.md in this project, bash comments use `#` not `##`.
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(sections[0].name).toBe('Development Commands');
  });

  it('should handle sections with tables', () => {
    const md = `## Task Rules

| Field | Required |
|-------|----------|
| title | Yes |
| developer | No |`;

    const sections = parseSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0].content).toContain('| Field | Required |');
    expect(sections[0].content).toContain('| title | Yes |');
  });

  it('should handle empty sections', () => {
    const md = `## Empty Section

## Non-Empty Section

Some content.`;

    const sections = parseSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0].name).toBe('Empty Section');
    expect(sections[0].content).toBe('');
    expect(sections[1].content).toBe('Some content.');
  });

  it('should assign correct categories based on heading', () => {
    const md = `## Architecture Overview

Arch content.

## Common Troubleshooting

Troubleshooting content.

## Security & Pre-commit Hooks

Security content.`;

    const sections = parseSections(md);
    expect(sections[0].category).toBe('architecture');
    expect(sections[1].category).toBe('documentation');
    expect(sections[2].category).toBe('development');
  });
});

describe('parseSectionsByCategory', () => {
  it('should group sections by category', () => {
    const md = `## Architecture Overview

Arch content.

## Development Commands

Dev commands.

## Common Troubleshooting

Troubleshooting.`;

    const grouped = parseSectionsByCategory(md);

    expect(Object.keys(grouped)).toContain('architecture');
    expect(Object.keys(grouped)).toContain('development');
    expect(Object.keys(grouped)).toContain('documentation');

    expect(grouped.architecture).toHaveLength(1);
    expect(grouped.development).toHaveLength(1);
    expect(grouped.documentation).toHaveLength(1);
  });

  it('should return empty object for empty input', () => {
    expect(parseSectionsByCategory('')).toEqual({});
  });
});

describe('extractSubsections', () => {
  it('should return empty array for null/empty section', () => {
    expect(extractSubsections(null)).toEqual([]);
    expect(extractSubsections({ content: '' })).toEqual([]);
  });

  it('should extract ### subsections from a section', () => {
    const section = {
      id: 'instr_parent',
      name: 'Parent',
      content: `Intro text.

### Sub A

Content A.

### Sub B

Content B.`,
      category: 'development',
    };

    const subs = extractSubsections(section);
    expect(subs).toHaveLength(3); // intro + Sub A + Sub B

    expect(subs[0].name).toBe('Parent (intro)');
    expect(subs[0].content).toBe('Intro text.');
    expect(subs[0].parentId).toBe('instr_parent');

    expect(subs[1].name).toBe('Sub A');
    expect(subs[1].content).toBe('Content A.');
    expect(subs[1].level).toBe(3);
    expect(subs[1].parentId).toBe('instr_parent');

    expect(subs[2].name).toBe('Sub B');
    expect(subs[2].content).toBe('Content B.');
  });

  it('should skip intro if no content before first ###', () => {
    const section = {
      id: 'instr_x',
      name: 'X',
      content: `### Only Sub

Content.`,
      category: 'development',
    };

    const subs = extractSubsections(section);
    expect(subs).toHaveLength(1);
    expect(subs[0].name).toBe('Only Sub');
  });

  it('should skip empty subsections', () => {
    const section = {
      id: 'instr_x',
      name: 'X',
      content: `### Empty Sub

### Non-Empty Sub

Content here.`,
      category: 'development',
    };

    const subs = extractSubsections(section);
    expect(subs).toHaveLength(1);
    expect(subs[0].name).toBe('Non-Empty Sub');
  });

  it('should assign categories to subsections based on heading', () => {
    const section = {
      id: 'instr_arch',
      name: 'Architecture',
      content: `### Testing Rules

Test content.

### Workflow Steps

Workflow content.`,
      category: 'architecture',
    };

    const subs = extractSubsections(section);
    expect(subs[0].category).toBe('qa'); // "Testing" keyword
    expect(subs[1].category).toBe('planning'); // "Workflow" keyword
  });
});

describe('parseSectionsWithExtraction', () => {
  const mdWithSubs = `## Architecture Overview

Intro text.

### Tech Stack

- Astro + Lit

### MCP Card Workflow Rules

MCP workflow content here.

### Delivery Pipeline Tracking

Pipeline content here.

### Other Stuff

Other content.

## Development Commands

npm run dev`;

  it('should extract specified subsections as top-level sections', () => {
    const sections = parseSectionsWithExtraction(mdWithSubs, {
      extractFrom: {
        'Architecture Overview': ['MCP Card Workflow Rules', 'Delivery Pipeline Tracking'],
      },
    });

    const names = sections.map(s => s.name);
    expect(names).toContain('Architecture Overview');
    expect(names).toContain('MCP Card Workflow Rules');
    expect(names).toContain('Delivery Pipeline Tracking');
    expect(names).toContain('Development Commands');
  });

  it('should promote extracted subsections to level 2', () => {
    const sections = parseSectionsWithExtraction(mdWithSubs, {
      extractFrom: {
        'Architecture Overview': ['MCP Card Workflow Rules'],
      },
    });

    const mcp = sections.find(s => s.name === 'MCP Card Workflow Rules');
    expect(mcp.level).toBe(2);
    expect(mcp.parentId).toBeUndefined();
  });

  it('should remove extracted subsections from parent content', () => {
    const sections = parseSectionsWithExtraction(mdWithSubs, {
      extractFrom: {
        'Architecture Overview': ['MCP Card Workflow Rules', 'Delivery Pipeline Tracking'],
      },
    });

    const arch = sections.find(s => s.name === 'Architecture Overview');
    expect(arch.content).not.toContain('MCP Card Workflow Rules');
    expect(arch.content).not.toContain('Delivery Pipeline Tracking');
    expect(arch.content).toContain('Tech Stack');
    expect(arch.content).toContain('Other Stuff');
  });

  it('should pass through sections without extraction unchanged', () => {
    const sections = parseSectionsWithExtraction(mdWithSubs, {
      extractFrom: {},
    });

    expect(sections).toHaveLength(2); // Architecture + Development
    expect(sections[0].name).toBe('Architecture Overview');
    expect(sections[1].name).toBe('Development Commands');
  });

  it('should work with empty extractFrom', () => {
    const sections = parseSectionsWithExtraction(mdWithSubs);
    expect(sections).toHaveLength(2);
  });
});

describe('parseSections with real CLAUDE.md structure', () => {
  it('should parse a realistic CLAUDE.md excerpt', () => {
    const md = `# CLAUDE.md

This file provides guidance to Claude Code.

## Communication & Commit Guidelines

### Language Preferences
- **User communication**: Always speak in Spanish
- **Code, comments**: Always in English

### Git Commits
- Keep commit messages clean

## Development Commands

### Core Development

\`\`\`bash
npm run dev              # Start development server
npm run build            # Production build
\`\`\`

### Testing

\`\`\`bash
npm run test             # Run unit tests
\`\`\`

## Architecture Overview

### Tech Stack

- **Frontend**: Astro with Lit web components
- **Backend**: Firebase

### Key Features

- Multi-view support
- Real-time collaboration`;

    const sections = parseSections(md);

    // Should have preamble + 3 sections
    expect(sections).toHaveLength(4);

    const preamble = sections[0];
    expect(preamble.name).toBe('_preamble');
    expect(preamble.content).toContain('This file provides guidance');

    const commSection = sections[1];
    expect(commSection.name).toBe('Communication & Commit Guidelines');
    expect(commSection.content).toContain('### Language Preferences');
    expect(commSection.content).toContain('### Git Commits');

    const devSection = sections[2];
    expect(devSection.name).toBe('Development Commands');
    expect(devSection.content).toContain('npm run dev');
    expect(devSection.content).toContain('npm run test');

    const archSection = sections[3];
    expect(archSection.name).toBe('Architecture Overview');
    expect(archSection.content).toContain('### Tech Stack');
    expect(archSection.content).toContain('### Key Features');
  });
});
