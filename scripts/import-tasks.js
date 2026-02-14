#!/usr/bin/env node

/**
 * Inserta tareas en Firebase RTDB a partir de un archivo JSON.
 *
 * Uso:
 *   node scripts/import-tasks.js --project MY_PROJECT --input ./tasks.json [--dry-run] [--key-field cardId]
 *
 * Requisitos:
 *   - `firebase-admin` instalado (ya presente en el proyecto).
 *   - Variables de entorno con credenciales:
 *       * GOOGLE_APPLICATION_CREDENTIALS (ruta al JSON)  **o**
 *       * PUBLIC_FIREBASE_CLIENT_EMAIL, PUBLIC_FIREBASE_PRIVATE_KEY, PUBLIC_FIREBASE_PROJECT_ID
 *   - PUBLIC_FIREBASE_DATABASE_URL (o FIREBASE_DATABASE_URL) con la URL de la RTDB.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import admin from 'firebase-admin';

const DEFAULT_KEY_FIELD = 'cardId';

function parseArgs(argv) {
  const args = {
    project: null,
    input: null,
    dryRun: false,
    keyField: DEFAULT_KEY_FIELD
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--project':
      case '-p':
        args.project = argv[++i];
        break;
      case '--input':
      case '-i':
        args.input = argv[++i];
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--key-field':
        args.keyField = argv[++i] || DEFAULT_KEY_FIELD;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith('-')) {
          console.warn(`⚠️  Argumento desconocido: ${arg}`);
        }
    }
  }

  if (!args.project || !args.project.trim()) {
    console.error('❌ Falta el parámetro --project');
    printHelp();
    process.exit(1);
  }

  if (!args.input || !args.input.trim()) {
    console.error('❌ Falta el parámetro --input');
    printHelp();
    process.exit(1);
  }

  return args;
}

function printHelp() {
  console.log(`Importa tareas en Firebase evitando duplicados.

Uso:
  node scripts/import-tasks.js --project PROYECTO --input ./tasks.json [--dry-run] [--key-field cardId]

Opciones:
  --project, -p   ID del proyecto (obligatorio).
  --input,   -i   Ruta al archivo JSON con las tareas (obligatorio).
  --dry-run       Realiza la validación sin escribir en Firebase.
  --key-field     Campo que identifica cada tarea (por defecto "cardId").
  --help,    -h   Muestra esta ayuda.
`);
}

function loadJson(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ El archivo ${absolutePath} no existe.`);
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`❌ Error leyendo el JSON (${absolutePath}):`, error.message);
    process.exit(1);
  }
}

function normalizePrivateKey(value) {
  if (!value) {
    return value;
  }
  return value.replace(/\\n/g, '\n');
}

async function buildCredential() {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath) {
    const absolutePath = path.resolve(serviceAccountPath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo inexistente: ${absolutePath}`);
      process.exit(1);
    }
    const serviceJson = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
    return admin.credential.cert(serviceJson);
  }

  const clientEmail = process.env.PUBLIC_FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.PUBLIC_FIREBASE_PRIVATE_KEY);
  const projectId = process.env.PUBLIC_FIREBASE_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) {
    console.error('❌ No se encontraron credenciales en el entorno. Define GOOGLE_APPLICATION_CREDENTIALS o PUBLIC_FIREBASE_*');
    process.exit(1);
  }

  return admin.credential.cert({
    type: 'service_account',
    project_id: projectId,
    private_key_id: process.env.PUBLIC_FIREBASE_PRIVATE_KEY_ID || 'not-provided',
    private_key: privateKey,
    client_email: clientEmail,
    client_id: process.env.PUBLIC_FIREBASE_CLIENT_ID || 'not-provided',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${clientEmail.replace('@', '%40')}`
  });
}

async function ensureFirebaseInitialized() {
  if (admin.apps.length > 0) {
    return;
  }

  const databaseURL =
    process.env.PUBLIC_FIREBASE_DATABASE_URL ||
    process.env.FIREBASE_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!databaseURL) {
    console.error('❌ Falta la URL de la base de datos (PUBLIC_FIREBASE_DATABASE_URL o FIREBASE_DATABASE_URL).');
    process.exit(1);
  }

  const credential = await buildCredential();
  admin.initializeApp({
    credential,
    databaseURL
  });
}

function extractTasks(data, keyField) {
  const tasks = [];

  const normalizeEntry = (maybeKey, payload) => {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Cada tarea debe ser un objeto con sus propiedades.');
    }
    const candidate = (maybeKey || payload[keyField] || payload.cardId || payload.id || '').toString().trim();
    if (!candidate) {
      throw new Error('No se encontró un identificador para la tarea (cardId/id).');
    }
    const cloned = { ...payload };
    cloned.cardId = cloned.cardId || candidate;
    cloned.id = cloned.id || candidate;
    return [candidate, cloned];
  };

  if (Array.isArray(data)) {
    data.forEach(item => {
      const [key, payload] = normalizeEntry(null, item);
      tasks.push([key, payload]);
    });
  } else if (data && typeof data === 'object') {
    Object.entries(data).forEach(([key, payload]) => {
      const [normalizedKey, normalizedPayload] = normalizeEntry(key, payload);
      tasks.push([normalizedKey, normalizedPayload]);
    });
  } else {
    throw new Error('El JSON debe contener un array de tareas o un objeto {id: tarea}.');
  }

  return tasks;
}

async function main() {
  const args = parseArgs(process.argv);
  const projectId = args.project.trim();
  const inputData = loadJson(args.input);

  let tasks;
  try {
    tasks = extractTasks(inputData, args.keyField);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }

  if (tasks.length === 0) {
    console.log('⚠️  No se encontraron tareas en el archivo proporcionado.');
    return;
  }

  await ensureFirebaseInitialized();

  const basePath = `/cards/${projectId}/TASKS_${projectId}`;
  const ref = admin.database().ref(basePath);
  const snapshot = await ref.get();
  const existing = snapshot.exists() ? snapshot.val() : {};

  const existingKeys = new Set(Object.keys(existing || {}));
  const existingCardIds = new Set(
    Object.entries(existing || {})
      .map(([, payload]) => (payload && typeof payload === 'object' ? payload.cardId || payload.id : null))
      .filter(Boolean)
      .map(value => value.toString().trim())
  );

  const toInsert = {};
  const skippedExisting = [];
  const skippedCardId = [];

  tasks.forEach(([key, payload]) => {
    if (existingKeys.has(key)) {
      skippedExisting.push(key);
      return;
    }
    const cardId = (payload.cardId || payload.id || key).toString().trim();
    if (existingCardIds.has(cardId)) {
      skippedCardId.push(cardId);
      return;
    }
    toInsert[key] = payload;
  });

  const newCount = Object.keys(toInsert).length;
  if (newCount === 0) {
    console.log('✅ No hay tareas nuevas para insertar.');
  } else if (args.dryRun) {
    console.log(`🚫 Modo dry-run: se omite la escritura de ${newCount} tareas nuevas en ${basePath}.`);
  } else {
    await ref.update(toInsert);
    console.log(`✅ Insertadas ${newCount} tareas nuevas en ${basePath}.`);
  }

  if (skippedExisting.length > 0) {
    console.log(`ℹ️  ${skippedExisting.length} tareas omitidas porque ya existían con la misma clave.`);
    skippedExisting.slice(0, 5).forEach(key => console.log(`   - ${key}`));
    if (skippedExisting.length > 5) {
      console.log(`   ... y ${skippedExisting.length - 5} más`);
    }
  }

  if (skippedCardId.length > 0) {
    console.log(`ℹ️  ${skippedCardId.length} tareas omitidas por duplicar cardId.`);
    skippedCardId.slice(0, 5).forEach(key => console.log(`   - ${key}`));
    if (skippedCardId.length > 5) {
      console.log(`   ... y ${skippedCardId.length - 5} más`);
    }
  }
}

main().catch(error => {
  console.error('❌ Error durante la importación:', error);
  process.exit(1);
});
