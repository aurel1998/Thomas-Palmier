import { unstable_cache } from "next/cache";
import type { Content } from "../types/content";
import { CONTENT_CACHE_TAG } from "./contentCache";
import { withDemoCatalogFallback } from "./demoCatalog";
import { mapContentRow } from "./dbMappers";
import { prisma } from "./prisma";

export { getFeaturedContentServer } from "./featuredContent";

async function fetchPublishedContentsForHome(limit: number): Promise<Content[]> {
  try {
    const data = await prisma.content.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: Math.max(1, Math.min(limit, 48)),
    });
    return withDemoCatalogFallback(data.map(mapContentRow));
  } catch (error) {
    console.error("[contents] fetchPublishedContentsForHome:", (error as Error).message);
    return withDemoCatalogFallback([]);
  }
}

/** Homepage : contenus publiés récents (cache taggé, max 48). */
export async function getContentsForHomeServer(limit = 48): Promise<Content[]> {
  try {
    const clamped = Math.max(1, Math.min(limit, 48));
    return unstable_cache(
      () => fetchPublishedContentsForHome(clamped),
      ["home-contents", String(clamped)],
      { tags: [CONTENT_CACHE_TAG], revalidate: 120 }
    )();
  } catch (error) {
    console.error("[contents] getContentsForHomeServer:", (error as Error).message);
    return withDemoCatalogFallback([]);
  }
}



/**

 * Liste complète (admin, futures pages archive). Préférer `getContentsForHomeServer` sur l’accueil.

 */

export async function getAllContentsServer(): Promise<Content[]> {

  try {

    const data = await prisma.content.findMany({

      orderBy: { createdAt: "desc" },

    });

    return data.map(mapContentRow);

  } catch {

    return [];

  }

}


