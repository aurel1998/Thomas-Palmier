# Technologies du projet — guide pour la soutenance

**Site :** [thomaspalmier.fr](https://www.thomaspalmier.fr)  
**Projet :** portfolio et site éditorial de Thomas Palmier — journaliste sportif  
**Nom technique du dépôt :** `sport-journal-site`

---

## 1. Le projet en quelques phrases

Il s’agit d’un **site web professionnel** qui sert à la fois de **vitrine publique** et d’**espace de gestion** pour un journaliste sportif.

**Côté visiteur**, le site propose :
- une page d’accueil avec mise en avant et sélection de contenus ;
- un **catalogue** de vidéos, articles et audios (organisé par catégories : Radio, TV, Presse, Réseaux sociaux) ;
- des pages éditoriales (à propos, collaborer, contact) ;
- un **agenda** des événements ;
- une **newsletter**.

**Côté administrateur** (Thomas), l’espace `/monsite` permet de gérer l’intégralité du site (voir section 4 détaillée). La connexion se fait **uniquement via cette URL** — il n’existe pas de page `/login` publique (voir section 4.1).

Le tout est **hébergé sur un serveur VPS** (IONOS), avec une base de données PostgreSQL, et mis en ligne à l’adresse **www.thomaspalmier.fr**.

---

## 2. Architecture globale (vue simple)

```
Visiteur / Admin
       │
       ▼
   Nginx (HTTPS, domaine)
       │
       ▼
   Next.js (application Node.js, port 3000)
       │
       ├── Pages publiques (React)
       ├── Espace admin /monsite
       └── API internes (/api/...)
       │
       ▼
   PostgreSQL (données : contenus, users, agenda…)
```

En résumé : **une seule application** gère l’interface et le serveur. Pas de backend séparé en PHP ou Java — tout est dans le projet Next.js.

---

## 3. Technologies utilisées

### Langages

| Technologie | C’est quoi ? | Rôle en général | Rôle dans ce projet |
|-------------|--------------|-----------------|---------------------|
| **TypeScript** | JavaScript avec des types (variables, objets typés) | Réduire les erreurs, mieux structurer le code | Tout le code applicatif (pages, composants, API) est en `.ts` / `.tsx` |
| **JavaScript** | Langage du web côté navigateur et serveur (Node.js) | Exécuter la logique | Scripts de déploiement, seeds base de données (`.mjs`) |
| **SQL** | Langage des bases relationnelles | Stocker et interroger des données structurées | Schéma géré via Prisma ; PostgreSQL stocke contenus, utilisateurs, événements, etc. |
| **HTML / CSS** | Structure et mise en forme des pages | Afficher le contenu | Rendu par React ; styles globaux dans `globals.css` |

---

### Framework & bibliothèque front-end

| Technologie | C’est quoi ? | Rôle en général | Rôle dans ce projet |
|-------------|--------------|-----------------|---------------------|
| **Next.js 15** | Framework React pour sites web complets | Routing, rendu serveur, API, optimisation SEO | **Cœur du projet** : pages (`app/`), routes API (`app/api/`), build de production |
| **React 19** | Bibliothèque pour construire des interfaces par composants | Interface dynamique, réactive | Tous les composants UI (header, cartes vidéo, formulaires, admin) |
| **GSAP** | Bibliothèque d’animations JavaScript | Animations fluides (scroll, apparitions) | Hero, cartes catalogue, transitions visuelles |
| **Lenis** | Smooth scroll | Défilement fluide | Expérience de navigation plus agréable |
| **Three.js** | Bibliothèque 3D dans le navigateur | Graphismes WebGL | Effet visuel sur la section hero (vidéo / fond) |
| **FullCalendar** | Composant calendrier | Afficher et interagir avec des dates | Agenda public et gestion des événements en admin |
| **Recharts** | Graphiques pour React | Visualiser des statistiques | Tableau de bord admin (vues, activité) |

---

### Back-end & données

| Technologie | C’est quoi ? | Rôle en général | Rôle dans ce projet |
|-------------|--------------|-----------------|---------------------|
| **Node.js** | Environnement pour exécuter JavaScript hors navigateur | Serveur, scripts, outils | Fait tourner Next.js en local et sur le VPS |
| **PostgreSQL** | Base de données relationnelle open source | Stockage durable (tables liées entre elles) | Contenus, catégories, rubriques, utilisateurs, agenda, newsletter, profil journalistique |
| **Prisma** | ORM (couche entre le code et la base) | Écrire des requêtes en TypeScript au lieu de SQL brut | Modèles dans `prisma/schema.prisma`, migrations, accès données dans les API |
| **pg** | Driver PostgreSQL pour Node.js | Connexion bas niveau à PostgreSQL | Utilisé avec l’adaptateur Prisma (`@prisma/adapter-pg`) |
| **API Routes Next.js** | Endpoints HTTP dans le projet | CRUD, logique métier côté serveur | `/api/content`, `/api/agenda`, `/api/newsletter`, etc. |

---

### Authentification & sécurité

| Technologie | C’est quoi ? | Rôle en général | Rôle dans ce projet |
|-------------|--------------|-----------------|---------------------|
| **NextAuth (v5)** | Solution d’authentification pour Next.js | Sessions, connexion sécurisée | Connexion admin sur `/monsite` ; protection des routes sensibles |
| **bcryptjs** | Hachage de mots de passe | Ne jamais stocker un mot de passe en clair | Création du compte admin (`scripts/create-admin.mjs`) |
| **Middleware Next.js** | Code exécuté avant certaines pages | Filtrer les accès, en-têtes de sécurité | Sécurisation de l’espace admin, masquage de `/login` public |

---

### Médias, e-mail & intégrations

| Technologie | C’est quoi ? | Rôle en général | Rôle dans ce projet |
|-------------|--------------|-----------------|---------------------|
| **Sharp** | Traitement d’images Node.js | Redimensionner, optimiser les images | Optimisation des médias (`scripts/optimize-public-media.mjs`) |
| **YouTube (embed)** | Plateforme vidéo | Héberger et lire des vidéos | Les vidéos du catalogue sont des liens YouTube intégrés (pas d’hébergement vidéo lourd sur le serveur) |
| **Nodemailer** | Envoi d’e-mails depuis Node.js | SMTP, newsletters, notifications | Inscription newsletter, envoi de campagnes, rappels agenda |
| **dotenv** | Variables d’environnement depuis `.env` | Secrets hors du code (DB, SMTP, URLs) | Configuration locale et production (`DATABASE_URL`, `NEXTAUTH_SECRET`, etc.) |

---

### Outils de développement & déploiement

| Technologie | C’est quoi ? | Rôle en général | Rôle dans ce projet |
|-------------|--------------|-----------------|---------------------|
| **npm** | Gestionnaire de paquets Node.js | Installer les dépendances, lancer des scripts | `npm install`, `npm run build`, `npm run seed:youtube` |
| **Git** | Versionnement du code | Historique, collaboration, déploiement | Dépôt GitHub `Thomas-Palmier` |
| **GitHub** | Hébergement Git + collaboration | Sauvegarde du code, pull sur le serveur | Source de vérité ; `git pull` sur le VPS pour mettre à jour |
| **PM2** | Gestionnaire de processus Node.js | Garder l’app en marche, redémarrage auto | Lance `next start` en production sur le VPS |
| **Nginx** | Serveur web / reverse proxy | HTTPS, redirection www, proxy vers l’app | `thomaspalmier.fr` → application Next.js ; certificat SSL |
| **VPS IONOS** | Serveur virtuel dédié | Hébergement en ligne 24h/24 | Production : `/var/www/sport-journal` |
| **Cron (Linux)** | Tâches planifiées | Exécuter un script à intervalle régulier | Rappels automatiques des événements agenda |

---

## 4. Espace admin `/monsite` — fonctionnalités détaillées

L’administration est regroupée dans une **interface à onglets** (`/monsite`), protégée par **NextAuth**. Chaque onglet correspond à un panneau dédié.

### 4.1 Obfuscation de l’accès admin (pourquoi `/monsite` et pas `/login` ?)

| Aspect | Comportement |
|--------|--------------|
| **URL de connexion** | `/monsite` — page unique qui affiche le formulaire si non connecté, l’espace admin si connecté |
| **URL masquée** | `/login` renvoie une **erreur 404** (middleware Next.js) — aucune page de connexion « classique » indexable |
| **Avantage sécurité** | Réduit le **scan automatique** des bots qui testent `/admin`, `/login`, `/wp-admin`, etc. Un attaquant ne trouve pas d’entrée évidente |
| **Avantage discrétion** | L’URL n’est pas devinable pour un visiteur lambda ; seul Thomas connaît le chemin d’accès |
| **Auth technique** | NextAuth (session JWT/cookie), mot de passe haché **bcrypt**, en-têtes de sécurité sur les routes admin |

> **À dire à l’oral :** « J’ai volontairement **obfusqué** l’accès admin : pas de `/login` public, tout passe par `/monsite`. C’est une couche de **défense en profondeur** en complément du mot de passe. »

### 4.2 Tableau de bord (`Dashboard`)

- **KPIs** : nombre total de contenus, publiés / brouillons, répartition vidéo / article / audio
- **Abonnés newsletter** actifs et **événements à venir**
- **Graphiques** (Recharts) : activité éditoriale, tendances
- **Contenu à la une** actuel avec accès rapide à l’édition
- **Derniers contenus** et **derniers abonnés** avec liens vers les onglets concernés

### 4.3 Publier (`Publier`)

- Création de contenus **vidéo** (lien YouTube), **article** (texte long par paragraphes) ou **audio** (URL ou upload)
- **Upload** d’images et de fichiers audio vers le serveur (`/api/upload`)
- **Catégorie** (Radio, TV, Presse, Réseaux sociaux) et **rubrique** (sous-catégorie)
- **Tags** avec suggestions des tags déjà utilisés
- **Statut** : brouillon ou publié
- **À la une** : mise en avant sur l’accueil (un seul contenu à la fois)
- **Notifier les abonnés** à la publication (e-mail automatique via Nodemailer)

### 4.4 Contenus (`Contenus`)

- Liste de tous les contenus avec filtre par statut
- **Édition** : ouvre le formulaire Publier pré-rempli
- **Suppression** avec confirmation
- Badges visuels : type, statut, « À la une »

### 4.5 Rubriques (`Rubriques`)

- Gestion des **catégories** (univers éditoriaux : TV, Radio, etc.)
- Gestion des **sous-catégories / rubriques** (ex. Réactions après-match, Reportages…)
- Création, renommage, suppression (avec impact sur le catalogue public)

### 4.6 Agenda (`Agenda`)

- **Calendrier interactif** (FullCalendar) : clic sur une date pour créer, clic sur un événement pour modifier
- Formulaire : titre, date, heure, lieu, description
- **Visibilité** : publié (calendrier public + accueil) ou brouillon (admin uniquement)
- **Mettre en avant** : un événement phare sur l’accueil
- **Informer les abonnés** par e-mail à la création / modification de date
- **Rappel automatique** 24 h avant (cron serveur + Nodemailer)
- Aperçu de l’événement mis en avant dans l’admin

### 4.7 Newsletter (`Newsletter`)

- Liste des **abonnés** (actifs, désinscrits) avec statistiques
- **Campagne manuelle** : objet, corps HTML, aperçu avant envoi
- Historique des **campagnes** envoyées (contenus, agenda, rappels)
- Vérification de la configuration **SMTP** (Nodemailer)

### 4.8 Profil Thomas (`Profil Thomas`)

Hub identité éditoriale — tout alimente le site public :

- **Profil éditorial** : photo, nom, titre, accroche, bio courte / longue, spécialités, ligne éditoriale
- **Médias hero** : URL vidéo de fond et poster optionnel de la page d’accueil
- **Récompenses** : logos et libellés (page À propos)
- **Médias** : presse et médias partenaires (À propos, Collaborer)
- **Partenaires** : logos écosystème (page Collaborer)
- **Réseaux sociaux** : liens header, footer, contact

### 4.9 Textes du site (`Textes site`)

- Textes éditoriaux des pages : newsletter, bloc À propos accueil, page Collaborer (titres, CTA, accroches)
- Mise à jour sans toucher au code

### 4.10 Page Collaborer (`Collaborer`)

- **Offres de collaboration** : titres, descriptions, position
- **Études de cas** : projets passés avec visuels
- **Logos partenaires** de la page Collaborer
- Contenu affiché sur `/collaborer`

### 4.11 Fonctions transverses

- **Toasts** de confirmation / erreur
- **Déconnexion** sécurisée
- **Chargement dynamique** des gros panneaux (code splitting) pour des performances correctes
- Toutes les actions passent par des **API internes** (`/api/...`) avec contrôle de session

---

## 5. Fonctionnalités ↔ technologies (pour l’oral)

| Fonctionnalité | Technologies principales |
|----------------|-------------------------|
| Page d’accueil, animations | Next.js, React, GSAP, Three.js |
| Catalogue vidéos (30 vidéos YouTube) | PostgreSQL, Prisma, scripts `seed:youtube`, lecteur embed |
| Articles / audio hybrides | Modèle `Content` Prisma, composants « blocs » JSON |
| Espace admin `/monsite` (9 onglets) | NextAuth, React, API Routes, obfuscation `/login` |
| Agenda | FullCalendar, table `Event`, API `/api/agenda` |
| Newsletter | Nodemailer, tables abonnés / campagnes |
| SEO (Google Search Console) | Métadonnées Next.js, sitemap, fichier de vérification Google |
| Mise en production | Git, `npm run build`, PM2, Nginx |

---

## 6. Ce qu’on peut dire en conclusion à l’oral

> « J’ai développé un **site fullstack** avec **Next.js et React**, une base **PostgreSQL** gérée par **Prisma**, et un **espace d’administration sécurisé** avec **NextAuth**. Le site est **déployé sur un VPS IONOS** derrière **Nginx**, avec **PM2** pour la disponibilité. Les vidéos sont intégrées depuis **YouTube** pour alléger l’hébergement, et l’ensemble forme un **portfolio éditorial vivant** : catalogue, agenda, newsletter et gestion de contenus pour un journaliste sportif. »

---

## 7. Mots-clés utiles si le jury pose des questions

- **Fullstack** : front (ce que voit l’utilisateur) + back (serveur, base) dans un même projet.
- **SSR / rendu serveur** : certaines pages sont générées côté serveur (ex. catalogue) pour le SEO et la performance.
- **API REST** : le front appelle des URLs `/api/...` pour lire ou modifier les données.
- **ORM** : Prisma traduit le code TypeScript en requêtes SQL.
- **Reverse proxy** : Nginx reçoit les visiteurs en HTTPS et transmet la requête à Node.js.
- **Obfuscation** : masquer l’URL de connexion (`/monsite` au lieu de `/login`) pour limiter les scans automatiques.
- **Seed** : script qui remplit la base avec des données initiales (catégories, vidéos YouTube).

---

*Document rédigé pour la soutenance — projet stage Thomas Palmier / portfolio journaliste sportif.*
