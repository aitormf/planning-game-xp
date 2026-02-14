---
layout: ../../../components/doc/DocLayout.astro
---
# Calidad y requisitos de PR

Para que una PR pueda mergearse a `main` debe cumplir:

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
En casos críticos se puede reducir el alcance,
pero nunca se elimina la revisión humana ni la de IA.
