import { getHybridVideoTeaser } from "./hybridContent";

/** Extrait lisible pour un teaser article (balises HTML retirées). */
export function articleExcerpt(content: string, max = 158): string {
  const t = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.startsWith("{")) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

/**
 * Teaser court quand le corps n’est pas une URL média (vidéo avec description en texte).
 * Gère aussi les documents hybrides JSON ({ blocks: [...] }).
 */
export function plainBodyTeaser(content: string, max = 120): string {
  const trimmed = content.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("{")) {
    const hybrid = getHybridVideoTeaser(trimmed, max);
    return hybrid || "";
  }

  const t = trimmed.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return "";
  if (/\.(mp4|webm|m3u8|mov|mp3|wav|ogg)(\?.*)?$/i.test(t)) return "";
  // Sécurité : certains contenus "vidéo" peuvent contenir un chemin local + texte ("...mp4 Immersion").
  // On évite d'afficher ce brut dans les cartes.
  if (/(^|[\s(])\/?(src|videos?)\/[^\s]+\.(mp4|webm|m3u8|mov|mp3|wav|ogg)\b/i.test(t)) return "";
  return articleExcerpt(t, max);
}
