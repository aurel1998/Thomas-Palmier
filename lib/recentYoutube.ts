import type { Content } from "../types/content";
import { extractYouTubeId } from "./youtube";

/**
 * Vidéos catalogue dont l’URL est une vidéo YouTube, les plus récentes d’abord.
 */
export function pickRecentYoutubeContents(
  contents: Content[],
  options?: { limit?: number; excludeIds?: string[] }
): Content[] {
  const limit = options?.limit ?? 12;
  const exclude = new Set(options?.excludeIds ?? []);

  return contents
    .filter((c) => c.type === "video" && extractYouTubeId(c.content) && !exclude.has(c.id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
