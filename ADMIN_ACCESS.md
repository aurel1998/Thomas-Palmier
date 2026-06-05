# Accès admin `/monsite`



## Identifiants production



| Rôle | Adresse |

|------|---------|

| **Connexion admin** | **contact@thomaspalmier.fr** (`ADMIN_EMAIL`) |

| **Contact public** | **contact@thomaspalmier.fr** (formulaire /contact) |

| **Envoi newsletter** | **contact@thomaspalmier.fr** (SMTP IONOS) |



## Créer / mettre à jour le compte



```bash

npm run create-admin

```



Utilise `ADMIN_EMAIL` et `ADMIN_PASSWORD` du fichier `.env`.



## URLs



- Login : https://thomaspalmier.fr/login

- Back-office : https://thomaspalmier.fr/monsite



## Newsletter (`/monsite` → Newsletter)



- Liste abonnés, campagnes, relance contenu

- Notifications auto : publication, nouvelles dates agenda



Déploiement complet : **`IONOS_QUICKSTART.md`** → `npm run deploy:vps`



## Sécurité



- Ne pas commiter `.env`

- Mot de passe admin fort (`CHANGEME_MOT_DE_PASSE_ADMIN` en prod)

- `JWT_SECRET` unique (`openssl rand -base64 32`)

