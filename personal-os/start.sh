#!/usr/bin/env bash
# Inicia el backend (puerto 4000) y el frontend (puerto 5173) en paralelo.
set -e
cd "$(dirname "$0")"

cleanup() {
  echo ""
  echo "Cerrando Personal OS..."
  kill 0
}
trap cleanup EXIT INT TERM

echo "🚀 Iniciando backend en http://localhost:4000 ..."
(cd backend && npm start) &

sleep 1

echo "🚀 Iniciando frontend en http://localhost:5173 ..."
(cd frontend && npm run dev) &

wait
