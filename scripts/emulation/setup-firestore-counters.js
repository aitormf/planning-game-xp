#!/usr/bin/env node

// Script para ejecutar DESPUÉS de estar logueado en la aplicación
// Este script debe ejecutarse desde la consola del navegador

console.log(`
📋 INSTRUCCIONES PARA CONFIGURAR CONTADORES DE FIRESTORE:

1. Asegúrate de que los emuladores estén corriendo (npm run emulator)
2. Ve a http://localhost:4321 y loguéate con tu usuario
3. Abre la consola del navegador (F12)
4. Copia y pega el siguiente código:

// ========== CÓDIGO PARA LA CONSOLA DEL NAVEGADOR ==========

(async () => {
  const { doc, setDoc } = window.firebase.firestore;
  const db = window.databaseFirestore;
  
  console.log('🔢 Creando contadores en Firestore...');
  
  const counters = {
    'DM_P-TSK': { lastId: 2 },
    'DM_P-BUG': { lastId: 1 },
    'DM_P-EPIC': { lastId: 1 },
    'DM_P-PRP': { lastId: 1 },
    'DM_P-QA': { lastId: 1 }
  };
  
  try {
    for (const [counterId, data] of Object.entries(counters)) {
      const docRef = doc(db, 'projectCounters', counterId);
      await setDoc(docRef, data);
      console.log(\`✅ Contador \${counterId}: \${data.lastId}\`);
    }
    console.log('🎉 ¡Todos los contadores creados!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();

// ========== FIN DEL CÓDIGO ==========

5. Presiona Enter para ejecutar
6. Deberías ver los mensajes de confirmación

¡Los contadores estarán listos para generar IDs correctamente!
`);