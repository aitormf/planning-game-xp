/**
 * Script to migrate hardcoded documentation to Firebase
 * Run this once to populate Firebase with initial content
 *
 * Usage: node scripts/migrate-docs-to-firebase.js
 */

const initialDocs = [
  {
    title: 'Engineering Playbook',
    path: '/',
    section: 'general',
    order: 0,
    content: `# Engineering Playbook

Esta sección define cómo trabajamos en ingeniería: Git, calidad de código, despliegues y uso de IA.

## Contenido

- [Git & flujo de trabajo](#/git)
- [Despliegues](#/deploy)
- [IA en PRs](#/ai)
- [PlanningGame](#/planninggame)`
  },
  {
    title: 'Visión general',
    path: '/git',
    section: 'git',
    order: 0,
    content: `# Git

Guía oficial de cómo trabajamos con Git en el equipo.

## Contenido

- [Flujo de trabajo](#/git/workflow)
- [Calidad en PR](#/git/pr-quality-gates)
- [Plan de transición](#/git/transition)`
  },
  {
    title: 'Flujo de trabajo',
    path: '/git/workflow',
    section: 'git',
    order: 1,
    content: `# Flujo de trabajo Git

Trabajamos con **Trunk-Based Development**.

## Principios

- Una única rama principal: \`main\`
- \`main\` siempre debe ser desplegable
- Todo cambio entra por Pull Request
- Las ramas de trabajo son cortas

## Ramas

- \`feature/<ticket>-<descripcion>\`
- \`fix/<ticket>-<descripcion>\`
- \`chore/<descripcion>\`

## Pull Requests

- PR obligatoria hacia \`main\`
- Revisión automática por IA
- Revisión humana obligatoria
- Merge solo cuando todo está en OK

## Hotfix

Un hotfix no es un flujo especial. Es un fix normal que entra en \`main\` y se libera como versión.

## Entornos

Los entornos no son ramas. DEV, PRE y PRO son decisiones de despliegue, no ramas Git.`
  },
  {
    title: 'Calidad en PR',
    path: '/git/pr-quality-gates',
    section: 'git',
    order: 2,
    content: `# Calidad y requisitos de PR

Para que una PR pueda mergearse a \`main\` debe cumplir:

## Requisitos obligatorios

- Build correcta
- Lint correcto
- Tests correctos
- Revisión IA: OK
- Revisión humana: OK
- Conversaciones resueltas

## Qué revisa la IA

- Bugs evidentes
- Problemas de seguridad
- Problemas de rendimiento obvios
- Complejidad innecesaria
- Código duplicado

## Qué revisa el humano

- Correctitud funcional
- Diseño y mantenibilidad
- Impacto en el sistema
- Riesgos y trade-offs

## Urgencias

En casos críticos se puede reducir el alcance, pero nunca se elimina la revisión humana ni la de IA.`
  },
  {
    title: 'Plan de transición',
    path: '/git/transition',
    section: 'git',
    order: 3,
    content: `# Plan de transición

Objetivo: pasar a trunk-based sin romper el delivery.

## Fase 1

- PR obligatoria
- Protección de \`main\`
- Checks automáticos

## Fase 2

- Eliminar ramas por entorno
- Todo fix entra en \`main\`

## Fase 3

- Endurecer calidad
- IA como check obligatorio

## Escalabilidad

Este modelo funciona con equipos de 10–12 personas porque reduce coordinación y dependencias humanas.`
  },
  {
    title: 'Visión general',
    path: '/deploy',
    section: 'deploy',
    order: 0,
    content: `# Despliegues

Guías de despliegue independientes del flujo Git.

## Contenido

- [Vercel](#/deploy/vercel)`
  },
  {
    title: 'Vercel',
    path: '/deploy/vercel',
    section: 'deploy',
    order: 1,
    content: `# Despliegue en Vercel

Esta guía define un modelo ideal de despliegue en Vercel.

## Principios

- Despliegues explícitos
- Producción trazable
- Rollback posible

## Entornos

- **DEV**: integración continua
- **PRE**: validación controlada
- **PRO**: solo versiones aprobadas

## Requisitos para desplegar

- Código aprobado en \`main\`
- Calidad verificada
- Responsabilidad clara de quién despliega`
  },
  {
    title: 'Visión general',
    path: '/ai',
    section: 'ai',
    order: 0,
    content: `# IA en el flujo de desarrollo

Uso de inteligencia artificial para revisar Pull Requests.

## Contenido

- [Revisión de PR con IA](#/ai/pr-review-openai)`
  },
  {
    title: 'Revisión PR',
    path: '/ai/pr-review-openai',
    section: 'ai',
    order: 1,
    content: `# Revisión de PR con IA

La IA revisa todas las Pull Requests.

## Rol de la IA

- Analiza el diff
- Detecta problemas
- Emite OK o NOK

## Rol del humano

- Toma la decisión final
- Evalúa contexto y producto

## Política

- IA OK + Humano OK = merge permitido
- IA NOK = la PR no puede mergearse`
  },
  {
    title: 'Visión general',
    path: '/planninggame',
    section: 'planninggame',
    order: 0,
    content: `# PlanningGame

Integración futura entre PlanningGame, GitHub y despliegues.

## Contenido

- [Documento de integración](#/planninggame/integration)`
  },
  {
    title: 'Integración',
    path: '/planninggame/integration',
    section: 'planninggame',
    order: 1,
    content: `# Integración con PlanningGame

Este documento describe una integración futura.

## Objetivo

- Vincular tickets con PRs
- Visualizar estado de calidad
- Conocer qué versión está en cada entorno

## Fases

1. Visibilidad
2. Gobernanza
3. Acciones

*No se implementa código aún.*`
  }
];

// Output JSON for manual import or use with Firebase Admin SDK
console.log('=== Documentation Migration Data ===\n');
console.log('Copy this JSON to Firebase Realtime Database under /docs/\n');

const docsData = {};
initialDocs.forEach((doc, index) => {
  const docId = `doc_${String(index + 1).padStart(3, '0')}`;
  const now = new Date().toISOString();
  docsData[docId] = {
    ...doc,
    createdAt: now,
    createdBy: 'system@migration',
    updatedAt: now,
    updatedBy: 'system@migration'
  };
});

console.log(JSON.stringify(docsData, null, 2));

console.log('\n\n=== Instructions ===');
console.log('1. Go to Firebase Console > Realtime Database');
console.log('2. Navigate to the root of your database');
console.log('3. Click the three dots menu > Import JSON');
console.log('4. Or manually create a "docs" node and paste the JSON above');
console.log('\nAlternatively, you can use the Firebase emulator UI at http://localhost:4000');
