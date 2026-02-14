#!/usr/bin/env node
/**
 * Migra /cards para usar dev_XXX y stk_XXX en campos developer y validator.
 *
 * Uso:
 *   node scripts/migrate-cards-to-entity-ids.js
 *
 * Lee:
 *   - data/cards.json
 *   - data/developers.json
 *   - data/stakeholders.json
 *
 * Escribe:
 *   - data/cards-migrated.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

// Leer archivos
const cards = JSON.parse(fs.readFileSync(path.join(dataDir, 'cards.json'), 'utf8'));
const developers = JSON.parse(fs.readFileSync(path.join(dataDir, 'developers.json'), 'utf8'));
const stakeholders = JSON.parse(fs.readFileSync(path.join(dataDir, 'stakeholders.json'), 'utf8'));

// Normalizar texto para comparación
const normalize = (str) => (str || '').toString().trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Alias conocidos para developers
const devAliases = {
  'oscar garcia': 'dev_011',
  'oscar garcía': 'dev_011',
  'alex alvarez': 'dev_002',
  'alex álvarez': 'dev_002',
  'dani gonzalez': 'dev_004',
  'daniel gonzalez': 'dev_004',
  'daniel gonzález': 'dev_004',
  'alvaro gomez': 'dev_014',
  'alvaro gómez': 'dev_014'
};

// Alias conocidos para stakeholders
const stkAliases = {
  'elisabeth vargas': 'stk_012',
  'eli vargas': 'stk_012'
};

// Crear índices por email Y por nombre (normalizado)
const devByEmail = new Map();
const devByName = new Map();
for (const [id, dev] of Object.entries(developers)) {
  if (dev.email) {
    devByEmail.set(normalize(dev.email), id);
  }
  if (dev.name) {
    devByName.set(normalize(dev.name), id);
  }
}
// Añadir aliases
for (const [alias, id] of Object.entries(devAliases)) {
  devByName.set(normalize(alias), id);
}

const stkByEmail = new Map();
const stkByName = new Map();
for (const [id, stk] of Object.entries(stakeholders)) {
  if (stk.email) {
    stkByEmail.set(normalize(stk.email), id);
  }
  if (stk.name) {
    stkByName.set(normalize(stk.name), id);
  }
}
// Añadir aliases
for (const [alias, id] of Object.entries(stkAliases)) {
  stkByName.set(normalize(alias), id);
}

console.log(`📊 Developers: ${devByEmail.size} emails, ${devByName.size} nombres`);
console.log(`📊 Stakeholders: ${stkByEmail.size} emails, ${stkByName.size} nombres`);

// Función para resolver developer
function resolveDeveloper(value) {
  if (!value) return null;

  // Ya es un dev_XXX
  if (value.startsWith('dev_')) return value;

  // Es "No developer assigned" o similar
  if (value === 'No developer assigned' || normalize(value) === 'sin asignar') {
    return 'No developer assigned';
  }

  const norm = normalize(value);

  // Buscar por email
  if (devByEmail.has(norm)) return devByEmail.get(norm);

  // Buscar por nombre
  if (devByName.has(norm)) return devByName.get(norm);

  return null;
}

// Función para resolver stakeholder/validator
function resolveStakeholder(value) {
  if (!value) return null;

  // Ya es un stk_XXX
  if (value.startsWith('stk_')) return value;

  const norm = normalize(value);

  // Buscar por email
  if (stkByEmail.has(norm)) return stkByEmail.get(norm);

  // Buscar por nombre
  if (stkByName.has(norm)) return stkByName.get(norm);

  return null;
}

// Stats
const stats = {
  cards: 0,
  developersConverted: 0,
  developersNotFound: [],
  validatorsConverted: 0,
  validatorsNotFound: [],
  alreadyMigrated: { developers: 0, validators: 0 }
};

// Migrar cards
const migratedCards = JSON.parse(JSON.stringify(cards)); // Deep clone

for (const [projectName, projectCards] of Object.entries(migratedCards)) {
  for (const [sectionKey, section] of Object.entries(projectCards)) {
    if (!section || typeof section !== 'object') continue;

    for (const [cardId, card] of Object.entries(section)) {
      if (!card || typeof card !== 'object') continue;
      stats.cards++;

      // Migrar developer
      if (card.developer) {
        if (card.developer.startsWith('dev_')) {
          stats.alreadyMigrated.developers++;
        } else {
          const resolved = resolveDeveloper(card.developer);
          if (resolved && resolved !== 'No developer assigned') {
            card.developer = resolved;
            stats.developersConverted++;
          } else if (resolved === 'No developer assigned') {
            card.developer = resolved;
          } else {
            stats.developersNotFound.push({
              project: projectName,
              cardId: card.cardId || cardId,
              value: card.developer
            });
          }
        }
      }

      // Migrar validator
      if (card.validator) {
        if (card.validator.startsWith('stk_')) {
          stats.alreadyMigrated.validators++;
        } else {
          const resolved = resolveStakeholder(card.validator);
          if (resolved) {
            card.validator = resolved;
            stats.validatorsConverted++;
          } else {
            stats.validatorsNotFound.push({
              project: projectName,
              cardId: card.cardId || cardId,
              value: card.validator
            });
          }
        }
      }
    }
  }
}

// Escribir resultado
const outputPath = path.join(dataDir, 'cards-migrated.json');
fs.writeFileSync(outputPath, JSON.stringify(migratedCards, null, 2), 'utf8');

console.log('\n✅ Migración completada');
console.log(`📁 Cards procesadas: ${stats.cards}`);
console.log(`👨‍💻 Developers convertidos: ${stats.developersConverted} (ya migrados: ${stats.alreadyMigrated.developers})`);
console.log(`👥 Validators convertidos: ${stats.validatorsConverted} (ya migrados: ${stats.alreadyMigrated.validators})`);

if (stats.developersNotFound.length > 0) {
  console.log('\n⚠️  Developers NO encontrados:');
  // Agrupar por valor único
  const unique = [...new Set(stats.developersNotFound.map(d => d.value))];
  unique.forEach(v => console.log(`   - "${v}"`));
}

if (stats.validatorsNotFound.length > 0) {
  console.log('\n⚠️  Validators NO encontrados:');
  const unique = [...new Set(stats.validatorsNotFound.map(v => v.value))];
  unique.forEach(v => console.log(`   - "${v}"`));
}

console.log(`\n💾 Resultado guardado en: ${outputPath}`);
