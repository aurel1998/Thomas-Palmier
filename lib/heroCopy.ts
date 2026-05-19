/**
 * Vidéo de fond du hero — `/public/videos/hero.mp4`.
 * Le paramètre `?v=` est un cache-buster : il force le navigateur à retélécharger
 * la vidéo quand on change physiquement le fichier (sinon il garde l'ancienne en cache).
 * Incrémenter la valeur à chaque fois qu'on remplace `hero.mp4` côté disque.
 */
export const HERO_VIDEO_MP4_DEFAULT = "/videos/hero.mp4?v=2";

/** Secours : même fichier — évite toute bascule visuelle vers une autre vidéo. */
export const HERO_VIDEO_MP4_FALLBACK = "/videos/hero.mp4?v=2";

/** Nom fort pour branding personnel immédiat. */
export const HERO_HEADLINE = "Thomas Palmier";

/** Positionnement journaliste (signature éditoriale). */
export const HERO_JOURNAL_LINE = "Journaliste sportif";

/** Phrase courte de positionnement éditorial. */
export const HERO_POSITIONING = "Le sport raconté au plus près.";
