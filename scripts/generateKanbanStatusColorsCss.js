import fs from 'fs';
import path from 'path';

/**
 * Convierte una clave a un nombre de clase CSS.
 * @param {string} key - Clave del estado Kanban.
 * @returns {string} Nombre de clase CSS.
 */
function toCssClassName(key) {
  return '.' + key.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, '');
}

/**
 * Genera el archivo theme-config.js a partir de los colores Kanban.
 * @param {object} KANBAN_BG_COLORS - Objeto con los colores de fondo de los estados Kanban.
 * @returns {void}
 */
export function generateKanbanStatusColorsCss(KANBAN_BG_COLORS) {
  const cssLines = Object.entries(KANBAN_BG_COLORS)
    .map(([key, value]) => `${toCssClassName(key)} { background: ${value}; color: #fff; }`)
    .join('\n');
  const output = `// Este archivo es generado automáticamente por astro.config.mjs
  export const KANBAN_STATUS_COLORS_CSS = \`\n${cssLines}\n\``;

  const outPath = path.resolve('public/js/config/theme-config.js');
  fs.writeFileSync(outPath, output, 'utf8');
  console.log('✅ File theme-config.js generated successfully!');
} 