#!/usr/bin/env bash
# Déploiement / mise à jour sur le VPS IONOS (à lancer depuis la racine du projet).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  if [[ -f .env.production.example ]]; then
    echo ""
    echo "→ Pas de .env : lance d'abord npm run env:init"
    echo ""
    exit 1
  fi
  echo "Erreur : fichier .env manquant."
  exit 1
fi

if grep -v '^[[:space:]]*#' .env | grep -qE 'CHANGEME'; then
  echo ""
  echo "Erreur : des valeurs CHANGEME restent dans .env."
  echo "Ouvre .env et remplace :"
  echo "  - CHANGEME_MOT_DE_PASSE_DB"
  echo "  - CHANGEME_MOT_DE_PASSE_ADMIN"
  echo "  - CHANGEME_MOT_DE_PASSE_BOITE_MAIL"
  echo ""
  exit 1
fi

echo "==> Dossiers uploads"
mkdir -p public/uploads/images public/uploads/audio logs backups

echo "==> Dépendances"
# devDependencies requises pour le build TypeScript (Next.js)
npm ci --include=dev

export NODE_ENV=production

echo "==> Base de données"
npx prisma migrate deploy
npx prisma generate

echo "==> Compte admin"
npm run create-admin

echo "==> Catalogue (catégories + vidéos YouTube)"
npm run seed:catalog
npm run seed:youtube

echo "==> Contenu démo soutenance (profil, agenda)"
if npm run seed:soutenance 2>/dev/null; then
  echo "    Seed soutenance OK."
else
  echo "    Seed soutenance ignoré (optionnel)."
fi

echo "==> Build Next.js"
npm run build

echo "==> PM2"
if pm2 describe sport-journal >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
  pm2 save
  echo ""
  echo "→ Pour redémarrage auto au boot (Rocky 9), exécute une fois :"
  echo "  pm2 startup systemd"
  echo "  pm2 save"
  echo ""
fi

echo "==> Cron rappels agenda"
if bash scripts/install-cron.sh 2>/dev/null; then
  echo "    Cron OK."
else
  echo "    Cron non installé (lance : npm run install:cron)"
fi

echo "==> Vérifications"
sleep 2
if node scripts/post-deploy-check.mjs; then
  :
else
  echo "⚠ Certaines vérifications ont échoué — le site peut quand même tourner."
fi

echo ""
echo "✓ Déploiement terminé."
echo "  Site   : https://thomaspalmier.fr"
echo "  Admin  : https://thomaspalmier.fr/login"
echo "  Logs   : pm2 logs sport-journal"
echo ""
