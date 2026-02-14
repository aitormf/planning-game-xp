#!/usr/bin/env node

/**
 * Script para mover cards de un proyecto corrupto a uno correcto.
 *
 * Uso:
 *   node scripts/fix-corrupted-project.js [--dry-run]
 */

import process from 'node:process';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const CORRUPTED_PROJECT = 'Extranet V2?projectId=Extranet V2?projectId=Extranet V2';
const TARGET_PROJECT = 'Extranet V2';

const dryRun = process.argv.includes('--dry-run');

function getFirebaseConfig() {
  const databaseURL = process.env.PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL;

  if (!databaseURL) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  const clientEmail = process.env.PUBLIC_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.PUBLIC_FIREBASE_PRIVATE_KEY?.replaceAll('\\n', '\n');
  const projectId = process.env.PUBLIC_FIREBASE_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error('Missing Firebase credentials');
  }

  return {
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    databaseURL
  };
}

function logSections(data, label) {
  console.log(`\n${label}:`);
  for (const section of Object.keys(data)) {
    const count = Object.keys(data[section] || {}).length;
    console.log(`  - ${section}: ${count} items`);
  }
}

function prepareUpdates(corruptedData) {
  const updates = {};
  let itemsMoved = 0;

  for (const [section, items] of Object.entries(corruptedData)) {
    if (!items || typeof items !== 'object') continue;

    const targetSection = section.replace(CORRUPTED_PROJECT, TARGET_PROJECT);

    for (const [itemId, itemData] of Object.entries(items)) {
      if (!itemData) continue;

      const updatedData = { ...itemData };
      if (updatedData.projectId) {
        updatedData.projectId = TARGET_PROJECT;
      }

      updates[`cards/${TARGET_PROJECT}/${targetSection}/${itemId}`] = updatedData;
      itemsMoved++;

      console.log(`\n  Moviendo: ${itemData.title || itemData.cardId || itemId}`);
      console.log(`    De: cards/${CORRUPTED_PROJECT}/${section}/${itemId}`);
      console.log(`    A:  cards/${TARGET_PROJECT}/${targetSection}/${itemId}`);
    }
  }

  updates[`cards/${CORRUPTED_PROJECT}`] = null;
  return { updates, itemsMoved };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Fix Corrupted Project Script');
  console.log('='.repeat(60));
  console.log(`\nProyecto corrupto: ${CORRUPTED_PROJECT}`);
  console.log(`Proyecto destino:  ${TARGET_PROJECT}`);
  console.log(`Modo: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const config = getFirebaseConfig();
  admin.initializeApp(config);
  const db = admin.database();

  const corruptedRef = db.ref(`cards/${CORRUPTED_PROJECT}`);
  const snapshot = await corruptedRef.once('value');
  const corruptedData = snapshot.val();

  if (!corruptedData) {
    console.log('El proyecto corrupto no tiene datos. Nada que mover.');
    process.exit(0);
  }

  logSections(corruptedData, 'Secciones encontradas en proyecto corrupto');

  const targetRef = db.ref(`cards/${TARGET_PROJECT}`);
  const targetSnapshot = await targetRef.once('value');
  const targetData = targetSnapshot.val() || {};

  logSections(targetData, 'Secciones en proyecto destino');

  const { updates, itemsMoved } = prepareUpdates(corruptedData);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total items a mover: ${itemsMoved}`);

  if (dryRun) {
    console.log('\nDRY RUN - No se han realizado cambios.');
    console.log('Ejecuta sin --dry-run para aplicar los cambios.');
  } else {
    console.log('\nAplicando cambios...');
    await db.ref().update(updates);
    console.log('Cambios aplicados correctamente.');
  }

  process.exit(0);
}

await main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
