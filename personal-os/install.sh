#!/usr/bin/env bash
# Instala las dependencias del backend y del frontend.
set -e

echo "📦 Instalando backend..."
cd "$(dirname "$0")/backend"
npm install

echo "📦 Instalando frontend..."
cd "../frontend"
npm install

echo ""
echo "✅ Instalación completa."
echo "Ejecuta ./start.sh para iniciar Personal OS."
