#!/usr/bin/env bash
# Sauvegarde PostgreSQL + uploads (à planifier en cron hebdomadaire).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^DATABASE_URL=' .env | sed 's/^/export /')
  set +a
fi

DB_NAME="${DB_NAME:-sport_journal}"
DB_FILE="$BACKUP_DIR/db-$STAMP.sql"
UPLOADS_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"

echo "==> Dump PostgreSQL → $DB_FILE"
pg_dump "$DATABASE_URL" -F p -f "$DB_FILE" 2>/dev/null || pg_dump -U sport -h localhost "$DB_NAME" -F p -f "$DB_FILE"

if [[ -d public/uploads ]]; then
  echo "==> Archive uploads → $UPLOADS_FILE"
  tar -czf "$UPLOADS_FILE" -C public uploads
fi

echo "✓ Sauvegarde terminée dans $BACKUP_DIR"
