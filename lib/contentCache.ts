import { revalidatePath, revalidateTag } from "next/cache";

export const CONTENT_CACHE_TAG = "content-list";
export const FEATURED_CONTENT_TAG = "featured-content";

/** Invalide le cache accueil + catalogue après mutation contenu. */
export function revalidateContentCaches(): void {
  revalidateTag(CONTENT_CACHE_TAG);
  revalidateTag(FEATURED_CONTENT_TAG);
  revalidatePath("/");
  revalidatePath("/mes-contenus");
}
