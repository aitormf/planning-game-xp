/**
 * Script para configurar el usuario de test en Firebase
 * Establece permisos "All" para que pueda ver todos los proyectos
 *
 * Ejecutar con: node playwright/setup-test-user.js
 */

import dotenv from 'dotenv';

// Cargar variables de entorno del archivo .env.test
dotenv.config({ path: '.env.test' });

const DATABASE_URL = process.env.PUBLIC_FIREBASE_DATABASE_URL;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'testuser@example.com';

// Codificar email para Firebase (@ → |, . → !)
function encodeEmailForFirebase(email) {
  return email.replaceAll('@', '|').replaceAll('.', '!').replaceAll('#', '-');
}

const userKey = encodeEmailForFirebase(TEST_USER_EMAIL);
const url = `${DATABASE_URL}/data/projectsByUser/${userKey}.json`;

console.log(`📧 Configurando usuario de test: ${TEST_USER_EMAIL}`);
console.log(`🔑 User key: ${userKey}`);
console.log(`🌐 URL: ${url}`);

try {
  // Establecer permisos "All" para el usuario de test
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify('All')
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const result = await response.json();
  console.log(`✅ Usuario configurado correctamente:`, result);

  // Verificar que se guardó
  const verifyResponse = await fetch(url);
  const verifyData = await verifyResponse.json();
  console.log(`✅ Verificación: /data/projectsByUser/${userKey} = ${JSON.stringify(verifyData)}`);

} catch (error) {
  console.error('❌ Error configurando usuario:', error.message);
  process.exit(1);
}
