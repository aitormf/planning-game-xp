#!/usr/bin/env node
/**
 * Script de migración para añadir el campo `year` a todas las tareas y bugs.
 *
 * Uso:
 *   node scripts/migrate-add-year-field.js <input.json> [output.json]
 *
 * Si no se especifica output.json, se genera con sufijo _migrated.json
 *
 * Reglas:
 * - Todas las tareas/bugs reciben year: 2025 por defecto
 * - Si la tarea/bug fue creada en 2026 (según fechas), recibe year: 2026
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEGACY_YEAR = 2025;
const CURRENT_YEAR = 2026;

/**
 * Extrae el año de una fecha en formato string
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD o similar
 * @returns {number|null}
 */
function extractYearFromDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // Intentar extraer año del inicio (formato YYYY-MM-DD o YYYY/MM/DD)
  const match = dateStr.match(/^(\d{4})/);
  if (match) {
    const year = parseInt(match[1], 10);
    if (year >= 2020 && year <= 2100) {
      return year;
    }
  }

  // Intentar parsear como fecha completa
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    if (year >= 2020 && year <= 2100) {
      return year;
    }
  }

  return null;
}

/**
 * Determina el año de una card basándose en sus fechas
 * @param {Object} cardData - Datos de la card
 * @returns {number} - Año determinado (2025 o 2026)
 */
function determineCardYear(cardData) {
  // Si ya tiene año, respetarlo
  if (cardData.year && typeof cardData.year === 'number') {
    return cardData.year;
  }

  // Campos de fecha a revisar (en orden de prioridad)
  const dateFields = ['createdAt', 'registerDate', 'startDate', 'endDate'];

  for (const field of dateFields) {
    if (cardData[field]) {
      const year = extractYearFromDate(cardData[field]);
      if (year === CURRENT_YEAR) {
        return CURRENT_YEAR;
      }
    }
  }

  // Por defecto, año legacy
  return LEGACY_YEAR;
}

/**
 * Procesa las cards de una sección (TASKS, BUGS, etc.)
 * @param {Object} cardsSection - Objeto con las cards
 * @param {string} sectionName - Nombre de la sección para logging
 * @returns {Object} - Estadísticas de la migración
 */
function processCardsSection(cardsSection, sectionName) {
  const stats = {
    total: 0,
    alreadyHadYear: 0,
    assignedLegacy: 0,
    assignedCurrent: 0
  };

  if (!cardsSection || typeof cardsSection !== 'object') {
    return stats;
  }

  Object.entries(cardsSection).forEach(([cardId, cardData]) => {
    if (!cardData || typeof cardData !== 'object') return;

    stats.total++;

    if (cardData.year && typeof cardData.year === 'number') {
      stats.alreadyHadYear++;
    } else {
      const year = determineCardYear(cardData);
      cardData.year = year;

      if (year === CURRENT_YEAR) {
        stats.assignedCurrent++;
      } else {
        stats.assignedLegacy++;
      }
    }
  });

  console.log(`  ${sectionName}: ${stats.total} cards`);
  console.log(`    - Ya tenían year: ${stats.alreadyHadYear}`);
  console.log(`    - Asignado ${LEGACY_YEAR}: ${stats.assignedLegacy}`);
  console.log(`    - Asignado ${CURRENT_YEAR}: ${stats.assignedCurrent}`);

  return stats;
}

/**
 * Determina el año de un sprint basándose en sus fechas
 * @param {Object} sprintData - Datos del sprint
 * @returns {number} - Año determinado
 */
function determineSprintYear(sprintData) {
  // Si ya tiene año, respetarlo
  if (sprintData.year && typeof sprintData.year === 'number') {
    return sprintData.year;
  }

  // Campos de fecha específicos de sprints
  const dateFields = ['startDate', 'endDate', 'createdAt'];

  for (const field of dateFields) {
    if (sprintData[field]) {
      const year = extractYearFromDate(sprintData[field]);
      if (year) {
        return year;
      }
    }
  }

  // Por defecto, año legacy
  return LEGACY_YEAR;
}

/**
 * Migra toda la base de datos
 * @param {Object} database - Objeto completo de la base de datos
 * @returns {Object} - Estadísticas totales
 */
