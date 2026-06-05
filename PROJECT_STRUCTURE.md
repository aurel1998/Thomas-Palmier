# Structure du projet

Application **Next.js 15** (App Router) — site journaliste fullstack.

```
.
├── app/                    # Pages et routes API
│   ├── api/                # Backend REST (auth, contenu, agenda, newsletter, upload)
│   ├── login/              # Connexion admin
│   ├── monsite/            # Back-office (protégé middleware)
│   ├── mes-contenus/       # Catalogue public
│   ├── page.tsx            # Accueil
│   └── …                   # contact, a-propos, collaborer, contenus (redirect)
├── components/             # UI React
│   ├── contenus/           # Cartes catalogue
│   ├── fx/                 # GSAP, micro-interactions
│   ├── home/               # Sections page d'accueil
│   ├── media/              # Lecteurs image / vidéo / audio
│   ├── monsite/            # Panneaux admin (agenda, newsletter)
│   └── theme/              # Thème clair / sombre
├── lib/                    # Logique serveur & utilitaires
├── prisma/                 # Schéma PostgreSQL + migrations
├── public/                 # Assets statiques (logos, médias /src/…)
├── scripts/                # deploy:vps, env:init, setup-ionos, cron, backup
├── types/                  # Types TypeScript partagés
├── auth.ts                 # NextAuth (credentials admin)
├── middleware.ts           # Protection /monsite
├── .env.production.example # Modèle .env VPS (3 secrets CHANGEME + auto JWT/CRON)
├── IONOS_QUICKSTART.md     # Guide express VPS Rocky 9 (217.160.191.235)
├── HOSTING.md              # Déploiement VPS détaillé
├── deploy/VPS.md           # Fiche serveur IONOS
├── deploy/nginx/           # Config Nginx thomaspalmier.fr
├── deploy/postgres-init.sql
├── DEPLOY.md               # Référence rapide déploiement
└── ADMIN_ACCESS.md         # Compte admin
```

## Backend (API)

| Route | Accès | Rôle |
|-------|--------|------|
| `GET /api/content`, `GET /api/agenda`, `POST /api/newsletter/subscribe` | Public | Lecture / inscription |
| `POST /api/content/create`, agenda, upload, newsletter/send, … | Admin | `requireAdmin()` |

Base : **PostgreSQL** via **Prisma**. Fichiers uploadés : `public/uploads/`.

## Admin

1. `npm run env:init` → remplir les 3 `CHANGEME` dans `.env`
2. `npm run deploy:vps` sur le VPS (voir `IONOS_QUICKSTART.md`)
3. Connexion `/login` avec **contact@thomaspalmier.fr**

Emails : contact **contact@thomaspalmier.fr** (SMTP IONOS) · config centralisée `lib/siteConfig.ts`.
