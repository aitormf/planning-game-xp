#!/usr/bin/env node
import fs from 'fs';

const cards = JSON.parse(fs.readFileSync('./data/cards-migrated.json', 'utf8'));
const fields = new Map();

for (const [project, sections] of Object.entries(cards)) {
  for (const [section, items] of Object.entries(sections)) {
    for (const [id, card] of Object.entries(items)) {
      if (!card || typeof card !== 'object') continue;
      for (const key of Object.keys(card)) {
        fields.set(key, (fields.get(key) || 0) + 1);
      }
    }
  }
}

const sorted = [...fields.entries()].sort((a,b) => b[1] - a[1]);
sorted.forEach(([k, v]) => console.log(`${v.toString().padStart(5)} ${k}`));