function migrateDatabase(database) {
  const totalStats = {
    tasks: { total: 0, alreadyHadYear: 0, assignedLegacy: 0, assignedCurrent: 0 },
    bugs: { total: 0, alreadyHadYear: 0, assignedLegacy: 0, assignedCurrent: 0 },
    proposals: { total: 0, alreadyHadYear: 0, assignedLegacy: 0, assignedCurrent: 0 },
    sprints: { total: 0, alreadyHadYear: 0, assignedLegacy: 0, assignedCurrent: 0 },
    epics: { total: 0, alreadyHadYear: 0, assignedLegacy: 0, assignedCurrent: 0 }
  };

  // Procesar /cards/{projectId}/{section}_{projectId}
  if (database.cards) {
    console.log('\nProcesando cards por proyecto...');

    Object.entries(database.cards).forEach(([projectId, projectCards]) => {
      console.log(`\nProyecto: ${projectId}`);

      Object.entries(projectCards).forEach(([sectionKey, sectionCards]) => {
        // Determinar tipo de sección
        let statsKey = null;
        let processFunc = processCardsSection;

        if (sectionKey.startsWith('TASKS_')) {
          statsKey = 'tasks';
        } else if (sectionKey.startsWith('BUGS_')) {
          statsKey = 'bugs';
        } else if (sectionKey.startsWith('PROPOSALS_')) {
          statsKey = 'proposals';
        } else if (sectionKey.startsWith('SPRINTS_')) {
          statsKey = 'sprints';
          processFunc = processSprintsSection;
        } else if (sectionKey.startsWith('EPICS_')) {
          statsKey = 'epics';
          processFunc = processEpicsSection;
        }

        if (statsKey) {
          const stats = processFunc(sectionCards, sectionKey);
          totalStats[statsKey].total += stats.total;
          totalStats[statsKey].alreadyHadYear += stats.alreadyHadYear;
          totalStats[statsKey].assignedLegacy += stats.assignedLegacy;
          totalStats[statsKey].assignedCurrent += stats.assignedCurrent;
        }
      });
    });
  }

  return totalStats;
}

/**
 * Determina el año de una épica basándose en sus fechas
 * @param {Object} epicData - Datos de la épica
 * @returns {number} - Año determinado
 */
function determineEpicYear(epicData) {
  // Si ya tiene año, respetarlo
  if (epicData.year && typeof epicData.year === 'number') {
    return epicData.year;
  }

  // Campos de fecha específicos de épicas (en orden de prioridad)
  const dateFields = ['startDate', 'endDate', 'createdAt', 'registerDate'];

  for (const field of dateFields) {
    if (epicData[field]) {
      const year = extractYearFromDate(epicData[field]);
      if (year) {
        return year;
      }
    }
  }

  // Por defecto, año legacy
  return LEGACY_YEAR;
}

/**
 * Procesa las épicas de una sección
 * Asigna year basándose en las fechas de la épica
 * @param {Object} epicsSection - Objeto con las épicas
 * @param {string} sectionName - Nombre de la sección para logging
 * @returns {Object} - Estadísticas de la migración
 */
function processEpicsSection(epicsSection, sectionName) {
  const stats = {
    total: 0,
    alreadyHadYear: 0,
    assignedLegacy: 0,
    assignedCurrent: 0
  };

  if (!epicsSection || typeof epicsSection !== 'object') {
    return stats;
  }

  Object.entries(epicsSection).forEach(([epicId, epicData]) => {
    if (!epicData || typeof epicData !== 'object') return;

    stats.total++;

    if (epicData.year && typeof epicData.year === 'number') {
      stats.alreadyHadYear++;
    } else {
      const year = determineEpicYear(epicData);
      epicData.year = year;

      if (year === CURRENT_YEAR) {
        stats.assignedCurrent++;
      } else {
        stats.assignedLegacy++;
      }
    }
  });

  console.log(`  ${sectionName}: ${stats.total} epics`);
  console.log(`    - Ya tenían year: ${stats.alreadyHadYear}`);
  console.log(`    - Asignado ${LEGACY_YEAR}: ${stats.assignedLegacy}`);
  console.log(`    - Asignado ${CURRENT_YEAR}: ${stats.assignedCurrent}`);

  return stats;
}

/**
 * Procesa los sprints de una sección
 * @param {Object} sprintsSection - Objeto con los sprints
 * @param {string} sectionName - Nombre de la sección para logging
 * @returns {Object} - Estadísticas de la migración
 */
