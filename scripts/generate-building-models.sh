#!/usr/bin/env bash
# Locate Blender and run the building model generator headlessly.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="$SCRIPT_DIR/generate-building-models.py"

BLENDER="${BLENDER:-}"
if [ -z "$BLENDER" ]; then
  if [ -x "/Applications/Blender.app/Contents/MacOS/Blender" ]; then
    BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
  elif command -v blender >/dev/null 2>&1; then
    BLENDER="blender"
  else
    echo "[buildings:generate] Blender not found. Set BLENDER env var or install Blender." >&2
    exit 1
  fi
fi

exec "$BLENDER" --background --python "$PY" -- "$@"
