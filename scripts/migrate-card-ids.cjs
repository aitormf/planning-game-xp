#!/usr/bin/env node
/**
 * Migration script for card IDs consistency
 *
 * This script:
 * 1. Adds `firebaseId` field to all cards (using the Firebase key)
 * 2. Validates `cardId` format matches project abbreviation
 * 3. Reports inconsistencies and optionally fixes them
 *
 * Usage:
 *   node scripts/migrate-card-ids.js <input.json> [--fix] [--output <file>]
 *
 * Options:
 *   --fix       Apply fixes (default: dry-run, only report)
 *   --output    Output file path (default: <input>_migrated.json)
 *
 * Example:
 *   node scripts/migrate-card-ids.js database-export.json --fix
 */

const fs = require('fs');
const path = require('path');

// Default project abbreviations mapping
// These are used as fallback if project doesn't have `abbreviation` field in Firebase
const DEFAULT_PROJECT_ABBREVIATIONS = {
  'Cinema4D': 'C4D',
  'Intranet': 'NTR',
  'Extranet V1': 'EX1',
  'Extranet V2': 'EX2',
  'PlanningGame': 'PLG',
  'Marketing': 'MRK',
  'Visor-Editor': 'VSR',
  'SAP': 'SAP',
  'IT': '_IT',
  'IA': '_IA',
  'Auth&Sign': 'A&S',
  'PRUEBAS': 'PRB',
  'Desarrollos en SAP': 'DSP',
};

// Runtime abbreviations (populated from Firebase data + defaults)
let PROJECT_ABBREVIATIONS = { ...DEFAULT_PROJECT_ABBREVIATIONS };

// Section type abbreviations
const SECTION_ABBREVIATIONS = {
  'TASKS': 'TSK',
  'BUGS': 'BUG',
  'EPICS': 'EPC',
  'PROPOSALS': 'PRP',
  'SPRINTS': 'SPR',
  'QA': '_QA',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    inputFile: null,
    fix: false,
    outputFile: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--fix') {
      options.fix = true;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.outputFile = args[++i];
    } else if (!args[i].startsWith('--')) {
      options.inputFile = args[i];
    }
  }

  return options;
}

function getExpectedAbbreviation(projectId) {
  if (PROJECT_ABBREVIATIONS[projectId]) {
    return PROJECT_ABBREVIATIONS[projectId];
  }
  // Generate abbreviation using same algorithm as getAbbrId
  return generateAbbreviation(projectId);
}

function generateAbbreviation(word) {
  const upperWord = word.toUpperCase().trim();

  // Known exceptions
  if (upperWord === 'BUGS') return 'BUG';
  if (upperWord === 'CINEMA4D') return 'C4D';
  if (upperWord === 'EXTRANET V1') return 'EX1';
  if (upperWord === 'EXTRANET V2') return 'EX2';

  if (upperWord.length <= 3) return upperWord.padStart(3, '_');

  const consonants = upperWord.replace(/[AEIOUÁÉÍÓÚÜ\s\d]/gi, '').split('');
  const vowels = upperWord.replace(/[^AEIOUÁÉÍÓÚÜ]/gi, '').split('');
  const matchNumber = upperWord.match(/\d+$/);
  const lastNumber = matchNumber ? matchNumber[0] : null;

  if (lastNumber && consonants.length >= 3) {
    return consonants.slice(0, 2).join('') + lastNumber;
  }
  if (consonants.length >= 3) {
    return consonants.slice(0, 3).join('');
  }
  if (consonants.length === 2) {
    return consonants.join('') + (vowels[0] || '_');
  }
  if (consonants.length === 1) {
    return consonants[0] + (vowels[0] || '_') + (vowels[vowels.length - 1] || '_');
  }
  return upperWord.slice(0, 3);
}

function getSectionAbbreviation(sectionKey) {
  // sectionKey format: "TASKS_ProjectName" or "BUGS_ProjectName"
  const section = sectionKey.split('_')[0];
  return SECTION_ABBREVIATIONS[section] || generateAbbreviation(section);
}

function parseCardId(cardId) {
  if (!cardId) return null;
  const match = cardId.match(/^([A-Z0-9_&]+)-([A-Z0-9_]+)-(\d+)$/);
  if (!match) return null;
  return {
    projectAbbr: match[1],
    sectionAbbr: match[2],
    number: match[3],
  };
}

/**
 * Load abbreviations from Firebase project data
 * Projects can have an `abbreviation` field that overrides the default
 */
