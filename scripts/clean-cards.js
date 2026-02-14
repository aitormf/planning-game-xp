#!/usr/bin/env node
/**
 * Limpia campos innecesarios de cards-migrated.json
 */
import fs from 'fs';

const cards = JSON.parse(fs.readFileSync('./data/cards-migrated.json', 'utf8'));

// Campos a eliminar:
// - Estado temporal de UI
// - Datos redundantes o deprecated
// - Arrays de permisos antiguos
const fieldsToRemove = [
  'userAuthorizedEmails',  // Sistema de permisos antiguo
  'expanded',              // Estado UI temporal
  'isEditable',            // Estado UI temporal
  'hasUnsavedChanges',     // Estado UI temporal
  'isSaving',              // Estado UI temporal
  'canEditPermission',     // Estado UI temporal
  'selected',              // Estado UI temporal
  'activeTab',             // Estado UI temporal
  'newNoteText',           // Estado UI temporal
  'editingNote',           // Estado UI temporal
  'editingNoteIndex',      // Estado UI temporal
  'invalidFields',         // Estado UI temporal
  'originalFiles',         // Backup temporal
  'originalStatus',        // Backup temporal
  'id',                    // Redundante con cardId/firebaseId
  'group',                 // Deprecated
  'section',               // Deprecated
  'firebaseId',            // La key de Firebase ya es el ID
  'acceptanceCriteriaColor', // Colores UI no necesarios
  'descriptionColor',      // Colores UI no necesarios
  'notesColor',            // Colores UI no necesarios
];

let totalRemoved = 0;
let cardsProcessed = 0;

for (const [project, sections] of Object.entries(cards)) {
  for (const [section, items] of Object.entries(sections)) {
    for (const [id, card] of Object.entries(items)) {
      if (!card || typeof card !== 'object') continue;
      cardsProcessed++;

      for (const field of fieldsToRemove) {
        if (field in card) {
          delete card[field];
          totalRemoved++;
        }
      }
    }
  }
}

fs.writeFileSync('./data/cards-migrated.json', JSON.stringify(cards, null, 2), 'utf8');

console.log(`✅ Limpieza completada`);
console.log(`📁 Cards procesadas: ${cardsProcessed}`);
console.log(`🗑️  Campos eliminados: ${totalRemoved}`);

// Mostrar tamaño antes/después
const originalSize = fs.statSync('./data/cards.json').size;
const newSize = fs.statSync('./data/cards-migrated.json').size;
console.log(`📊 Tamaño original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`📊 Tamaño nuevo: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`📉 Reducción: ${((1 - newSize/originalSize) * 100).toFixed(1)}%`);
