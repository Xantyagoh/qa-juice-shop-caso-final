#!/bin/sh
# Ejecuta los tests unitarios de servidor de Juice Shop con cobertura (nyc) dentro de un contenedor Node 22.
# /src = repositorio (solo lectura)   /out = carpeta de salida con coverage/
set -e
mkdir -p /work && cd /src
tar --exclude=node_modules --exclude=.git --exclude=coverage -cf - . | tar -xf - -C /work
cd /work
echo "== npm install (sin scripts)"
npm install --ignore-scripts --no-audit --no-fund > /out/npm-ci.log 2>&1; echo "npm install exit=$?"; tail -5 /out/npm-ci.log
echo "== reconstruir m??dulos nativos"
npm rebuild sqlite3 2>&1 | tail -3 || true
echo "== tests unitarios de servidor con cobertura"
set +e
npm run test:server:coverage 2>&1 | tee /out/test-server-coverage.log | tail -60
CODE=$?
set -e
mkdir -p /out/coverage && cp -r coverage/. /out/coverage/ 2>/dev/null || true
echo "== exit tests: $CODE"