function loadAbbreviationsFromData(data) {
  const projects = data.projects || {};
  const loaded = [];

  for (const [projectId, projectData] of Object.entries(projects)) {
    if (projectData && projectData.abbreviation) {
      PROJECT_ABBREVIATIONS[projectId] = projectData.abbreviation;
      loaded.push({ projectId, abbreviation: projectData.abbreviation, source: 'firebase' });
    } else if (!PROJECT_ABBREVIATIONS[projectId]) {
      // Generate one if not in defaults
      const generated = generateAbbreviation(projectId);
      PROJECT_ABBREVIATIONS[projectId] = generated;
      loaded.push({ projectId, abbreviation: generated, source: 'generated' });
    }
  }

  return loaded;
}

/**
 * Add abbreviation field to projects that don't have it
 */
function addAbbreviationsToProjects(data) {
  const projects = data.projects || {};
  let added = 0;

  for (const [projectId, projectData] of Object.entries(projects)) {
    if (projectData && !projectData.abbreviation) {
      projectData.abbreviation = PROJECT_ABBREVIATIONS[projectId] || generateAbbreviation(projectId);
      added++;
    }
  }

  return added;
}

function analyzeCards(data) {
  const report = {
    totalCards: 0,
    missingFirebaseId: [],
    incorrectCardId: [],
    missingCardId: [],
    projectsFound: new Set(),
    sectionsFound: new Set(),
  };

  const cardsData = data.cards || {};

  for (const [projectId, projectCards] of Object.entries(cardsData)) {
    report.projectsFound.add(projectId);
    const expectedProjectAbbr = getExpectedAbbreviation(projectId);

    for (const [sectionKey, sectionCards] of Object.entries(projectCards)) {
      if (!sectionCards || typeof sectionCards !== 'object') continue;

      report.sectionsFound.add(sectionKey);
      const expectedSectionAbbr = getSectionAbbreviation(sectionKey);
      const expectedPrefix = `${expectedProjectAbbr}-${expectedSectionAbbr}`;

      for (const [firebaseKey, card] of Object.entries(sectionCards)) {
        if (!card || typeof card !== 'object') continue;

        report.totalCards++;

        // Check firebaseId
        if (!card.firebaseId) {
          report.missingFirebaseId.push({
            path: `/cards/${projectId}/${sectionKey}/${firebaseKey}`,
            firebaseKey,
            cardId: card.cardId,
            currentId: card.id,
          });
        }

        // Check cardId
        if (!card.cardId) {
          report.missingCardId.push({
            path: `/cards/${projectId}/${sectionKey}/${firebaseKey}`,
            firebaseKey,
            title: card.title,
          });
        } else {
          const parsed = parseCardId(card.cardId);
          if (parsed) {
            // Check if prefix matches expected
            const currentPrefix = `${parsed.projectAbbr}-${parsed.sectionAbbr}`;
            if (currentPrefix !== expectedPrefix) {
              report.incorrectCardId.push({
                path: `/cards/${projectId}/${sectionKey}/${firebaseKey}`,
                firebaseKey,
                currentCardId: card.cardId,
                expectedPrefix,
                currentPrefix,
                number: parsed.number,
                suggestedCardId: `${expectedPrefix}-${parsed.number}`,
              });
            }
          } else {
            report.incorrectCardId.push({
              path: `/cards/${projectId}/${sectionKey}/${firebaseKey}`,
              firebaseKey,
              currentCardId: card.cardId,
              expectedPrefix,
              error: 'Invalid cardId format',
            });
          }
        }
      }
    }
  }

  return report;
}

function applyFixes(data, report) {
  const fixes = {
    firebaseIdAdded: 0,
    cardIdFixed: 0,
  };

  // Add missing firebaseId
  for (const item of report.missingFirebaseId) {
    const pathParts = item.path.split('/').filter(p => p);
    let current = data;
    for (const part of pathParts.slice(0, -1)) {
      current = current[part];
    }
    const cardKey = pathParts[pathParts.length - 1];
    if (current && current[cardKey]) {
      current[cardKey].firebaseId = item.firebaseKey;
      // Also ensure id matches firebaseId
      current[cardKey].id = item.firebaseKey;
      fixes.firebaseIdAdded++;
    }
  }

  // Fix incorrect cardIds
  for (const item of report.incorrectCardId) {
    if (!item.suggestedCardId) continue;

    const pathParts = item.path.split('/').filter(p => p);
    let current = data;
    for (const part of pathParts.slice(0, -1)) {
      current = current[part];
    }
    const cardKey = pathParts[pathParts.length - 1];
    if (current && current[cardKey]) {
      current[cardKey].cardId = item.suggestedCardId;
      fixes.cardIdFixed++;
    }
  }

  return fixes;
}

