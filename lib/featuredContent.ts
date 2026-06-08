import { unstable_cache } from "next/cache";
import type { Content } from "../types/content";
import { FEATURED_CONTENT_TAG } from "./contentCache";
import { pickFeaturedStory } from "./demoCatalog";
import { mapContentRow } from "./dbMappers";
import { prisma } from "./prisma";

async function fetchFeaturedRow() {
  return prisma.content.findFirst({
    where: { isFeatured: true, status: "published" },
    orderBy: { updatedAt: "desc" },
  });
}

/** Contenu publié actuellement mis en avant (un seul en base). */
export function resolveFeaturedContent(contents: Content[]): Content | null {
  return contents.find((c) => c.is_featured && c.status === "published") ?? null;
}

/** Retire le contenu à la une d'une liste (ex. rail sans doublon). */
export function withoutFeaturedContent(contents: Content[], featured: Content | null): Content[] {
  if (!featured) return contents;
  return contents.filter((c) => c.id !== featured.id);
}

/** Charge le contenu à la une pour l'accueil (publié uniquement). */
async function fetchFeaturedContent(): Promise<Content | null> {
  try {
    const row = await fetchFeaturedRow();
    if (row) return mapContentRow(row);
    return pickFeaturedStory([]);
  } catch (error) {
    console.error("[contents] fetchFeaturedContent:", (error as Error).message);
    return pickFeaturedStory([]);
  }
}

export async function getFeaturedContentServer(): Promise<Content | null> {
  try {
    return unstable_cache(fetchFeaturedContent, ["featured-content"], {
      tags: [FEATURED_CONTENT_TAG],
      revalidate: 120,
    })();
  } catch (error) {
    console.error("[contents] getFeaturedContentServer:", (error as Error).message);
    return pickFeaturedStory([]);
  }
}

/** Un seul à la une : retire le flag sur tous les autres contenus. */
export async function unsetOtherFeaturedContent(excludeId?: string): Promise<void> {
  await prisma.content.updateMany({
    where: {
      isFeatured: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    data: { isFeatured: false },
  });
}
