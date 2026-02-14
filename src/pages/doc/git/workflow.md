---
layout: ../../../components/doc/DocLayout.astro
---
# Flujo de trabajo Git

Trabajamos con **Trunk-Based Development**.

## Principios
- Una única rama principal: `main`
- `main` siempre debe ser desplegable
- Todo cambio entra por Pull Request
- Las ramas de trabajo son cortas

## Ramas
- feature/<ticket>-<descripcion>
- fix/<ticket>-<descripcion>
- chore/<descripcion>

## Pull Requests
- PR obligatoria hacia `main`
- Revisión automática por IA
- Revisión humana obligatoria
- Merge solo cuando todo está en OK

## Hotfix
Un hotfix no es un flujo especial.
Es un fix normal que entra en `main` y se libera como versión.

## Entornos
Los entornos no son ramas.
DEV, PRE y PRO son decisiones de despliegue, no ramas Git.
