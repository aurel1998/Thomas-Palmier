# Déploiement — VPS IONOS

> **Démarrage rapide** : **[IONOS_QUICKSTART.md](./IONOS_QUICKSTART.md)**  
> **Serveur** : `root@217.160.191.235` · Rocky Linux 9 · **[deploy/VPS.md](./deploy/VPS.md)**

Site fullstack autonome : **Next.js 15 + PostgreSQL (Prisma) + NextAuth + uploads disque + Nodemailer**.

## 1. Prérequis serveur (Rocky 9)

Tout est installé par `bash scripts/setup-ionos-vps.sh` : Node 20, PostgreSQL, Nginx, PM2, firewalld, certbot.

## 2. Base de données

```bash
sudo -u postgres psql
CREATE DATABASE sport_journal;
CREATE USER sport WITH ENCRYPTED PASSWORD 'mot_de_passe_fort';
GRANT ALL PRIVILEGES ON DATABASE sport_journal TO sport;
\q
```

## 3. Variables d'environnement (`.env`)

```ini
DATABASE_URL="postgresql://sport:mot_de_passe_fort@localhost:5432/sport_journal?schema=public"
JWT_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="https://thomaspalmier.fr"
NEXT_PUBLIC_APP_URL="https://thomaspalmier.fr"
ADMIN_EMAIL="contact@thomaspalmier.fr"
ADMIN_PASSWORD="<mot de passe admin fort>"
CONTACT_EMAIL="contact@thomaspalmier.fr"
NEXT_PUBLIC_CONTACT_EMAIL="contact@thomaspalmier.fr"
# Emails (IONOS)
EMAIL_USER="contact@thomaspalmier.fr"
EMAIL_PASS="<mot de passe email>"
SMTP_HOST="smtp.ionos.fr"
SMTP_PORT="587"
SMTP_SECURE="false"
MAIL_FROM="Thomas Palmier <contact@thomaspalmier.fr>"
```

## 4. Installation & build

```bash
git clone https://github.com/aurel1998/Thomas-Palmier.git /var/www/sport-journal
cd /var/www/sport-journal
npm ci
npx prisma migrate deploy   # applique les migrations
npx prisma generate
npm run env:init                  # crée .env + génère JWT/CRON
nano .env                         # 3 CHANGEME : DB, admin, boîte mail
npm run deploy:vps                # migrate + admin + build + PM2 + cron
```

> **Production** : aucun contenu ni agenda fictif n’est injecté (`NODE_ENV=production`).
> Si le catalogue est vide, publiez via `/monsite` ou lancez `npm run seed:catalog` une fois.

## 4.b Vérification accès admin

Après `npm run create-admin`, teste immédiatement :

- `https://ton-domaine.fr/login`
- `https://ton-domaine.fr/monsite`

Référence complète : voir `ADMIN_ACCESS.md`.

## 5. Lancement (PM2)

```bash
pm2 start ecosystem.config.js
pm2 save && pm2 startup     # redémarrage auto au boot
```

> Garder `next start` (pas `output: standalone`) pour le serving natif de `public/uploads`.

## 6. Reverse-proxy Nginx + HTTPS

```nginx
server {
  server_name ton-domaine.fr;
  client_max_body_size 64M;   # autorise les uploads audio (≤60 Mo)
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo certbot --nginx -d ton-domaine.fr   # certificat Let's Encrypt
```

## 7. Mises à jour

```bash
cd /var/www/sport-journal
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 reload sport-journal
```

## 8. Rappels agenda (cron horaire)

Les événements avec **« Envoyer un rappel 24 h avant »** déclenchent un email aux abonnés actifs environ 24 h avant la date.

1. Ajouter dans `.env` sur le VPS :

```bash
CRON_SECRET="$(openssl rand -base64 32)"
```

2. Tester manuellement :

```bash
npm run cron:event-reminders
# ou
curl -fsS -H "Authorization: Bearer VOTRE_CRON_SECRET" https://thomaspalmier.fr/api/cron/event-reminders
```

3. Planifier dans la crontab de l'utilisateur du site (`crontab -e`) :

```cron
0 * * * * cd /var/www/sport-journal && /usr/bin/node scripts/cron-event-reminders.mjs >> /var/log/sport-journal-cron.log 2>&1
```

Le job tourne **chaque heure** ; la fenêtre d'envoi couvre 23 h–25 h avant l'événement. `pm2` doit rester actif (`sport-journal`).

## 9. Sauvegardes (à planifier en cron)

- **Base** : `pg_dump sport_journal > backup_$(date +%F).sql`
- **Médias** : archiver le dossier `public/uploads/` (les fichiers y vivent sur disque).