function printReport(report) {
  console.log('\n========================================');
  console.log('       CARD MIGRATION ANALYSIS REPORT');
  console.log('========================================\n');

  console.log(`Total cards analyzed: ${report.totalCards}`);
  console.log(`Projects found: ${Array.from(report.projectsFound).join(', ')}`);
  console.log('');

  // Missing firebaseId
  console.log(`\n📋 Missing firebaseId: ${report.missingFirebaseId.length}`);
  if (report.missingFirebaseId.length > 0) {
    console.log('----------------------------------------');
    for (const item of report.missingFirebaseId.slice(0, 10)) {
      console.log(`  ${item.cardId || 'NO_CARDID'} @ ${item.path}`);
      console.log(`    Firebase key: ${item.firebaseKey}`);
      console.log(`    Current id: ${item.currentId || 'NONE'}`);
    }
    if (report.missingFirebaseId.length > 10) {
      console.log(`  ... and ${report.missingFirebaseId.length - 10} more`);
    }
  }

  // Missing cardId
  console.log(`\n📋 Missing cardId: ${report.missingCardId.length}`);
  if (report.missingCardId.length > 0) {
    console.log('----------------------------------------');
    for (const item of report.missingCardId.slice(0, 10)) {
      console.log(`  ${item.path}`);
      console.log(`    Title: ${item.title || 'NO_TITLE'}`);
    }
    if (report.missingCardId.length > 10) {
      console.log(`  ... and ${report.missingCardId.length - 10} more`);
    }
  }

  // Incorrect cardId
  console.log(`\n📋 Incorrect cardId prefix: ${report.incorrectCardId.length}`);
  if (report.incorrectCardId.length > 0) {
    console.log('----------------------------------------');
    for (const item of report.incorrectCardId.slice(0, 20)) {
      console.log(`  ${item.currentCardId}`);
      console.log(`    Expected prefix: ${item.expectedPrefix}`);
      console.log(`    Current prefix: ${item.currentPrefix}`);
      if (item.suggestedCardId) {
        console.log(`    Suggested fix: ${item.suggestedCardId}`);
      }
      if (item.error) {
        console.log(`    Error: ${item.error}`);
      }
    }
    if (report.incorrectCardId.length > 20) {
      console.log(`  ... and ${report.incorrectCardId.length - 20} more`);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('              SUMMARY');
  console.log('========================================');
  console.log(`Issues found:`);
  console.log(`  - Missing firebaseId: ${report.missingFirebaseId.length}`);
  console.log(`  - Missing cardId: ${report.missingCardId.length}`);
  console.log(`  - Incorrect cardId: ${report.incorrectCardId.length}`);
  console.log(`  - Total issues: ${report.missingFirebaseId.length + report.missingCardId.length + report.incorrectCardId.length}`);
}

function printAbbreviationTable() {
  console.log('\n========================================');
  console.log('     PROJECT ABBREVIATIONS TABLE');
  console.log('========================================\n');
  console.log('Project ID          | Abbreviation');
  console.log('--------------------|-------------');
  for (const [project, abbr] of Object.entries(PROJECT_ABBREVIATIONS)) {
    console.log(`${project.padEnd(19)} | ${abbr}`);
  }
  console.log('\nNote: Add `abbreviation` field to each project in Firebase');
  console.log('to avoid relying on algorithmic generation.\n');
}

function main() {
  const options = parseArgs();

  if (!options.inputFile) {
    console.log('Usage: node migrate-card-ids.js <input.json> [--fix] [--output <file>]');
    console.log('');
    console.log('Options:');
    console.log('  --fix       Apply fixes (default: dry-run)');
    console.log('  --output    Output file path');
    console.log('');
    printAbbreviationTable();
    process.exit(1);
  }

  const inputPath = path.resolve(options.inputFile);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Reading: ${inputPath}`);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  // Load abbreviations from project data (if they have `abbreviation` field)
  console.log('\nLoading abbreviations from project data...');
  const loadedAbbrs = loadAbbreviationsFromData(data);
  if (loadedAbbrs.length > 0) {
    console.log('Abbreviations loaded:');
    for (const item of loadedAbbrs) {
      console.log(`  ${item.projectId}: ${item.abbreviation} (${item.source})`);
    }
  }

  const report = analyzeCards(data);
  printReport(report);
  printAbbreviationTable();

  if (options.fix) {
    console.log('\n🔧 Applying fixes...');
    const fixes = applyFixes(data, report);
    console.log(`  - firebaseId added: ${fixes.firebaseIdAdded}`);
    console.log(`  - cardId fixed: ${fixes.cardIdFixed}`);

    // Also add abbreviation field to projects that don't have it
    const abbrsAdded = addAbbreviationsToProjects(data);
    console.log(`  - abbreviation added to projects: ${abbrsAdded}`);

    const outputPath = options.outputFile || inputPath.replace('.json', '_migrated.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\n✅ Output written to: ${outputPath}`);
    console.log('\nNext steps:');
    console.log('  1. Review the migrated file');
    console.log('  2. Import to Firebase: firebase database:set / --data @file.json');
    console.log('  3. Each project now has an `abbreviation` field for future cardId generation');
  } else {
    console.log('\n💡 Run with --fix to apply corrections');
  }
}

main();
