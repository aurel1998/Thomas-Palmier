# Deploiement Vercel + Supabase

Ce guide met le projet en production avec Vercel (frontend/API Next) et Supabase (DB/Auth/Storage).

## 1) Supabase

1. Creez un projet Supabase.
2. Executez les scripts SQL du dossier `supabase/` dans l'editeur SQL Supabase.
3. Creez le bucket Storage `media` (public si vous servez des visuels publics).
4. Recuperez les cles:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (meme valeur que `NEXT_PUBLIC_SUPABASE_URL`)
   - `SUPABASE_ANON_KEY` (meme valeur que `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement)

## 2) Variables d'environnement (Vercel)

Copiez les variables de `.env.example` dans Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (ex: `media`)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DEMO_PRESENTATION` (mettre `false` en production)
- `DEMO_PRESENTATION_PASSWORD`

Important:
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` cote client.
- Desactiver `DEMO_PRESENTATION` en production publique.

## 3) Build local de verification

```bash
npm install
npm run build
```

## 4) Deployer sur Vercel

1. Importez le repo dans Vercel.
2. Framework detecte: Next.js.
3. Ajoutez les variables d'environnement ci-dessus.
4. Lancez le deploy.

Le fichier `vercel.json` configure:
- headers de securite de base,
- cache long pour assets statiques/versionnes (`_next/static`, images, videos, polices).

## 5) Post-deploiement

Verifier:
- page d'accueil (hero, chapitres, sections),
- pages `mes-contenus`, `contact`, `collaborer`,
- login/admin si utilise,
- upload media (si active),
- lecture video/audio,
- theme clair/sombre.

## 6) Optimisations deja appliquees

- Compression HTTP active (`compress: true`).
- Header `x-powered-by` desactive.
- Source maps navigateur desactivees en prod.
- Cache TTL image Next augmente (`minimumCacheTTL`).
