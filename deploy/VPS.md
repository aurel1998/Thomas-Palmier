# VPS IONOS — thomaspalmier.fr

| Paramètre | Valeur |
|-----------|--------|
| **Hôte / IP** | `217.160.191.235` |
| **Utilisateur SSH** | `root` |
| **OS** | Rocky Linux 9 |
| **Fournisseur** | IONOS (image Rocky 9) |
| **Domaine** | thomaspalmier.fr / www.thomaspalmier.fr |
| **Dépôt Git** | `https://github.com/aurel1998/Thomas-Palmier.git` |
| **Branche** | `main` |
| **Chemin projet** | `/var/www/sport-journal` |
| **Port app** | `3000` (PM2 → Nginx reverse proxy) |

## Clone sur le VPS

```bash
git clone https://github.com/aurel1998/Thomas-Palmier.git /var/www/sport-journal
cd /var/www/sport-journal
```

## Connexion SSH

```bash
ssh root@217.160.191.235
```

> Le mot de passe initial est fourni par IONOS (panneau VPS). **Ne le commite jamais** dans le dépôt.

## DNS IONOS (à configurer dans le panneau domaine)

| Type | Nom | Valeur |
|------|-----|--------|
| `A` | `@` | `217.160.191.235` |
| `A` | `www` | `217.160.191.235` |

Propagation : quelques minutes à 24 h. HTTPS (`certbot`) une fois le DNS actif.

## Pare-feu (Rocky 9 — firewalld)

Ouvert automatiquement par `scripts/setup-ionos-vps.sh` : SSH, HTTP, HTTPS.

## SELinux (Rocky 9)

Le script active `httpd_can_network_connect` pour que Nginx puisse joindre Next.js sur `:3000`.
