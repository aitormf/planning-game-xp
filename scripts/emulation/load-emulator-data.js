// Importa las librerías necesarias
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Conexión con el emulador ---
// Establece las variables de entorno para apuntar a los emuladores.
// Es crucial hacer esto ANTES de inicializar la app.
process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9001';
// Si también usaras otros emuladores en el script, los añadirías aquí:
// process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
// process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
// process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

// --- Read projectId from .env.dev (symlinked to active instance) ---
function getProjectIdFromEnv() {
  const envPath = path.join(__dirname, '../../.env.dev');
  if (!fs.existsSync(envPath)) {
    throw new Error('No .env.dev found. Run: npm run instance:use -- <name>');
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/^PUBLIC_FIREBASE_PROJECT_ID=(.+)$/m);
  if (!match) {
    throw new Error('PUBLIC_FIREBASE_PROJECT_ID not found in .env.dev');
  }
  return match[1].trim();
}

const projectId = getProjectIdFromEnv();

// --- Inicialización de Firebase Admin ---
// Usamos el projectId de la instancia activa y especificamos el namespace correcto
// Nota: El emulador en desarrollo usa el namespace de tests
admin.initializeApp({
  projectId,
  databaseURL: `http://localhost:9001?ns=${projectId}-tests-rtdb`
});

// Obtén una referencia a la Realtime Database
const db = admin.database();
const dbRef = db.ref('/'); // Referencia a la raíz de la base de datos

// --- Carga y subida de datos ---
// Find the first .json file in emulator-data/ (the exported database)
const emulatorDataDir = path.join(__dirname, '../../emulator-data');
const jsonFiles = fs.readdirSync(emulatorDataDir).filter(f => f.endsWith('.json'));
if (jsonFiles.length === 0) {
  console.error('No .json files found in emulator-data/. Export your database first.');
  process.exit(1);
}
const jsonPath = path.join(emulatorDataDir, jsonFiles[0]);
console.log(`Using emulator data: ${jsonFiles[0]}`);

// Lee el archivo de forma síncrona
try {
  console.log('🌱 Leyendo el archivo JSON...');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log('📝 Escribiendo datos en el emulador de Realtime Database...');

  // Usa el método set() para reemplazar todos los datos en la referencia raíz
  // Si quisieras añadir datos sin borrar los existentes, podrías usar update()
  dbRef.set(data)
    .then(() => {
      console.log('✅ Datos insertados correctamente.');
      process.exit(0); // Termina el script con éxito
    })
    .catch((error) => {
      console.error('❌ Error al insertar los datos:', error);
      process.exit(1); // Termina el script con error
    });

} catch (error) {
  console.error('❌ Error al leer o parsear el archivo JSON:', error);
  process.exit(1);
}