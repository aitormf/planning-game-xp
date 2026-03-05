# Pendiente: deploy geniova

## Estado actual
- Personal desplegado: https://planning-game-xp.web.app
- Geniova fallo en deploy hosting por permisos de Firebase:
  - Error: `Failed to get Firebase project planning-gamexp`
  - Log: `/tmp/deploy-all-geniova.log`

## Pendiente por hacer
1) Autenticarse con la cuenta de Firebase que tiene acceso a `planning-gamexp`.
2) Rehacer build y deploy (recomendado) porque hubo commits despues del build:
   - `CHANGELOG.md` sigue en `[Unreleased]` y no contiene `1.164.3`.
   - Hubo un commit extra para sincronizar `lastBuildCommit`.

## Comandos sugeridos
```bash
# (opcional, recomendado) regenerar build para que version/changelog cuadren
npm run build:all

# deploy solo hosting (geniova + personal)
npm run deploy:all -- --only hosting
```

## Nota sobre tests
- En este entorno, los pre-commit fallaron para la instancia `geniova` en tests de reglas
  (custom claims / /users/). No bloquea el build, pero conviene revisar si se tocan reglas.
