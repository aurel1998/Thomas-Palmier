# Déploiement VPS IONOS — thomaspalmier.fr

> **Guide express** : **[IONOS_QUICKSTART.md](./IONOS_QUICKSTART.md)**  
> **Fiche serveur** : **[deploy/VPS.md](./deploy/VPS.md)**

---

## Résumé

| Élément | Valeur |
|---------|--------|
| **IP VPS** | `217.160.191.235` |
| **SSH** | `root@217.160.191.235` |
| **OS** | Rocky Linux 9 |
| Domaine | **thomaspalmier.fr** |
| Admin `/monsite` | **contact@thomaspalmier.fr** |
| SMTP newsletter | **contact@thomaspalmier.fr** (IONOS) |
| Déploiement | `npm run deploy:vps` |

---

## Première installation (rappel)

```bash
ssh root@217.160.191.235

# 1. Clone
mkdir -p /var/www && cd /var/www
git clone https://github.com/aurel1998/Thomas-Palmier.git sport-journal && cd sport-journal

# 2. Rocky 9 (une fois)
bash scripts/setup-ionos-vps.sh

# 3. Config (3 CHANGEME dans .env)
npm run env:init && nano .env

# 4. Déploiement
npm run deploy:vps

# 5. DNS IONOS : A @ et www → 217.160.191.235, puis HTTPS
certbot --nginx -d thomaspalmier.fr -d www.thomaspalmier.fr

# 6. Boot auto
pm2 startup systemd && pm2 save
```

---

## Ce que fait `npm run deploy:vps`

1. `npm ci`
2. `prisma migrate deploy` + `generate`
3. Compte admin (`create-admin`)
4. Seed éditorial si base vide
5. `next build`
6. PM2 (start ou reload)
7. Cron rappels agenda
8. Vérifications (`post-deploy:check`)

---

## Newsletter IONOS

1. Créer **contact@thomaspalmier.fr** dans IONOS Email.
2. Activer **SPF** et **DKIM** sur le domaine.
3. Mot de passe → `EMAIL_PASS` dans `.env`.
4. Si changement : `pm2 reload sport-journal`.

Notifications automatiques :

- Publication contenu → si « Publié » + « Informer les abonnés »
- Rendez-vous agenda → si « Publié » + case cochée (modification : titre, lieu, description ou date)
- Campagnes manuelles → onglet **Newsletter** dans `/monsite`

---

## Mises à jour

```bash
cd /var/www/sport-journal
git pull
npm run deploy:vps
```

---

## Sauvegardes

```bash
npm run backup:vps
```

Planifier en cron hebdomadaire si besoin.

---

## Checklist finale

- [ ] https://thomaspalmier.fr
- [ ] https://thomaspalmier.fr/login (**contact@thomaspalmier.fr**)
- [ ] `/monsite` → Newsletter : **SMTP OK**
- [ ] Test inscription newsletter

Logs : `pm2 logs sport-journal`

---

Voir aussi : `DEPLOY.md`, `ADMIN_ACCESS.md`, `deploy/nginx/thomaspalmier.fr.conf`.
