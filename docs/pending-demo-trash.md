## Pendiente: demo trash users

Objetivo: sembrar `dev_018` (David Nieto, `dnfernandez@geniova.com`) en `/trash/users` del entorno demo.

Requerido:
- Instance/credenciales que tengan acceso a RTDB demo.
- Service account del proyecto demo (o instancia en `planning-game-instances/`).

Endpoints demo:
- `https://pgamexp-demo-default-rtdb.firebaseio.com/`
- `https://pgamexp-demo.europe-west1.firebasedatabase.app/`

Script:
```
node scripts/migrate-users-trash.cjs --instance <demo-instance> --db-url <demo-rtdb-url>
```

## Pendiente: demo firestore rules

Objetivo: desplegar reglas de Firestore para permitir `projectCounters` en demo (igual que personal).

Requerido:
- Credenciales/instancia demo activas.

Archivo:
- `planning-game-instances/demo/firestore.rules` (crear si no existe).
