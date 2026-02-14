#!/usr/bin/env node
/**
 * Script to fix cards created by AiDocumentUploader with incorrect fields
 *
 * This script:
 * 1. Finds cards that have 'como', 'quiero', 'para' fields (incorrectly saved)
 * 2. Converts them to the correct 'descriptionStructured' format
 *
 * Usage:
 *   node scripts/fix-upload-cards.js <database-export.json> [--dry-run]
 *
 * The script modifies the JSON file in place (creates a backup first)
 */

import fs from 'fs';

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/fix-upload-cards.js <database-export.json> [--dry-run]');
    console.log('');
    console.log('This script fixes cards with incorrect como/quiero/para fields');
    console.log('by converting them to the correct descriptionStructured format.');
    process.exit(1);
  }

  const inputFile = args[0];
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  console.log(`Reading: ${inputFile}`);
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  let fixedCount = 0;
  let checkedCount = 0;
  const fixedCards = [];

  // Navigate to cards section
  const cards = data.cards || {};

  for (const [projectId, sections] of Object.entries(cards)) {
    if (!sections || typeof sections !== 'object') continue;

    for (const [sectionKey, sectionCards] of Object.entries(sections)) {
      if (!sectionCards || typeof sectionCards !== 'object') continue;

      // Only process tasks and proposals sections (which use descriptionStructured)
      const isTaskSection = sectionKey.toLowerCase().includes('task');
      const isProposalSection = sectionKey.toLowerCase().includes('proposal');

      if (!isTaskSection && !isProposalSection) continue;

      for (const [cardId, card] of Object.entries(sectionCards)) {
        if (!card || typeof card !== 'object') continue;

        checkedCount++;

        // Check if card has incorrect fields
        const hasComo = 'como' in card && card.como;
        const hasQuiero = 'quiero' in card && card.quiero;
        const hasPara = 'para' in card && card.para;
        const hasDescriptionStructured = 'descriptionStructured' in card &&
          Array.isArray(card.descriptionStructured) &&
          card.descriptionStructured.length > 0;

        // If it has como/quiero/para but no proper descriptionStructured, fix it
        if ((hasComo || hasQuiero || hasPara) && !hasDescriptionStructured) {
          fixedCards.push({
            projectId,
            section: sectionKey,
            cardId: card.cardId || cardId,
            firebaseId: cardId,
            como: card.como || '',
            quiero: card.quiero || '',
            para: card.para || ''
          });

          // Create the correct descriptionStructured
          card.descriptionStructured = [{
            role: card.como || '',
            goal: card.quiero || '',
            benefit: card.para || '',
            legacy: ''
          }];

          // Remove the incorrect fields
          delete card.como;
          delete card.quiero;
          delete card.para;

          fixedCount++;
        }
      }
    }
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`Cards checked: ${checkedCount}`);
  console.log(`Cards fixed: ${fixedCount}`);
  console.log('');

  if (fixedCards.length > 0) {
    console.log('Fixed cards:');
    fixedCards.forEach(card => {
      console.log(`  - ${card.cardId} (${card.projectId}/${card.section})`);
      console.log(`    como: "${card.como.substring(0, 50)}${card.como.length > 50 ? '...' : ''}"`);
      console.log(`    quiero: "${card.quiero.substring(0, 50)}${card.quiero.length > 50 ? '...' : ''}"`);
      console.log(`    para: "${card.para.substring(0, 50)}${card.para.length > 50 ? '...' : ''}"`);
    });
    console.log('');
  }

  if (dryRun) {
    console.log('[DRY RUN] No changes written to file.');
    console.log('Remove --dry-run to apply changes.');
  } else if (fixedCount > 0) {
    // Create backup
    const backupFile = inputFile.replace('.json', '_backup.json');
    fs.copyFileSync(inputFile, backupFile);
    console.log(`Backup created: ${backupFile}`);

    // Write fixed data
    fs.writeFileSync(inputFile, JSON.stringify(data, null, 2));
    console.log(`Fixed data written to: ${inputFile}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Import the fixed JSON back to Firebase');
    console.log('2. Or use the Firebase Console to import');
  } else {
    console.log('No cards need fixing.');
  }
}

main();
