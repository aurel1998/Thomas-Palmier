import type { ContentType } from "../types/content";

type ContentLike = { type: ContentType };

/** Comptage par format pour les cartes catalogue. */
export function countByContentType(items: ContentLike[]): Record<ContentType, number> {
  const counts: Record<ContentType, number> = { video: 0, article: 0, audio: 0 };
  for (const item of items) {
    counts[item.type] += 1;
  }
  return counts;
}

/** Libellé public du format (articles = publications texte). */
export function publicContentTypeLabel(type: ContentType, count = 1): string {
  if (type === "article") {
    return count > 1 ? "publications" : "publication";
  }
  if (type === "video") {
    return count > 1 ? "vidéos" : "vidéo";
  }
  return count > 1 ? "audios" : "audio";
}

/** Résumé mixte : « 2 publications · 3 vidéos ». */
export function summarizeContentMix(items: ContentLike[]): string {
  const counts = countByContentType(items);
  const parts: string[] = [];

  if (counts.article > 0) {
    parts.push(`${counts.article} ${publicContentTypeLabel("article", counts.article)}`);
  }
  if (counts.video > 0) {
    parts.push(`${counts.video} ${publicContentTypeLabel("video", counts.video)}`);
  }
  if (counts.audio > 0) {
    parts.push(`${counts.audio} ${publicContentTypeLabel("audio", counts.audio)}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Aucun contenu";
}
