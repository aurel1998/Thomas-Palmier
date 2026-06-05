# Déploiement IONOS — guide express (Rocky 9)

Serveur préconfiguré pour **thomaspalmier.fr**.

| Paramètre | Valeur |
|-----------|--------|
| **IP VPS** | `217.160.191.235` |
| **SSH** | `root@217.160.191.235` |
| **OS** | Rocky Linux 9 |
| **Projet** | `/var/www/sport-journal` |

Détails serveur : **[deploy/VPS.md](./deploy/VPS.md)**

---

## Avant le déploiement (sur ton PC + panneau IONOS)

1. **Push Git** du projet sur ton dépôt.
2. **Boîte mail** : créer **contact@thomaspalmier.fr** (mot de passe → `.env` plus tard).
3. **DNS domaine** (panneau IONOS → thomaspalmier.fr) :

| Type | Nom | Valeur |
|------|-----|--------|
| `A` | `@` | `217.160.191.235` |
| `A` | `www` | `217.160.191.235` |

---

## Sur le VPS — installation complète

### 0. Connexion

```bash
ssh root@217.160.191.235
```

(Mot de passe initial : panneau IONOS VPS → « Afficher mot de passe ».)

### 1. Cloner le projet

```bash
dnf install -y git
mkdir -p /var/www && cd /var/www
git clone https://github.com/aurel1998/Thomas-Palmier.git sport-journal
cd sport-journal
```

### 2. Préparer Rocky 9 (une seule fois)

```bash
bash scripts/setup-ionos-vps.sh
```

Installe : Node 20, PostgreSQL, Nginx, PM2, firewalld, SELinux, certbot.

Choisis un **mot de passe PostgreSQL** fort → **note-le** (même valeur dans `.env`).

### 3. Configurer `.env`

```bash
npm run env:init
nano .env
```

Remplace **3 lignes** (JWT + CRON déjà générés) :

| Variable | Valeur |
|----------|--------|
| `CHANGEME_MOT_DE_PASSE_DB` | mot de passe PostgreSQL (étape 2) |
| `CHANGEME_MOT_DE_PASSE_ADMIN` | mot de passe login `/monsite` |
| `CHANGEME_MOT_DE_PASSE_BOITE_MAIL` | mot de passe **contact@thomaspalmier.fr** |

### 4. Déployer

```bash
npm run deploy:vps
```

### 5. HTTPS (DNS propagé vers `217.160.191.235`)

```bash
certbot --nginx -d thomaspalmier.fr -d www.thomaspalmier.fr
```

### 6. Redémarrage auto (une fois)

```bash
pm2 startup systemd
pm2 save
```

---

## Checklist

- [ ] `ping thomaspalmier.fr` → `217.160.191.235`
- [ ] https://thomaspalmier.fr
- [ ] https://thomaspalmier.fr/login (**contact@thomaspalmier.fr**)
- [ ] `/monsite` → Newsletter : **SMTP configuré**
- [ ] Test inscription newsletter

Logs : `pm2 logs sport-journal`

---

## Mises à jour

```bash
cd /var/www/sport-journal
git pull
npm run deploy:vps
```

---

## Commandes utiles

| Commande | Rôle |
|----------|------|
| `npm run env:init` | Crée `.env` + JWT/CRON auto |
| `npm run deploy:vps` | Déploiement complet |
| `npm run post-deploy:check` | Vérifie site + config |
| `npm run create-admin` | Réinitialise mot de passe admin |
| `npm run backup:vps` | Sauvegarde DB + uploads |

---

## Dépannage Rocky 9

| Symptôme | Action |
|----------|--------|
| 502 Bad Gateway | `pm2 logs sport-journal` · `getenforce` → si Enforcing : `setsebool -P httpd_can_network_connect 1` |
| Nginx ne démarre pas | `nginx -t` · config dans `/etc/nginx/conf.d/thomaspalmier.fr.conf` |
| PostgreSQL | `systemctl status postgresql` |
| Pare-feu | `firewall-cmd --list-all` |
| Build échoue (DB) | Vérifie `DATABASE_URL` dans `.env` |

Docs : `HOSTING.md`, `DEPLOY.md`, `deploy/VPS.md`.
