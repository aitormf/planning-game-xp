#!/usr/bin/env node
/**
 * Migra /projects para usar dev_XXX y stk_XXX en lugar de emails/nombres.
 *
 * Uso:
 *   node scripts/migrate-projects-to-entity-ids.js
 *
 * Lee:
 *   - data/projects.json
 *   - data/developers.json
 *   - data/stakeholders.json
 *
 * Escribe:
 *   - data/projects-migrated.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

// Leer archivos
const projects = JSON.parse(fs.readFileSync(path.join(dataDir, 'projects.json'), 'utf8'));
const developers = JSON.parse(fs.readFileSync(path.join(dataDir, 'developers.json'), 'utf8'));
const stakeholders = JSON.parse(fs.readFileSync(path.join(dataDir, 'stakeholders.json'), 'utf8'));

// Crear índices por email (normalizado a minúsculas)
const devByEmail = new Map();
for (const [id, dev] of Object.entries(developers)) {
  if (dev.email) {
    devByEmail.set(dev.email.toLowerCase(), id);
  }
}

const stkByEmail = new Map();
for (const [id, stk] of Object.entries(stakeholders)) {
  if (stk.email) {
    stkByEmail.set(stk.email.toLowerCase(), id);
  }
}

console.log(`📊 Developers: ${devByEmail.size} emails indexados`);
console.log(`📊 Stakeholders: ${stkByEmail.size} emails indexados`);

// Stats
const stats = {
  projects: 0,
  developersConverted: 0,
  developersNotFound: [],
  stakeholdersConverted: 0,
  stakeholdersNotFound: []
};

// Migrar projects
const migratedProjects = {};

for (const [projectName, project] of Object.entries(projects)) {
  stats.projects++;
  const migrated = { ...project };

  // Migrar developers
  if (Array.isArray(project.developers)) {
    migrated.developers = project.developers.map(dev => {
      const email = (typeof dev === 'object' ? dev.email : dev)?.toLowerCase();
      if (!email) return null;

      const devId = devByEmail.get(email);
      if (devId) {
        stats.developersConverted++;
        return devId;
      } else {
        stats.developersNotFound.push({ project: projectName, email });
        return null;
      }
    }).filter(Boolean);
  }

  // Migrar stakeholders
  if (Array.isArray(project.stakeholders)) {
    migrated.stakeholders = project.stakeholders.map(stk => {
      const email = (typeof stk === 'object' ? stk.email : stk)?.toLowerCase();
      if (!email) return null;

      const stkId = stkByEmail.get(email);
      if (stkId) {
        stats.stakeholdersConverted++;
        return stkId;
      } else {
        stats.stakeholdersNotFound.push({ project: projectName, email });
        return null;
      }
    }).filter(Boolean);
  }

  migratedProjects[projectName] = migrated;
}

// Escribir resultado
const outputPath = path.join(dataDir, 'projects-migrated.json');
fs.writeFileSync(outputPath, JSON.stringify(migratedProjects, null, 2), 'utf8');

console.log('\n✅ Migración completada');
console.log(`📁 Proyectos procesados: ${stats.projects}`);
console.log(`👨‍💻 Developers convertidos: ${stats.developersConverted}`);
console.log(`👥 Stakeholders convertidos: ${stats.stakeholdersConverted}`);

if (stats.developersNotFound.length > 0) {
  console.log('\n⚠️  Developers NO encontrados (revisar /projects/{projectId}/developers):');
  stats.developersNotFound.forEach(d => console.log(`   - ${d.project}: ${d.email}`));
}

if (stats.stakeholdersNotFound.length > 0) {
  console.log('\n⚠️  Stakeholders NO encontrados (revisar /projects/{projectId}/stakeholders):');
  stats.stakeholdersNotFound.forEach(s => console.log(`   - ${s.project}: ${s.email}`));
}

console.log(`\n💾 Resultado guardado en: ${outputPath}`);
