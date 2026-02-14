---
layout: ../../../components/doc/DocLayout.astro
---
# Despliegue en Vercel

Esta guía define un modelo ideal de despliegue en Vercel.

## Principios
- Despliegues explícitos
- Producción trazable
- Rollback posible

## Entornos
- DEV: integración continua
- PRE: validación controlada
- PRO: solo versiones aprobadas

## Requisitos para desplegar
- Código aprobado en `main`
- Calidad verificada
- Responsabilidad clara de quién despliega
