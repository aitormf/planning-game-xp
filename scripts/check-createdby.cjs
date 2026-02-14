const fs = require('fs');
const cards = JSON.parse(fs.readFileSync('data/cards.json', 'utf8'));

function isValidEmail(value) {
  if (!value || typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const issues = {};

for (const [projectId, projectData] of Object.entries(cards)) {
  if (!projectData || typeof projectData !== 'object') continue;

  for (const [collectionKey, collection] of Object.entries(projectData)) {
    if (!collection || typeof collection !== 'object') continue;

    for (const [cardId, card] of Object.entries(collection)) {
      if (!card || typeof card !== 'object') continue;

      const createdBy = card.createdBy;
      if (createdBy && !isValidEmail(createdBy)) {
        const type = collectionKey.split('_')[0]; // TASKS, BUGS, PROPOSALS, etc.
        if (!issues[type]) issues[type] = [];
        issues[type].push({
          cardId: card.cardId || cardId,
          createdBy: createdBy
        });
      }
    }
  }
}

console.log('Campos createdBy que NO son emails válidos:\n');
let total = 0;
for (const [type, items] of Object.entries(issues)) {
  console.log(`${type}: ${items.length} casos`);
  total += items.length;

  // Agrupar por valor único
  const byValue = {};
  items.forEach(i => {
    if (!byValue[i.createdBy]) byValue[i.createdBy] = 0;
    byValue[i.createdBy]++;
  });

  Object.entries(byValue).forEach(([val, count]) => {
    console.log(`  - "${val}": ${count} cards`);
  });
  console.log();
}

console.log(`TOTAL: ${total} cards con createdBy inválido`);
