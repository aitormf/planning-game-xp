import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const firebaseConfigPath = path.resolve(process.cwd(), 'public/firebase-config.js');
const firebaseSnapshotPath = path.join(__dirname, '.firebase-config.snapshot');

/**
 * Global teardown que se ejecuta después de todos los tests
 */

async function globalTeardown() {
  console.log('🧹 Ejecutando teardown global...');
  if (fs.existsSync(firebaseSnapshotPath) && fs.existsSync(firebaseConfigPath)) {
    fs.writeFileSync(firebaseConfigPath, fs.readFileSync(firebaseSnapshotPath, 'utf8'));
    fs.unlinkSync(firebaseSnapshotPath);
  }
  console.log('✅ Teardown global completado');
}

export default globalTeardown;
