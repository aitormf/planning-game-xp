/**
 * Mapping between CLAUDE.md sections and existing global_config entries in Firebase.
 *
 * Sections listed here will be MERGED with existing configs rather than
 * creating duplicates. The merge appends new content after a separator.
 *
 * Keys: section heading (as it appears after ## in CLAUDE.md)
 * Values: { configId, mergeStrategy }
 *   - configId: existing Firebase key under /global/instructions/
 *   - mergeStrategy: 'append' (add after separator) or 'replace' (overwrite content)
 */
export const SECTION_MERGE_MAP = {
  'Communication & Commit Guidelines': {
    configId: 'instr_code_style',
    mergeStrategy: 'append',
    targetFile: 'CLAUDE.md',
  },
  'DOM Modern Best Practices': {
    configId: 'instr_code_style',
    mergeStrategy: 'append',
    targetFile: 'CLAUDE.md',
  },
  'Security & Pre-commit Hooks': {
    configId: 'instr_security',
    mergeStrategy: 'append',
    targetFile: 'CLAUDE.md',
  },
  'Test-First Development (MANDATORY)': {
    configId: 'instr_testing',
    mergeStrategy: 'append',
    targetFile: 'CLAUDE.md',
  },
  'Coding Conventions': {
    configId: 'instr_code_style',
    mergeStrategy: 'append',
    targetFile: 'CLAUDE.md',
  },
};

/**
 * Subsections to extract from large parent sections.
 *
 * Keys: parent section heading (## level)
 * Values: array of ### heading names to extract as top-level sections
 *
 * Extracted subsections are promoted to ## level and processed independently
 * through SECTION_MERGE_MAP / SECTION_CREATE_MAP.
 */
export const SUBSECTION_EXTRACTION = {
  'Architecture Overview': [
    'Test-First Development (MANDATORY)',
    'Development Workflow',
    'MCP Card Workflow Rules',
    'Delivery Pipeline Tracking',
    'Lit Components Conventions',
    'Component Catalog',
    'Coding Conventions',
  ],
};

/**
 * Sections to create as new guidelines in Firebase.
 * Each entry maps a section heading to its target configId and category.
 *
 * If a section heading is NOT in SECTION_MERGE_MAP and NOT in SECTION_CREATE_MAP,
 * it will be auto-created using the slugified heading as configId.
 */
export const SECTION_CREATE_MAP = {
  'Development Commands': {
    configId: 'instr_dev_commands',
    category: 'development',
    description: 'Development, testing, deployment, and emulator commands',
    targetFile: 'CLAUDE.md',
  },
  'Architecture Overview': {
    configId: 'instr_architecture',
    category: 'architecture',
    description: 'Tech stack, services, patterns, project structure, and data model',
    targetFile: 'CLAUDE.md',
  },
  'Common Troubleshooting': {
    configId: 'instr_troubleshooting',
    category: 'documentation',
    description: 'Common issues and solutions for emulators, builds, testing, and system requirements',
    targetFile: 'CLAUDE.md',
  },
  'Additional Build Commands': {
    configId: 'instr_additional_build',
    category: 'development',
    description: 'Additional build and test commands',
    targetFile: 'CLAUDE.md',
  },
  'System Requirements': {
    configId: 'instr_system_requirements',
    category: 'architecture',
    description: 'Browser requirements, system capabilities, and verification',
    targetFile: 'CLAUDE.md',
  },
  'MCP Card Workflow Rules': {
    configId: 'instr_mcp_workflow',
    category: 'planning',
    description: 'MCP card workflow checklists: tasks, bugs, pipeline, user identification',
    targetFile: 'CLAUDE.md',
  },
  'Delivery Pipeline Tracking': {
    configId: 'instr_delivery_pipeline',
    category: 'planning',
    description: 'Pipeline tracking from commit to deployment, branch naming, PR requirements',
    targetFile: 'CLAUDE.md',
  },
  'Lit Components Conventions': {
    configId: 'instr_lit_components',
    category: 'development',
    description: 'Lit web component conventions, naming, CSS separation, communication patterns',
    targetFile: 'CLAUDE.md',
  },
  'Component Catalog': {
    configId: 'instr_component_catalog',
    category: 'development',
    description: 'Full catalog of web components, base classes, Astro components',
    targetFile: 'CLAUDE.md',
  },
  'Development Workflow': {
    configId: 'instr_dev_workflow',
    category: 'planning',
    description: 'Step-by-step development workflow, branching, deployment rules',
    targetFile: 'CLAUDE.md',
  },
};

/**
 * Sections to SKIP entirely (not migrated to Firebase).
 * These are preamble or meta-content that doesn't belong in guidelines.
 */
export const SECTION_SKIP = new Set([
  '_preamble',
]);

/**
 * Content separator used when merging sections into existing configs.
 */
export const MERGE_SEPARATOR = '\n\n---\n\n';

/**
 * Resolve the target config for a parsed section.
 *
 * @param {{id: string, name: string, category: string}} section
 * @returns {{action: 'merge'|'create'|'skip', configId: string, category?: string, description?: string, mergeStrategy?: string, targetFile?: string}}
 */
export function resolveTarget(section) {
  if (SECTION_SKIP.has(section.name)) {
    return { action: 'skip', configId: null };
  }

  const mergeEntry = SECTION_MERGE_MAP[section.name];
  if (mergeEntry) {
    return {
      action: 'merge',
      configId: mergeEntry.configId,
      mergeStrategy: mergeEntry.mergeStrategy,
      targetFile: mergeEntry.targetFile,
    };
  }

  const createEntry = SECTION_CREATE_MAP[section.name];
  if (createEntry) {
    return {
      action: 'create',
      configId: createEntry.configId,
      category: createEntry.category,
      description: createEntry.description,
      targetFile: createEntry.targetFile,
    };
  }

  // Auto-create with slugified ID
  return {
    action: 'create',
    configId: section.id,
    category: section.category,
  };
}
