/**
 * Generate a CLAUDE.md from Firebase guidelines.
 *
 * Reads guidelines (type=instructions) from Firebase and assembles them
 * into a CLAUDE.md file with proper section ordering.
 *
 * Used by: sync_guidelines MCP tool / migration scripts
 */

/**
 * Preamble template for generated CLAUDE.md files.
 */
export const PREAMBLE_TEMPLATE = `# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.`;

/**
 * Ordered list of configIds defining the section order in the generated CLAUDE.md.
 * Guidelines not in this list are appended at the end, sorted alphabetically by name.
 */
export const SECTION_ORDER = [
  'instr_code_style',
  'instr_dev_commands',
  'instr_architecture',
  'instr_system_requirements',
  'instr_testing',
  'instr_security',
  'instr_ui_ux',
  'instr_lit_components',
  'instr_component_catalog',
  'instr_dev_workflow',
  'instr_mcp_workflow',
  'instr_delivery_pipeline',
  'instr_troubleshooting',
  'instr_additional_build',
];

/**
 * Order guidelines according to SECTION_ORDER.
 * Known guidelines come first in the defined order.
 * Unknown guidelines are appended alphabetically by name.
 *
 * @param {Array<{configId: string, name: string, content: string}>} guidelines
 * @returns {Array<{configId: string, name: string, content: string}>}
 */
export function orderGuidelines(guidelines) {
  if (!guidelines || guidelines.length === 0) return [];

  const orderMap = new Map(SECTION_ORDER.map((id, idx) => [id, idx]));

  const known = [];
  const unknown = [];

  for (const g of guidelines) {
    if (orderMap.has(g.configId)) {
      known.push(g);
    } else {
      unknown.push(g);
    }
  }

  known.sort((a, b) => orderMap.get(a.configId) - orderMap.get(b.configId));
  unknown.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return [...known, ...unknown];
}

/**
 * Generate a CLAUDE.md string from an array of guideline objects.
 *
 * @param {Array<{configId: string, name: string, content: string, targetFile?: string}>} guidelines
 * @param {Object} [options]
 * @param {string} [options.targetFile] - If set, only include guidelines matching this targetFile
 * @returns {string} Generated CLAUDE.md content
 */
export function generateClaudeMd(guidelines, options = {}) {
  const { targetFile } = options;

  let filtered = guidelines;
  if (targetFile) {
    filtered = guidelines.filter(g => g.targetFile === targetFile);
  }

  const ordered = orderGuidelines(filtered);
  const parts = [PREAMBLE_TEMPLATE];

  for (const guideline of ordered) {
    const content = (guideline.content || '').trim();
    if (content) {
      parts.push(content);
    }
  }

  return parts.join('\n\n') + '\n';
}
