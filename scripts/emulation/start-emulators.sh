#!/bin/bash

# Limpiar procesos anteriores
echo "🧹 Limpiando procesos anteriores..."
pkill -f "firebase emulators" 2>/dev/null || true
pkill -f "java.*emulator" 2>/dev/null || true

# Esperar un momento para que se liberen los puertos
sleep 2

# Arrancar emuladores SIN importación automática
echo "🚀 Iniciando emuladores Firebase..."
firebase emulators:start --only firestore,database,storage,ui &

# Guardar el PID del proceso
EMULATOR_PID=$!

# Esperar a que los emuladores estén completamente listos
echo "⏳ Esperando que los emuladores estén completamente listos..."
sleep 10

# Ejecutar script de inserción de datos
echo "📊 Insertando datos demo..."
node scripts/emulation/load-emulator-data.js

# Mostrar mensaje final
echo ""
echo "✅ Emuladores listos con datos demo"
echo "📌 Ver datos en: http://localhost:4000"
echo "📌 Acceder a la app: http://localhost:4321"
echo "📌 Presiona Ctrl+C para detener los emuladores"
echo ""

# Mantener los emuladores corriendo
wait $EMULATOR_PID