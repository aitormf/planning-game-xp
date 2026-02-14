#!/usr/bin/env node

/**
 * Script para migrar de sinsole.js a sinsole-log
 * Actualiza todos los imports y categoriza los logs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const JS_DIR = path.join(PROJECT_ROOT, 'public', 'js');

// Archivos a excluir
const EXCLUDE_PATTERNS = [
  'sinsole.js',
  'sinsole-log.js',
  'sinsole-package',
  'sinsole-migration-example.js',
  'sinsole-advanced-usage.js',
  'sinsole-config.js'
];

// Mapeo de patrones a categorías
const PATTERN_TO_CATEGORY = {
  // Firebase
  'Firebase|firebase|Firebase Service|FIREBASE': 'FIREBASE',
  'Firestore|firestore': 'DB',
  'Storage|storage|upload|Upload': 'STORAGE',
  
  // Autenticación
  'Auth|auth|login|Login|usuario autenticado|User authenticated': 'AUTH',
  'Permission|permission|permisos': 'PERMISSION',
  
  // Cards específicas
  'TaskCard|Task Card|task card': 'TASK',
  'BugCard|Bug Card|bug card': 'BUG',
  'EpicCard|Epic Card|epic card': 'EPIC',
  'SprintCard|Sprint Card|sprint card': 'SPRINT',
  'ProposalCard|Proposal Card|proposal card': 'PROPOSAL',
  'QACard|QA Card|qa card': 'QA',
  
  // Notas
  'Note|note|nota|Notes|notes': 'NOTE',
  
  // Notificaciones
  '🔔|Notification|notification|Push notification|push': 'NOTIFICATION',
  
  // Eventos
  '🎯|EventDelegation|Event Delegation|event delegation': 'DELEGATION',
  'Event|event|click|Click': 'EVENT',
  
  // Vistas
  'ViewFactory|View Factory|view factory': 'FACTORY',
  'TableRenderer|Table Renderer|table': 'TABLE',
  'ListRenderer|List Renderer|list': 'LIST',
  'GanttRenderer|Gantt|gantt': 'GANTT',
  'KanbanRenderer|Kanban|kanban': 'KANBAN',
  'Render|render|rendering': 'RENDER',
  
  // Filtros
  'Filter|filter|filtro|Filters|filters': 'FILTER',
  
  // Inicialización
  '🚀|initialized|Initialized|inicializado|starting|Starting': 'INIT',
  
  // Modal
  'Modal|modal': 'MODAL',
  
  // Cache
  'Cache|cache': 'CACHE',
  
  // Lazy loading
  'Lazy|lazy|LazyLoader': 'LAZY',
  
  // Performance
  'Performance|performance|tiempo|time': 'PERFORMANCE',
  
  // Network/API
  'API|api|fetch|Fetch|request|Request': 'API',
  
  // UI
  'UI|ui|interface|Interface': 'UI',
  
  // History
  'History|history|historial': 'HISTORY',
  
  // Updates
  'Update|update|actualización': 'UPDATE',
  
  // Realtime
  'Realtime|realtime|sync|Sync': 'REALTIME',
  
  // Service
  'Service|service': 'SERVICE',
  
  // Mixins
  'Mixin|mixin': 'MIXIN'
};

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function detectCategory(logMessage) {
  for (const [pattern, category] of Object.entries(PATTERN_TO_CATEGORY)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(logMessage)) {
      return category;
    }
  }
  return null; // No category detected
}

function processFile(filePath) {
  if (shouldExclude(filePath)) {
    console.log(`Skipping: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 1. Reemplazar imports
  const importPattern = /import\s*{\s*sinsole\s*}\s*from\s*['"][^'"]*sinsole\.js['"]/g;
  if (importPattern.test(content)) {
    // Primero reemplazar el import con el de sinsole-log
    content = content.replace(importPattern, "import { sinsole } from 'sinsole-log'");
    
    // Luego agregar la configuración si es necesario
    // Solo agregar si no existe ya
    if (!content.includes('sinsole-config')) {
      // Agregar import de configuración después del import de sinsole-log
      content = content.replace(
        "import { sinsole } from 'sinsole-log'",
        "import { sinsole } from '../config/sinsole-config.js'"
      );
    }
    modified = true;
    console.log(`✓ Updated imports in: ${path.relative(PROJECT_ROOT, filePath)}`);
  }

  // 2. Categorizar logs (solo mostrar, no modificar automáticamente para revisión)
  const logPatterns = [
    /sinsole\.log\(([^)]+)\)/g,
    /sinsole\.error\(([^)]+)\)/g,
    /sinsole\.warn\(([^)]+)\)/g,
    /sinsole\.info\(([^)]+)\)/g
  ];

  const suggestions = [];
  for (const pattern of logPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const logContent = match[1];
      const category = detectCategory(logContent);
      if (category) {
        const line = content.substring(0, match.index).split('\n').length;
        suggestions.push({
          line,
          original: match[0],
          category,
          suggested: match[0].replace(')', `, '${category}')`)
        });
      }
    }
  }

  if (suggestions.length > 0) {
    console.log(`\n📝 Suggestions for ${path.relative(PROJECT_ROOT, filePath)}:`);
    suggestions.forEach(s => {
      console.log(`  Line ${s.line}: Add category '${s.category}'`);
      console.log(`    ${s.original} → ${s.suggested}`);
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return { modified, suggestions: suggestions.length };
}

function findJSFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (!item.includes('node_modules') && !item.includes('.git')) {
        findJSFiles(fullPath, files);
      }
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
console.log('🚀 Starting migration to sinsole-log...\n');

const jsFiles = findJSFiles(JS_DIR);
let totalModified = 0;
let totalSuggestions = 0;

for (const file of jsFiles) {
  const result = processFile(file);
  if (result) {
    if (result.modified) totalModified++;
    totalSuggestions += result.suggestions;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`✅ Migration complete!`);
console.log(`📊 Files modified: ${totalModified}`);
console.log(`💡 Total categorization suggestions: ${totalSuggestions}`);
console.log('\nNext steps:');
console.log('1. Review the categorization suggestions above');
console.log('2. Manually add categories where appropriate');
console.log('3. Test the application');
console.log('4. Use sd.filter() in console to filter by categories');