function processSprintsSection(sprintsSection, sectionName) {
  const stats = {
    total: 0,
    alreadyHadYear: 0,
    assignedLegacy: 0,
    assignedCurrent: 0
  };

  if (!sprintsSection || typeof sprintsSection !== 'object') {
    return stats;
  }

  Object.entries(sprintsSection).forEach(([sprintId, sprintData]) => {
    if (!sprintData || typeof sprintData !== 'object') return;

    stats.total++;

    if (sprintData.year && typeof sprintData.year === 'number') {
      stats.alreadyHadYear++;
    } else {
      const year = determineSprintYear(sprintData);
      sprintData.year = year;

      if (year === CURRENT_YEAR) {
        stats.assignedCurrent++;
      } else {
        stats.assignedLegacy++;
      }
    }
  });

  console.log(`  ${sectionName}: ${stats.total} sprints`);
  console.log(`    - Ya tenían year: ${stats.alreadyHadYear}`);
  console.log(`    - Asignado ${LEGACY_YEAR}: ${stats.assignedLegacy}`);
  console.log(`    - Asignado ${CURRENT_YEAR}: ${stats.assignedCurrent}`);

  return stats;
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Uso: node migrate-add-year-field.js <input.json> [output.json]');
    console.error('');
    console.error('Ejemplo:');
    console.error('  node scripts/migrate-add-year-field.js database-export.json');
    console.error('  node scripts/migrate-add-year-field.js database-export.json database-migrated.json');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = args[1]
    ? path.resolve(args[1])
    : inputPath.replace(/\.json$/, '_migrated.json');

  console.log('='.repeat(60));
  console.log('MIGRACIÓN: Añadir campo year a tasks y bugs');
  console.log('='.repeat(60));
  console.log(`\nArchivo entrada: ${inputPath}`);
  console.log(`Archivo salida:  ${outputPath}`);

  // Leer archivo de entrada
  if (!fs.existsSync(inputPath)) {
    console.error(`\nError: No se encuentra el archivo ${inputPath}`);
    process.exit(1);
  }

  console.log('\nLeyendo base de datos...');
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const database = JSON.parse(rawData);

  // Ejecutar migración
  const stats = migrateDatabase(database);

  // Guardar resultado
  console.log('\nGuardando base de datos migrada...');
  fs.writeFileSync(outputPath, JSON.stringify(database, null, 2), 'utf8');

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(60));
  console.log('\nTASKS:');
  console.log(`  Total: ${stats.tasks.total}`);
  console.log(`  Ya tenían year: ${stats.tasks.alreadyHadYear}`);
  console.log(`  Asignado ${LEGACY_YEAR}: ${stats.tasks.assignedLegacy}`);
  console.log(`  Asignado ${CURRENT_YEAR}: ${stats.tasks.assignedCurrent}`);

  console.log('\nBUGS:');
  console.log(`  Total: ${stats.bugs.total}`);
  console.log(`  Ya tenían year: ${stats.bugs.alreadyHadYear}`);
  console.log(`  Asignado ${LEGACY_YEAR}: ${stats.bugs.assignedLegacy}`);
  console.log(`  Asignado ${CURRENT_YEAR}: ${stats.bugs.assignedCurrent}`);

  console.log('\nPROPOSALS:');
  console.log(`  Total: ${stats.proposals.total}`);
  console.log(`  Ya tenían year: ${stats.proposals.alreadyHadYear}`);
  console.log(`  Asignado ${LEGACY_YEAR}: ${stats.proposals.assignedLegacy}`);
  console.log(`  Asignado ${CURRENT_YEAR}: ${stats.proposals.assignedCurrent}`);

  console.log('\nSPRINTS:');
  console.log(`  Total: ${stats.sprints.total}`);
  console.log(`  Ya tenían year: ${stats.sprints.alreadyHadYear}`);
  console.log(`  Asignado ${LEGACY_YEAR}: ${stats.sprints.assignedLegacy}`);
  console.log(`  Asignado ${CURRENT_YEAR}: ${stats.sprints.assignedCurrent}`);

  console.log('\nEPICS:');
  console.log(`  Total: ${stats.epics.total}`);
  console.log(`  Ya tenían year: ${stats.epics.alreadyHadYear}`);
  console.log(`  Asignado ${LEGACY_YEAR}: ${stats.epics.assignedLegacy}`);
  console.log(`  Asignado ${CURRENT_YEAR}: ${stats.epics.assignedCurrent}`);

  const grandTotal = stats.tasks.total + stats.bugs.total + stats.proposals.total + stats.sprints.total + stats.epics.total;
  const totalMigrated = stats.tasks.assignedLegacy + stats.tasks.assignedCurrent +
                        stats.bugs.assignedLegacy + stats.bugs.assignedCurrent +
                        stats.proposals.assignedLegacy + stats.proposals.assignedCurrent +
                        stats.sprints.assignedLegacy + stats.sprints.assignedCurrent +
                        stats.epics.assignedLegacy + stats.epics.assignedCurrent;

  console.log('\n' + '-'.repeat(60));
  console.log(`Total cards procesadas: ${grandTotal}`);
  console.log(`Total cards migradas (con year asignado): ${totalMigrated}`);
  console.log(`\nArchivo guardado: ${outputPath}`);
  console.log('='.repeat(60));
}

main();
