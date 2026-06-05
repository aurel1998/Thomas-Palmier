#!/usr/bin/env bash
# Installe le cron horaire des rappels agenda (24 h avant).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "Erreur : node introuvable."
  exit 1
fi

LOG_FILE="/var/log/sport-journal-cron.log"
if ! touch "$LOG_FILE" 2>/dev/null; then
  LOG_FILE="$ROOT/logs/cron.log"
  mkdir -p "$(dirname "$LOG_FILE")"
  touch "$LOG_FILE"
fi

if [[ ! -f .env ]] || ! grep -q '^CRON_SECRET=' .env || grep -q 'CHANGEME' .env; then
  echo "Erreur : configure CRON_SECRET dans .env avant d'installer le cron."
  exit 1
fi

CRON_LINE="0 * * * * cd $ROOT && $NODE_BIN scripts/cron-event-reminders.mjs >> $LOG_FILE 2>&1"

EXISTING="$(crontab -l 2>/dev/null || true)"
FILTERED="$(echo "$EXISTING" | grep -v 'cron-event-reminders.mjs' || true)"
{ echo "$FILTERED"; echo "$CRON_LINE"; } | sed '/^$/d' | crontab -

echo "✓ Cron installé (chaque heure)."
echo "  Log : $LOG_FILE"
echo "  Test : npm run cron:event-reminders"
