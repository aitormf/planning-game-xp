#!/usr/bin/env node

/**
 * Script para inicializar contadores de Firestore para proyectos
 * 
 * IMPORTANTE: Este script debe ejecutarse desde la consola del navegador
 * después de estar logueado en la aplicación, NO desde Node.js
 * 
 * USO:
 * 1. Ir a http://localhost:4321 (o la URL de producción)
 * 2. Loguearse en la aplicación
 * 3. Abrir consola del navegador (F12)
 * 4. Copiar y pegar el código de abajo
 * 5. Ejecutar: initializeProjectCounters('NombreDelProyecto')
 */

console.log(`
🔢 INICIALIZADOR AUTOMÁTICO DE CONTADORES DE PROYECTO
====================================================

COPIA Y PEGA ESTE CÓDIGO EN LA CONSOLA DEL NAVEGADOR:

// ========== CÓDIGO PARA LA CONSOLA DEL NAVEGADOR ==========

/**
 * Inicializa contadores de Firestore para un proyecto
 * @param {string} projectId - ID del proyecto (ej: "MiNuevoProyecto")
 * @param {Object} options - { dryRun: boolean, force: boolean }
 */
window.initializeProjectCounters = async function(projectId, options = {}) {
  if (!projectId) {
    console.error('❌ Error: projectId es requerido');
    return;
  }
  
  if (!window.ServiceCommunicator) {
    console.error('❌ Error: ServiceCommunicator no disponible. ¿Estás logueado en la aplicación?');
    return;
  }
  
  console.log(\`🔢 Inicializando contadores para proyecto: \${projectId}\`);
  
  try {
    const result = await window.ServiceCommunicator.initializeProjectCounters(projectId, options);
    
    console.log('📊 RESULTADO:');
    console.log(\`   📋 Proyecto: \${result.projectId} (\${result.projectAbbr})\`);
    console.log(\`   ✅ Existían: \${result.existing}\`);
    console.log(\`   🆕 Creados: \${result.created}\`);
    console.log(\`   💬 Mensaje: \${result.message}\`);
    
    if (result.created > 0) {
      console.log('🎉 ¡Contadores creados exitosamente!');
    } else if (result.existing > 0) {
      console.log('✅ Todos los contadores ya existían (sin cambios)');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error inicializando contadores:', error);
    return { error: error.message, success: false };
  }
};

/**
 * Verificar qué contadores se crearían sin crearlos realmente
 */
window.checkProjectCounters = async function(projectId) {
  return await window.initializeProjectCounters(projectId, { dryRun: true });
};

// ========== FIN DEL CÓDIGO ==========

EJEMPLOS DE USO:
================

// Verificar qué se crearía (no crea nada):
checkProjectCounters('MiNuevoProyecto')

// Crear contadores para proyecto nuevo:
initializeProjectCounters('MiNuevoProyecto')

// Verificar proyecto existente (protegido):
initializeProjectCounters('Cinema4D')

CONTADORES QUE SE CREAN AUTOMÁTICAMENTE:
=======================================
- {PROYECTO}-TSK (Tasks/Historias)
- {PROYECTO}-BUG (Bugs/Defectos)  
- {PROYECTO}-EPC (Epics)
- {PROYECTO}-PRP (Propuestas)
- {PROYECTO}-_QA (Quality Assurance)
- {PROYECTO}-SPR (Sprints)

SEGURIDAD:
==========
✅ NUNCA modifica contadores existentes
✅ Solo crea contadores que no existen
✅ Verificación doble antes de crear
✅ Logs detallados de todas las acciones
✅ Dry-run disponible para verificar sin cambios

Para más ayuda, ejecuta: initializeProjectCounters() sin parámetros
`);

// Este script no hace nada más, solo proporciona documentación
// La funcionalidad real está en firebase-service.js