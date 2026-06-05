#!/usr/bin/env bash
# Préparation initiale du VPS IONOS (une seule fois).
# Testé : Rocky Linux 9 (IONOS). Compatible aussi Debian/Ubuntu.
#
# Usage (root sur Rocky 9) :
#   bash scripts/setup-ionos-vps.sh [MOT_DE_PASSE_DB]
#
# Depuis : /var/www/sport-journal
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Erreur : lance ce script en root (ou avec sudo)."
  echo "  ssh root@217.160.191.235"
  echo "  bash scripts/setup-ionos-vps.sh"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB_PASSWORD="${1:-}"
if [[ -z "$DB_PASSWORD" ]]; then
  read -rsp "Mot de passe PostgreSQL (utilisateur sport) : " DB_PASSWORD
  echo ""
  if [[ -z "$DB_PASSWORD" ]]; then
    echo "Erreur : mot de passe vide."
    exit 1
  fi
fi

detect_os() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    echo "${ID:-unknown}"
  else
    echo "unknown"
  fi
}

OS_ID="$(detect_os)"
echo "==> Système détecté : ${OS_ID}"

install_packages_debian() {
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get upgrade -y -qq
  apt-get install -y -qq curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw \
    gcc g++ make python3
}

install_packages_rocky() {
  dnf install -y epel-release
  dnf install -y curl git nginx postgresql-server postgresql-contrib certbot python3-certbot-nginx \
    firewalld policycoreutils-python-utils gcc-c++ make python3

  if [[ ! -f /var/lib/pgsql/data/PG_VERSION ]]; then
    postgresql-setup --initdb
  fi
  systemctl enable --now postgresql
}

install_node() {
  if command -v node >/dev/null 2>&1 && [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -ge 20 ]]; then
    return 0
  fi
  echo "==> Node.js 20"
  if [[ "$OS_ID" == "rocky" || "$OS_ID" == "rhel" || "$OS_ID" == "almalinux" || "$OS_ID" == "centos" ]]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs
  else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
  fi
}

configure_firewall_debian() {
  ufw allow OpenSSH
  ufw allow "Nginx Full"
  ufw --force enable
}

configure_firewall_rocky() {
  systemctl enable --now firewalld
  firewall-cmd --permanent --add-service=ssh
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload
}

configure_selinux_rocky() {
  if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce)" != "Disabled" ]]; then
    echo "==> SELinux : autoriser Nginx → Next.js :3000"
    setsebool -P httpd_can_network_connect 1
  fi
}

install_nginx_config() {
  NGINX_SRC="$ROOT/deploy/nginx/thomaspalmier.fr.conf"
  if [[ ! -f "$NGINX_SRC" ]]; then
    echo "Avertissement : config Nginx introuvable."
    return 0
  fi

  if [[ "$OS_ID" == "rocky" || "$OS_ID" == "rhel" || "$OS_ID" == "almalinux" || "$OS_ID" == "centos" ]]; then
    NGINX_DST="/etc/nginx/conf.d/thomaspalmier.fr.conf"
    cp "$NGINX_SRC" "$NGINX_DST"
    # Évite le conflit avec la page par défaut Rocky
    if [[ -f /etc/nginx/conf.d/default.conf ]]; then
      mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true
    fi
  else
    NGINX_DST="/etc/nginx/sites-available/thomaspalmier.fr"
    cp "$NGINX_SRC" "$NGINX_DST"
    ln -sf "$NGINX_DST" /etc/nginx/sites-enabled/thomaspalmier.fr
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  fi

  nginx -t
  systemctl enable nginx
  systemctl restart nginx
}

echo "==> Paquets système"
case "$OS_ID" in
  rocky|rhel|almalinux|centos|fedora)
    install_packages_rocky
    ;;
  debian|ubuntu|linuxmint|pop)
    install_packages_debian
    ;;
  *)
    echo "OS non reconnu ($OS_ID) — tentative Rocky/RHEL…"
    install_packages_rocky || install_packages_debian
    ;;
esac

install_node

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> PM2"
  npm install -g pm2
fi

echo "==> Pare-feu"
case "$OS_ID" in
  rocky|rhel|almalinux|centos|fedora)
    configure_firewall_rocky
    configure_selinux_rocky
    ;;
  *)
    configure_firewall_debian
    ;;
esac

echo "==> PostgreSQL"
SQL_FILE="$ROOT/deploy/postgres-init.sql"
if [[ ! -f "$SQL_FILE" ]]; then
  echo "Erreur : $SQL_FILE introuvable."
  exit 1
fi
TMP_SQL="$(mktemp)"
ESCAPED="${DB_PASSWORD//\'/\'\'}"
sed "s/:DB_PASSWORD/${ESCAPED}/g" "$SQL_FILE" > "$TMP_SQL"
if sudo -u postgres psql -v ON_ERROR_STOP=1 -f "$TMP_SQL" 2>/dev/null; then
  echo "    Base sport_journal prête."
else
  echo "    Note : la base existe peut-être déjà (relance OK si sport_journal est là)."
  sudo -u postgres psql -v ON_ERROR_STOP=1 -f "$TMP_SQL" || true
fi
rm -f "$TMP_SQL"

# Rocky 9 : Prisma se connecte en TCP (localhost) — mot de passe requis
PG_HBA=""
for candidate in /var/lib/pgsql/data/pg_hba.conf /var/lib/postgresql/*/main/pg_hba.conf; do
  [[ -f "$candidate" ]] && PG_HBA="$candidate" && break
done
if [[ -n "$PG_HBA" ]]; then
  if grep -qE '127\.0\.0\.1/32\s+(ident|peer)' "$PG_HBA"; then
    sed -i -E 's/^(host\s+all\s+all\s+127\.0\.0\.1\/32\s+)(ident|peer)/\1scram-sha-256/' "$PG_HBA"
    sed -i -E 's/^(host\s+all\s+all\s+::1\/128\s+)(ident|peer)/\1scram-sha-256/' "$PG_HBA"
    systemctl restart postgresql
    echo "    pg_hba.conf ajusté pour connexions localhost (Prisma)."
  fi
fi

if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U sport -d sport_journal -c 'SELECT 1' >/dev/null 2>&1; then
  echo "    Connexion sport@localhost OK."
else
  echo "    ⚠ Test connexion sport@localhost échoué — vérifie pg_hba.conf et le mot de passe DB."
fi

echo "==> Dossiers projet"
mkdir -p public/uploads/images public/uploads/audio logs backups

install_nginx_config

echo ""
echo "✓ Serveur Rocky/IONOS prêt (217.160.191.235)."
echo ""
echo "Prochaines étapes :"
echo "  cd $ROOT"
echo "  npm run env:init"
echo "  nano .env    # 3 CHANGEME (même mot de passe DB que ci-dessus)"
echo "  npm run deploy:vps"
echo ""
echo "DNS IONOS : A @ et www → 217.160.191.235"
echo "Puis HTTPS :"
echo "  certbot --nginx -d thomaspalmier.fr -d www.thomaspalmier.fr"
echo ""
